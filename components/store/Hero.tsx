'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const slides = [
  {
    id: 1,
    desktop: '/images/hero/slide-1-desktop.png',
    mobile: '/images/hero/slide-1-mobile.png',
    width: 1942, height: 809,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Tu rutina perfecta con ayuda de Lora',
    boton: {
      texto: '✦ Descubre tu rutina con Lora',
      tipo: 'lora',
      // Posicion y tamano por separado para desktop y movil.
      // top/left son % de la altura/ancho del hero. Ajusta a tu gusto.
      posicion: { top: '72%', left: '50%' },
      posicionMobile: { top: '85%', left: '50%' },
      tamano: 'normal',        // 'normal' | 'grande' | 'pequeno'
      tamanoMobile: 'pequeno',
    },
  },
  {
    id: 2,
    desktop: '/images/hero/slide-2-desktop.png',
    mobile: '/images/hero/slide-2-mobile.png',
    width: 1942, height: 809,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Cosméticos Coreanos Auténticos',
    boton: {
      texto: '✦ Ver Cosméticos Coreanos',
      tipo: 'link',
      href: '/cosmeticos',
      posicion: { top: '72%', left: '50%' },
      posicionMobile: { top: '85%', left: '50%' },
      tamano: 'normal',
      tamanoMobile: 'pequeno',
    },
  },
  {
    id: 3,
    desktop: '/images/hero/slide-3-desktop.png',
    mobile: '/images/hero/slide-3-mobile.png',
    width: 1717, height: 916,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Suplementos de Alta Pureza',
    boton: {
      texto: '✦ Ver Suplementos',
      tipo: 'link',
      href: '/suplementos',
      posicion: { top: '72%', left: '50%' },
      posicionMobile: { top: '85%', left: '50%' },
      tamano: 'normal',
      tamanoMobile: 'pequeno',
    },
  },
  {
    id: 4,
    desktop: '/images/hero/slide-4-desktop.png',
    mobile: '/images/hero/slide-4-mobile.png',
    width: 1774, height: 887,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Belleza sin fronteras, sin complicaciones',
    boton: null,
  },
]

const botonBase: React.CSSProperties = {
  background: 'var(--gold)',
  color: 'var(--black)',
  border: '1px solid var(--gold)',
  textTransform: 'uppercase',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  borderRadius: '100px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  textDecoration: 'none',
  transition: 'all 0.3s',
  whiteSpace: 'nowrap' as const,
}

const tamanos: Record<string, React.CSSProperties> = {
  normal: { padding: '16px 32px', fontSize: '12px', letterSpacing: '0.2em' },
  grande: { padding: '20px 44px', fontSize: '14px', letterSpacing: '0.2em' },
  pequeno: { padding: '10px 18px', fontSize: '10px', letterSpacing: '0.12em' },
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  function handleLoraClick() {
    const loraBtn = document.getElementById('loraFab')
    if (loraBtn) loraBtn.click()
  }

  function irAtras() {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  function irAdelante() {
    setCurrent((prev) => (prev + 1) % slides.length)
  }

  const slide = slides[current]

  const botonStyle: React.CSSProperties = slide.boton
    ? { ...botonBase, ...tamanos[(isMobile ? slide.boton.tamanoMobile : slide.boton.tamano) || 'normal'] }
    : {}

  const botonPos = slide.boton
    ? (isMobile ? slide.boton.posicionMobile : slide.boton.posicion)
    : { top: '72%', left: '50%' }

  const flechaSize = isMobile ? 36 : 48

  return (
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>

      {/* Slides */}
      {slides.map((s, i) => (
        <div key={s.id} style={{ display: i === current ? 'block' : 'none' }}>
          <Image
            src={isMobile ? s.mobile : s.desktop}
            alt={s.alt}
            width={isMobile ? s.widthMobile : s.width}
            height={isMobile ? s.heightMobile : s.height}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            priority={i === 0}
          />
        </div>
      ))}

      {/* Flecha izquierda */}
      <button
        onClick={irAtras}
        style={{
          position: 'absolute',
          top: '50%',
          left: isMobile ? '12px' : '20px',
          transform: 'translateY(-50%)',
          width: `${flechaSize}px`,
          height: `${flechaSize}px`,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.35)',
          cursor: 'pointer',
          fontSize: isMobile ? '16px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
      >←</button>

      {/* Flecha derecha */}
      <button
        onClick={irAdelante}
        style={{
          position: 'absolute',
          top: '50%',
          right: isMobile ? '12px' : '20px',
          transform: 'translateY(-50%)',
          width: `${flechaSize}px`,
          height: `${flechaSize}px`,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.35)',
          cursor: 'pointer',
          fontSize: isMobile ? '16px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
      >→</button>

      {/* Puntos de navegación */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '14px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        zIndex: 10,
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? '32px' : '10px',
              height: '10px',
              borderRadius: '100px',
              background: i === current ? 'var(--gold)' : 'rgba(255,255,255,0.6)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.4s ease',
            }}
          />
        ))}
      </div>

      {/* Botón por slide */}
      {slide.boton && (
        <div style={{
          position: 'absolute',
          top: botonPos.top,
          left: botonPos.left,
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}>
          {slide.boton.tipo === 'lora' ? (
            <button
              onClick={handleLoraClick}
              style={botonStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--black)'
                e.currentTarget.style.color = 'var(--gold)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--gold)'
                e.currentTarget.style.color = 'var(--black)'
              }}
            >
              {slide.boton.texto}
            </button>
          ) : (
            <Link
              href={(slide.boton as any).href || '/'}
              style={botonStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--black)'
                e.currentTarget.style.color = 'var(--gold)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--gold)'
                e.currentTarget.style.color = 'var(--black)'
              }}
            >
              {slide.boton.texto}
            </Link>
          )}
        </div>
      )}

    </section>
  )
}
