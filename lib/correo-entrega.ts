// ============================================================
// Correos del rastreo (SOLO SERVIDOR).
//  - Al cliente cuando la paquetería reporta la entrega (a domicilio o en sucursal).
//  - Al admin cuando hay intento fallido, excepción, devolución, cancelación o error.
// ============================================================
import { Resend } from 'resend'
import { formatearNumeroPedido } from '@/lib/utils'

const ADMIN_EMAIL = 'gabomaciel7@gmail.com'
const SITIO = 'https://vitalora.com.mx'

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

export async function enviarCorreoEntrega(p: {
  id: number; nombre: string; email: string; user_id: string | null
}, enSucursal: boolean, paqueteria: string | null): Promise<boolean> {
  const numero = formatearNumeroPedido(p.id)
  // La reseña se deja desde Mi cuenta → Mis pedidos (solo pedidos ligados a una cuenta)
  const resena = !enSucursal && p.user_id
    ? `<div style="margin-top:28px;padding-top:24px;border-top:1px solid #E8E0D5;text-align:center;">
        <p style="font-size:15px;color:#0E0E0E;margin:0 0 16px;">¿Te gustaron tus productos? Nos encantaría conocer tu opinión.</p>
        <a href="${SITIO}/cuenta?tab=pedidos" target="_blank" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:0.05em;">Dejar mi reseña</a>
      </div>`
    : ''
  const cuerpo = enSucursal
    ? `<h1 style="font-size:24px;color:#0E0E0E;margin:0 0 12px;font-weight:400;">¡Tu pedido llegó a la sucursal!</h1>
       <p style="font-size:14px;color:#666;line-height:1.7;margin:0;">Hola ${escapar(p.nombre)}, la paquetería reporta que tu pedido <strong>${numero}</strong> llegó a la sucursal${paqueteria ? ' de ' + escapar(paqueteria) : ''}. Ya puedes recogerlo. Si algo no llegó como esperabas, escríbenos a hola@vitalora.com.mx.</p>`
    : `<h1 style="font-size:24px;color:#0E0E0E;margin:0 0 12px;font-weight:400;">¡Tu pedido llegó!</h1>
       <p style="font-size:14px;color:#666;line-height:1.7;margin:0;">Hola ${escapar(p.nombre)}, la paquetería reporta que tu pedido <strong>${numero}</strong> fue entregado. Esperamos que disfrutes tus productos. Si algo no llegó como esperabas, escríbenos a hola@vitalora.com.mx.</p>`

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: p.email,
      subject: enSucursal ? `Tu pedido ${numero} llegó a la sucursal 📦` : `Tu pedido ${numero} fue entregado 🎉`,
      html: plantilla(`<div style="padding:40px 32px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">${enSucursal ? '📦' : '🎉'}</div>
        ${cuerpo}
        ${resena}
      </div>`),
    })
    return true
  } catch (e) {
    console.error('Error al enviar correo de entrega:', e)
    return false
  }
}

const NOMBRE_ALERTA: Record<string, string> = {
  delivery_attempt: 'Intento de entrega fallido',
  exception: 'Excepción en el envío',
  in_return: 'El paquete va de regreso (devolución)',
  canceled: 'La paquetería canceló el envío',
  error: 'Error en el envío',
}

export async function enviarAlertaRastreo(p: {
  id: number; nombre: string; apellido: string; email: string; telefono: string | null
  numero_guia: string | null; paqueteria: string | null; guia_url_rastreo: string | null
}, estado: string, descripcion: string | null): Promise<boolean> {
  const numero = formatearNumeroPedido(p.id)
  const titulo = NOMBRE_ALERTA[estado] || estado
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: ADMIN_EMAIL,
      subject: `⚠️ ${titulo}: pedido ${numero}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;max-width:560px;">
        <h2 style="font-size:18px;margin:0 0 12px;">${escapar(titulo)}</h2>
        <p style="margin:0 0 12px;">Pedido <strong>${numero}</strong> · ${escapar(p.paqueteria)} · guía <strong>${escapar(p.numero_guia)}</strong></p>
        ${descripcion ? `<p style="margin:0 0 12px;">La paquetería dice: <em>${escapar(descripcion)}</em></p>` : ''}
        <p style="margin:0 0 12px;">Cliente: ${escapar(p.nombre)} ${escapar(p.apellido)} · ${escapar(p.email)}${p.telefono ? ' · ' + escapar(p.telefono) : ''}</p>
        <p style="margin:0 0 12px;">
          <a href="${SITIO}/admin/pedidos/${p.id}">Ver el pedido en el admin</a>
          ${p.guia_url_rastreo ? ` · <a href="${escapar(p.guia_url_rastreo)}">Rastreo en la paquetería</a>` : ''}
        </p>
        <p style="color:#888;font-size:12px;">Aviso automático del rastreo de Skydropx (una vez por estado y por guía).</p>
      </div>`,
    })
    return true
  } catch (e) {
    console.error('Error al enviar alerta de rastreo:', e)
    return false
  }
}
