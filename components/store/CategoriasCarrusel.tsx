'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

const CATEGORIAS = [
  { nombre: 'Sérum', img: '/images/categorias/cat-serum.png' },
  { nombre: 'Crema & Balm', img: '/images/categorias/cat-crema.png' },
  { nombre: 'Limpiador & Exfoliante', img: '/images/categorias/cat-limpiador.png' },
  { nombre: 'Tónico & Mist', img: '/images/categorias/cat-tonico.png' },
  { nombre: 'Protector Solar', img: '/images/categorias/cat-protector.png' },
  { nombre: 'Cuidado de Ojos', img: '/images/categorias/cat-ojos.png' },
  { nombre: 'Mascarillas & Parche', img: '/images/categorias/cat-mascarillas.png' },
  { nombre: 'Parches para Acné', img: '/images/categorias/cat-acne.png' },
  { nombre: 'Labios', img: '/images/categorias/cat-labios.png' },
  { nombre: 'Make Up', img: '/images/categorias/cat-makeup.png' },
  { nombre: 'Cuidado del Cabello', img: '/images/categorias/cat-cabello.png' },
  { nombre: 'Kits', img: '/images/categorias/cat-kits.png' },
  { nombre: 'Cuidado Corporal', img: '/images/categorias/cat-corporal.png' },
]

export default function CategoriasCarrusel() {
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
      background: 'var(--bg-cream)',
    }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px', padding: '0 20px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '14px' }}>
          Explora
        </div>
        <h2 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: isMobile ? '34px' : '52px',
          color: 'var(--black)',
          letterSpacing: '0.02em',
          lineHeight: 1.1,
        }}>
          Compra por{' '}
          <em style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', color: 'var(--gold)', fontWeight: 400 }}>categoría</em>
        </h2>
      </div>

      {/* Carrusel */}
      <div style={{ position: 'relative', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Flecha izquierda (solo desktop) */}
        {!isMobile && (
          <button onClick={() => scroll('izq')} aria-label="Anterior" style={flechaStyle('izq')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
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
          className="cat-scroll"
        >
          {CATEGORIAS.map((cat) => (
            <Link
              key={cat.nombre}
              href={`/cosmeticos?categoria=${encodeURIComponent(cat.nombre)}`}
              style={{
                flexShrink: 0,
                width: cardW,
                textDecoration: 'none',
                scrollSnapAlign: 'start',
              }}
              className="cat-card"
            >
              <div style={{
                width: cardW,
                height: cardH,
                borderRadius: '14px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '14px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}>
                <img
                  src={cat.img}
                  alt={cat.nombre}
                  className="cat-img"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.6s ease',
                  }}
                />
                {/* Degradado inferior para legibilidad */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 50%)',
                }} />
                {/* Nombre encima */}
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
                  textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}>
                  {cat.nombre}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Flecha derecha (solo desktop) */}
        {!isMobile && (
          <button onClick={() => scroll('der')} aria-label="Siguiente" style={flechaStyle('der')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
      </div>

      <style>{`
        .cat-scroll::-webkit-scrollbar { display: none; }
        .cat-card:hover .cat-img { transform: scale(1.08); }
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
    border: '1px solid var(--line)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
