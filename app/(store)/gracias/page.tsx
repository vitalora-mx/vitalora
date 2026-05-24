'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'

export default function GraciasPage() {
  const { vaciarCarrito } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    vaciarCarrito()
  }, [])

  if (!mounted) return null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>

        {/* Ícono */}
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F0F7F0', border: '2px solid #6B8F6B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '32px' }}>
          ✓
        </div>

        {/* Título */}
        <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '0.02em', color: 'var(--black)', marginBottom: '16px' }}>
          ¡Gracias por tu compra!
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '32px' }}>
          Tu pedido ha sido procesado exitosamente. En breve recibirás un correo de confirmación con los detalles de tu compra y el número de seguimiento cuando tu pedido sea enviado.
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--line)', margin: '32px 0' }} />

        {/* Info envío */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          {[
            { icon: '📦', titulo: 'Preparando', desc: 'Tu pedido está siendo preparado' },
            { icon: '🚚', titulo: 'En camino', desc: 'Recibirás tu número de guía por correo' },
            { icon: '✦', titulo: 'Entrega', desc: '2-5 días hábiles a todo México' },
          ].map((step) => (
            <div key={step.titulo} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{step.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--black)', marginBottom: '4px', letterSpacing: '0.05em' }}>{step.titulo}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            padding: '16px 32px',
            background: 'var(--black)',
            color: 'var(--bg-cream)',
            textDecoration: 'none',
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 500,
            borderRadius: '2px',
          }}>
            Seguir comprando
          </Link>
          <button
            onClick={() => document.getElementById('loraFab')?.click()}
            style={{
              padding: '16px 32px',
              background: 'none',
              color: 'var(--black)',
              border: '1px solid var(--line)',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderRadius: '2px',
            }}
          >
            ✦ Hablar con Lora
          </button>
        </div>

        {/* Footer */}
        <p style={{ marginTop: '48px', fontSize: '12px', color: 'var(--text-muted)' }}>
          ¿Tienes dudas? Escríbenos a{' '}
          <a href="mailto:hola@vitalora.com.mx" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            hola@vitalora.com.mx
          </a>
        </p>

      </div>
    </main>
  )
}