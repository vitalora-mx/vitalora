// ============================================================
// Correo al cliente con la guía y el rastreo (SOLO SERVIDOR).
// Sale al generar la guía en Skydropx y al registrar una guía manual.
// ============================================================
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { formatearNumeroPedido } from '@/lib/utils'

// Enlace de rastreo de cada paquetería (cuando Skydropx no da uno)
export function linkRastreo(paqueteria: string, guia: string): string {
  const g = encodeURIComponent(guia.trim())
  switch ((paqueteria || '').toLowerCase()) {
    case 'estafeta': return `https://www.estafeta.com/herramientas/rastreo?guias=${g}`
    case 'dhl': return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${g}`
    case 'fedex': return `https://www.fedex.com/fedextrack/?trknbr=${g}`
    case 'paquetexpress': return `https://www.paquetexpress.com.mx/rastreo/${g}`
    default: return `https://www.google.com/search?q=rastrear+${encodeURIComponent(paqueteria)}+${g}`
  }
}

const escapar = (s: string) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export async function enviarCorreoGuia(pedidoId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: pedido } = await createServiceClient()
    .from('pedidos')
    .select('id, nombre, email, numero_guia, paqueteria, guia_url_rastreo')
    .eq('id', pedidoId)
    .maybeSingle()
  if (!pedido) return { ok: false, error: 'Pedido no encontrado.' }
  if (!pedido.numero_guia || !pedido.paqueteria) return { ok: false, error: 'El pedido no tiene guía o paquetería.' }

  const link = pedido.guia_url_rastreo && /^https:\/\//.test(pedido.guia_url_rastreo)
    ? pedido.guia_url_rastreo
    : linkRastreo(pedido.paqueteria, pedido.numero_guia)
  const numeroPedido = formatearNumeroPedido(pedido.id)
  const paqueteria = escapar(pedido.paqueteria)
  const guia = escapar(pedido.numero_guia)

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>

  <div style="padding:40px 32px;text-align:center;border-bottom:1px solid #E8E0D5;">
    <div style="font-size:40px;margin-bottom:8px;">📦</div>
    <h1 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">¡Tu pedido ya tiene guía!</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">Hola ${escapar(pedido.nombre)}, tu pedido <strong>${numeroPedido}</strong> ya tiene guía de envío. Aquí están tus datos de rastreo.</p>
  </div>

  <div style="padding:32px;">
    <div style="background:#FAF7F0;border:1px solid #E8E0D5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Paquetería</div>
      <div style="font-size:20px;font-weight:700;color:#0E0E0E;margin-bottom:20px;">${paqueteria}</div>
      <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Número de guía</div>
      <div style="font-size:22px;font-weight:700;color:#0E0E0E;font-family:monospace;letter-spacing:0.05em;word-break:break-all;">${guia}</div>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${escapar(link)}" target="_blank" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:16px 36px;border-radius:4px;font-size:15px;font-weight:600;letter-spacing:0.05em;">Rastrear mi pedido</a>
    </div>

    <div style="background:#FFF9F0;border:1px solid #E8D5B0;border-radius:6px;padding:16px;">
      <p style="font-size:13px;color:#8B6914;line-height:1.6;margin:0;text-align:center;">
        El rastreo se activa en cuanto la paquetería reciba tu paquete; puede tardar unas horas en aparecer. Si el enlace no carga, copia tu número de guía y pégalo en la página de ${paqueteria}.
      </p>
    </div>
    <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#888;line-height:1.6;text-align:center;">Tu pedido ya tiene guía de envío y no puede cancelarse.</p>
  </div>

  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: pedido.email,
      subject: `Tu pedido ${numeroPedido} ya tiene guía de envío 📦`,
      html,
    })
    return { ok: true }
  } catch (e) {
    console.error('Error al enviar correo de guía:', e)
    return { ok: false, error: 'No se pudo enviar el correo.' }
  }
}
