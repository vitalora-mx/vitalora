import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Términos y condiciones',
  ruta: '/terminos',
  descripcion: 'Términos y condiciones de compra y uso de la tienda en línea Vitalora.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
