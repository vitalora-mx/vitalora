import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { formatearNumeroPedido } from '@/lib/utils'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/facturacion
// Dos acciones segun "accion": "buscar" o "enviar"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const accion = body.accion

    // ---------- ACCION 1: BUSCAR Y VERIFICAR PEDIDO ----------
    if (accion === 'buscar') {
      const { pedidoId, email } = body
      if (!pedidoId || !email) {
        return NextResponse.json({ error: 'Falta el número de pedido o el correo.' }, { status: 400 })
      }

      const { data: pedido } = await supabaseAdmin
        .from('pedidos')
        .select('id, email, estado, total, forma_pago, created_at')
        .eq('id', (() => { const digitos = String(pedidoId).replace(/[^0-9]/g, ''); const n = parseInt(digitos || '0', 10); return n >= 10000 ? n - 10000 : n })())
        .single()

      if (!pedido) {
        return NextResponse.json({ error: 'No encontramos un pedido con ese número.' }, { status: 404 })
      }

      // Verificar que el correo coincida (sin distinguir mayusculas/espacios)
      if (String(pedido.email).trim().toLowerCase() !== String(email).trim().toLowerCase()) {
        return NextResponse.json({ error: 'El correo no coincide con el del pedido.' }, { status: 403 })
      }

      // Solo se factura un pedido pagado
      if (pedido.estado !== 'pagado') {
        return NextResponse.json({ error: 'Este pedido aún no tiene un pago confirmado.' }, { status: 400 })
      }

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
      const { pedidoId, email, rfc, razonSocial, cpFiscal, regimenFiscal, usoCfdi, formaPago, total } = body

      if (!pedidoId || !email || !rfc || !razonSocial || !cpFiscal || !regimenFiscal || !usoCfdi) {
        return NextResponse.json({ error: 'Faltan datos fiscales obligatorios.' }, { status: 400 })
      }

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
          <strong>No. de Pedido:</strong> ${formatearNumeroPedido((() => { const d = String(pedidoId).replace(/[^0-9]/g,''); const n = parseInt(d||'0',10); return n >= 10000 ? n - 10000 : n })())}<br>
          <strong>Correo del pedido:</strong> ${email}<br>
          <strong>Total:</strong> $${Number(total).toLocaleString()} MXN<br>
          <strong>Forma de pago:</strong> ${formaPago}
        </p>
      </div>
      <div style="margin-bottom:20px;padding:16px;background:#FFF;border-radius:8px;border:1px solid #E5E5E5;">
        <h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Datos fiscales</h3>
        <p style="font-size:14px;color:#333;line-height:1.8;margin:0;">
          <strong>RFC:</strong> ${rfc}<br>
          <strong>Razón social:</strong> ${razonSocial}<br>
          <strong>CP fiscal:</strong> ${cpFiscal}<br>
          <strong>Régimen fiscal:</strong> ${regimenFiscal}<br>
          <strong>Uso de CFDI:</strong> ${usoCfdi}
        </p>
      </div>
      <div style="padding:12px 16px;background:#E8F0E8;border-radius:6px;font-size:13px;color:#3A3;">
        Emitir la factura a estos datos y enviarla al correo: <strong>${email}</strong>
      </div>
    </div>
    <div style="background:#0E0E0E;padding:20px;text-align:center;">
      <p style="font-size:11px;color:rgba(245,240,232,0.4);margin:0;">Vitalora - Solicitud de factura</p>
    </div>
  </div>
</body>
</html>`

      await resend.emails.send({
        from: 'Vitalora Facturacion <hola@vitalora.com.mx>',
        to: 'gabomaciel7@gmail.com',
        subject: `Solicitud de factura - Pedido ${formatearNumeroPedido((() => { const d = String(pedidoId).replace(/[^0-9]/g,''); const n = parseInt(d||'0',10); return n >= 10000 ? n - 10000 : n })())} - ${razonSocial}`,
        html,
        replyTo: email || undefined,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
  } catch (error) {
    console.error('Error en facturacion:', error)
    return NextResponse.json({ error: 'Error procesando la solicitud.' }, { status: 500 })
  }
}
