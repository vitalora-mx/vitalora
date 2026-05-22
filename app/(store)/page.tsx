'use client'

import AnnouncementBar from '@/components/store/AnnouncementBar'
import Header from '@/components/store/Header'
import Hero from '@/components/store/Hero'
import Marquee from '@/components/store/Marquee'
import Categories from '@/components/store/Categories'
import FeaturedProducts from '@/components/store/FeaturedProducts'
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
      <FeaturedProducts />
      <Editorial />
      <Trust />
      <Newsletter />
      <Footer />
      <LoraChat />
    </main>
  )
}