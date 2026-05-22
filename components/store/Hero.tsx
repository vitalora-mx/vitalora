'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleLoraClick() {
    const loraBtn = document.getElementById('loraFab')
    if (loraBtn) loraBtn.click()
  }

  return (
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>

      {/* Imagen Desktop */}
      <div style={{ display: 'block' }} className="hero-desktop">
        <Image
          src="/images/hero/slide-1-desktop.png"
          alt="Vitalora K-Beauty — Tu rutina perfecta con ayuda de Lora"
          width={1942}
          height={809}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          priority
        />
      </div>

      {/* Imagen Móvil */}
      <div style={{ display: 'none' }} className="hero-mobile">
        <Image
          src="/images/hero/slide-1-mobile.png"
          alt="Vitalora K-Beauty — Tu rutina perfecta con ayuda de Lora"
          width={936}
          height={1680}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          priority
        />
      </div>

      {/* Botón Lora */}
      <button
        onClick={handleLoraClick}
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '40px',
          padding: '16px 32px',
          background: 'var(--black)',
          color: 'var(--gold)',
          border: '1px solid var(--gold)',
          fontSize: '13px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--gold)'
          e.currentTarget.style.color = 'var(--black)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--black)'
          e.currentTarget.style.color = 'var(--gold)'
        }}
      >
        ✦ Descubre tu rutina con Lora
      </button>

    </section>
  )
}