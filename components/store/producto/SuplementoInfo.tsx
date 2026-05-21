'use client'

import { useState } from 'react'

interface Props {
  producto: any
}

export default function SuplementoInfo({ producto }: Props) {
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  function handleAgregar() {
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Marca y categoría */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B8F6B', fontWeight: 600 }}>
          {producto.marca}
        </span>
        <span style={{ color: '#DDDDDD' }}>·</span>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999999' }}>
          {producto.categoria}
        </span>
      </div>

      {/* Nombre */}
      <h1 style={{
        fontFamily: 'var(--font-italiana), serif',
        fontSize: 'clamp(28px, 4vw, 44px)',
        lineHeight: 1.1,
        letterSpacing: '0.02em',
        color: '#111111',
      }}>
        {producto.nombre}
      </h1>

      {/* Estrellas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#6B8F6B', fontSize: '16px', letterSpacing: '2px' }}>★★★★★</span>
        <span style={{ fontSize: '13px', color: '#999999' }}>4.8 · 98 reseñas</span>
      </div>

      {/* Precio */}
      <div style={{
        fontFamily: 'var(--font-cormorant), serif',
        fontSize: '40px',
        fontWeight: 600,
        color: '#111111',
      }}>
        ${producto.precio.toLocaleString()} MXN
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#EEEEEE' }} />

      {/* Beneficios rápidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {producto.beneficios.slice(0, 3).map((b: string, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#444444' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#6B8F6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>
            </div>
            {b}
          </div>
        ))}
      </div>

      {/* Certificaciones */}
      {producto.certificaciones && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {producto.certificaciones.map((cert: string) => (
            <span key={cert} style={{
              padding: '4px 12px',
              border: '1px solid #6B8F6B',
              borderRadius: '100px',
              fontSize: '11px',
              color: '#6B8F6B',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}>{cert}</span>
          ))}
        </div>
      )}

      {/* Cantidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999' }}>
          Cantidad
        </span>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EEEEEE', borderRadius: '8px' }}>
          <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#333333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>{cantidad}</span>
          <button onClick={() => setCantidad(cantidad + 1)} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#333333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>

      {/* Botón agregar */}
      <button
        onClick={handleAgregar}
        style={{
          padding: '20px',
          background: agregado ? '#4A7A4A' : '#0E0E0E',
          color: 'white',
          border: 'none',
          fontSize: '13px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.3s',
          borderRadius: '8px',
        }}
      >
        {agregado ? '✓ Agregado al carrito' : '+ Agregar al carrito'}
      </button>

      {/* Beneficios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { icon: '🚚', text: 'Envío gratis +$1,000 MXN' },
          { icon: '✓', text: '100% Auténtico' },
          { icon: '🔒', text: 'Pago seguro' },
          { icon: '↩', text: 'Devolución 30 días' },
        ].map((b) => (
          <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#999999' }}>
            <span style={{ fontSize: '14px' }}>{b.icon}</span>
            {b.text}
          </div>
        ))}
      </div>

    </div>
  )
}