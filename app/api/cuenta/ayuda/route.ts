import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

const resend = new Resend(process.env.RESEND_API_KEY)

// Límite de envíos por IP (tabla limites_envio + función registrar_envio)
const MAX_POR_HORA = 3
const MAX_POR_DIA = 10
const MENSAJE_LIMITE = 'Recibimos muchos mensajes desde tu conexión. Escríbenos directo a hola@vitalora.com.mx'

function escaparHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function ipDe(req: NextRequest): string {
  const reenviada = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return reenviada || req.headers.get('x-real-ip')?.trim() || 'desconocida'
}

// Devuelve true si se permite el envío (y lo registra). Si la base falla, se permite.
async function permitirEnvio(req: NextRequest): Promise<boolean> {
  const clave = 'ayuda:' + createHash('sha256').update('vitalora:' + ipDe(req)).digest('hex')
  const { data, error } = await createServiceClient().rpc('registrar_envio', {
    p_clave: clave,
    p_max_hora: MAX_POR_HORA,
    p_max_dia: MAX_POR_DIA,
  })
  if (error) {
    console.error('Error revisando límite de ayuda:', error)
    return true
  }
  return data === true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const nombre = texto(body?.nombre, 100)
    const telefono = texto(body?.telefono, 30)
    const emailBruto = texto(body?.email, 200)
    const numeroPedido = texto(body?.numeroPedido, 20)
    const mensaje = texto(body?.mensaje, 2000)

    if (!nombre || !telefono || !mensaje) {
      return NextResponse.json({ error: 'Nombre, teléfono y mensaje son obligatorios' }, { status: 400 })
    }
    const email = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(emailBruto) ? emailBruto : ''

    // Límite por IP: se revisa después de validar, para no gastar intentos en formularios incompletos
    if (!(await permitirEnvio(req))) {
      return NextResponse.json({ error: MENSAJE_LIMITE }, { status: 429 })
    }

    const h = {
      nombre: escaparHtml(nombre),
      telefono: escaparHtml(telefono),
      email: escaparHtml(email),
      numeroPedido: escaparHtml(numeroPedido),
      mensaje: escaparHtml(mensaje),
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #F5F0E8; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #0E0E0E; padding: 24px; text-align: center;">
      <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
      <div style="font-size: 10px; letter-spacing: 0.3em; color: #C9A961; margin-top: 4px;">MENSAJE DE CLIENTE</div>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; color: #0E0E0E; margin: 0 0 24px;">Nuevo mensaje de ayuda</h2>

      <div style="margin-bottom: 20px; padding: 16px; background: #F9F9F5; border-radius: 8px; border: 1px solid #E5E5D5;">
        <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Datos del cliente</h3>
        <p style="font-size: 14px; color: #333; line-height: 1.8; margin: 0;">
          <strong>Nombre:</strong> ${h.nombre}<br>
          <strong>WhatsApp / Teléfono:</strong> ${h.telefono}<br>
          ${h.email ? `<strong>Email:</strong> ${h.email}<br>` : ''}
          ${h.numeroPedido ? `<strong>No. de Pedido:</strong> #${h.numeroPedido}<br>` : ''}
        </p>
      </div>

      <div style="margin-bottom: 20px; padding: 16px; background: #FFF; border-radius: 8px; border: 1px solid #E5E5E5;">
        <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin: 0 0 12px;">Mensaje</h3>
        <p style="font-size: 14px; color: #333; line-height: 1.8; margin: 0; white-space: pre-wrap;">${h.mensaje}</p>
      </div>

      <div style="padding: 12px 16px; background: #E8F0E8; border-radius: 6px; font-size: 13px; color: #3A3;">
        Responder a este cliente por WhatsApp: <strong>${h.telefono}</strong>
      </div>
    </div>
    <div style="background: #0E0E0E; padding: 20px; text-align: center;">
      <p style="font-size: 11px; color: rgba(245,240,232,0.4); margin: 0;">Vitalora — Mensaje de ayuda</p>
    </div>
  </div>
</body>
</html>`

    // El asunto es texto plano: solo se quitan saltos de línea
    const sinSaltos = (s: string) => s.replace(/[\r\n]+/g, ' ')
    await resend.emails.send({
      from: 'Vitalora Ayuda <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `📩 Mensaje de ${sinSaltos(nombre)} — ${numeroPedido ? 'Pedido #' + sinSaltos(numeroPedido) : 'Consulta general'}`,
      html,
      replyTo: email || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error enviando mensaje:', error)
    return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 })
  }
}
