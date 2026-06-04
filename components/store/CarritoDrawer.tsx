'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'

const ENVIO_GRATIS = 1000
const COSTO_ENVIO = 99

export default function CarritoDrawer() {
  const { items, isOpen, cerrarCarrito, quitarItem, actualizarCantidad, total, totalItems } = useCartStore()

  if (!isOpen) return null

  const subtotal = total()
  const costoEnvio = subtotal >= ENVIO_GRATIS ? 0 : COSTO_ENVIO
  const totalFinal = subtotal + costoEnvio

  return (
    <>
      {/* Overlay */}
      <div
        onClick={cerrarCarrito}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '420px', maxWidth: '100vw', height: '100dvh',
        background: 'var(--bg-cream)', zIndex: 1001, display: 'flex',
        flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div style={{ padding: '24px', flexShrink: 0, position: 'relative', zIndex: 2, borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--black)', color: 'var(--bg-cream)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '22px', letterSpacing: '0.1em' }}>Tu Carrito</div>
            <div style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.1em' }}>
              {totalItems()} {totalItems() === 1 ? 'producto' : 'productos'}
            </div>
          </div>
          <button onClick={cerrarCarrito} style={{ background: 'none', border: 'none', color: 'var(--bg-cream)', cursor: 'pointer', fontSize: '24px', opacity: 0.7 }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'var(--gold)', marginBottom: '16px' }}>✦</div>
              <p style={{ fontSize: '15px', marginBottom: '24px' }}>Tu carrito está vacío</p>
              <button onClick={cerrarCarrito} style={{ padding: '12px 24px', background: 'var(--black)', color: 'var(--bg-cream)', border: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'inherit', borderRadius: '2px' }}>
                Seguir comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.varianteId ?? 'base'}`} style={{ display: 'flex', gap: '16px', padding: '16px', background: 'white', borderRadius: '4px', border: '1px solid var(--line)' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--bg-cream-deep)', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '24px', color: 'var(--text-muted)' }}>V</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '4px' }}>{item.marca}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 500, color: 'var(--black)', marginBottom: item.varianteNombre ? '2px' : '8px', lineHeight: 1.3 }}>{item.nombre}</div>
                  {item.varianteNombre && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.varianteNombre}</div>}
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 600, color: 'var(--black)' }}>
                    ${(item.precio * item.cantidad).toLocaleString()} MXN
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <button onClick={() => quitarItem(item.id, item.varianteId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1 }}>✕</button>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: '2px' }}>
                    <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1, item.varianteId)} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text)' }}>−</button>
                    <span style={{ width: '32px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{item.cantidad}</span>
                    <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1, item.varianteId)} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text)' }}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '24px', flexShrink: 0, borderTop: '1px solid var(--line)', background: 'white' }}>

            {/* Barra envío gratis */}
            {subtotal >= ENVIO_GRATIS ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 16px', background: '#F0F7F0', borderRadius: '4px', border: '1px solid #A8C5A0' }}>
                <span style={{ color: '#6B8F6B', fontSize: '14px' }}>✓</span>
                <span style={{ fontSize: '13px', color: '#6B8F6B', fontWeight: 500 }}>¡Envío gratis aplicado!</span>
              </div>
            ) : (
              <div style={{ marginBottom: '16px', padding: '10px 16px', background: 'var(--bg-cream-deep)', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Te faltan <strong style={{ color: 'var(--black)' }}>${(ENVIO_GRATIS - subtotal).toLocaleString()} MXN</strong> para envío gratis
                </div>
                <div style={{ height: '4px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((subtotal / ENVIO_GRATIS) * 100, 100)}%`, background: 'var(--gold)', borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Desglose */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()} MXN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: costoEnvio === 0 ? '#6B8F6B' : 'var(--text-muted)' }}>
                <span>Envío</span>
                <span>{costoEnvio === 0 ? 'Gratis' : `$${COSTO_ENVIO} MXN`}</span>
              </div>
            </div>

            {/* Total final */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--line)', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '28px', fontWeight: 600, color: 'var(--black)' }}>
                ${totalFinal.toLocaleString()} MXN
              </span>
            </div>

            {/* Botón checkout */}
            <Link href="/checkout" onClick={cerrarCarrito} style={{ display: 'block', width: '100%', padding: '18px', background: 'var(--black)', color: 'var(--bg-cream)', textAlign: 'center', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, fontFamily: 'inherit', borderRadius: '2px', marginBottom: '12px' }}>
              Proceder al Pago →
            </Link>

            <button onClick={cerrarCarrito} style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--line)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', borderRadius: '2px' }}>
              Seguir comprando
            </button>
          </div>
        )}

      </div>
    </>
  )
}
