'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const slides = [
  {
    id: 1,
    desktop: '/images/hero/slide-1-desktop.png',
    width: 1942,
    height: 809,
    alt: 'Vitalora — Tu rutina perfecta con ayuda de Lora',
    boton: { texto: '✦ Descubre tu rutina con Lora', tipo: 'lora' },
  },
  {
    id: 2,
    desktop: '/images/hero/slide-2-desktop.png',
    width: 1942,
    height: 809,
    alt: 'Vitalora — Cosméticos Coreanos Auténticos',
    boton: { texto: '✦ Ver Cosméticos Coreanos', tipo: 'link', href: '/cosmeticos' },
  },
  {
    id: 3,
    desktop: '/images/hero/slide-3-desktop.png',
    width: 1717,
    height: 916,
    alt: 'Vitalora — Suplementos de Alta Pureza',
    boton: { texto: '✦ Ver Suplementos', tipo: 'link', href: '/suplementos' },
  },
  {
    id: 4,
    desktop: '/images/hero/slide-4-desktop.png',
    width: 1774,
    height: 887,
    alt: 'Vitalora — Belleza sin fronteras, sin complicaciones',
    boton: null,
  },
]

const botonStyle: React.CSSProperties = {
  padding: '16px 32px',
  background: 'var(--gold)',
  color: 'var(--black)',
  border: '1px solid var(--gold)',
  fontSize: '12px',
  letterSpacing: '0.2em',
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
}

export default function Hero() {
  const [current, setCurrent] = useState(0)

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

  return (
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>

      {/* Slides */}
      {slides.map((s, i) => (
        <div key={s.id} style={{ display: i === current ? 'block' : 'none' }}>
          <Image
            src={s.desktop}
            alt={s.alt}
            width={s.width}
            height={s.height}
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
          left: '16px',
          transform: 'translateY(-50%)',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
      >←</button>

      {/* Flecha derecha */}
      <button
        onClick={irAdelante}
        style={{
          position: 'absolute',
          top: '50%',
          right: '16px',
          transform: 'translateY(-50%)',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
      >→</button>

      {/* Puntos de navegación */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
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
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          whiteSpace: 'nowrap',
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
              href={slide.boton.href || '/'}
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