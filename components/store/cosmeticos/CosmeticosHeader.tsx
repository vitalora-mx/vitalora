'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'

const CarritoDrawer = dynamic(() => import('@/components/store/CarritoDrawer'), { ssr: false })

const marcas = [
  'Abib', 'Anua', 'Celimax', 'COSRX', "D'ALBA", 'Dr Althea',
  'Elizavecca', 'Eqqual Berry', 'Mary & May', 'Medicube',
  'Mixsoon', 'Nineless', 'Numbuzin', 'Purito', 'Rootree',
  'Round Lab', 'Skin1004', 'Tocobo', 'Unleashia',
]

export default function CosmeticosHeader() {
  const [marcasOpen, setMarcasOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { totalItems, abrirCarrito } = useCartStore()

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      {/* Barra superior */}
      <div style={{ background: '#F9F5F0', borderBottom: '1px solid #E8E0D5', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', letterSpacing: '0.08em', color: '#2C2C2C' }}>
        <span>✦ Envío gratis en compras mayores a <strong>$1,000 MXN</strong></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ cursor: 'pointer', color: 'var(--gold)', letterSpacing: '0.1em' }} onClick={() => document.getElementById('loraFab')?.click()}>
            ✦ Chatea con <strong>Lora</strong> y descubre tu rutina ideal
          </span>
          <Link href="/suplementos" style={{ padding: '6px 16px', border: '1px solid var(--gold)', borderRadius: '100px', color: 'var(--gold)', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
            Suplementos →
          </Link>
        </div>
      </div>

      {/* Header principal */}
      <header style={{ background: 'white', borderBottom: '1px solid #E8E0D5', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '40px' }}>

          {/* Nav izquierda */}
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMarcasOpen(!marcasOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C2C2C', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Marcas <span style={{ fontSize: '10px' }}>▼</span>
              </button>
              {marcasOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '12px', background: 'white', border: '1px solid #E8E0D5', borderRadius: '4px', padding: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px', minWidth: '320px', zIndex: 200 }}>
                  {marcas.map((marca) => (
                    <Link key={marca} href={`/cosmeticos?marca=${marca.toLowerCase()}`} onClick={() => setMarcasOpen(false)} style={{ fontSize: '13px', color: '#2C2C2C', textDecoration: 'none', padding: '6px 0', borderBottom: '1px solid #F5F0E8' }}>
                      {marca}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/cosmeticos/best-sellers" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C2C2C', textDecoration: 'none' }}>Best Sellers</Link>
            <Link href="/cosmeticos/kits" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C2C2C', textDecoration: 'none' }}>Kits de Rutina</Link>
          </nav>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', letterSpacing: '0.15em', color: '#0E0E0E', textAlign: 'center' }}>VITALORA</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', textAlign: 'center', marginTop: '2px' }}>K-Beauty</div>
          </Link>

          {/* Iconos derecha */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E8E0D5', borderRadius: '100px', padding: '8px 16px', background: '#F9F5F0' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Buscar..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', color: '#2C2C2C', width: '120px', fontFamily: 'inherit' }} />
            </div>
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
