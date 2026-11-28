import { metadatosPagina } from '@/lib/compartir'

export const metadata = metadatosPagina({
  titulo: 'Términos de Vitalora Rewards',
  ruta: '/rewards/terminos',
  descripcion: 'Términos y condiciones del programa Vitalora Rewards.',
  indexar: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
