'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

export default function AnnouncementBar() {
  const isMobile = useIsMobile()

  return (
    <div style={{
      background: 'var(--black)',
      color: 'var(--bg-cream)',
      textAlign: 'center',
      padding: isMobile ? '8px 14px' : '10px 20px',
      fontSize: isMobile ? '10px' : '12px',
      letterSpacing: isMobile ? '0.08em' : '0.15em',
      textTransform: 'uppercase',
      fontWeight: 400,
    }}>
      {isMobile ? (
        <>✦ Envío gratis desde <span style={{ color: 'var(--gold)' }}>$1,000 MXN</span> ✦</>
      ) : (
        <>✦ ENVÍO GRATIS EN COMPRAS MAYORES A{' '}
        <span style={{ color: 'var(--gold)' }}>$1,000 MXN</span>
        {' '}✦ PRODUCTOS 100% AUTÉNTICOS ✦</>
      )}
    </div>
  )
}
