import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ItemEmail {
  nombre: string
  marca: string
  cantidad: number
  precio: number
}

interface EmailData {
  items: ItemEmail[]
  comprador: {
    nombre: string
    apellido: string
    email: string
    telefono: string
  }
  direccion: {
    calle: string
    numero: string
    interior?: string
    colonia?: string
    ciudad?: string
    estado?: string
    cp: string
    referencia?: string
  }
  subtotal: number
  costoEnvio: number
  total: number
}

function generarEmailCliente(data: EmailData) {
  const { items, comprador, direccion, subtotal, costoEnvio, total } = data

  const productosHTML = items.map(item => `
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

    <!-- Header -->
    <div style="background: #0E0E0E; padding: 32px; text-align: center;">
      <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
      <div style="font-size: 10px; letter-spacing: 0.3em; color: #C9A961; margin-top: 4px;">WELLNESS</div>
    </div>

    <!-- Confirmación -->
    <div style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #E8E0D5;">
      <div style="width: 60px; height: 60px; border-radius: 50%; background: #F0F7F0; border: 2px solid #6B8F6B; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px;">âœ“</div>
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
        <tbody>
          ${productosHTML}
        </tbody>
      </table>

      <!-- Totales -->
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E8E0D5;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #888;">Subtotal</span>
          <span style="font-size: 13px; color: #333;">$${subtotal.toLocaleString()} MXN</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="font-size: 13px; color: ${costoEnvio === 0 ? '#6B8F6B' : '#888'};">Envío</span>
          <span style="font-size: 13px; color: ${costoEnvio === 0 ? '#6B8F6B' : '#333'};">${costoEnvio === 0 ? 'Gratis' : '$99 MXN'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #0E0E0E;">
          <span style="font-size: 18px; font-weight: 600; color: #0E0E0E;">Total</span>
          <span style="font-size: 18px; font-weight: 600; color: #0E0E0E;">$${total.toLocaleString()} MXN</span>
        </div>
      </div>
    </div>

    <!-- Dirección -->
    <div style="padding: 24px 32px; background: #FAFAF5; border-top: 1px solid #E8E0D5; border-bottom: 1px solid #E8E0D5;">
      <h3 style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Dirección de envío</h3>
      <p style="font-size: 14px; color: #333; line-height: 1.7; margin: 0;">
        ${comprador.nombre} ${comprador.apellido}<br>
        ${direccion.calle} ${direccion.numero}${direccion.interior ? ', Int. ' + direccion.interior : ''}<br>
        ${direccion.colonia || ''}<br>
        ${direccion.ciudad || ''}, ${direccion.estado || ''} CP ${direccion.cp}<br>
        ${direccion.referencia ? 'Ref: ' + direccion.referencia : ''}
      </p>
    </div>

    <!-- Pasos -->
    <div style="padding: 32px; text-align: center;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px; text-align: center; width: 33%;">
            <div style="font-size: 24px; margin-bottom: 8px;">ðŸ“¦</div>
            <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 4px;">Preparando</div>
            <div style="font-size: 11px; color: #999;">Tu pedido se está preparando</div>
          </td>
          <td style="padding: 12px; text-align: center; width: 33%;">
            <div style="font-size: 24px; margin-bottom: 8px;">ðŸšš</div>
            <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 4px;">En camino</div>
            <div style="font-size: 11px; color: #999;">Te enviaremos tu guía</div>
          </td>
          <td style="padding: 12px; text-align: center; width: 33%;">
            <div style="font-size: 24px; margin-bottom: 8px;">✦</div>
            <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 4px;">Entrega</div>
            <div style="font-size: 11px; color: #999;">2-5 días hábiles</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background: #0E0E0E; padding: 32px; text-align: center;">
      <p style="font-size: 12px; color: rgba(245,240,232,0.6); margin: 0 0 8px;">¿Tienes dudas? Escríbenos a</p>
      <a href="mailto:hola@vitalora.com.mx" style="font-size: 13px; color: #C9A961; text-decoration: none;">hola@vitalora.com.mx</a>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(245,240,232,0.1);">
        <p style="font-size: 11px; color: rgba(245,240,232,0.4); margin: 0;">© 2026 Vitalora. Todos los derechos reservados.</p>
      </div>
    </div>

  </div>
</body>
</html>`
}

function generarEmailGabo(data: EmailData) {
  const { items, comprador, direccion, subtotal, costoEnvio, total } = data

  const productosTexto = items.map(item =>
    `• ${item.marca} — ${item.nombre} x${item.cantidad} → $${(item.precio * item.cantidad).toLocaleString()} MXN`
  ).join('\n')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #F5F0E8; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">

    <div style="background: #0E0E0E; padding: 24px; text-align: center;">
      <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
      <div style="font-size: 10px; letter-spacing: 0.3em; color: #C9A961; margin-top: 4px;">NUEVA VENTA 🎉</div>
    </div>

    <div style="padding: 32px;">
      <h2 style="font-size: 20px; color: #0E0E0E; margin: 0 0 24px;">¡Nueva venta recibida!</h2>

      <div style="background: #F0F7F0; border: 1px solid #A8C5A0; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 28px; font-weight: 700; color: #333; text-align: center;">$${total.toLocaleString()} MXN</div>
        <div style="font-size: 12px; color: #6B8F6B; text-align: center; margin-top: 4px;">Subtotal: $${subtotal.toLocaleString()} | Envío: ${costoEnvio === 0 ? 'Gratis' : '$99'}</div>
      </div>

      <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Cliente</h3>
      <p style="font-size: 14px; color: #333; line-height: 1.7; margin: 0 0 20px;">
        ${comprador.nombre} ${comprador.apellido}<br>
        ${comprador.email}<br>
        ${comprador.telefono}
      </p>

      <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Dirección</h3>
      <p style="font-size: 14px; color: #333; line-height: 1.7; margin: 0 0 20px;">
        ${direccion.calle} ${direccion.numero}${direccion.interior ? ', Int. ' + direccion.interior : ''}<br>
        ${direccion.colonia || ''}<br>
        ${direccion.ciudad || ''}, ${direccion.estado || ''} CP ${direccion.cp}<br>
        ${direccion.referencia ? 'Ref: ' + direccion.referencia : ''}
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
    const body: EmailData = await req.json()

    // Email al cliente
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: body.comprador.email,
      subject: `✦ ¡Gracias por tu compra, ${body.comprador.nombre}! — Vitalora`,
      html: generarEmailCliente(body),
    })

    // Email a Gabo
    await resend.emails.send({
      from: 'Vitalora Ventas <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `🎉 Nueva venta — $${body.total.toLocaleString()} MXN — ${body.comprador.nombre} ${body.comprador.apellido}`,
      html: generarEmailGabo(body),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error enviando emails:', error)
    return NextResponse.json({ error: 'Error enviando emails' }, { status: 500 })
  }
}
