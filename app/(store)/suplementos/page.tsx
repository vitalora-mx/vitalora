import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import SuplementosCliente from './SuplementosCliente'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const metadata: Metadata = {
  title: 'Suplementos de Alta Pureza | Bienestar',
  description:
    'Suplementos alimenticios de alta pureza para tu bienestar diario. Vitaminas, colágeno, antioxidantes y más, con envío a todo México.',
  alternates: { canonical: 'https://vitalora.com.mx/suplementos' },
  openGraph: {
    locale: 'es_MX',
    siteName: 'Vitalora',
    title: 'Suplementos de Alta Pureza | Bienestar | Vitalora',
    description:
      'Suplementos alimenticios de alta pureza con envío a todo México.',
    url: 'https://vitalora.com.mx/suplementos',
  },
  robots: { index: true, follow: true },
}

async function obtenerProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*), producto_videos(*), producto_variantes(*, variante_imagenes(*))')
    .eq('activo', true)
    .eq('tipo', 'suplemento')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data
}

export default async function SuplementosPage() {
  const productos = await obtenerProductos()

  return <SuplementosCliente productosIniciales={productos} />
}