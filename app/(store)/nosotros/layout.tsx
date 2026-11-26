import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Nosotros',
  ruta: '/nosotros',
  descripcion: 'Vitalora nació de la pasión por el K-Beauty y el bienestar. Conoce nuestra historia y nuestra selección de skincare coreano 100% original.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
