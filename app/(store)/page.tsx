import type { Metadata } from 'next'
import AnnouncementBar from '@/components/store/AnnouncementBar'
import Header from '@/components/store/Header'
import Hero from '@/components/store/Hero'
import Marquee from '@/components/store/Marquee'
import Categories from '@/components/store/Categories'
import CategoriasCarrusel from '@/components/store/CategoriasCarrusel'
import SuplementosCarrusel from '@/components/store/SuplementosCarrusel'
import Editorial from '@/components/store/Editorial'
import Trust from '@/components/store/Trust'
import Newsletter from '@/components/store/Newsletter'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { SUPLEMENTOS_ACTIVO } from '@/lib/tienda'
import { OG_IMAGEN_DEFECTO } from '@/lib/compartir'

export const metadata: Metadata = {
  title: { absolute: 'Vitalora — K-Beauty & Bienestar Auténtico' },
  description:
    SUPLEMENTOS_ACTIVO
      ? 'Cosméticos coreanos auténticos y suplementos de alta pureza para México. Envío nacional, productos originales importados de Corea.'
      : 'Cosméticos coreanos auténticos para México. Envío nacional, productos originales importados de Corea.',
  alternates: { canonical: 'https://vitalora.com.mx' },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Vitalora',
    url: 'https://vitalora.com.mx',
    title: 'Vitalora — K-Beauty & Bienestar Auténtico',
    description: SUPLEMENTOS_ACTIVO
      ? 'Cosméticos coreanos auténticos y suplementos de alta pureza para México.'
      : 'Cosméticos coreanos auténticos para México.',
    images: [OG_IMAGEN_DEFECTO],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vitalora — K-Beauty & Bienestar Auténtico',
    images: [OG_IMAGEN_DEFECTO],
  },
  robots: { index: true, follow: true },
}

export default function HomePage() {
  return (
    <main>
      <AnnouncementBar />
      <Header />
      <Hero />
      <Marquee />
      <Categories />
      <CategoriasCarrusel />
      {SUPLEMENTOS_ACTIVO && <SuplementosCarrusel />}
      <Editorial />
      <Trust />
      <Newsletter />
      <Footer />
      <LoraChat />
    </main>
  )
}