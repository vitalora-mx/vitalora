import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import CosmeticosCliente from './CosmeticosCliente'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const metadata: Metadata = {
  title: 'Cosméticos Coreanos | K-Beauty Auténtica',
  description:
    'Descubre cosméticos coreanos originales: limpiadores, sérums, protectores solares, mascarillas y más. K-Beauty auténtica con envío a todo México.',
  alternates: { canonical: 'https://vitalora.com.mx/cosmeticos' },
  openGraph: {
    locale: 'es_MX',
    siteName: 'Vitalora',
    title: 'Cosméticos Coreanos | K-Beauty Auténtica | Vitalora',
    description:
      'Cosméticos coreanos originales con envío a todo México. Limpiadores, sérums, protectores solares y más.',
    url: 'https://vitalora.com.mx/cosmeticos',
  },
  robots: { index: true, follow: true },
}

async function obtenerProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*), producto_videos(*), producto_variantes(*, variante_imagenes(*))')
    .eq('activo', true)
    .eq('tipo', 'cosmetico')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data
}

export default async function CosmeticosPage() {
  const productos = await obtenerProductos()

  return (
    <Suspense fallback={<main style={{ minHeight: '60vh', background: 'var(--bg-cream)' }} />}>
      <CosmeticosCliente productosIniciales={productos} />
    </Suspense>
  )
}