'use client'

import AnnouncementBar from '@/components/store/AnnouncementBar'
import Header from '@/components/store/Header'
import Hero from '@/components/store/Hero'
import Marquee from '@/components/store/Marquee'
import Categories from '@/components/store/Categories'
import CategoriasCarrusel from '@/components/store/CategoriasCarrusel'
import Editorial from '@/components/store/Editorial'
import Trust from '@/components/store/Trust'
import Newsletter from '@/components/store/Newsletter'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

export default function HomePage() {
  return (
    <main>
      <AnnouncementBar />
      <Header />
      <Hero />
      <Marquee />
      <Categories />
      <CategoriasCarrusel />
      <Editorial />
      <Trust />
      <Newsletter />
      <Footer />
      <LoraChat />
    </main>
  )
}