'use client'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function RitualBanner() {
  const isMobile = useIsMobile()

  const src = isMobile
    ? '/images/ritual/banner-ritual-mobile.png'
    : '/images/ritual/banner-ritual-desktop.png'

  return (
    <div style={{
      width: '100%',
      aspectRatio: isMobile ? '1254 / 1254' : '2172 / 724',
      backgroundImage: `url(${src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }} />
  )
}
