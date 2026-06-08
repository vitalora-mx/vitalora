'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useIsMobile } from '@/hooks/useIsMobile'

const CarritoDrawer = dynamic(() => import('@/components/store/CarritoDrawer'), { ssr: false })

const categorias = [
  'Vitaminas', 'Minerales', 'Proteínas', 'Colágeno',
  'Probióticos', 'Omega 3', 'Antioxidantes', 'Energía',
]

export default function SuplementosHeader() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { totalItems, abrirCarrito } = useCartStore()
  const isMobile = useIsMobile()

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      {/* Barra superior */}
      <div style={{ background: '#0E0E0E', borderBottom: '1px solid #2A2A2A', padding: isMobile ? '8px 16px' : '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: isMobile ? '10px' : '12px', letterSpacing: '0.08em', color: '#F5F2EC' }}>
        {isMobile ? (
          <span style={{ width: '100%', textAlign: 'center' }}>✦ Envío gratis desde <strong style={{ color: '#A8C5A0' }}>$1,000 MXN</strong></span>
        ) : (
          <>
            <span>✦ Envío gratis en compras mayores a <strong style={{ color: '#A8C5A0' }}>$1,000 MXN</strong></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ cursor: 'pointer', color: '#A8C5A0', letterSpacing: '0.1em' }} onClick={() => document.getElementById('loraFab')?.click()}>
                ✦ Chatea con <strong>Lora</strong> y descubre tu suplemento ideal
              </span>
              <Link href="/cosmeticos" style={{ padding: '6px 16px', border: '1px solid #A8C5A0', borderRadius: '100px', color: '#A8C5A0', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
                Cosméticos →
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Header principal */}
      <header style={{ background: '#0E0E0E', borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '14px 16px' : '16px 40px', display: 'grid', gridTemplateColumns: isMobile ? 'auto 1fr auto' : '1fr auto 1fr', alignItems: 'center', gap: isMobile ? '12px' : '40px' }}>

          {/* Izquierda: nav (desktop) o hamburguesa (movil) */}
          {isMobile ? (
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F5F2EC', padding: '4px', display: 'flex', alignItems: 'center' }} aria-label="Menú">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {menuAbierto ? <path d="M18 6 6 18M6 6l12 12"/> : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
              </svg>
            </button>
          ) : (
            <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setCatOpen(!catOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5F2EC', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Categorías <span style={{ fontSize: '10px' }}>▼</span>
                </button>
                {catOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '12px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '4px', padding: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', minWidth: '200px', zIndex: 200 }}>
                    {categorias.map((cat) => (
                      <Link key={cat} href={`/suplementos?categoria=${cat.toLowerCase()}`} onClick={() => setCatOpen(false)} style={{ display: 'block', fontSize: '13px', color: '#F5F2EC', textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid #2A2A2A' }}>
                        {cat}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/ritual" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5F2EC', textDecoration: 'none' }}>Ritual</Link>
              <Link href="/suplementos/kits" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5F2EC', textDecoration: 'none' }}>Kits</Link>
            </nav>
          )}

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: isMobile ? '24px' : '28px', letterSpacing: '0.15em', color: '#F5F2EC', textAlign: 'center' }}>VITALORA</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#A8C5A0', textAlign: 'center', marginTop: '2px' }}>Wellness</div>
          </Link>

          {/* Iconos derecha */}
          <div style={{ display: 'flex', gap: isMobile ? '14px' : '16px', alignItems: 'center', justifyContent: 'flex-end' }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #2A2A2A', borderRadius: '100px', padding: '8px 16px', background: '#1A1A1A' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8C5A0" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && busqueda.trim().length >= 2) router.push('/buscar?q=' + encodeURIComponent(busqueda.trim())) }} style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', color: '#F5F2EC', width: '120px', fontFamily: 'inherit' }} />
              </div>
            )}
            {!isMobile && (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F5F2EC', padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
            )}
            <button onClick={abrirCarrito} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F5F2EC', padding: '4px', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {mounted && totalItems() > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-8px', background: '#A8C5A0', color: '#0E0E0E', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {totalItems()}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Menu desplegable movil */}
        {isMobile && menuAbierto && (
          <nav style={{ borderTop: '1px solid #2A2A2A', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column' }}>
            <Link href="/cosmeticos" onClick={() => setMenuAbierto(false)} style={{ color: '#F5F2EC', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid #2A2A2A' }}>Cosméticos</Link>
            <Link href="/suplementos" onClick={() => setMenuAbierto(false)} style={{ color: '#F5F2EC', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid #2A2A2A' }}>Suplementos</Link>
            <Link href="/ritual" onClick={() => setMenuAbierto(false)} style={{ color: '#F5F2EC', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid #2A2A2A' }}>Ritual</Link>
            <Link href="/suplementos/kits" onClick={() => setMenuAbierto(false)} style={{ color: '#F5F2EC', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid #2A2A2A' }}>Kits</Link>
            <Link href="/cuenta" onClick={() => setMenuAbierto(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F5F2EC', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 0' }}>
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
