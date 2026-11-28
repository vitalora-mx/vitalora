import { notFound } from 'next/navigation'
import { metadatosPagina } from '@/lib/compartir'
import { REWARDS_ACTIVO, REWARDS_VISIBLE } from '@/lib/rewards-config'

// Metadatos de /rewards y /rewards/terminos (las páginas son componentes de cliente).
// Mientras el programa está apagado no se indexa.
export const metadata = metadatosPagina({
  titulo: 'Vitalora Rewards',
  ruta: '/rewards',
  descripcion: 'Comparte tu código: quien compra obtiene 5% de descuento en productos y tú recibes 10% en puntos en tu Monedero Rewards.',
  indexar: REWARDS_ACTIVO,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  // Segunda capa (la primera es proxy.ts)
  if (!REWARDS_VISIBLE) notFound()
  return children
}
