'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

const SAGE = '#6B8F6B'

const CATEGORIAS = [
  { nombre: 'Energía y Rendimiento', img: '/images/categorias/cat-sup-energia.png' },
  { nombre: 'Músculo y Recuperación', img: '/images/categorias/cat-sup-musculo.png' },
  { nombre: 'Control de Peso', img: '/images/categorias/cat-sup-peso.png' },
  { nombre: 'Sueño y Relajación', img: '/images/categorias/cat-sup-sueno.png' },
  { nombre: 'Defensas e Inmunidad', img: '/images/categorias/cat-sup-inmunidad.png' },
  { nombre: 'Digestión', img: '/images/categorias/cat-sup-digestion.png' },
  { nombre: 'Belleza', img: '/images/categorias/cat-sup-belleza.png' },
  { nombre: 'Vitaminas y Minerales', img: '/images/categorias/cat-sup-vitaminas.png' },
]

export default function SuplementosCarrusel() {
  const isMobile = useIsMobile()
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'izq' | 'der') {
    if (!scrollRef.current) return
    const cantidad = isMobile ? 200 : 360
    scrollRef.current.scrollBy({ left: dir === 'izq' ? -cantidad : cantidad, behavior: 'smooth' })
  }

  const cardW = isMobile ? 150 : 230
  const cardH = isMobile ? 200 : 300

  return (
    <section style={{
      padding: isMobile ? '56px 0' : '90px 0',
      background: '#FFFFFF',
    }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px', padding: '0 20px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: SAGE, marginBottom: '14px' }}>
          Suplementos
        </div>
        <h2 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: isMobile ? '34px' : '52px',
          color: 'var(--black)',
          letterSpacing: '0.02em',
          lineHeight: 1.1,
        }}>
          Compra por{' '}
          <em style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', color: SAGE, fontWeight: 400 }}>objetivo</em>
        </h2>
      </div>

      {/* Carrusel */}
      <div style={{ position: 'relative', maxWidth: '1400px', margin: '0 auto' }}>
        {!isMobile && (
          <button onClick={() => scroll('izq')} aria-label="Anterior" style={flechaStyle('izq')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: isMobile ? '14px' : '20px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: isMobile ? '0 20px' : '0 50px',
            scrollSnapType: 'x mandatory',
          }}
          className="cat-sup-scroll"
        >
          {CATEGORIAS.map((cat) => (
            <Link
              key={cat.nombre}
              href={`/suplementos?categoria=${encodeURIComponent(cat.nombre)}`}
              style={{
                flexShrink: 0,
                width: cardW,
                textDecoration: 'none',
                scrollSnapAlign: 'start',
              }}
              className="cat-sup-card"
            >
              <div style={{
                width: cardW,
                height: cardH,
                borderRadius: '14px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '14px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <img
                  src={cat.img}
                  alt={cat.nombre}
                  className="cat-sup-img"
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.6s ease',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%)',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  color: '#fff',
                  fontFamily: 'var(--font-cormorant), serif',
                  fontSize: isMobile ? '16px' : '19px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                }}>
                  {cat.nombre}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!isMobile && (
          <button onClick={() => scroll('der')} aria-label="Siguiente" style={flechaStyle('der')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
      </div>

      <style>{`
        .cat-sup-scroll::-webkit-scrollbar { display: none; }
        .cat-sup-card:hover .cat-sup-img { transform: scale(1.08); }
      `}</style>
    </section>
  )
}

function flechaStyle(lado: 'izq' | 'der'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [lado === 'izq' ? 'left' : 'right']: '8px',
    zIndex: 5,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #E5E5E5',
    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}