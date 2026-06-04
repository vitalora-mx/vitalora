'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'

export default function CarritoPage() {
  const { items, total, quitarItem, actualizarCantidad, vaciarCarrito } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '48px', color: 'var(--gold)', marginBottom: '16px' }}>✦</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', marginBottom: '16px' }}>Tu carrito está vacío</h1>
          <Link href="/" style={{ padding: '14px 32px', background: 'var(--black)', color: 'var(--bg-cream)', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Seguir comprando
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: 'var(--bg-cream)', minHeight: '100vh', padding: '60px 40px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '48px', marginBottom: '48px', color: 'var(--black)' }}>Tu carrito</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' }}>
          <div>
            {items.map((item) => (
              <div key={`${item.id}-${item.varianteId ?? 'base'}`} style={{ display: 'flex', gap: '20px', padding: '24px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: '100px', height: '100px', background: 'var(--bg-cream-deep)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', color: 'var(--text-muted)' }}>V</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '4px' }}>{item.marca}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 500, color: 'var(--black)', marginBottom: item.varianteNombre ? '2px' : '16px' }}>{item.nombre}</div>
                  {item.varianteNombre && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{item.varianteNombre}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: '2px' }}>
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1, item.varianteId)} style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>−</button>
                      <span style={{ width: '36px', textAlign: 'center', fontSize: '14px' }}>{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1, item.varianteId)} style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>+</button>
                    </div>
                    <button onClick={() => quitarItem(item.id, item.varianteId)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Eliminar</button>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 600, color: 'var(--black)' }}>
                  ${(item.precio * item.cantidad).toLocaleString()} MXN
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'sticky', top: '24px', background: 'white', padding: '32px', borderRadius: '4px', border: '1px solid var(--line)', height: 'fit-content' }}>
            <h3 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '22px', marginBottom: '24px' }}>Resumen</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <span>Subtotal</span><span>${total().toLocaleString()} MXN</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: total() >= 1000 ? '#6B8F6B' : 'var(--text-muted)', marginBottom: '24px' }}>
              <span>Envío</span><span>{total() >= 1000 ? 'Gratis' : 'Por calcular'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--line)', marginBottom: '24px' }}>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 600 }}>${total().toLocaleString()} MXN</span>
            </div>
            <Link href="/checkout" style={{ display: 'block', padding: '16px', background: 'var(--black)', color: 'var(--bg-cream)', textAlign: 'center', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '2px', marginBottom: '12px' }}>
              Proceder al pago →
            </Link>
            <Link href="/" style={{ display: 'block', padding: '12px', textAlign: 'center', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', border: '1px solid var(--line)', borderRadius: '2px' }}>
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
