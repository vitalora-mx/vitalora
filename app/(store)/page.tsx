import AnnouncementBar from '@/components/store/AnnouncementBar'
import Header from '@/components/store/Header'
import Hero from '@/components/store/Hero'
import Marquee from '@/components/store/Marquee'
import Categories from '@/components/store/Categories'
import FeaturedProducts from '@/components/store/FeaturedProducts'

export default function HomePage() {
  return (
    <main>
      <AnnouncementBar />
      <Header />
      <Hero />
      <Marquee />
      <Categories />
      <FeaturedProducts />
    </main>
  )
}