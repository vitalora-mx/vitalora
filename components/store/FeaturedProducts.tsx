'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useIsMobile } from '@/hooks/useIsMobile'

const products = [
  { id: 1, slug: 'hydra-glow-essence', meta: 'K-Beauty · Sérum', nombre: 'Hydra Glow Essence', marca: 'COSRX', sub: 'Ácido hialurónico + ginseng coreano', precio: 649, tag: 'Best Seller', tagType: 'gold', color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)', tipo: 'cosmetico' as const },
  { id: 2, slug: 'royal-snail-cream', meta: 'K-Beauty · Crema', nombre: 'Royal Snail Cream', marca: 'COSRX', sub: 'Regeneración nocturna intensiva', precio: 890, tag: 'Nuevo', tagType: 'black', color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)', tipo: 'cosmetico' as const },
  { id: 3, slug: 'colageno-marino', meta: 'Wellness · Cápsulas', nombre: 'Colágeno Marino', marca: 'B Life', sub: 'Tipo I & III · 60 cápsulas', precio: 520, tag: 'Vegano', tagType: 'sage', color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)', tipo: 'suplemento' as const },
  { id: 4, slug: 'vital-defense-pro', meta: 'Wellness · Cápsulas', nombre: 'Vital Defense Pro', marca: 'NOW Foods', sub: 'Multivitamínico premium · 90 días', precio: 745, tag: 'Best Seller', tagType: 'gold', color: 'linear-gradient(135deg, #1A1A1A, #0E0E0E)', tipo: 'suplemento' as const },
]

const tagStyles: Record<string, React.CSSProperties> = {
  gold:  { background: 'var(--gold)',      color: 'var(--black)' },
  black: { background: 'var(--black)',     color: 'var(--bg-cream)' },
  sage:  { background: 'var(--sage-deep)', color: 'var(--bg-cream)' },
}

export default function FeaturedProducts() {
  const { agregarItem } = useCartStore()
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const isMobile = useIsMobile()

  return (
    <section style={{ padding: isMobile ? '64px 20px' : '120px 40px', background: 'var(--bg-cream-deep)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-end', marginBottom: isMobile ? '40px' : '60px', flexWrap: 'wrap', gap: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ textAlign: isMobile ? 'center' : 'left', width: isMobile ? '100%' : 'auto' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <span style={{ width: '24px', height: '1px', background: 'var(--gold)', display: 'block' }} />
              Más Vendidos
            </div>
            <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 4vw, 56px)', letterSpacing: '0.02em' }}>
              Favoritos{' '}
              <em style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', color: 'var(--gold)', fontWeight: 300 }}>de la casa</em>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-cream)', padding: '6px', borderRadius: '100px', border: '1px solid var(--line)' }}>
            {['Todos', 'Cosméticos', 'Suplementos'].map((tab, i) => (
              <button key={tab} style={{ padding: isMobile ? '8px 14px' : '10px 24px', fontSize: isMobile ? '10px' : '12px', letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', borderRadius: '100px', fontWeight: 500, cursor: 'pointer', background: i === 0 ? 'var(--black)' : 'none', color: i === 0 ? 'var(--bg-cream)' : 'var(--text)', fontFamily: 'inherit' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '16px' : '32px' }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={{ aspectRatio: '4/5', background: 'var(--bg-cream)', borderRadius: '2px', overflow: 'hidden', position: 'relative', marginBottom: isMobile ? '14px' : '20px' }}>
                <div style={{ ...tagStyles[product.tagType], position: 'absolute', top: '12px', left: '12px', padding: '5px 10px', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', zIndex: 2 }}>
                  {product.tag}
                </div>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: product.color }}>
                  <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'rgba(255,255,255,0.3)' }}>V</div>
                </div>
                <button
                  onClick={() => agregarItem({
                    id: product.id,
                    slug: product.slug,
                    nombre: product.nombre,
                    marca: product.marca,
                    precio: product.precio,
                    imagen: '',
                    tipo: product.tipo,
                  })}
                  style={{
                    position: 'absolute', bottom: isMobile ? '10px' : '16px', left: isMobile ? '10px' : '16px', right: isMobile ? '10px' : '16px',
                    padding: isMobile ? '11px' : '14px', background: 'var(--black)', color: 'var(--bg-cream)',
                    border: 'none', fontFamily: 'inherit', fontSize: isMobile ? '9px' : '11px',
                    letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                    opacity: isMobile ? 1 : (hoveredId === product.id ? 1 : 0),
                    transition: 'opacity 0.3s',
                    zIndex: 3,
                  }}
                >
                  + Agregar
                </button>
              </div>

              <div style={{ fontSize: isMobile ? '9px' : '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>{product.meta}</div>
              <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '18px' : '22px', fontWeight: 500, marginBottom: '4px', color: 'var(--black)' }}>{product.nombre}</h3>
              <p style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--muted)', marginBottom: '12px' }}>{product.sub}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '17px' : '20px', fontWeight: 500 }}>
                  ${product.precio.toLocaleString()} MXN
                </span>
                <span style={{ color: 'var(--gold)', fontSize: isMobile ? '10px' : '12px' }}>★★★★★</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
