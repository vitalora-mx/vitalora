import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { crearClienteAuthAdmin, requireAdmin, ADMIN_COOKIE } from '@/lib/admin-auth'
import { cookies } from 'next/headers'

// POST: login de administrador.
// Inicia sesión con un cliente creado en esta petición (llave anon) que guarda
// la sesión en cookies httpOnly. La verificación en admin_usuarios se hace con
// el cliente de service role, que nunca inicia sesión.
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos.' }, { status: 400 })
    }

    const emailLimpio = String(email).toLowerCase().trim()
    const supabase = await crearClienteAuthAdmin()

    // 1) Verificar credenciales con Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password,
    })

    if (loginError || !loginData.user) {
      return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 })
    }

    // 2) Verificar que sea un usuario admin activo
    const { data: adminUser } = await createServiceClient()
      .from('admin_usuarios')
      .select('id, email, nombre, rol, activo')
      .eq('id', loginData.user.id)
      .maybeSingle()

    if (!adminUser || !adminUser.activo) {
      // No dejar una sesión abierta para alguien sin acceso al panel
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      const error = !adminUser
        ? 'Esta cuenta no tiene acceso al panel de administración.'
        : 'Tu acceso ha sido desactivado. Contacta al administrador.'
      return NextResponse.json({ error }, { status: 403 })
    }

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

// GET: devuelve el admin de la sesión actual (cookie). 401 si no hay sesión válida.
export async function GET(request: Request) {
  const adminAuth = await requireAdmin(request)
  if (!adminAuth.ok) return adminAuth.response
  return NextResponse.json({ valido: true, usuario: adminAuth.admin })
}

// DELETE: cerrar sesión.
export async function DELETE() {
  try {
    const supabase = await crearClienteAuthAdmin()
    await supabase.auth.signOut({ scope: 'local' })
  } catch (err) {
    console.error('Error al cerrar sesión admin:', err)
  }
  // Borrar cualquier cookie de sesión que haya quedado
  const cookieStore = await cookies()
  for (const c of cookieStore.getAll()) {
    if (c.name === ADMIN_COOKIE || c.name.startsWith(`${ADMIN_COOKIE}.`) || c.name.startsWith(`${ADMIN_COOKIE}-`)) {
      cookieStore.delete(c.name)
    }
  }
  return NextResponse.json({ ok: true })
}
