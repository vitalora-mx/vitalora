import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Registro de embajadoras',
  ruta: '/influencer/registro',
  descripcion: 'Inscripción al Programa de Embajadoras Vitalora. Inscripciones suspendidas temporalmente.',
  indexar: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
