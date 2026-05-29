'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'

const CarritoDrawer = dynamic(() => import('@/components/store/CarritoDrawer'), { ssr: false })

export default function RitualHeader() {
  const [mounted, setMounted] = useState(false)
  const { totalItems, abrirCarrito } = useCartStore()

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      {/* Barra superior */}
      <div style={{ background: '#F9F5F0', borderBottom: '1px solid #E8E0D5', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', letterSpacing: '0.08em', color: '#2C2C2C' }}>
        <span>✦ Aprende a usar tus productos con nuestros videos</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ cursor: 'pointer', color: 'var(--gold)', letterSpacing: '0.1em' }} onClick={() => document.getElementById('loraFab')?.click()}>
            ✦ Chatea con <strong>Lora</strong> y descubre tu rutina ideal
          </span>
        </div>
      </div>

      {/* Header principal */}
      <header style={{ background: 'white', borderBottom: '1px solid #E8E0D5', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '40px' }}>

          {/* Nav izquierda (sin boton de Suplementos/Cosmeticos arriba) */}
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Link href="/cosmeticos" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C2C2C', textDecoration: 'none' }}>Cosméticos</Link>
            <Link href="/suplementos" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C2C2C', textDecoration: 'none' }}>Suplementos</Link>
            <Link href="/ritual" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Ritual</Link>
          </nav>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', letterSpacing: '0.15em', color: '#0E0E0E', textAlign: 'center' }}>VITALORA</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', textAlign: 'center', marginTop: '2px' }}>Ritual</div>
          </Link>

          {/* Iconos derecha */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2C2C2C', padding: '4px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <button onClick={abrirCarrito} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2C2C2C', padding: '4px', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {mounted && totalItems() > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-8px', background: 'var(--gold)', color: 'var(--black)', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {totalItems()}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      <CarritoDrawer />
    </>
  )
}
