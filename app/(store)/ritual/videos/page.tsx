import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import RitualVideosCliente from './RitualVideosCliente'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const metadata: Metadata = {
  title: 'Todos los videos | Ritual',
  description:
    'Explora todos nuestros videos de skincare coreano y bienestar, organizados por tema. Aprende rutinas y descubre productos.',
  alternates: { canonical: 'https://vitalora.com.mx/ritual/videos' },
  openGraph: {
    locale: 'es_MX',
    siteName: 'Vitalora',
    title: 'Todos los videos | Ritual | Vitalora',
    description:
      'Videos de skincare coreano y bienestar organizados por tema.',
    url: 'https://vitalora.com.mx/ritual/videos',
  },
  robots: { index: true, follow: true },
}

async function obtenerVideos() {
  const { data, error } = await supabase
    .from('ritual_videos')
    .select('*, ritual_temas(nombre)')
    .eq('activo', true)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data
}

export default async function RitualTodosVideosPage() {
  const videos = await obtenerVideos()

  return <RitualVideosCliente videosIniciales={videos} />
}