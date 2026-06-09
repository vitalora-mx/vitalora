'use client'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function Trust() {
  const isMobile = useIsMobile()

  const items = [
    {
      title: 'Pago Seguro',
      desc: 'Procesado por Mercado Pago',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M16 19c2.5 0 4-1.5 4-4" opacity="0" />
        </svg>
      ),
    },
    {
      title: 'Envío Nacional',
      desc: 'A todo México en 2-5 días',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4h13v11H1z" />
          <path d="M14 8h4l3 3v4h-7z" />
          <circle cx="6" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
      ),
    },
    {
      title: '100% Auténtico',
      desc: 'Garantía de originalidad',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C9 6 5 7 5 7s0 7 7 15c7-8 7-15 7-15s-4-1-7-5z" />
        </svg>
      ),
    },
    {
      title: 'Atención Personal',
      desc: 'Asesoría por WhatsApp',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
        </svg>
      ),
    },
  ]

  return (
    <section style={{
      padding: isMobile ? '40px 20px' : '64px 40px',
      background: 'var(--bg-cream)',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        maxWidth: '1300px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 0,
      }}>
        {items.map((item, i) => (
          <div
            key={item.title}
            style={{
              textAlign: 'center',
              padding: isMobile ? '20px 12px' : '8px 28px',
              borderRight: !isMobile && i < items.length - 1 ? '1px solid var(--line)' : 'none',
              borderBottom: isMobile && i < 2 ? '1px solid var(--line)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '10px' : '14px' }}>
              {item.icon}
            </div>
            <h4 style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: isMobile ? '17px' : '20px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--black)',
              letterSpacing: '0.01em',
            }}>{item.title}</h4>
            <p style={{
              fontSize: isMobile ? '10px' : '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
