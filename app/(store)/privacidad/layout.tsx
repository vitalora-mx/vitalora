import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Aviso de privacidad',
  ruta: '/privacidad',
  descripcion: 'Cómo recopilamos, usamos y protegemos tus datos personales en Vitalora.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
