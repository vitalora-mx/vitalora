'use client'

import RitualHeader from '@/components/store/ritual/RitualHeader'
import RitualBanner from '@/components/store/ritual/RitualBanner'
import RitualVideos from '@/components/store/ritual/RitualVideos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

export default function RitualPage() {
  return (
    <main>
      <RitualHeader />
      <RitualBanner />
      <RitualVideos />
      <Footer />
      <LoraChat />
    </main>
  )
}
