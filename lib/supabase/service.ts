import { createClient } from '@supabase/supabase-js'

// Cliente con la SERVICE ROLE (se salta RLS). Solo para el servidor.
// No guarda sesión: NUNCA llamar auth.signInWithPassword() ni otro login con
// este cliente, porque a partir de ahí las consultas irían con el token del
// usuario en vez de la service role.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  )
}

// Cliente con la llave ANON, nuevo en cada llamada y sin guardar sesión.
// Úsalo para signInWithPassword cuando no quieras manejar cookies
// (por ejemplo, el login de clientes en /api/cuenta/auth).
export function createLoginClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  )
}
