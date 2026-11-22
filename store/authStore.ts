import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// La sesión real vive en cookies httpOnly "vt-cliente" (lib/cliente-auth.ts).
// Aquí solo se guarda quién es el usuario y su perfil, para mostrarlos en pantalla.
// Nunca se guardan tokens en el navegador.

interface User {
  id: string
  email: string
}

interface Perfil {
  nombre: string; apellido: string; telefono: string
  envio_calle: string; envio_numero: string; envio_interior: string
  envio_colonia: string; envio_ciudad: string; envio_estado: string
  envio_cp: string; envio_referencia: string
  rfc: string; razon_social: string; regimen_fiscal: string; email_facturacion: string
  factura_misma_direccion: boolean
  factura_calle: string; factura_numero: string; factura_interior: string
  factura_colonia: string; factura_ciudad: string; factura_estado: string; factura_cp: string
  primera_compra_usada: boolean
}

interface AuthStore {
  user: User | null
  perfil: Perfil | null
  setAuth: (user: User) => void
  setPerfil: (perfil: Perfil) => void
  // Solo limpia los datos locales (por ejemplo, cuando el servidor responde 401)
  logout: () => void
  // Cierra la sesión en el servidor (borra las cookies) y limpia los datos locales
  cerrarSesion: () => Promise<void>
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      perfil: null,
      setAuth: (user) => set({ user: { id: user.id, email: user.email } }),
      setPerfil: (perfil) => set({ perfil }),
      logout: () => set({ user: null, perfil: null }),
      cerrarSesion: async () => {
        try { await fetch('/api/cuenta/auth', { method: 'DELETE' }) } catch { /* sin red: igual se limpia */ }
        set({ user: null, perfil: null })
      },
      isLoggedIn: () => !!get().user,
    }),
    {
      name: 'vitalora-auth',
      // v2: la sesión pasó a cookies httpOnly. Se descarta lo guardado antes
      // (incluía el access_token), así que todos inician sesión una vez más.
      version: 2,
      migrate: () => ({ user: null, perfil: null }) as unknown as AuthStore,
      partialize: (s) => ({ user: s.user, perfil: s.perfil }),
    }
  )
)

// fetch para las rutas que requieren sesión de cliente.
// Si el servidor responde 401 (sesión vencida o inexistente), limpia los datos locales.
export async function fetchCliente(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: 'same-origin' })
  if (res.status === 401) useAuthStore.getState().logout()
  return res
}
