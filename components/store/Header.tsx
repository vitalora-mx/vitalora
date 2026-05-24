'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'

const CarritoDrawer = dynamic(() => import('@/components/store/CarritoDrawer'), { ssr: false })

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const { totalItems, abrirCarrito } = useCartStore()

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <header style={{
        background: 'rgba(245, 240, 232, 0.95)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '40px',
        }}>

          {/* Nav izquierda */}
          <nav style={{ display: 'flex', gap: '32px', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <Link href="/cosmeticos" style={{ color: 'var(--text)', textDecoration: 'none' }}>Cosméticos</Link>
            <Link href="/suplementos" style={{ color: 'var(--text)', textDecoration: 'none' }}>Suplementos</Link>
            <Link href="/nosotros" style={{ color: 'var(--text)', textDecoration: 'none' }}>Nosotros</Link>
          </nav>

          {/* Logo */}
          <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', letterSpacing: '0.15em', color: 'var(--black)', textAlign: 'center' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>VITALORA</Link>
          </div>

          {/* Iconos derecha */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
            <button onClick={abrirCarrito} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
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
