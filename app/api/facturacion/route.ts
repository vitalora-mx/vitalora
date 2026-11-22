import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { formatearNumeroPedido } from '@/lib/utils'
import { esCorreoValido } from '@/lib/facturas'

const resend = new Resend(process.env.RESEND_API_KEY)

// Estados en los que un pedido ya está pagado y se puede facturar
const ESTADOS_FACTURABLES = ['pagado', 'preparando', 'enviado', 'entregado']

// "VIT-10010", "10010" o "10" -> 10
function idDesdeNumero(pedidoId: unknown): number {
  const digitos = String(pedidoId ?? '').replace(/[^0-9]/g, '')
  const n = parseInt(digitos || '0', 10)
  return n >= 10000 ? n - 10000 : n
}

function escapar(txt: string): string {
  return txt.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

// Busca el pedido y verifica que el correo coincida y que esté pagado.
async function verificarPedido(pedidoId: unknown, email: unknown) {
  const id = idDesdeNumero(pedidoId)
  if (!id || !email) return { error: 'Falta el número de pedido o el correo.', status: 400 } as const

  const { data: pedido } = await createServiceClient()
    .from('pedidos')
    .select('id, email, estado, total, forma_pago, created_at, requiere_factura, factura_estado')
    .eq('id', id)
    .maybeSingle()

  if (!pedido) return { error: 'No encontramos un pedido con ese número.', status: 404 } as const

  // Verificar que el correo coincida (sin distinguir mayusculas/espacios)
  if (String(pedido.email).trim().toLowerCase() !== String(email).trim().toLowerCase()) {
    return { error: 'El correo no coincide con el del pedido.', status: 403 } as const
  }

  // Solo se factura un pedido con pago confirmado
  if (!ESTADOS_FACTURABLES.includes(pedido.estado)) {
    return { error: 'Este pedido aún no tiene un pago confirmado.', status: 400 } as const
  }

  return { pedido } as const
}

// POST /api/facturacion
// Dos acciones segun "accion": "buscar" o "enviar"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const accion = body.accion

    // ---------- ACCION 1: BUSCAR Y VERIFICAR PEDIDO ----------
    if (accion === 'buscar') {
      const v = await verificarPedido(body.pedidoId, body.email)
      if ('error' in v) return NextResponse.json({ error: v.error }, { status: v.status })
      const pedido = v.pedido

      // Verificar que la compra sea del mes en curso (facturas solo del mismo mes)
      const fechaPedido = new Date(pedido.created_at)
      const ahora = new Date()
      const mismoMes = fechaPedido.getMonth() === ahora.getMonth() && fechaPedido.getFullYear() === ahora.getFullYear()

      return NextResponse.json({
        ok: true,
        pedido: {
          id: pedido.id,
          total: pedido.total,
          forma_pago: pedido.forma_pago || 'No especificada',
          fuera_de_mes: !mismoMes,
        },
      })
    }

    // ---------- ACCION 2: ENVIAR SOLICITUD DE FACTURA ----------
    if (accion === 'enviar') {
      const rfc = String(body.rfc ?? '').trim().toUpperCase()
      const razonSocial = String(body.razonSocial ?? '').trim().slice(0, 300)
      const cpFiscal = String(body.cpFiscal ?? '').trim()
      const regimenFiscal = String(body.regimenFiscal ?? '').trim().slice(0, 200)
      const usoCfdi = String(body.usoCfdi ?? '').trim().slice(0, 200)
      const emailFactura = String(body.emailFactura ?? '').trim().toLowerCase()

      if (!rfc || !razonSocial || !cpFiscal || !regimenFiscal || !usoCfdi) {
        return NextResponse.json({ error: 'Faltan datos fiscales obligatorios.' }, { status: 400 })
      }
      if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)) {
        return NextResponse.json({ error: 'El RFC no tiene un formato válido (12 o 13 caracteres).' }, { status: 400 })
      }
      if (!/^\d{5}$/.test(cpFiscal)) {
        return NextResponse.json({ error: 'El código postal fiscal debe tener 5 dígitos.' }, { status: 400 })
      }
      if (!esCorreoValido(emailFactura)) {
        return NextResponse.json({ error: 'Revisa el correo para recibir la factura.' }, { status: 400 })
      }

      // Volver a verificar el pedido en el servidor (no confiar en el paso "buscar")
      const v = await verificarPedido(body.pedidoId, body.email)
      if ('error' in v) return NextResponse.json({ error: v.error }, { status: v.status })
      const pedido = v.pedido

      if (pedido.requiere_factura && pedido.factura_estado === 'emitida') {
        return NextResponse.json({ error: 'Este pedido ya fue facturado.' }, { status: 400 })
      }

      // Guardar la solicitud en el pedido
      const { error: errGuardar } = await createServiceClient()
        .from('pedidos')
        .update({
          requiere_factura: true,
          factura_solicitada_at: new Date().toISOString(),
          factura_estado: 'pendiente',
          rfc,
          razon_social: razonSocial,
          regimen_fiscal: regimenFiscal,
          cp_fiscal: cpFiscal,
          uso_cfdi: usoCfdi,
          email_facturacion: emailFactura,
        })
        .eq('id', pedido.id)
      if (errGuardar) {
        console.error('Error guardando solicitud de factura:', errGuardar)
        return NextResponse.json({ error: 'No se pudo guardar la solicitud.' }, { status: 500 })
      }

      const numero = formatearNumeroPedido(pedido.id)
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    <div style="background:#0E0E0E;padding:24px;text-align:center;">
      <h1 style="font-size:22px;letter-spacing:0.15em;color:#F5F0E8;margin:0;">VITALORA</h1>
      <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">SOLICITUD DE FACTURA</div>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;color:#0E0E0E;margin:0 0 24px;">Nueva solicitud de factura</h2>
      <div style="margin-bottom:20px;padding:16px;background:#F9F9F5;border-radius:8px;border:1px solid #E5E5D5;">
        <h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Pedido</h3>
        <p style="font-size:14px;color:#333;line-height:1.8;margin:0;">
          <strong>No. de Pedido:</strong> ${numero}<br>
          <strong>Correo del pedido:</strong> ${escapar(pedido.email)}<br>
          <strong>Correo para la factura:</strong> ${escapar(emailFactura)}<br>
          <strong>Total:</strong> $${Number(pedido.total).toLocaleString()} MXN<br>
          <strong>Forma de pago:</strong> ${escapar(pedido.forma_pago || 'No especificada')}
        </p>
      </div>
      <div style="margin-bottom:20px;padding:16px;background:#FFF;border-radius:8px;border:1px solid #E5E5E5;">
        <h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Datos fiscales</h3>
        <p style="font-size:14px;color:#333;line-height:1.8;margin:0;">
          <strong>RFC:</strong> ${escapar(rfc)}<br>
          <strong>Razón social:</strong> ${escapar(razonSocial)}<br>
          <strong>CP fiscal:</strong> ${escapar(cpFiscal)}<br>
          <strong>Régimen fiscal:</strong> ${escapar(regimenFiscal)}<br>
          <strong>Uso de CFDI:</strong> ${escapar(usoCfdi)}
        </p>
      </div>
      <div style="padding:12px 16px;background:#E8F0E8;border-radius:6px;font-size:13px;color:#3A3;">
        Emitir la factura a estos datos y enviarla al correo: <strong>${escapar(emailFactura)}</strong>
      </div>
    </div>
    <div style="background:#0E0E0E;padding:20px;text-align:center;">
      <p style="font-size:11px;color:rgba(245,240,232,0.4);margin:0;">Vitalora - Solicitud de factura</p>
    </div>
  </div>
</body>
</html>`

      try {
        await resend.emails.send({
          from: 'Vitalora Facturacion <hola@vitalora.com.mx>',
          to: 'gabomaciel7@gmail.com',
          subject: `Solicitud de factura - Pedido ${numero} - ${razonSocial}`,
          html,
          replyTo: pedido.email || undefined,
        })
      } catch (e) {
        // La solicitud ya quedó guardada en el pedido; el aviso por correo es secundario
        console.error('Error enviando correo de solicitud de factura:', e)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
  } catch (error) {
    console.error('Error en facturacion:', error)
    return NextResponse.json({ error: 'Error procesando la solicitud.' }, { status: 500 })
  }
}
