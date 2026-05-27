import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, telefono, email, numeroPedido, mensaje } = body

    if (!nombre || !telefono || !mensaje) {
      return NextResponse.json({ error: 'Nombre, teléfono y mensaje son obligatorios' }, { status: 400 })
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #F5F0E8; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #0E0E0E; padding: 24px; text-align: center;">
      <h1 style="font-size: 22px; letter-spacing: 0.15em; color: #F5F0E8; margin: 0;">VITALORA</h1>
      <div style="font-size: 10px; letter-spacing: 0.3em; color: #C9A961; margin-top: 4px;">MENSAJE DE CLIENTE</div>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; color: #0E0E0E; margin: 0 0 24px;">Nuevo mensaje de ayuda</h2>

      <div style="margin-bottom: 20px; padding: 16px; background: #F9F9F5; border-radius: 8px; border: 1px solid #E5E5D5;">
        <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Datos del cliente</h3>
        <p style="font-size: 14px; color: #333; line-height: 1.8; margin: 0;">
          <strong>Nombre:</strong> ${nombre}<br>
          <strong>WhatsApp / Teléfono:</strong> ${telefono}<br>
          ${email ? `<strong>Email:</strong> ${email}<br>` : ''}
          ${numeroPedido ? `<strong>No. de Pedido:</strong> #${numeroPedido}<br>` : ''}
        </p>
      </div>

      <div style="margin-bottom: 20px; padding: 16px; background: #FFF; border-radius: 8px; border: 1px solid #E5E5E5;">
        <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Mensaje</h3>
        <p style="font-size: 14px; color: #333; line-height: 1.8; margin: 0; white-space: pre-wrap;">${mensaje}</p>
      </div>

      <div style="padding: 12px 16px; background: #E8F0E8; border-radius: 6px; font-size: 13px; color: #3A3;">
        Responder a este cliente por WhatsApp: <strong>${telefono}</strong>
      </div>
    </div>
    <div style="background: #0E0E0E; padding: 20px; text-align: center;">
      <p style="font-size: 11px; color: rgba(245,240,232,0.4); margin: 0;">Vitalora — Mensaje de ayuda</p>
    </div>
  </div>
</body>
</html>`

    await resend.emails.send({
      from: 'Vitalora Ayuda <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `📩 Mensaje de ${nombre} — ${numeroPedido ? 'Pedido #' + numeroPedido : 'Consulta general'}`,
      html,
      replyTo: email || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error enviando mensaje:', error)
    return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 })
  }
}
