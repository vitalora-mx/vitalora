'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function Categories() {
  const isMobile = useIsMobile()

  const cosmeticosImg = isMobile
    ? '/images/categoria-cosmeticos-mobile.png'
    : '/images/categoria-cosmeticos-desktop.png'
  const suplementosImg = isMobile
    ? '/images/categoria-suplementos-mobile.png'
    : '/images/categoria-suplementos-desktop.png'

  return (
    <section style={{
      padding: isMobile ? '64px 20px' : '120px 40px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        justifyContent: 'center',
      }}>
        <span style={{ width: '30px', height: '1px', background: 'var(--gold)', display: 'block' }} />
        Nuestras Colecciones
        <span style={{ width: '30px', height: '1px', background: 'var(--gold)', display: 'block' }} />
      </div>

      <h2 style={{
        fontFamily: 'var(--font-italiana), serif',
        fontSize: 'clamp(36px, 5vw, 64px)',
        textAlign: 'center',
        marginBottom: isMobile ? '48px' : '80px',
        letterSpacing: '0.02em',
      }}>
        Dos mundos,{' '}
        <em style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic',
          color: 'var(--gold)',
          fontWeight: 300,
        }}>una</em>{' '}
        filosofía
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '24px',
      }}>
        {/* Cosméticos */}
        <Link href="/cosmeticos" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '2px',
            cursor: 'pointer',
            aspectRatio: isMobile ? '1122 / 1402' : '1390 / 1132',
            transition: 'transform 0.4s, box-shadow 0.4s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Image
              src={cosmeticosImg}
              alt="Cosméticos Coreanos — Colección K-Beauty"
              fill
              sizes={isMobile ? '100vw' : '50vw'}
              style={{ objectFit: 'cover' }}
            />
          </div>
        </Link>

        {/* Suplementos */}
        <Link href="/suplementos" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '2px',
            cursor: 'pointer',
            aspectRatio: isMobile ? '1122 / 1402' : '1390 / 1132',
            transition: 'transform 0.4s, box-shadow 0.4s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Image
              src={suplementosImg}
              alt="Suplementos Alimenticios — Colección Wellness"
              fill
              sizes={isMobile ? '100vw' : '50vw'}
              style={{ objectFit: 'cover' }}
            />
          </div>
        </Link>
      </div>
    </section>
  )
}
