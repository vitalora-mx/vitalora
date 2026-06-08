'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useIsMobile } from '@/hooks/useIsMobile'

const CarritoDrawer = dynamic(() => import('@/components/store/CarritoDrawer'), { ssr: false })

export default function Header() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [mounted, setMounted] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { totalItems, abrirCarrito } = useCartStore()
  const isMobile = useIsMobile()

  useEffect(() => { setMounted(true) }, [])

  function irABuscar() {
    if (busqueda.trim().length >= 2) {
      router.push('/buscar?q=' + encodeURIComponent(busqueda.trim()))
      setMenuAbierto(false)
    }
  }

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
          padding: isMobile ? '14px 20px' : '20px 40px',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'auto 1fr auto' : '1fr auto 1fr',
          alignItems: 'center',
          gap: isMobile ? '12px' : '40px',
        }}>

          {/* Izquierda: nav (desktop) o boton hamburguesa (movil) */}
          {isMobile ? (
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px', display: 'flex', alignItems: 'center' }} aria-label="Menú">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {menuAbierto ? <path d="M18 6 6 18M6 6l12 12"/> : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
              </svg>
            </button>
          ) : (
            <nav style={{ display: 'flex', gap: '32px', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Link href="/cosmeticos" style={{ color: 'var(--text)', textDecoration: 'none' }}>Cosméticos</Link>
              <Link href="/suplementos" style={{ color: 'var(--text)', textDecoration: 'none' }}>Suplementos</Link>
              <Link href="/ritual" style={{ color: 'var(--text)', textDecoration: 'none' }}>Ritual</Link>
            </nav>
          )}

          {/* Logo */}
          <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: isMobile ? '24px' : '32px', letterSpacing: '0.15em', color: 'var(--black)', textAlign: 'center' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>VITALORA</Link>
          </div>

          {/* Iconos derecha */}
          <div style={{ display: 'flex', gap: isMobile ? '14px' : '20px', alignItems: 'center', justifyContent: 'flex-end' }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--line)', borderRadius: '100px', padding: '8px 16px', background: 'rgba(255,255,255,0.5)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') irABuscar() }}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', color: 'var(--text)', width: '130px', fontFamily: 'inherit' }}
                />
              </div>
            )}
            <Link href="/cuenta" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px', display: 'flex', alignItems: 'center' }} aria-label="Mi cuenta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
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

        {/* Menu desplegable movil */}
        {isMobile && menuAbierto && (
          <nav style={{ borderTop: '1px solid var(--line)', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column' }}>
            {/* Buscador movil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--line)', borderRadius: '100px', padding: '10px 16px', background: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') irABuscar() }}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '14px', color: 'var(--text)', flex: 1, fontFamily: 'inherit' }}
              />
            </div>
            <Link href="/cosmeticos" onClick={() => setMenuAbierto(false)} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid var(--line-soft)' }}>Cosméticos</Link>
            <Link href="/suplementos" onClick={() => setMenuAbierto(false)} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid var(--line-soft)' }}>Suplementos</Link>
            <Link href="/ritual" onClick={() => setMenuAbierto(false)} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid var(--line-soft)' }}>Ritual</Link>
            <Link href="/cuenta" onClick={() => setMenuAbierto(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Mi cuenta
            </Link>
          </nav>
        )}
      </header>
      <CarritoDrawer />
    </>
  )
}
