'use client'
import { useRef } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const CATEGORIAS = [
  { nombre: 'Limpiador & Exfoliante', img: '/images/categorias/cat-limpiador.png' },
  { nombre: 'Tónico & Mist', img: '/images/categorias/cat-tonico.png' },
  { nombre: 'Sérum', img: '/images/categorias/cat-serum.png' },
  { nombre: 'Crema & Balm', img: '/images/categorias/cat-crema.png' },
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

interface Props {
  rutinaActiva: string
  setRutinaActiva: (r: string) => void
}

export default function CosmeticosRutinas({ rutinaActiva, setRutinaActiva }: Props) {
  const isMobile = useIsMobile()
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'izq' | 'der') {
    if (!scrollRef.current) return
    const cantidad = isMobile ? 200 : 360
    scrollRef.current.scrollBy({ left: dir === 'izq' ? -cantidad : cantidad, behavior: 'smooth' })
  }

  const cardW = isMobile ? 140 : 200
  const cardH = isMobile ? 180 : 260

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #E8E0D5',
      padding: isMobile ? '24px 0' : '40px 0',
    }}>
      {/* Encabezado + boton Todas */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '18px' : '24px', padding: '0 20px' }}>
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: '14px',
        }}>
          Explora por categoría
        </div>
        <button
          onClick={() => setRutinaActiva('Todas')}
          style={{
            padding: isMobile ? '8px 20px' : '10px 28px',
            border: '1px solid',
            borderColor: rutinaActiva === 'Todas' ? 'var(--gold)' : '#E8E0D5',
            borderRadius: '100px',
            background: rutinaActiva === 'Todas' ? 'var(--gold)' : 'white',
            color: rutinaActiva === 'Todas' ? 'white' : '#2C2C2C',
            fontSize: isMobile ? '12px' : '13px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: rutinaActiva === 'Todas' ? 500 : 400,
            transition: 'all 0.2s',
          }}
        >
          ✦ Ver todas
        </button>
      </div>

      {/* Carrusel de categorias con foto */}
      <div style={{ position: 'relative', maxWidth: '1400px', margin: '0 auto' }}>
        {!isMobile && (
          <button onClick={() => scroll('izq')} aria-label="Anterior" style={flechaStyle('izq')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: isMobile ? '12px' : '18px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: isMobile ? '0 16px' : '0 50px',
            scrollSnapType: 'x mandatory',
          }}
          className="rutinas-scroll"
        >
          {CATEGORIAS.map((cat) => {
            const activa = rutinaActiva === cat.nombre
            return (
              <button
                key={cat.nombre}
                onClick={() => setRutinaActiva(cat.nombre)}
                className="rutina-card"
                style={{
                  flexShrink: 0,
                  width: cardW,
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  scrollSnapAlign: 'start',
                }}
              >
                <div style={{
                  width: cardW,
                  height: cardH,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: activa ? '0 0 0 3px var(--gold), 0 4px 20px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s',
                }}>
                  <img
                    src={cat.img}
                    alt={cat.nombre}
                    className="rutina-img"
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
                    background: activa
                      ? 'linear-gradient(to top, rgba(201,169,97,0.55) 0%, rgba(0,0,0,0) 55%)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 50%)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '14px',
                    right: '14px',
                    color: '#fff',
                    fontFamily: 'var(--font-cormorant), serif',
                    fontSize: isMobile ? '15px' : '18px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                    textAlign: 'left',
                  }}>
                    {cat.nombre}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {!isMobile && (
          <button onClick={() => scroll('der')} aria-label="Siguiente" style={flechaStyle('der')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
      </div>

      <style>{`
        .rutinas-scroll::-webkit-scrollbar { display: none; }
        .rutina-card:hover .rutina-img { transform: scale(1.08); }
      `}</style>
    </div>
  )
}

function flechaStyle(lado: 'izq' | 'der'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [lado === 'izq' ? 'left' : 'right']: '8px',
    zIndex: 5,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'white',
    border: '1px solid #E8E0D5',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
