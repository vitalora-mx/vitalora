import { Resend } from 'resend'
import { formatearNumeroPedido } from '@/lib/utils'
import { DATOS_BANCARIOS, enlacePedidoTransferencia, fechaHoraMexico, HORAS_PARA_PAGAR } from '@/lib/datos-transferencia'
import { WHATSAPP_URL } from '@/lib/correoPedido'

// ============================================================
// Correos de pedidos por transferencia (SOLO SERVIDOR)
//  - Instrucciones al crear el pedido (enlace con token, datos bancarios, monto, plazo)
//  - Comprobante rechazado (enlace con token y plazo nuevo de 24 horas)
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY)
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const mxn = (n: number) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`

interface PedidoCorreo { id: number; nombre: string; email: string; total: number; acceso_token?: string | null }

function marco(titulo: string, contenido: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>
  <div style="padding:36px 32px 8px;text-align:center;">
    <h1 style="font-size:24px;color:#0E0E0E;margin:0;font-weight:400;">${titulo}</h1>
  </div>
  <div style="padding:16px 32px 32px;">${contenido}
    <p style="font-size:13px;color:#888;line-height:1.6;margin:24px 0 0;text-align:center;">
      ¿Dudas? Escríbenos a <a href="mailto:hola@vitalora.com.mx" style="color:#C9A961;">hola@vitalora.com.mx</a> o por <a href="${WHATSAPP_URL}" style="color:#C9A961;">WhatsApp</a>.
    </p>
  </div>
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`
}

function boton(texto: string, url: string) {
  return `<div style="text-align:center;margin:28px 0;">
  <a href="${esc(url)}" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:16px 32px;border-radius:4px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.03em;">${texto}</a>
</div>`
}

const fila = (k: string, v: string) =>
  `<tr><td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:#888;">${k}</td><td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#0E0E0E;font-weight:600;text-align:right;">${v}</td></tr>`

async function enviar(to: string, subject: string, html: string) {
  if (!to) return
  try {
    await resend.emails.send({ from: 'Vitalora <hola@vitalora.com.mx>', to, subject, html })
  } catch (e) {
    console.error('Error enviando correo de transferencia:', subject, e)
  }
}

// Al crear el pedido por transferencia
export async function correoInstruccionesTransferencia(pedido: PedidoCorreo, accesoToken: string, limiteISO: string) {
  const numero = formatearNumeroPedido(pedido.id)
  const enlace = enlacePedidoTransferencia(pedido.id, accesoToken)
  const contenido = `
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">Hola ${esc(pedido.nombre)}, recibimos tu pedido <strong>${numero}</strong>. Para confirmarlo, haz una transferencia por el <strong>monto exacto</strong> y sube tu comprobante.</p>
    <div style="background:#FAF7F0;border:1px solid #E8E0D5;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Monto exacto a transferir</div>
      <div style="font-size:30px;font-weight:700;color:#0E0E0E;">${mxn(pedido.total)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E0D5;border-bottom:1px solid #E8E0D5;">
      ${fila('CLABE interbancaria', `<span style="font-family:monospace;">${DATOS_BANCARIOS.clabe}</span>`)}
      ${fila('Beneficiario', esc(DATOS_BANCARIOS.beneficiario))}
      ${fila('Institución / Banco', esc(DATOS_BANCARIOS.institucion))}
      ${fila('Concepto', numero)}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#B45309;line-height:1.6;margin:20px 0 0;text-align:center;">
      Tienes <strong>${HORAS_PARA_PAGAR} horas</strong> para pagar y subir tu comprobante: hasta el <strong>${fechaHoraMexico(limiteISO)}</strong> (hora del centro de México). Si no, el pedido se cancela.
    </p>
    ${boton('Subir mi comprobante', enlace)}
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;line-height:1.6;margin:0;text-align:center;">Este enlace es solo para ti: no lo compartas.</p>`
  await enviar(pedido.email, `Instrucciones para tu transferencia — Pedido ${numero}`, marco('Instrucciones para tu transferencia', contenido))
}

// Cuando el admin rechaza el comprobante
export async function correoRechazoTransferencia(pedido: PedidoCorreo, limiteISO: string) {
  const numero = formatearNumeroPedido(pedido.id)
  const conEnlace = !!pedido.acceso_token
  const contenido = `
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 16px;">Hola ${esc(pedido.nombre)},</p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">No pudimos confirmar el pago de tu pedido <strong>${numero}</strong> por transferencia. Puede ser que aún no recibimos la transferencia, o que el comprobante que subiste no correspondía o no se veía con claridad.</p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#B45309;line-height:1.6;margin:0 0 8px;text-align:center;">
      Tienes hasta el <strong>${fechaHoraMexico(limiteISO)}</strong> (hora del centro de México) para subir tu comprobante correcto. Si no, el pedido se cancela.
    </p>
    ${conEnlace
      ? boton('Subir mi comprobante', enlacePedidoTransferencia(pedido.id, pedido.acceso_token!))
      : `<p style="font-size:14px;color:#555;line-height:1.7;margin:16px 0;">Responde a este correo o escríbenos por WhatsApp con tu comprobante y lo revisamos.</p>`}
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Si tienes dudas, escríbenos a <a href="mailto:hola@vitalora.com.mx" style="color:#C9A961;">hola@vitalora.com.mx</a> o por <a href="${WHATSAPP_URL}" style="color:#C9A961;">WhatsApp</a>. En algunos casos podríamos contactarte para ayudarte a resolverlo.</p>`
  await enviar(pedido.email, `Necesitamos tu comprobante — Pedido ${numero}`, marco('No pudimos confirmar tu pago', contenido))
}
