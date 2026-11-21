import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createLoginClient } from '@/lib/supabase/service'

// Service role: solo para crear el usuario y actualizar su perfil. Nunca inicia sesión.
const supabaseAdmin = createServiceClient()

// POST — registro o login
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, email, password, nombre, apellido } = body

  if (action === 'registro') {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Actualizar perfil con nombre
    if (data.user) {
      await supabaseAdmin.from('perfiles').update({ nombre, apellido }).eq('id', data.user.id)
    }

    // Generar sesión con un cliente aparte, creado para esta petición
    const { data: session, error: loginError } = await createLoginClient().auth.signInWithPassword({ email, password })
    if (loginError) return NextResponse.json({ error: loginError.message }, { status: 400 })

    return NextResponse.json({ user: session.user, session: session.session })
  }

  if (action === 'login') {
    const { data, error } = await createLoginClient().auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ user: data.user, session: data.session })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
