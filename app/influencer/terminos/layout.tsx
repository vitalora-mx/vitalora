import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Términos del Programa de Embajadoras',
  ruta: '/influencer/terminos',
  descripcion: 'Condiciones del Programa de Embajadoras Vitalora: códigos, comisiones y pagos.',
  indexar: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
