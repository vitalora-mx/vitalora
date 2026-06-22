import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = 'gabomaciel7@gmail.com'

const CATEGORIAS: Record<string, { label: string; color: string; emoji: string }> = {
  ayuda: { label: 'Ayuda', color: '#5B7C99', emoji: '\u{1F4AC}' },
  sugerencia: { label: 'Sugerencia de mejora', color: '#6A8A62', emoji: '\u{1F4A1}' },
  falla: { label: 'Reporte de falla', color: '#EF4444', emoji: '\u{1F41B}' },
  otro: { label: 'Otro', color: '#C9A961', emoji: '\u{2709}' },
}

export async function POST(request: Request) {
  try {
    const { email, categoria, mensaje } = await request.json()

    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    if (!categoria || !CATEGORIAS[categoria]) return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 })
    if (!mensaje || mensaje.trim().length < 5) return NextResponse.json({ error: 'Escribe un mensaje más detallado.' }, { status: 400 })
    if (mensaje.length > 3000) return NextResponse.json({ error: 'El mensaje es demasiado largo.' }, { status: 400 })

    const emailLimpio = email.toLowerCase().trim()

    // Buscar el influencer para incluir su nombre/código en el correo
    const { data: influencer } = await supabase
      .from('influencers')
      .select('nombre, codigo')
      .eq('email', emailLimpio)
      .maybeSingle()

    if (!influencer) return NextResponse.json({ error: 'Influencer no encontrado' }, { status: 404 })

    const cat = CATEGORIAS[categoria]
    const mensajeLimpio = mensaje.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: ADMIN_EMAIL,
      replyTo: emailLimpio,
      subject: `[${cat.label}] Mensaje de ${influencer.nombre}`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">PORTAL DE EMBAJADORAS</div>
  </div>
  <div style="padding:32px;">
    <div style="display:inline-block;background:${cat.color};color:white;font-size:12px;font-weight:600;padding:5px 14px;border-radius:100px;margin-bottom:16px;">${cat.emoji} ${cat.label}</div>
    <h2 style="font-size:18px;color:#0E0E0E;margin:0 0 6px;">Mensaje de ${influencer.nombre}</h2>
    <p style="font-size:13px;color:#888;margin:0 0 20px;">${emailLimpio}${influencer.codigo ? ` · Código ${influencer.codigo}` : ''}</p>
    <div style="background:#FAFAF5;border-left:3px solid ${cat.color};border-radius:4px;padding:16px 18px;">
      <p style="font-size:14px;color:#333;line-height:1.7;margin:0;">${mensajeLimpio}</p>
    </div>
    <p style="font-size:12px;color:#A8A8A8;margin:24px 0 0;">Puedes responder directamente a este correo para contactar a la embajadora.</p>
  </div>
</div></body></html>`,
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Error mensaje soporte influencer:', err)
    return NextResponse.json({ error: 'Error al enviar el mensaje.' }, { status: 500 })
  }
}
