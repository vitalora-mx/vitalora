import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { permitirIp } from '@/lib/limites'

const supabaseAdmin = createServiceClient()

const MIN_PASSWORD = 8

async function buscarUsuarioPorEmail(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data) break
    const encontrado = data.users.find(u => u.email?.toLowerCase() === email)
    if (encontrado) return encontrado
    if (data.users.length < 1000) break
  }
  return null
}

// GET /api/recuperar/cambiar?token=... — solo revisa si el enlace sigue sirviendo (no lo consume).
// Responde { valido: boolean } sin decir de qué correo es.
export async function GET(req: NextRequest) {
  try {
    if (!(await permitirIp(req, 'recuperar-verificar', 30, 100))) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' }, { status: 429 })
    }
    const token = (req.nextUrl.searchParams.get('token') ?? '').trim()
    if (!token || token.length > 200) return NextResponse.json({ valido: false })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const { data } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id')
      .eq('token_hash', tokenHash)
      .eq('usado', false)
      .gt('expira_at', new Date().toISOString())
      .maybeSingle()

    return NextResponse.json({ valido: !!data })
  } catch (err) {
    console.error('Error verificando enlace de recuperación:', err)
    return NextResponse.json({ error: 'No se pudo verificar el enlace.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Evita probar tokens a lo loco: 10 intentos por hora por IP
    if (!(await permitirIp(req, 'recuperar-cambiar', 10, 30))) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` }, { status: 400 })
    }
    if (password.length > 72) {
      return NextResponse.json({ error: 'La contraseña es demasiado larga (máximo 72 caracteres).' }, { status: 400 })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Reclamar el token de forma atómica: solo una petición puede marcarlo como usado
    const { data: reclamado } = await supabaseAdmin
      .from('password_reset_tokens')
      .update({ usado: true })
      .eq('token_hash', tokenHash)
      .eq('usado', false)
      .gt('expira_at', new Date().toISOString())
      .select('id, email')
      .maybeSingle()

    if (!reclamado) {
      return NextResponse.json({ error: 'El enlace no es válido, ya fue usado o expiró. Solicita uno nuevo.' }, { status: 400 })
    }

    const usuario = await buscarUsuarioPorEmail(reclamado.email)
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(usuario.id, { password })

    if (updateError) {
      console.error('Error al actualizar contraseña:', updateError)
      // Devolver el token para que pueda intentarlo otra vez con el mismo enlace
      await supabaseAdmin.from('password_reset_tokens').update({ usado: false }).eq('id', reclamado.id)
      return NextResponse.json({ error: 'No se pudo actualizar la contraseña.' }, { status: 500 })
    }

    // Invalidar cualquier otro enlace pendiente de ese correo
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ usado: true })
      .eq('email', reclamado.email)
      .eq('usado', false)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error reset password:', err)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
