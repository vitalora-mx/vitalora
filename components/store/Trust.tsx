'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

export default function Trust() {
  const isMobile = useIsMobile()

  const items = [
    { icon: '✦', title: 'Pago Seguro', desc: 'Procesado por Mercado Pago' },
    { icon: '✦', title: 'Envío Nacional', desc: 'A todo México en 2-5 días' },
    { icon: '✦', title: '100% Auténtico', desc: 'Garantía de originalidad' },
    { icon: '✦', title: 'Atención Personal', desc: 'Asesoría por WhatsApp' },
  ]

  return (
    <section style={{
      padding: isMobile ? '48px 20px' : '80px 40px',
      background: 'var(--bg-cream)',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '32px 16px' : '40px',
      }}>
        {items.map((item) => (
          <div key={item.title} style={{ textAlign: 'center', padding: isMobile ? '0' : '0 20px' }}>
            <div style={{ fontSize: isMobile ? '24px' : '28px', color: 'var(--gold)', marginBottom: isMobile ? '12px' : '16px' }}>
              {item.icon}
            </div>
            <h4 style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'var(--black)',
            }}>{item.title}</h4>
            <p style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-muted)' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
