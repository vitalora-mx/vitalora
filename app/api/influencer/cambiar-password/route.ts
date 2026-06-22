import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function buscarUsuarioPorEmail(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data) break
    const encontrado = data.users.find(u => u.email?.toLowerCase() === email)
    if (encontrado) return encontrado
    if (data.users.length < 1000) break
  }
  return null
}

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

    // Buscar el usuario en auth
    const usuario = await buscarUsuarioPorEmail(emailLimpio)

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const { error: errUpdate } = await supabase.auth.admin.updateUserById(usuario.id, {
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
