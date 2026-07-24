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

export const metadata: Metadata = {
  title: { absolute: 'Vitalora — K-Beauty & Bienestar Auténtico' },
  description:
    'Cosméticos coreanos auténticos y suplementos de alta pureza para México. Envío nacional, productos originales importados de Corea.',
  alternates: { canonical: 'https://vitalora.com.mx' },
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
      <SuplementosCarrusel />
      <Editorial />
      <Trust />
      <Newsletter />
      <Footer />
      <LoraChat />
    </main>
  )
}