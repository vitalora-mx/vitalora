import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Programa de Embajadoras',
  ruta: '/programa-embajadoras',
  descripcion: 'Comparte tu código con tu comunidad: ellas obtienen un descuento y tú ganas por cada venta. Inscripciones suspendidas temporalmente.',
  indexar: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
