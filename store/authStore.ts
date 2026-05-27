import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
}

interface Session {
  access_token: string
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
  session: Session | null
  perfil: Perfil | null
  setAuth: (user: User, session: Session) => void
  setPerfil: (perfil: Perfil) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      perfil: null,
      setAuth: (user, session) => set({ user, session }),
      setPerfil: (perfil) => set({ perfil }),
      logout: () => set({ user: null, session: null, perfil: null }),
      isLoggedIn: () => !!get().user && !!get().session,
    }),
    { name: 'vitalora-auth' }
  )
)
