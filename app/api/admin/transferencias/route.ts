import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/admin-auth'
import { formatearNumeroPedido } from '@/lib/utils'
import { filaDescuentoHTML, resumenInternoHTML, avisoCancelacionHTML } from '@/lib/correoPedido'
import { registrarComisionYAvisar } from '@/lib/comisiones'
import { descontarStockUnaVez } from '@/lib/inventario'
import { correoRechazoTransferencia } from '@/lib/correoTransferencia'
import { HORAS_TRAS_RECHAZO } from '@/lib/datos-transferencia'

// Estados desde los que se puede aprobar o rechazar un comprobante.
// 'cancelado_sin_pago' (venció el plazo) se puede aprobar si el pago llegó tarde;
// 'cancelado' (cancelado por el admin) NO.
const ESTADOS_APROBABLES = ['esperando_comprobante', 'comprobante_en_revision', 'comprobante_rechazado', 'cancelado_sin_pago']
const ESTADOS_RECHAZABLES = ['esperando_comprobante', 'comprobante_en_revision']

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

// ============================================================
// GET: listar pedidos por transferencia que requieren revisión
// ============================================================
export async function GET(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/transferencias')
  if (!adminAuth.ok) return adminAuth.response

  try {
    const { searchParams } = new URL(req.url)
    const filtro = searchParams.get('filtro') || 'comprobante_en_revision'

    let query = supabaseAdmin
      .from('pedidos')
      .select('id, estado, nombre, apellido, email, telefono, total, comprobante_url, comprobante_subido_at, created_at, metodo_pago')
      .eq('metodo_pago', 'transferencia')
      .order('comprobante_subido_at', { ascending: false, nullsFirst: false })

    if (filtro !== 'todos') {
      query = query.eq('estado', filtro)
    }

    const { data: pedidos } = await query

    return NextResponse.json({ pedidos: pedidos ?? [] })
  } catch (err) {
    console.error('Error al listar pedidos transferencia:', err)
    return NextResponse.json({ error: 'Error al cargar.' }, { status: 500 })
  }
}

// ============================================================
// POST: aprobar o rechazar un comprobante
// body: { pedidoId, accion: 'aprobar' | 'rechazar' }
// ============================================================
export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/transferencias')
  if (!adminAuth.ok) return adminAuth.response

  try {
    const { pedidoId, accion } = await req.json()

    if (!pedidoId || !accion) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }

    // Obtener el pedido con sus items
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('*, pedido_items(*)')
      .eq('id', pedidoId)
      .single()

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    if (pedido.metodo_pago !== 'transferencia') {
      return NextResponse.json({ error: 'Este pedido no es por transferencia.' }, { status: 400 })
    }

    // ─── RECHAZAR ───
    if (accion === 'rechazar') {
      // Usamos 'comprobante_rechazado' (no 'cancelado') para que el pedido
      // se pueda recuperar: el cliente puede resubir comprobante, o el admin re-aprobar.
      // Plazo nuevo: 24 horas desde el rechazo para subir otro comprobante.
      // Si vence sin comprobante, el cron diario lo pasa a 'cancelado_sin_pago'.
      const nuevoLimite = new Date(Date.now() + HORAS_TRAS_RECHAZO * 60 * 60 * 1000).toISOString()
      const { data: rechazado } = await supabaseAdmin
        .from('pedidos')
        .update({ estado: 'comprobante_rechazado', limite_transferencia_at: nuevoLimite })
        .eq('id', pedidoId)
        .in('estado', ESTADOS_RECHAZABLES)
        .select('id')
      if ((rechazado?.length ?? 0) === 0) {
        return NextResponse.json({ error: `No se puede rechazar un pedido en estado "${pedido.estado}".` }, { status: 400 })
      }

      // Correo al cliente con el enlace (con token) y el plazo nuevo
      await correoRechazoTransferencia(pedido, nuevoLimite)

      return NextResponse.json({ ok: true })
    }

    // ─── APROBAR ───
    if (accion === 'aprobar') {
      // 1) Marcar como pagado de forma atómica: solo una aprobación ejecuta los efectos,
      //    y un pedido cancelado, reembolsado o ya confirmado no se puede aprobar
      const { data: aprobado } = await supabaseAdmin
        .from('pedidos')
        .update({ estado: 'pagado' })
        .eq('id', pedidoId)
        .in('estado', ESTADOS_APROBABLES)
        .is('cancelado_at', null)
        .select('id')
      if ((aprobado?.length ?? 0) === 0) {
        return NextResponse.json({ error: `No se puede aprobar un pedido en estado "${pedido.estado}".` }, { status: 400 })
      }

      // 2) Descontar stock (una sola vez)
      await descontarStockUnaVez(pedido.id)

      // 3) Comisión de embajadora y correo de venta (igual que en Mercado Pago; una sola vez, nunca falla la aprobación)
      await registrarComisionYAvisar(pedido)

      // 4) Primera compra
      if (pedido.user_id && pedido.descuento_tipo === 'primera_compra') {
        await supabaseAdmin.from('perfiles').update({ primera_compra_usada: true }).eq('id', pedido.user_id)
      }

      // 5) Códigos de descuento
      if (pedido.codigo_descuento) {
        await supabaseAdmin.rpc('incrementar_uso_codigo', { codigo_param: pedido.codigo_descuento })
        if (pedido.email) {
          try {
            await supabaseAdmin.from('codigos_usados').insert({
              codigo: pedido.codigo_descuento,
              email: pedido.email.toLowerCase(),
              pedido_id: pedido.id,
            })
          } catch {}
        }
      }

      // 6) Emails de confirmación
      await enviarEmails(pedido)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
  } catch (err) {
    console.error('Error al procesar comprobante:', err)
    return NextResponse.json({ error: 'Error al procesar.' }, { status: 500 })
  }
}

