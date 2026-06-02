'use client'

import Image from 'next/image'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function SuplementosBanner() {
  const isMobile = useIsMobile()

  const src = isMobile
    ? '/images/banner-suplementos-mobile.png'
    : '/images/banner-suplementos-desktop.png'

  return (
    <div style={{
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      aspectRatio: isMobile ? '1254 / 1254' : '2120 / 742',
    }}>
      <Image
        src={src}
        alt="Suplementos Alimenticios — Colección Wellness Vitalora"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />
    </div>
  )
}
