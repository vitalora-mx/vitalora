// Correo al cliente cuando el admin cambia la dirección de envío (SOLO SERVIDOR).
// Va al correo original del pedido: si el cambio no lo pidió el cliente, se entera antes del envío.
import { Resend } from 'resend'
import { formatearNumeroPedido } from '@/lib/utils'
import type { DatosDireccion } from '@/lib/editar-direccion'

const escapar = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export async function enviarCorreoCambioDireccion(pedidoId: number, email: string, d: DatosDireccion): Promise<boolean> {
  const numero = formatearNumeroPedido(pedidoId)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>
  <div style="padding:40px 32px;">
    <h1 style="font-size:22px;color:#0E0E0E;margin:0 0 12px;font-weight:400;text-align:center;">Actualizamos la dirección de envío</h1>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 20px;text-align:center;">La dirección de envío de tu pedido <strong>${numero}</strong> quedó así:</p>
    <div style="background:#FAF7F0;border:1px solid #E8E0D5;border-radius:8px;padding:20px 24px;font-size:14px;color:#333;line-height:1.7;">
      <strong>${escapar(d.nombre)} ${escapar(d.apellido)}</strong><br>
      Tel. ${escapar(d.telefono)}<br>
      ${escapar(d.calle)} ${escapar(d.numero)}${d.interior ? ', Int. ' + escapar(d.interior) : ''}<br>
      Col. ${escapar(d.colonia)}<br>
      ${escapar(d.ciudad)}, ${escapar(d.estado)} · C.P. ${escapar(d.cp)}<br>
      ${d.referencia ? `<span style="color:#888;">Referencia: ${escapar(d.referencia)}</span>` : ''}
    </div>
    <div style="margin-top:20px;background:#FFF5F5;border:1px solid #E8B4B4;border-radius:6px;padding:14px 16px;">
      <p style="font-size:13px;color:#A33;line-height:1.6;margin:0;text-align:center;">Si tú no solicitaste este cambio, escríbenos de inmediato a <a href="mailto:hola@vitalora.com.mx" style="color:#A33;">hola@vitalora.com.mx</a>.</p>
    </div>
  </div>
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: email,
      subject: `Actualizamos la dirección de envío de tu pedido ${numero}`,
      html,
    })
    return true
  } catch (e) {
    console.error('Error al enviar correo de cambio de dirección:', e)
    return false
  }
}
