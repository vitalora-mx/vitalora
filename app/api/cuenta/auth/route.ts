import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { crearClienteAuthCliente, borrarCookiesCliente, obtenerCliente, origenValido } from '@/lib/cliente-auth'

// Service role: solo para crear el usuario y actualizar su perfil. Nunca inicia sesión.
const supabaseAdmin = createServiceClient()

const texto = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// POST — registro o login.
// La sesión se guarda en cookies httpOnly (lib/cliente-auth.ts); al navegador
// solo se le devuelve { user: { id, email } } para mostrarlo en pantalla.
export async function POST(req: NextRequest) {
  if (!origenValido(req)) return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const action = body?.action
  const email = texto(body?.email).toLowerCase()
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos.' }, { status: 400 })
  }

  if (action === 'registro') {
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Actualizar perfil con nombre
    if (data.user) {
      await supabaseAdmin
        .from('perfiles')
        .update({ nombre: texto(body?.nombre, 100), apellido: texto(body?.apellido, 100) })
        .eq('id', data.user.id)
    }
  } else if (action !== 'login') {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  // Iniciar sesión: el cliente de esta petición escribe las cookies httpOnly
  const supabase = await crearClienteAuthCliente()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    const mensaje = action === 'login' ? 'Email o contraseña incorrectos.' : (error?.message ?? 'No se pudo iniciar sesión.')
    return NextResponse.json({ error: mensaje }, { status: action === 'login' ? 401 : 400 })
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } })
}

// GET — cliente de la sesión actual (cookie). 401 si no hay sesión válida.
export async function GET() {
  const cliente = await obtenerCliente()
  if (!cliente) return NextResponse.json({ error: 'Sin sesión', sesionExpirada: true }, { status: 401 })
  return NextResponse.json({ user: cliente })
}

// DELETE — cerrar sesión.
export async function DELETE() {
  try {
    const supabase = await crearClienteAuthCliente()
    await supabase.auth.signOut({ scope: 'local' })
  } catch (err) {
    console.error('Error al cerrar sesión de cliente:', err)
  }
  await borrarCookiesCliente()
  return NextResponse.json({ ok: true })
}
