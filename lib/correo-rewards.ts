// ============================================================
// Correos de Vitalora Rewards (SOLO SERVIDOR).
// Bienvenida con el código personal al inscribirse.
// ============================================================
import { Resend } from 'resend'
import { DIAS_ACREDITACION } from '@/lib/rewards'
import { SITIO_REWARDS as SITIO, enlaceCodigo } from '@/lib/rewards-config'

const escapar = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function plantilla(contenido: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="${SITIO}/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>
  ${contenido}
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`
}

export async function enviarBienvenidaRewards(p: { email: string; nombre: string; codigo: string }): Promise<boolean> {
  const codigo = escapar(p.codigo)
  const parrafo = 'font-size:14px;color:#555;line-height:1.8;margin:0 0 16px;'
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: p.email,
      subject: `Te damos la bienvenida a Vitalora Rewards · Tu código: ${p.codigo}`,
      html: plantilla(`<div style="padding:40px 32px;">
        <p style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;text-align:center;">Vitalora Rewards</p>
        <h1 style="font-size:26px;color:#0E0E0E;margin:0 0 24px;font-weight:400;text-align:center;">Hola, ${escapar(p.nombre)}</h1>
        <p style="${parrafo}">Ya eres parte de Vitalora Rewards. Este es tu código personal:</p>
        <div style="background:#0E0E0E;border-radius:6px;padding:24px;text-align:center;margin:0 0 24px;">
          <div style="font-size:30px;letter-spacing:0.18em;color:#C9A961;font-family:Georgia,serif;">${codigo}</div>
        </div>
        <p style="${parrafo}">También puedes compartir tu enlace, que aplica el código solo al pagar:<br><a href="${escapar(enlaceCodigo(p.codigo))}" target="_blank" style="color:#A8873F;font-weight:600;word-break:break-all;">${escapar(enlaceCodigo(p.codigo).replace('https://', ''))}</a></p>
        <p style="${parrafo}">Compártelo: quien compre con él obtiene <strong>5% de descuento</strong> en productos y tú recibes <strong>10% en puntos</strong> en tu Monedero Rewards (1 punto = $1 de descuento en productos). También ganas cuando lo usas en tus propias compras.</p>
        <p style="${parrafo}">Tus puntos aparecen como pendientes en cuanto se paga cada pedido y pasan a disponibles ${DIAS_ACREDITACION} días después de que se entrega. <strong>Tus puntos no vencen.</strong></p>
        <div style="text-align:center;margin:32px 0 8px;">
          <a href="${SITIO}/cuenta?tab=rewards" target="_blank" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:0.05em;">Ver mi Monedero</a>
        </div>
        <p style="font-size:12px;color:#999;text-align:center;margin:16px 0 0;"><a href="${SITIO}/rewards/terminos" target="_blank" style="color:#C9A961;text-decoration:none;">Términos de Vitalora Rewards</a></p>
      </div>`),
    })
    if (error) throw error
    return true
  } catch (e) {
    console.error('Error al enviar bienvenida de Rewards:', e)
    return false
  }
}
