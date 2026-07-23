'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Producto {
  id: number; slug: string; nombre: string; marca: string; categoria: string; tipo: string
  precio: number; precio_original: number | null; tag: string; stock: number
  producto_imagenes: { id: number; url: string; posicion: number }[]
  producto_variantes: { stock: number }[]
}

export default function BuscarCliente() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function buscar() {
      setLoading(true)
      if (q.trim().length < 2) { setProductos([]); setLoading(false); return }
      try {
        const res = await fetch(`/api/tienda/buscar?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setProductos(Array.isArray(data) ? data : [])
      } catch { setProductos([]) }
      setLoading(false)
    }
    buscar()
  }, [q])

  if (!mounted) return null

  function rutaProducto(p: Producto) {
    const ruta = p.tipo === 'suplemento' ? 'suplementos' : 'cosmeticos'
    return `/${ruta}/producto/${p.slug}`
  }

  function stockTotal(p: Producto) {
    if (p.producto_variantes && p.producto_variantes.length > 0) {
      return p.producto_variantes.reduce((s, v) => s + (v.stock || 0), 0)
    }
    return p.stock
  }

  return (
    <main style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '32px 16px 60px' : '60px 40px 100px' }}>

        <div style={{ marginBottom: isMobile ? '32px' : '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Resultados de búsqueda</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: isMobile ? '32px' : '44px', color: 'var(--black)', lineHeight: 1.1 }}>
            {q ? `"${q}"` : 'Buscar productos'}
          </h1>
          {!loading && q.trim().length >= 2 && (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '12px' }}>
              {productos.length} {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
            </p>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Buscando...</p>
        ) : q.trim().length < 2 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Escribe al menos 2 letras para buscar.</p>
        ) : productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'var(--gold)', marginBottom: '16px' }}>✦</div>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>No encontramos productos para &quot;{q}&quot;</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Intenta con otra palabra o revisa la ortografía.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '24px' }}>
            {productos.map(p => {
              const img = p.producto_imagenes?.slice().sort((a, b) => a.posicion - b.posicion)[0]
              const agotado = stockTotal(p) <= 0
              const bg = p.tipo === 'suplemento' ? '#F0F7F0' : '#F5F0E8'
              return (
                <Link key={p.id} href={rutaProducto(p)} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ aspectRatio: '1 / 1', background: bg, borderRadius: '4px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {agotado && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', background: '#C0392B', color: 'white', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderRadius: '2px', zIndex: 2 }}>Agotado</div>
                      )}
                      {img ? (
                        <img src={img.url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: agotado ? 0.45 : 1, filter: agotado ? 'grayscale(60%)' : 'none' }} />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'rgba(0,0,0,0.1)' }}>V</span>
                      )}
                    </div>
                    {p.tag && !agotado && (
                      <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>{p.tag}</div>
                    )}
                    <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{p.marca}</div>
                    <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 500, color: 'var(--black)', lineHeight: 1.3 }}>{p.nombre}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      {p.precio_original && p.precio_original > p.precio && (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>${p.precio_original.toLocaleString()}</span>
                      )}
                      <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 600, color: 'var(--black)' }}>${p.precio.toLocaleString()} MXN</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
      <LoraChat />
    </main>
  )
}