'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const isMobile = useIsMobile()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section style={{
      padding: isMobile ? '64px 20px' : '120px 40px',
      background: 'var(--bg-cream-deep)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-100px',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--rose) 0%, transparent 70%)',
        opacity: 0.4,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--sage) 0%, transparent 70%)',
        opacity: 0.4,
      }} />

      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
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
          <span style={{ width: '24px', height: '1px', background: 'var(--gold)', display: 'block' }} />
          Únete al Círculo
          <span style={{ width: '24px', height: '1px', background: 'var(--gold)', display: 'block' }} />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: isMobile ? '34px' : '48px',
          marginBottom: '16px',
          letterSpacing: '0.02em',
        }}>
          Rituales que{' '}
          <em style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            color: 'var(--gold)',
            fontWeight: 300,
          }}>transforman</em>
        </h2>

        <p style={{
          fontSize: '15px',
          color: 'var(--text-muted)',
          marginBottom: '40px',
          lineHeight: 1.7,
        }}>
          Recibe acceso anticipado a nuevos productos, guías de skincare exclusivas
          y un 5% de descuento en tu primera compra.
        </p>

        {sent ? (
          <div style={{
            padding: '20px',
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: '18px',
            letterSpacing: '0.1em',
          }}>
            ✦ Bienvenida a Vitalora
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            borderBottom: '1px solid var(--black)',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              style={{
                flex: 1,
                padding: '16px 0',
                border: 'none',
                background: 'none',
                fontSize: '14px',
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'inherit',
                minWidth: 0,
              }}
            />
            <button type="submit" style={{
              padding: isMobile ? '16px 12px' : '16px 24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: isMobile ? '11px' : '12px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--black)',
              fontWeight: 500,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>
              Suscribirme →
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
