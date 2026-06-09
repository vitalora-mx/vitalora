'use client'

import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function Newsletter() {
  const isMobile = useIsMobile()

  return (
    <section style={{
      padding: isMobile ? '72px 20px' : '130px 40px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#F6F1E8',
      backgroundImage: "url('/images/fondos/fondo-newsletter.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center left',
      backgroundRepeat: 'no-repeat',
    }}>
      <div style={{ maxWidth: '620px', margin: '0 auto', position: 'relative', zIndex: 2 }}>

        {/* Eyebrow */}
        <div style={{
          fontSize: isMobile ? '10px' : '11px',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          justifyContent: 'center',
        }}>
          <span style={{ width: '28px', height: '1px', background: 'var(--gold)', display: 'block', opacity: 0.6 }} />
          Únete al Círculo
          <span style={{ width: '28px', height: '1px', background: 'var(--gold)', display: 'block', opacity: 0.6 }} />
        </div>

        {/* Título */}
        <h2 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: isMobile ? '40px' : '64px',
          marginBottom: '20px',
          letterSpacing: '0.02em',
          color: 'var(--black)',
          lineHeight: 1.05,
        }}>
          Rituales que{' '}
          <em style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            color: 'var(--gold)',
            fontWeight: 400,
          }}>transforman</em>
        </h2>

        {/* Descripción */}
        <p style={{
          fontSize: isMobile ? '14px' : '16px',
          color: 'var(--text-muted)',
          marginBottom: isMobile ? '36px' : '44px',
          lineHeight: 1.7,
          maxWidth: '520px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Crea tu cuenta y obtén un{' '}
          <strong style={{ color: 'var(--black)', fontWeight: 600 }}>5% de descuento</strong>{' '}
          en tu primera compra. Únete a nuestra comunidad y vive la experiencia Vitalora.
        </p>

        {/* Botón Regístrate */}
        <Link href="/cuenta" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: isMobile ? '16px 40px' : '18px 56px',
          background: 'var(--black)',
          borderRadius: '100px',
          fontSize: '12px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#F6F1E8',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'opacity 0.25s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
        >
          Regístrate
          <span style={{ fontSize: '15px' }}>→</span>
        </Link>

        {/* Texto de confianza */}
        <div style={{
          marginTop: '24px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Tu información está protegida. No enviamos spam.
        </div>
      </div>
    </section>
  )
}
