import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Mi cuenta',
  ruta: '/cuenta',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
