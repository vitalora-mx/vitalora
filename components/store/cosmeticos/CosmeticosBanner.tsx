'use client'

import Image from 'next/image'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function CosmeticosBanner() {
  const isMobile = useIsMobile()

  const src = isMobile
    ? '/images/banner-cosmeticos-mobile.png'
    : '/images/banner-cosmeticos-desktop.png'

  return (
    <div style={{
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      aspectRatio: isMobile ? '1254 / 1254' : '2120 / 742',
    }}>
      <Image
        src={src}
        alt="Cosméticos Coreanos — Colección K-Beauty Vitalora"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />
    </div>
  )
}
