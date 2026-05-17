'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const slides = [
  {
    id: 1,
    eyebrow: 'K-Beauty',
    title: 'Hidratación que',
    titleEm: 'transforma',
    sub: 'Sérum con ácido hialurónico y ginseng coreano para una piel radiante desde el primer uso.',
    cardColor: 'linear-gradient(135deg, #F5E8E0 0%, #E8C9C0 100%)',
    cardLabel: 'K-Beauty',
    cardName: 'Glow Serum',
  },
  {
    id: 2,
    eyebrow: 'Wellness',
    title: 'Vitalidad que',
    titleEm: 'florece',
    sub: 'Suplementos de alta pureza formulados para nutrir tu cuerpo desde dentro.',
    cardColor: 'linear-gradient(135deg, #D8DDD0 0%, #A8B5A0 100%)',
    cardLabel: 'Wellness',
    cardName: 'Vital Complex',
  },
  {
    id: 3,
    eyebrow: 'K-Beauty',
    title: 'Regeneración',
    titleEm: 'nocturna',
    sub: 'Crema de baba de caracol con 92% de filtrado activo. Despierta con piel renovada.',
    cardColor: 'linear-gradient(135deg, #EDE6D8 0%, #D9D2C4 100%)',
    cardLabel: 'K-Beauty',
    cardName: 'Snail Cream',
  },
  {
    id: 4,
    eyebrow: 'Wellness',
    title: 'Colágeno que',
    titleEm: 'protege',
    sub: 'Colágeno marino Tipo I y III. 60 cápsulas de alta biodisponibilidad.',
    cardColor: 'linear-gradient(135deg, #E8EBE2 0%, #8A9882 100%)',
    cardLabel: 'Wellness',
    cardName: 'Colágeno Marino',
  },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <section style={{ background: 'var(--black)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 30%, rgba(201,169,97,0.15) 0%, transparent 50%)' }} />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 40px 60px', width: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ color: 'var(--bg-cream)' }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ width: '40px', height: '1px', background: 'var(--gold)', display: 'block' }} />
            {slide.eyebrow}
          </div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(48px, 7vw, 96px)', lineHeight: 1, letterSpacing: '0.02em', marginBottom: '32px' }}>
            {slide.title}<br />
            <em style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)' }}>{slide.titleEm}</em>
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'rgba(245,240,232,0.75)', maxWidth: '480px', marginBottom: '48px' }}>{slide.sub}</p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '32px' : '8px', height: '8px', borderRadius: '100px', background: i === current ? 'var(--gold)' : 'rgba(245,240,232,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.4s ease', padding: 0 }} />
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', height: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '280px', height: '360px', background: slide.cardColor, transform: 'rotate(-2deg)', borderRadius: '2px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', transition: 'background 0.8s ease' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--black)', opacity: 0.6, marginBottom: '16px' }}>{slide.cardLabel}</div>
            <div style={{ width: '80px', height: '180px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px 4px 40px 40px', border: '1px solid rgba(255,255,255,0.5)', marginBottom: '20px' }} />
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 500, color: 'var(--black)', textAlign: 'center' }}>{slide.cardName}</div>
          </div>
        </div>
      </div><div style={{ borderTop: '1px solid rgba(245,240,232,0.1)', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <Link href="/cosmeticos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '28px', fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', color: 'var(--black)', background: 'var(--gold)', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
            <span>✦</span>
            Cosméticos Coreanos
            <span>→</span>
          </Link>
          <Link href="/suplementos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '28px', fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', color: 'var(--black)', background: 'var(--gold-light)' }}>
            <span>✦</span>
            Suplementos
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}