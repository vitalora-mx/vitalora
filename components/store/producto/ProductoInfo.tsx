'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'

interface Props {
  producto: any
}

export default function ProductoInfo({ producto }: Props) {
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const { agregarItem } = useCartStore()

  function handleAgregar() {
    for (let i = 0; i < cantidad; i++) {
      agregarItem({
        id: producto.id,
        slug: producto.slug || producto.nombre.toLowerCase().replace(/ /g, '-'),
        nombre: producto.nombre,
        marca: producto.marca,
        precio: producto.precio,
        imagen: '',
        tipo: 'cosmetico',
      })
    }
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Marca y categoría */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
          {producto.marca}
        </span>
        <span style={{ color: '#D9D2C4' }}>·</span>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {producto.categoria}
        </span>
      </div>

      {/* Nombre */}
      <h1 style={{
        fontFamily: 'var(--font-italiana), serif',
        fontSize: 'clamp(32px, 4vw, 48px)',
        lineHeight: 1.1,
        letterSpacing: '0.02em',
        color: 'var(--black)',
      }}>
        {producto.nombre}
      </h1>

      {/* Estrellas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--gold)', fontSize: '16px', letterSpacing: '2px' }}>★★★★★</span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>4.9 · 142 reseñas</span>
      </div>

      {/* Precio */}
      <div style={{
        fontFamily: 'var(--font-cormorant), serif',
        fontSize: '40px',
        fontWeight: 600,
        color: 'var(--black)',
        letterSpacing: '0.02em',
      }}>
        ${producto.precio.toLocaleString()} MXN
      </div>

      <div style={{ height: '1px', background: 'var(--line)' }} />

      <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-muted)' }}>
        {producto.descripcion.split('.')[0]}.
      </p>

      {/* Cantidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Cantidad
        </span>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: '2px' }}>
          <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>{cantidad}</span>
          <button onClick={() => setCantidad(cantidad + 1)} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>

      {/* Botón agregar */}
      <button
        onClick={handleAgregar}
        style={{
          padding: '20px',
          background: agregado ? 'var(--sage-deep)' : 'var(--black)',
          color: 'var(--bg-cream)',
          border: 'none',
          fontSize: '13px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.3s',
          borderRadius: '2px',
        }}
      >
        {agregado ? '✓ Agregado al carrito' : '+ Agregar al carrito'}
      </button>

      {/* Beneficios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { icon: '✦', text: 'Envío gratis +$1,000 MXN' },
          { icon: '✦', text: '100% Auténtico' },
          { icon: '✦', text: 'Pago seguro' },
          { icon: '✦', text: 'Devolución 30 días' },
        ].map((b) => (
          <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--gold)', fontSize: '10px' }}>{b.icon}</span>
            {b.text}
          </div>
        ))}
      </div>

    </div>
  )
}