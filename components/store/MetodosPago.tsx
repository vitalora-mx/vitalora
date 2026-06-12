'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

interface MetodosPagoProps {
  // 'claro' para fondo claro (producto), 'oscuro' para fondo negro (footer)
  variante?: 'claro' | 'oscuro'
  titulo?: string
}

const LOGOS = [
  { src: '/images/pagos/visa.png', alt: 'Visa' },
  { src: '/images/pagos/mastercard.png', alt: 'Mastercard' },
  { src: '/images/pagos/amex.png', alt: 'American Express' },
  { src: '/images/pagos/mercadopago.png', alt: 'Mercado Pago' },
  { src: '/images/pagos/oxxo.png', alt: 'OXXO' },
  { src: '/images/pagos/7eleven.png', alt: '7-Eleven' },
  { src: '/images/pagos/spei.png', alt: 'SPEI' },
]

export default function MetodosPago({ variante = 'claro', titulo = 'Métodos de pago aceptados' }: MetodosPagoProps) {
  const isMobile = useIsMobile()
  const colorTitulo = variante === 'oscuro' ? 'rgba(245,240,232,0.6)' : 'var(--text-muted)'

  return (
    <div style={{ width: '100%' }}>
      {titulo && (
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: colorTitulo,
          marginBottom: '14px',
          textAlign: variante === 'oscuro' ? 'left' : 'center',
        }}>
          {titulo}
        </div>
      )}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? '8px' : '10px',
        justifyContent: variante === 'oscuro' ? 'flex-start' : 'center',
        alignItems: 'center',
      }}>
        {LOGOS.map((logo) => (
          <div
            key={logo.alt}
            style={{
              width: isMobile ? '54px' : '62px',
              height: isMobile ? '36px' : '42px',
              background: '#FFFFFF',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
