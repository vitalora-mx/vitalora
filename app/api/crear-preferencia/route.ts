import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { Resend } from 'resend'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

const resend = new Resend(process.env.RESEND_API_KEY)

const LOGO_URL = 'https://vitalora.com.mx/images/logos/vitalora-logo-dark.png'

function generarEmailCliente(data: any) {
  const { items, comprador, direccion, subtotal, costoEnvio, total } = data

  const productosHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #E8E0D5; font-size: 14px; color: #333;">
        <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin-bottom: 4px;">${item.marca}</div>
        <div style="font-weight: 500;">${item.nombre}</div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #E8E0D5; text-align: center; font-size: 14px; color: #666;">x${item.cantidad}</td>
      <td style="padding: 16px; border-bottom: 1px solid #E8E0D5; text-align: right; font-size: 14px; font-weight: 600; color: #333;">$${(item.precio * item.cantidad).toLocaleString()} MXN</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F5F0E8; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">

    <!-- Header con logo -->
    <div style="background: #0E0E0E; padding: 32px; text-align: center;">
      <h1 style="font-size: 28px; letter-spacing: 0.15em; color: #F5F0E8; margin: 0; font-weight: 400;">VITALORA</h1>
      <div style="font-size: 10px; letter-spacing: 0.3em; color: #C9A961; margin-top: 4px;">WELLNESS</div>
    </div>

    <!-- Confirmación -->
    <div style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #E8E0D5;">
      <div style="width: 60px; height: 60px; border-radius: 50%; background: #F0F7F0; border: 2px solid #6B8F6B; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px;">&#10003;</div>
      <h2 style="font-size: 24px; color: #0E0E0E; margin: 0 0 8px; font-weight: 400;">¡Gracias por tu compra, ${comprador.nombre}!</h2>
      <p style="font-size: 14px; color: #888; margin: 0;">Tu pedido ha sido recibido y está siendo procesado.</p>
    </div>

    <!-- Productos -->
    <div style="padding: 32px;">
      <h3 style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A961; margin: 0 0 20px;">Detalle del pedido</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 12px 16px; text-align: left; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; border-bottom: 2px solid #E8E0D5;">Producto</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; border-bottom: 2px solid #E8E0D5;">Cant.</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; border-bottom: 2px solid #E8E0D5;">Precio</th>
          </tr>
        </thead>
        <tbody>${productosHTML}</tbody>
      </table>

      <!-- Totales -->
      <table style="width: 100%; margin-top: 20px; padding-top: 16px; border-top: 1px solid #E8E0D5;">
        <tr><td style="font-size: 13px; color: #888; padding: 4px 0;">Subtotal</td><td style="font-size: 13px; color: #333; text-align: right; padding: 4px 0;">$${subtotal.toLocaleString()} MXN</td></tr>
        <tr><td style="font-size: 13px; color: ${costoEnvio === 0 ? '#6B8F6B' : '#888'}; padding: 4px 0;">Envío</td><td style="font-size: 13px; color: ${costoEnvio === 0 ? '#6B8F6B' : '#333'}; text-align: right; padding: 4px 0;">${costoEnvio === 0 ? 'Gratis' : '$99 MXN'}</td></tr>
        <tr><td colspan="2" style="padding-top: 12px; border-top: 2px solid #0E0E0E;"></td></tr>
        <tr><td style="font-size: 18px; font-weight: 600; color: #0E0E0E; padding: 4px 0;">Total</td><td style="font-size: 18px; font-weight: 600; color: #0E0E0E; text-align: right; padding: 4px 0;">$${total.toLocaleString()} MXN</td></tr>
      </table>
    </div>

    <!-- Dirección -->
    <div style="padding: 24px 32px; background: #FAFAF5; border-top: 1px solid #E8E0D5; border-bottom: 1px solid #E8E0D5;">
      <h3 style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Dirección de envío</h3>
      <p style="font-size: 14px; color: #333; line-height: 1.7; margin: 0;">
        ${comprador.nombre} ${comprador.apellido}<br>
        ${direccion.calle} ${direccion.numero}${direccion.interior ? ', Int. ' + direccion.interior : ''}<br>
        ${direccion.colonia || ''}<br>
        ${direccion.ciudad || ''}, ${direccion.estado || ''} CP ${direccion.cp}
        ${direccion.referencia ? '<br>Ref: ' + direccion.referencia : ''}
      </p>
    </div>

    <!-- Pasos -->
    <div style="padding: 32px; text-align: center;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px; text-align: center; width: 33%;"><div style="font-size: 24px; margin-bottom: 8px;">&#128230;</div><div style="font-size: 12px; font-weight: 600; color: #333;">Preparando</div><div style="font-size: 11px; color: #999;">Tu pedido se está preparando</div></td>
          <td style="padding: 12px; text-align: center; width: 33%;"><div style="font-size: 24px; margin-bottom: 8px;">&#128666;</div><div style="font-size: 12px; font-weight: 600; color: #333;">En camino</div><div style="font-size: 11px; color: #999;">Te enviaremos tu guía</div></td>
          <td style="padding: 12px; text-align: center; width: 33%;"><div style="font-size: 24px; margin-bottom: 8px;">&#10022;</div><div style="font-size: 12px; font-weight: 600; color: #333;">Entrega</div><div style="font-size: 11px; color: #999;">2-5 días hábiles</div></td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background: #0E0E0E; padding: 32px; text-align: center;">
      <div style="font-size: 18px; letter-spacing: 0.15em; color: rgba(245,240,232,0.5); margin-bottom: 16px;">VITALORA</div>
      <p style="font-size: 12px; color: rgba(245,240,232,0.6); margin: 0 0 8px;">¿Tienes dudas? Escríbenos a</p>
      <a href="mailto:hola@vitalora.com.mx" style="font-size: 13px; color: #C9A961; text-decoration: none;">hola@vitalora.com.mx</a>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(245,240,232,0.1);">
        <p style="font-size: 11px; color: rgba(245,240,232,0.4); margin: 0;">&copy; 2026 Vitalora. Todos los derechos reservados.</p>
      </div>
    </div>

  </div>
</body>
</html>`
}

function generarEmailGabo(data: any) {
  const { items, comprador, direccion, subtotal, costoEnvio, total } = data

  const productosTexto = items.map((item: any) =>
    `${item.marca} — ${item.nombre} x${item.cantidad} → $${(item.precio * item.cantidad).toLocaleString()} MXN`
  ).join('\n')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #F5F0E8; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #0E0E0E; padding: 24px; text-align: center;">
      <h1 style="font-size: 22px; letter-spacing: 0.15em; color: #F5F0E8; margin: 0;">VITALORA</h1>
      <div style="font-size: 10px; letter-spacing: 0.3em; color: #C9A961; margin-top: 4px;">NUEVA VENTA</div>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; color: #0E0E0E; margin: 0 0 24px;">Nueva venta recibida</h2>
      <div style="background: #F0F7F0; border: 1px solid #A8C5A0; border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #333;">$${total.toLocaleString()} MXN</div>
        <div style="font-size: 12px; color: #6B8F6B; margin-top: 4px;">Subtotal: $${subtotal.toLocaleString()} | Envío: ${costoEnvio === 0 ? 'Gratis' : '$99'}</div>
      </div>
      <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Cliente</h3>
      <p style="font-size: 14px; color: #333; line-height: 1.7; margin: 0 0 20px;">
        ${comprador.nombre} ${comprador.apellido}<br>${comprador.email}<br>${comprador.telefono}
      </p>
      <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Dirección</h3>
      <p style="font-size: 14px; color: #333; line-height: 1.7; margin: 0 0 20px;">
        ${direccion.calle} ${direccion.numero}${direccion.interior ? ', Int. ' + direccion.interior : ''}<br>
        ${direccion.colonia || ''}<br>
        ${direccion.ciudad || ''}, ${direccion.estado || ''} CP ${direccion.cp}
        ${direccion.referencia ? '<br>Ref: ' + direccion.referencia : ''}
      </p>
      <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Productos</h3>
      <pre style="font-size: 13px; color: #333; line-height: 1.8; white-space: pre-wrap; margin: 0; background: #FAFAF5; padding: 16px; border-radius: 4px;">${productosTexto}</pre>
    </div>
    <div style="background: #0E0E0E; padding: 20px; text-align: center;">
      <p style="font-size: 11px; color: rgba(245,240,232,0.4); margin: 0;">Vitalora — Notificación automática de venta</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, comprador, direccion, costoEnvio } = body

    const subtotal = items.reduce((sum: number, item: any) => sum + item.precio * item.cantidad, 0)
    const total = subtotal + costoEnvio

    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: String(item.id),
          title: item.nombre,
          quantity: item.cantidad,
          unit_price: item.precio,
          currency_id: 'MXN',
        })),
        payer: {
          name: comprador.nombre,
          surname: comprador.apellido,
          email: comprador.email,
          phone: { number: comprador.telefono },
        },
        shipments: {
          mode: 'not_specified',
          cost: costoEnvio,
          receiver_address: {
            zip_code: direccion.cp,
            street_name: direccion.calle.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
            street_number: direccion.numero,
            floor: direccion.interior || '',
            apartment: direccion.referencia || '',
          },
        },
        back_urls: {
          success: 'https://vitalora.com.mx/gracias',
          failure: 'https://vitalora.com.mx/checkout',
          pending: 'https://vitalora.com.mx/checkout',
        },
        auto_return: 'approved',
        statement_descriptor: 'VITALORA',
      },
    })

    // Enviar emails
    const emailData = { items, comprador, direccion, subtotal, costoEnvio, total }

    try {
      await resend.emails.send({
        from: 'Vitalora <hola@vitalora.com.mx>',
        to: comprador.email,
        subject: `✦ ¡Gracias por tu compra, ${comprador.nombre}! — Vitalora`,
        html: generarEmailCliente(emailData),
      })

      await resend.emails.send({
        from: 'Vitalora Ventas <hola@vitalora.com.mx>',
        to: 'gabomaciel7@gmail.com',
        subject: `🎉 Nueva venta — $${total.toLocaleString()} MXN — ${comprador.nombre} ${comprador.apellido}`,
        html: generarEmailGabo(emailData),
      })
    } catch (emailError) {
      console.error('Error enviando emails (no bloquea el pago):', emailError)
    }

    return NextResponse.json({ init_point: result.init_point })
  } catch (error) {
    console.error('Error Mercado Pago:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Error al crear preferencia', detalle: JSON.stringify(error) }, { status: 500 })
  }
}
