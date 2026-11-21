import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Primera capa (rápida, sin red) para las APIs del panel:
// si no hay cookie de sesión del admin, se rechaza de inmediato.
// La validación real (sesión, caducidad, rol y permisos) la hace
// requireAdmin() dentro de cada ruta (lib/admin-auth.ts).
const ADMIN_COOKIE = 'vt-admin'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // El login/logout/sesión actual se maneja en su propia ruta
  if (pathname === '/api/admin/auth') return NextResponse.next()

  const tieneSesion = request.cookies
    .getAll()
    .some(c => c.name === ADMIN_COOKIE || c.name.startsWith(`${ADMIN_COOKIE}.`))

  if (!tieneSesion) {
    return NextResponse.json({ error: 'Sesión no válida. Inicia sesión de nuevo.' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/admin/:path*',
}
