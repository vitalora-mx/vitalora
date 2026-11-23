import type { Metadata } from 'next'
import { Suspense } from 'react'
import BuscarCliente from './BuscarCliente'
import { SUPLEMENTOS_ACTIVO } from '@/lib/tienda'

export const metadata: Metadata = {
  title: 'Buscar productos',
  description: SUPLEMENTOS_ACTIVO ? 'Busca cosméticos coreanos y suplementos en Vitalora.' : 'Busca cosméticos coreanos en Vitalora.',
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<main style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Cargando...</main>}>
      <BuscarCliente />
    </Suspense>
  )
}