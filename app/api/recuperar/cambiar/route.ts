import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Verificar expiración
    if (new Date(tokenData.expira_at) < new Date()) {
      return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 })
    }

    // Buscar el usuario por email para obtener su id
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('email', tokenData.email)
      .maybeSingle()

    if (!perfil) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 400 })
    }

    // Actualizar la contraseña con la service role key
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      perfil.id,
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
