import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { puedeVer, type RolAdmin } from '@/lib/admin-permisos'

// ============================================================
// Sesión del panel de administración
// - La sesión es la de Supabase Auth, guardada en cookies httpOnly "vt-admin*".
// - Caduca 12 horas después del último inicio de sesión con contraseña
//   (last_sign_in_at del usuario, que viene de Supabase y no del navegador).
// ============================================================

export const ADMIN_COOKIE = 'vt-admin'
export const SESION_MAX_HORAS = 12
const SESION_MAX_MS = SESION_MAX_HORAS * 60 * 60 * 1000
const SESION_MAX_SEG = SESION_MAX_HORAS * 60 * 60

export interface AdminSesion {
  id: string
  email: string
  nombre: string
  rol: RolAdmin
}

type ResultadoAdmin =
  | { ok: true; admin: AdminSesion }
  | { ok: false; response: NextResponse }

// Cliente de Supabase Auth para el panel, creado en cada petición con la llave anon.
// Lee y escribe la sesión en las cookies httpOnly del admin.
// Solo usar en Route Handlers (ahí se pueden escribir cookies).
export async function crearClienteAuthAdmin() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: ADMIN_COOKIE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(lista) {
          for (const { name, value, options } of lista) {
            const opciones = { ...options }
            // @supabase/ssr fija 400 días; la cookie no debe vivir más que la sesión.
            if ((opciones.maxAge ?? 0) > 0) opciones.maxAge = SESION_MAX_SEG
            cookieStore.set(name, value, opciones)
          }
        },
      },
    }
  )
}

function fallo(status: 401 | 403, error: string): ResultadoAdmin {
  return { ok: false, response: NextResponse.json({ error }, { status }) }
}

// Verifica que quien llama sea un admin activo con permiso.
//   permiso: sección de lib/admin-permisos.ts (ej. '/admin/pedidos') o lista
//            de secciones (basta con tener una). Sin permiso = cualquier admin activo.
//   opciones.roles: si se indica, además exige uno de esos roles.
// Uso:
//   const adminAuth = await requireAdmin(req, '/admin/pedidos')
//   if (!adminAuth.ok) return adminAuth.response
export async function requireAdmin(
  _req: Request,
  permiso?: string | string[],
  opciones?: { roles?: RolAdmin[] }
): Promise<ResultadoAdmin> {
  const supabase = await crearClienteAuthAdmin()

  // 1) Validar la sesión con Supabase (no solo leer la cookie)
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user
  if (error || !user) return fallo(401, 'Sesión no válida. Inicia sesión de nuevo.')

  // 2) Caducidad: 12 horas desde el último login con contraseña
  const inicio = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN
  if (!Number.isFinite(inicio) || Date.now() - inicio > SESION_MAX_MS) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    return fallo(401, 'Tu sesión expiró. Inicia sesión de nuevo.')
  }

  // 3) Debe ser admin activo (consulta con service role)
  const { data: admin } = await createServiceClient()
    .from('admin_usuarios')
    .select('id, email, nombre, rol, activo')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin || !admin.activo) return fallo(403, 'Esta cuenta no tiene acceso al panel de administración.')

  const rol = admin.rol as RolAdmin

  // 4) Permiso por sección
  if (permiso) {
    const secciones = Array.isArray(permiso) ? permiso : [permiso]
    if (!secciones.some(s => puedeVer(rol, s))) {
      return fallo(403, 'Tu rol no tiene permiso para esta acción.')
    }
  }

  // 5) Restricción por rol (ej. reembolsos solo dueño y gerente)
  if (opciones?.roles && !opciones.roles.includes(rol)) {
    return fallo(403, 'Tu rol no tiene permiso para esta acción.')
  }

  return { ok: true, admin: { id: admin.id, email: admin.email, nombre: admin.nombre, rol } }
}
