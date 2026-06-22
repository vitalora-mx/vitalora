import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, passwordActual, passwordNueva } = await request.json()

    if (!email || !passwordActual || !passwordNueva) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    if (passwordNueva.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
    }

    const emailLimpio = email.toLowerCase().trim()

    // Verificar la contraseña actual intentando login
    const { error: errLogin } = await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password: passwordActual,
    })

    if (errLogin) {
      return NextResponse.json({ error: 'Tu contraseña actual no es correcta.' }, { status: 401 })
    }

    // Obtener el id del usuario
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id')
      .eq('email', emailLimpio)
      .maybeSingle()

    if (!perfil) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
    }

    // Actualizar contraseña
    const { error: errUpdate } = await supabase.auth.admin.updateUserById(perfil.id, {
      password: passwordNueva,
    })

    if (errUpdate) {
      console.error('Error al cambiar contraseña:', errUpdate)
      return NextResponse.json({ error: 'No se pudo cambiar la contraseña.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Error cambiar password:', err)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