// ============================================================
// PATCH: generar URL firmada para ver el comprobante (bucket privado)
// body: { pedidoId }
// ============================================================
export async function PATCH(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/transferencias')
  if (!adminAuth.ok) return adminAuth.response

  try {
    const { pedidoId } = await req.json()

    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('comprobante_url')
      .eq('id', pedidoId)
      .maybeSingle()

    if (!pedido?.comprobante_url) {
      return NextResponse.json({ error: 'Este pedido no tiene comprobante.' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from('comprobantes')
      .createSignedUrl(pedido.comprobante_url, 300) // válida 5 minutos

    if (error || !data) {
      return NextResponse.json({ error: 'No se pudo generar el enlace.' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('Error al generar URL del comprobante:', err)
    return NextResponse.json({ error: 'Error.' }, { status: 500 })
  }
}

async function enviarEmails(pedido: any) {
  const items = pedido.pedido_items || []
  const subtotal = pedido.subtotal || 0
  const costoEnvio = pedido.costo_envio || 0
  const total = pedido.total || 0
  const productosHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; font-size: 14px; color: #333;">
        <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin-bottom: 4px;">${item.marca || ''}</div>
        <div style="font-weight: 500;">${item.nombre}${item.variante_nombre ? ` <span style="color:#888;font-weight:400;">(${item.variante_nombre})</span>` : ''}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: center; font-size: 14px; color: #666;">x${item.cantidad}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: right; font-size: 14px; font-weight: 600; color: #333;">$${(item.precio * item.cantidad).toLocaleString()} MXN</td>
    </tr>
  `).join('')

  const emailCliente = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>
  <div style="padding:40px 32px;text-align:center;border-bottom:1px solid #E8E0D5;">
    <h1 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">¡Pago confirmado!</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">Hola ${pedido.nombre}, confirmamos tu transferencia. Tu pedido <strong>${formatearNumeroPedido(pedido.id)}</strong> ya está en proceso.</p>
  </div>
  <div style="padding:32px;">
    <table style="width:100%;border-collapse:collapse;">${productosHTML}</table>
    <div style="margin-top:24px;padding-top:16px;border-top:2px solid #0E0E0E;">
      <table style="width:100%;font-size:14px;color:#555;">
        <tr><td style="padding:4px 0;">Subtotal</td><td style="padding:4px 0;text-align:right;">$${subtotal.toLocaleString()} MXN</td></tr>
        ${filaDescuentoHTML(pedido, 'padding:4px 0;', 'padding:4px 0;text-align:right;')}
        <tr><td style="padding:4px 0;">Envío</td><td style="padding:4px 0;text-align:right;">${costoEnvio === 0 ? 'Gratis' : '$' + costoEnvio.toLocaleString() + ' MXN'}</td></tr>
        <tr><td style="padding:8px 0;font-size:16px;font-weight:700;color:#0E0E0E;">Total</td><td style="padding:8px 0;text-align:right;font-size:16px;font-weight:700;color:#0E0E0E;">$${total.toLocaleString()} MXN</td></tr>
      </table>
    </div>
  </div>
  ${avisoCancelacionHTML()}
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`

  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: pedido.email,
      subject: `Pago confirmado — Pedido ${formatearNumeroPedido(pedido.id)}`,
      html: emailCliente,
    })
  } catch (e) {
    console.error('Error email cliente:', e)
  }

  // Email al admin
  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `Transferencia confirmada — Pedido ${formatearNumeroPedido(pedido.id)} - $${total.toLocaleString()} MXN`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;padding:32px;">`
        + `<p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 20px;">El pedido <strong>${formatearNumeroPedido(pedido.id)}</strong> de ${pedido.nombre} ${pedido.apellido || ''} (${pedido.email}) por transferencia fue confirmado.</p>`
        + resumenInternoHTML(pedido)
        + `</div></body></html>`,
    })
  } catch (e) {
    console.error('Error email admin:', e)
  }
}
