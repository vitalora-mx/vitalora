import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
    }

    // Buscar token válido
    const { data: tokenData } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('usado', false)
      .maybeSingle()

    if (!tokenData) {
      return NextResponse.json({ error: 'El enlace no es válido o ya fue usado.' }, { status: 400 })
    }

    if (new Date(tokenData.expira_at) < new Date()) {
      return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 })
    }

    // Buscar el usuario en el sistema de auth por email
    const usuario = await buscarUsuarioPorEmail(tokenData.email)

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 400 })
    }

    // Actualizar la contraseña
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      usuario.id,
      { password }
    )

    if (updateError) {
      console.error('Error al actualizar contraseña:', updateError)
      return NextResponse.json({ error: 'No se pudo actualizar la contraseña.' }, { status: 500 })
    }

    // Marcar el token como usado
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ usado: true })
      .eq('id', tokenData.id)

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Error reset password:', err)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
