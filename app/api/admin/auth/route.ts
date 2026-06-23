import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: login de administrador
// Verifica email + password contra Supabase Auth,
// y confirma que la persona este en admin_usuarios y activa.
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos.' }, { status: 400 })
    }

    const emailLimpio = email.toLowerCase().trim()

    // 1) Verificar credenciales con Supabase Auth
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: emailLimpio,
      password,
    })

    if (loginError || !loginData.user) {
      return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 })
    }

    // 2) Verificar que sea un usuario admin activo
    const { data: adminUser } = await supabaseAdmin
      .from('admin_usuarios')
      .select('id, email, nombre, rol, activo')
      .eq('id', loginData.user.id)
      .maybeSingle()

    if (!adminUser) {
      return NextResponse.json({ error: 'Esta cuenta no tiene acceso al panel de administración.' }, { status: 403 })
    }

    if (!adminUser.activo) {
      return NextResponse.json({ error: 'Tu acceso ha sido desactivado. Contacta al administrador.' }, { status: 403 })
    }

    // 3) Devolver datos del admin (sin la sesion de Supabase, usamos un token simple)
    return NextResponse.json({
      ok: true,
      usuario: {
        id: adminUser.id,
        email: adminUser.email,
        nombre: adminUser.nombre,
        rol: adminUser.rol,
      },
    })
  } catch (err) {
    console.error('Error en login admin:', err)
    return NextResponse.json({ error: 'Error al iniciar sesión.' }, { status: 500 })
  }
}

// GET: verificar que un usuario (por id) sigue siendo admin activo
// Se usa para revalidar la sesion guardada en el navegador.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ valido: false }, { status: 400 })
    }

    const { data: adminUser } = await supabaseAdmin
      .from('admin_usuarios')
      .select('id, email, nombre, rol, activo')
      .eq('id', id)
      .maybeSingle()

    if (!adminUser || !adminUser.activo) {
      return NextResponse.json({ valido: false })
    }

    return NextResponse.json({
      valido: true,
      usuario: {
        id: adminUser.id,
        email: adminUser.email,
        nombre: adminUser.nombre,
        rol: adminUser.rol,
      },
    })
  } catch (err) {
    console.error('Error al verificar admin:', err)
    return NextResponse.json({ valido: false }, { status: 500 })
  }
}
