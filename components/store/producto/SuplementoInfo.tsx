'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'

interface Props {
  producto: any
}

const badgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 10px',
  background: 'white',
  border: '1px solid #EEEEEE',
  borderRadius: '6px',
  height: '36px',
}

const badgeTextStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#333333',
  letterSpacing: '0.03em',
}

const MetodosPago = () => (
  <div style={{ marginTop: '8px' }}>
    <div style={{
      fontSize: '11px',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: '#999999',
      marginBottom: '12px',
    }}>
      Métodos de pago aceptados
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>

      {/* Mercado Pago */}
      <div style={{ ...badgeStyle, padding: '4px 12px', height: '44px' }} title="Mercado Pago">
        <img src="/images/logos/mercadopago.png" alt="Mercado Pago" style={{ height: '34px', width: 'auto', display: 'block' }} />
      </div>

      {/* Visa */}
      <div style={badgeStyle} title="Visa">
        <svg width="44" height="22" viewBox="0 0 60 20" fill="none">
          <rect width="60" height="20" rx="3" fill="#1A1F71"/>
          <text x="6" y="15" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white" letterSpacing="1">VISA</text>
        </svg>
      </div>

      {/* Mastercard */}
      <div style={badgeStyle} title="Mastercard">
        <svg width="36" height="24" viewBox="0 0 40 26" fill="none">
          <circle cx="15" cy="13" r="12" fill="#EB001B"/>
          <circle cx="25" cy="13" r="12" fill="#F79E1B"/>
          <path d="M20 4.8a12 12 0 0 1 0 16.4A12 12 0 0 1 20 4.8z" fill="#FF5F00"/>
        </svg>
      </div>

      {/* OXXO */}
      <div style={badgeStyle} title="OXXO Pay">
        <svg width="50" height="22" viewBox="0 0 70 22" fill="none">
          <rect width="70" height="22" rx="3" fill="#DD0000"/>
          <text x="6" y="16" fontFamily="Arial" fontWeight="900" fontSize="12" fill="white" letterSpacing="2">OXXO</text>
        </svg>
      </div>

      {/* SPEI */}
      <div style={badgeStyle} title="Transferencia SPEI">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#006847"/>
          <path d="M5 12h14M15 8l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={badgeTextStyle}>SPEI</span>
      </div>

      {/* Débito */}
      <div style={badgeStyle} title="Tarjeta de débito">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="1" y="4" width="22" height="16" rx="3" fill="#5B4FCF"/>
          <rect x="1" y="9" width="22" height="4" fill="#4338A8"/>
          <rect x="4" y="15" width="6" height="2" rx="1" fill="white" opacity="0.6"/>
        </svg>
        <span style={badgeTextStyle}>Débito</span>
      </div>

      {/* Crédito */}
      <div style={badgeStyle} title="Tarjeta de crédito">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="1" y="4" width="22" height="16" rx="3" fill="#C9A160"/>
          <rect x="1" y="9" width="22" height="4" fill="#A07840"/>
          <circle cx="7" cy="16" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="11" cy="16" r="1.5" fill="white" opacity="0.4"/>
        </svg>
        <span style={badgeTextStyle}>Crédito</span>
      </div>

    </div>
    <p style={{ fontSize: '11px', color: '#AAAAAA', marginTop: '8px', lineHeight: 1.5 }}>
      Pago procesado de forma segura por Mercado Pago. Sin comisión adicional.
    </p>
  </div>
)

export default function SuplementoInfo({ producto }: Props) {
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { agregarItem } = useCartStore()

  useEffect(() => { setMounted(true) }, [])

  function handleAgregar() {
    for (let i = 0; i < cantidad; i++) {
      agregarItem({
        id: producto.id,
        slug: producto.slug || producto.nombre.toLowerCase().replace(/ /g, '-'),
        nombre: producto.nombre,
        marca: producto.marca,
        precio: producto.precio,
        imagen: '',
        tipo: 'suplemento',
      })
    }
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  if (!mounted) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B8F6B', fontWeight: 600 }}>
          {producto.marca}
        </span>
        <span style={{ color: '#DDDDDD' }}>·</span>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999999' }}>
          {producto.categoria}
        </span>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-italiana), serif',
        fontSize: 'clamp(28px, 4vw, 44px)',
        lineHeight: 1.1,
        letterSpacing: '0.02em',
        color: '#111111',
      }}>
        {producto.nombre}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#6B8F6B', fontSize: '16px', letterSpacing: '2px' }}>★★★★★</span>
        <span style={{ fontSize: '13px', color: '#999999' }}>4.8 · 98 reseñas</span>
      </div>

      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '40px', fontWeight: 600, color: '#111111' }}>
        ${producto.precio.toLocaleString()} MXN
      </div>

      <div style={{ height: '1px', background: '#EEEEEE' }} />

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

      {producto.certificaciones && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {producto.certificaciones.map((cert: string) => (
            <span key={cert} style={{ padding: '4px 12px', border: '1px solid #6B8F6B', borderRadius: '100px', fontSize: '11px', color: '#6B8F6B', letterSpacing: '0.08em', fontWeight: 500 }}>
              {cert}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999' }}>Cantidad</span>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EEEEEE', borderRadius: '8px' }}>
          <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#333333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>{cantidad}</span>
          <button onClick={() => setCantidad(cantidad + 1)} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#333333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>

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

      <div style={{ height: '1px', background: '#EEEEEE' }} />

      <MetodosPago />

    </div>
  )
}
