import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envía notificaciones de tipo "payment"
    if (body.type === 'payment' || body.action === 'payment.updated' || body.action === 'payment.created') {
      const paymentId = body.data?.id
      if (!paymentId) return NextResponse.json({ ok: true })

      // Obtener detalles del pago de MP
      const payment = new Payment(mpClient)
      const paymentData = await payment.get({ id: paymentId })

      const status = paymentData.status // approved, rejected, pending, in_process, cancelled, refunded
      const preferenceId = paymentData.preference_id

      // Buscar pedido en DB
      const { data: pedido } = await supabaseAdmin
        .from('pedidos')
        .select('*, pedido_items(*)')
        .eq('mp_preference_id', preferenceId)
        .single()

      if (!pedido) {
        console.log('Pedido no encontrado para preference:', preferenceId)
        return NextResponse.json({ ok: true })
      }

      // Mapear estado de MP a nuestro estado
      let nuevoEstado = pedido.estado
      if (status === 'approved') nuevoEstado = 'pagado'
      else if (status === 'rejected' || status === 'cancelled') nuevoEstado = 'cancelado'
      else if (status === 'refunded') nuevoEstado = 'reembolsado'
      else if (status === 'pending' || status === 'in_process') nuevoEstado = 'pendiente'

      // Actualizar pedido
      await supabaseAdmin
        .from('pedidos')
        .update({ estado: nuevoEstado, mp_payment_id: String(paymentId) })
        .eq('id', pedido.id)

      // Si fue aprobado y antes no estaba pagado, enviar emails
      if (status === 'approved' && pedido.estado !== 'pagado') {
        await enviarEmails(pedido)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error webhook MP:', error)
    return NextResponse.json({ ok: true }) // Siempre responder 200 a MP
  }
}

// GET para verificación de MP
export async function GET() {
  return NextResponse.json({ ok: true })
}

async function enviarEmails(pedido: any) {
  const items = pedido.pedido_items || []
  const subtotal = pedido.subtotal || 0
  const costoEnvio = pedido.costo_envio || 0
  const total = pedido.total || 0

  const productosHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; font-size: 14px; color: #333;">
        <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin-bottom: 4px;">${item.marca}</div>
        <div style="font-weight: 500;">${item.nombre}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: center; font-size: 14px; color: #666;">x${item.cantidad}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: right; font-size: 14px; font-weight: 600; color: #333;">$${(item.precio * item.cantidad).toLocaleString()} MXN</td>
    </tr>
  `).join('')

  // Email al cliente
  const emailCliente = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <h1 style="font-size:28px;letter-spacing:0.15em;color:#F5F0E8;margin:0;font-weight:400;">VITALORA</h1>
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>
  <div style="padding:40px 32px;text-align:center;border-bottom:1px solid #E8E0D5;">
    <div style="width:60px;height:60px;border-radius:50%;background:#F0F7F0;border:2px solid #6B8F6B;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px;">&#10003;</div>
    <h2 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">¡Pago confirmado, ${pedido.nombre}!</h2>
    <p style="font-size:14px;color:#888;margin:0;">Pedido #${pedido.id} — Tu pedido está siendo preparado.</p>
  </div>
  <div style="padding:32px;">
    <h3 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A961;margin:0 0 20px;">Detalle del pedido</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Producto</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Cant.</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Precio</th>
      </tr></thead>
      <tbody>${productosHTML}</tbody>
    </table>
    <table style="width:100%;margin-top:20px;padding-top:16px;border-top:1px solid #E8E0D5;">
      <tr><td style="font-size:13px;color:#888;padding:4px 0;">Subtotal</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">$${subtotal.toLocaleString()} MXN</td></tr>
      <tr><td style="font-size:13px;color:${costoEnvio === 0 ? '#6B8F6B' : '#888'};padding:4px 0;">Envío</td><td style="font-size:13px;color:${costoEnvio === 0 ? '#6B8F6B' : '#333'};text-align:right;padding:4px 0;">${costoEnvio === 0 ? 'Gratis' : '$' + costoEnvio + ' MXN'}</td></tr>
      <tr><td colspan="2" style="padding-top:12px;border-top:2px solid #0E0E0E;"></td></tr>
      <tr><td style="font-size:18px;font-weight:600;color:#0E0E0E;padding:4px 0;">Total</td><td style="font-size:18px;font-weight:600;color:#0E0E0E;text-align:right;padding:4px 0;">$${total.toLocaleString()} MXN</td></tr>
    </table>
  </div>
  <div style="padding:24px 32px;background:#FAFAF5;border-top:1px solid #E8E0D5;">
    <h3 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Dirección de envío</h3>
    <p style="font-size:14px;color:#333;line-height:1.7;margin:0;">${pedido.nombre} ${pedido.apellido}<br>${pedido.calle} ${pedido.numero}${pedido.interior ? ', Int. ' + pedido.interior : ''}<br>${pedido.colonia || ''}<br>${pedido.ciudad || ''}, ${pedido.estado_dir || ''} CP ${pedido.cp}</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="font-size:13px;color:#888;">Te enviaremos tu número de guía cuando el pedido sea enviado.</p>
  </div>
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <div style="font-size:18px;letter-spacing:0.15em;color:rgba(245,240,232,0.5);margin-bottom:16px;">VITALORA</div>
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0 0 8px;">¿Tienes dudas? Escríbenos a</p>
    <a href="mailto:hola@vitalora.com.mx" style="font-size:13px;color:#C9A961;text-decoration:none;">hola@vitalora.com.mx</a>
  </div>
</div></body></html>`

  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: pedido.email,
      subject: `✦ ¡Pago confirmado! Pedido #${pedido.id} — Vitalora`,
      html: emailCliente,
    })

    const productosTexto = items.map((item: any) => `${item.marca} — ${item.nombre} x${item.cantidad} → $${(item.precio * item.cantidad).toLocaleString()} MXN`).join('\n')

    await resend.emails.send({
      from: 'Vitalora Ventas <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `🎉 Pago confirmado — Pedido #${pedido.id} — $${total.toLocaleString()} MXN`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;"><div style="background:#0E0E0E;padding:24px;text-align:center;"><h1 style="font-size:22px;letter-spacing:0.15em;color:#F5F0E8;margin:0;">VITALORA</h1><div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">PAGO CONFIRMADO</div></div><div style="padding:32px;"><h2 style="font-size:20px;color:#0E0E0E;margin:0 0 24px;">Pedido #${pedido.id}</h2><div style="background:#F0F7F0;border:1px solid #A8C5A0;border-radius:4px;padding:16px;margin-bottom:24px;text-align:center;"><div style="font-size:28px;font-weight:700;color:#333;">$${total.toLocaleString()} MXN</div></div><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Cliente</h3><p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 20px;">${pedido.nombre} ${pedido.apellido}<br>${pedido.email}<br>${pedido.telefono}</p><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Dirección</h3><p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 20px;">${pedido.calle} ${pedido.numero}<br>${pedido.colonia || ''}<br>${pedido.ciudad || ''}, ${pedido.estado_dir || ''} CP ${pedido.cp}</p><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Productos</h3><pre style="font-size:13px;color:#333;line-height:1.8;white-space:pre-wrap;margin:0;background:#FAFAF5;padding:16px;border-radius:4px;">${productosTexto}</pre></div></div></body></html>`,
    })
  } catch (emailError) {
    console.error('Error enviando emails desde webhook:', emailError)
  }
}
