import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PROGRAMA_EMBAJADORAS_ACTIVO, MENSAJE_PROGRAMA_SUSPENDIDO } from '@/lib/inscripciones'

// Primera capa (rápida, sin red) para las APIs del panel:
// si no hay cookie de sesión del admin, se rechaza de inmediato.
// La validación real (sesión, caducidad, rol y permisos) la hace
// requireAdmin() dentro de cada ruta (lib/admin-auth.ts).
const ADMIN_COOKIE = 'vt-admin'

// Página que se muestra en /influencer/portal mientras el programa está suspendido
const PAGINA_SUSPENDIDO = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Portal de embajadoras — Vitalora</title><meta name="robots" content="noindex"></head>
<body style="margin:0;min-height:100vh;background:#F5F0E8;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;">
<div style="background:#fff;max-width:440px;width:100%;padding:48px 32px;border-radius:4px;border:1px solid #E8E4DA;text-align:center;box-sizing:border-box;">
<p style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Programa de embajadoras</p>
<h1 style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#0E0E0E;margin:0 0 12px;">${MENSAJE_PROGRAMA_SUSPENDIDO}</h1>
<p style="font-size:14px;color:#6B6B6B;line-height:1.7;margin:0 0 28px;">Por ahora no estamos recibiendo nuevas solicitudes.</p>
<a href="/" style="display:inline-block;padding:14px 28px;background:#0E0E0E;color:#C9A961;text-decoration:none;border-radius:3px;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">Volver a la tienda</a>
</div></body></html>`

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Programa de embajadoras suspendido ──
  if (!PROGRAMA_EMBAJADORAS_ACTIVO) {
    if (pathname === '/api/influencer' || pathname.startsWith('/api/influencer/')) {
      return NextResponse.json({ error: MENSAJE_PROGRAMA_SUSPENDIDO }, { status: 403 })
    }
    if (pathname === '/influencer/portal' || pathname.startsWith('/influencer/portal/')) {
      return new NextResponse(PAGINA_SUSPENDIDO, {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }
  }

  // ── Panel de administración ──
  if (pathname.startsWith('/api/admin')) {
    // El login/logout/sesión actual se maneja en su propia ruta
    if (pathname === '/api/admin/auth') return NextResponse.next()

    const tieneSesion = request.cookies
      .getAll()
      .some(c => c.name === ADMIN_COOKIE || c.name.startsWith(`${ADMIN_COOKIE}.`))

    if (!tieneSesion) {
      return NextResponse.json({ error: 'Sesión no válida. Inicia sesión de nuevo.' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/influencer/:path*', '/influencer/portal/:path*'],
}
