import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import RitualHeader from '@/components/store/ritual/RitualHeader'
import RitualBanner from '@/components/store/ritual/RitualBanner'
import RitualVideos from '@/components/store/ritual/RitualVideos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const metadata: Metadata = {
  title: 'Ritual — Videos de K-Beauty y Bienestar',
  description:
    'Aprende rutinas de skincare coreano y bienestar con nuestros videos educativos. Descubre los productos que usamos en cada rutina.',
  alternates: { canonical: 'https://vitalora.com.mx/ritual' },
  openGraph: {
    locale: 'es_MX',
    siteName: 'Vitalora',
    title: 'Ritual — Videos de K-Beauty y Bienestar | Vitalora',
    description:
      'Videos educativos de skincare coreano y bienestar, con los productos de cada rutina.',
    url: 'https://vitalora.com.mx/ritual',
  },
  robots: { index: true, follow: true },
}

async function obtenerDatos() {
  const [videosRes, temasRes] = await Promise.all([
    supabase
      .from('ritual_videos')
      .select('*, ritual_temas(nombre)')
      .eq('activo', true)
      .order('posicion', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('ritual_temas')
      .select('*')
      .order('nombre', { ascending: true }),
  ])

  return {
    videos: videosRes.data || [],
    temas: temasRes.data || [],
  }
}

export default async function RitualPage() {
  const { videos, temas } = await obtenerDatos()

  return (
    <main>
      <RitualHeader />
      <RitualBanner />
      <RitualVideos videosIniciales={videos} temasIniciales={temas} />
      <Footer />
      <LoraChat />
    </main>
  )
}