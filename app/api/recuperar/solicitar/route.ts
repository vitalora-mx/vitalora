import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { permitirIp, permitirClave, hashClave } from '@/lib/limites'

const supabaseAdmin = createServiceClient()
const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = 'https://vitalora.com.mx'

// Buscar un usuario por email en el sistema de auth de Supabase (1000 por página)
async function buscarUsuarioPorEmail(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data) break
    const encontrado = data.users.find(u => u.email?.toLowerCase() === email)
    if (encontrado) return encontrado
    if (data.users.length < 1000) break // no hay más páginas
  }
  return null
}

// Siempre se responde { ok: true }: no se revela si el correo existe ni si se alcanzó un límite.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const emailLimpio = typeof body?.email === 'string' ? body.email.toLowerCase().trim().slice(0, 200) : ''
    if (!emailLimpio) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    // Límites: por IP (5/hora, 20/día) y por correo (3/hora, 5/día)
    if (!(await permitirIp(req, 'recuperar', 5, 20))) return NextResponse.json({ ok: true })
    if (!(await permitirClave(`recuperar-email:${hashClave(emailLimpio)}`, 3, 5))) return NextResponse.json({ ok: true })

    // Verificar que el usuario existe en el sistema de auth
    const usuario = await buscarUsuarioPorEmail(emailLimpio)
    if (!usuario) return NextResponse.json({ ok: true })

    // Token seguro: el correo lleva el token; en la base solo se guarda su hash
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    const { error: insertError } = await supabaseAdmin.from('password_reset_tokens').insert({
      email: emailLimpio,
      token_hash: tokenHash,
      expira_at: expira.toISOString(),
    })
    if (insertError) {
      console.error('Error guardando token de recuperación:', insertError)
      return NextResponse.json({ ok: true })
    }

    const enlace = `${BASE_URL}/recuperar/nueva?token=${token}`

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
    return NextResponse.json({ ok: true })
  }
}
