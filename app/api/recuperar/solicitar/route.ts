import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = 'https://vitalora.com.mx'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const emailLimpio = email.toLowerCase().trim()

    // Verificar que el usuario existe (buscamos en perfiles por email)
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('id, email')
      .eq('email', emailLimpio)
      .maybeSingle()

    // IMPORTANTE: por seguridad, respondemos OK aunque el email no exista
    // (no revelar qué correos están registrados)
    if (!perfil) {
      return NextResponse.json({ ok: true })
    }

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex')
    const expira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token
    await supabaseAdmin.from('password_reset_tokens').insert({
      email: emailLimpio,
      token,
      expira_at: expira.toISOString(),
    })

    const enlace = `${BASE_URL}/recuperar/nueva?token=${token}`

    // Enviar correo con Resend
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: emailLimpio,
      subject: 'Recupera tu contraseña — Vitalora',
      html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:560px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="150" style="display:block;margin:0 auto;max-width:150px;height:auto;" />
  </div>
  <div style="padding:40px 32px;">
    <h2 style="font-size:22px;color:#0E0E0E;margin:0 0 16px;font-weight:400;">Recupera tu contraseña</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva. Este enlace expira en 1 hora.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${enlace}" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:0.05em;">Crear nueva contraseña</a>
    </div>
    <p style="font-size:12px;color:#999;line-height:1.6;margin:24px 0 0;">
      Si no solicitaste este cambio, puedes ignorar este correo — tu contraseña no se modificará.
    </p>
  </div>
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`,
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Error solicitar recuperación:', err)
    // Aún así respondemos OK por seguridad
    return NextResponse.json({ ok: true })
  }
}
