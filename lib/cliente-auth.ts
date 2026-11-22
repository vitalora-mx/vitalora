import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ============================================================
// Sesión de clientes (Mi cuenta, checkout, reseñas, portal de embajadoras)
// - La sesión es la de Supabase Auth, guardada en cookies httpOnly "vt-cliente*".
//   El navegador nunca ve el access_token ni el refresh_token.
// - @supabase/ssr renueva el access_token con el refresh_token cuando caduca
//   y reescribe las cookies (solo dentro de Route Handlers).
// - Caduca 30 días después del último inicio de sesión con contraseña
//   (last_sign_in_at, que viene de Supabase y no del navegador).
// - CSRF: SameSite=Lax + en POST/PUT/PATCH/DELETE el Origin debe ser el propio sitio.
// ============================================================

export const CLIENTE_COOKIE = 'vt-cliente'
export const SESION_CLIENTE_DIAS = 30
const SESION_MAX_SEG = SESION_CLIENTE_DIAS * 24 * 60 * 60
const SESION_MAX_MS = SESION_MAX_SEG * 1000

export interface ClienteSesion {
  id: string
  email: string
}

type ResultadoCliente =
  | { ok: true; cliente: ClienteSesion }
  | { ok: false; response: NextResponse }

// Cliente de Supabase Auth para clientes, creado en cada petición con la llave anon.
// Lee y escribe la sesión en las cookies httpOnly "vt-cliente".
// Solo usar en Route Handlers (ahí se pueden escribir cookies).
export async function crearClienteAuthCliente() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: CLIENTE_COOKIE,
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

// Borra cualquier cookie de sesión de cliente que haya quedado.
export async function borrarCookiesCliente() {
  const cookieStore = await cookies()
  for (const c of cookieStore.getAll()) {
    if (c.name === CLIENTE_COOKIE || c.name.startsWith(`${CLIENTE_COOKIE}.`) || c.name.startsWith(`${CLIENTE_COOKIE}-`)) {
      cookieStore.delete(c.name)
    }
  }
}

// En métodos que modifican datos, el Origin (si viene) debe ser este mismo sitio.
export function origenValido(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true
  const origin = req.headers.get('origin')
  if (!origin) return true // fetch del mismo sitio siempre lo manda; SameSite=Lax cubre el resto
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  try {
    return !!host && new URL(origin).host === host
  } catch {
    return false
  }
}

// Devuelve el cliente de la sesión actual, o null si no hay sesión válida.
// No responde nada: útil donde la sesión es opcional (checkout).
export async function obtenerCliente(): Promise<ClienteSesion | null> {
  const supabase = await crearClienteAuthCliente()
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user
  if (error || !user || !user.email) return null

  const inicio = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN
  if (!Number.isFinite(inicio) || Date.now() - inicio > SESION_MAX_MS) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    return null
  }
  return { id: user.id, email: user.email }
}

// Verifica que quien llama tenga una sesión de cliente válida.
// Uso:
//   const auth = await requireCliente(req)
//   if (!auth.ok) return auth.response
//   const userId = auth.cliente.id
export async function requireCliente(req: Request): Promise<ResultadoCliente> {
  if (!origenValido(req)) {
    return { ok: false, response: NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 }) }
  }
  const cliente = await obtenerCliente()
  if (!cliente) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.', sesionExpirada: true }, { status: 401 }),
    }
  }
  return { ok: true, cliente }
}
