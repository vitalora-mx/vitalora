'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'
import RitualHeader from '@/components/store/ritual/RitualHeader'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { useCartStore } from '@/store/cartStore'

const SAGE = '#A8B5A0'

interface ProductoImagen { url: string; posicion: number }
interface Producto {
  id: number; slug: string; nombre: string; marca: string; tipo: string
  precio: number; precio_original: number | null
  producto_imagenes: ProductoImagen[]
}
interface Video {
  id: number; slug: string; titulo: string; descripcion: string
  youtube_id: string; tipo: string
  ritual_temas: { nombre: string } | null
  productos: Producto[]
}

export default function RitualVideoCliente({ video }: { video: Video }) {
  const isMobile = useIsMobile()
  const [acordeonAbierto, setAcordeonAbierto] = useState(true)
  const { agregarItem } = useCartStore()

  function getImagen(p: Producto): string {
    const imgs = p.producto_imagenes?.slice().sort((a, b) => a.posicion - b.posicion)
    return imgs?.[0]?.url || ''
  }

  function handleAgregar(p: Producto) {
    agregarItem({
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      marca: p.marca,
      precio: p.precio,
      imagen: getImagen(p),
      tipo: (p.tipo === 'suplemento' ? 'suplemento' : 'cosmetico'),
    })
  }

  function urlProducto(p: Producto): string {
    return p.tipo === 'suplemento'
      ? `/suplementos/producto/${p.slug}`
      : `/cosmeticos/producto/${p.slug}`
  }

  return (
    <main>
      <RitualHeader />

      <div style={{ background: '#0E0E0E' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '28px 16px 48px' : '48px 40px 80px' }}>

          {/* Breadcrumb */}
          <Link href="/ritual" style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: SAGE, textDecoration: 'none' }}>← Ritual</Link>

          {/* Tema */}
          {video.ritual_temas?.nombre && (
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginTop: '24px', marginBottom: '8px' }}>{video.ritual_temas.nombre}</div>
          )}

          {/* Titulo grande */}
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '42px', lineHeight: 1.15, color: '#E8E4DA', margin: '0 0 20px' }}>{video.titulo}</h1>

          {/* Descripcion breve */}
          {video.descripcion && (
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#B4B2A9', marginBottom: '32px' }}>{video.descripcion}</p>
          )}

          {/* Video embebido */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', background: '#000', marginBottom: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_id}`}
              title={video.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>

          {/* Acordeon de productos relacionados */}
          {video.productos && video.productos.length > 0 && (
            <div style={{ background: '#161616', border: '1px solid rgba(168,181,160,0.15)', borderRadius: '8px', overflow: 'hidden', marginBottom: '56px' }}>
              <button onClick={() => setAcordeonAbierto(!acordeonAbierto)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#E8E4DA', fontWeight: 600 }}>Productos en este video ({video.productos.length})</span>
                <span style={{ fontSize: '12px', color: SAGE }}>{acordeonAbierto ? '▲' : '▼'}</span>
              </button>
              {acordeonAbierto && (
                <div style={{ borderTop: '1px solid rgba(168,181,160,0.15)' }}>
                  {video.productos.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px 24px', borderTop: i === 0 ? 'none' : '1px solid rgba(168,181,160,0.1)', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: '4px' }}>{p.marca}</div>
                        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '17px', color: '#E8E4DA' }}>{p.nombre}</div>
                        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 600, color: '#E8E4DA', marginTop: '2px' }}>${p.precio.toLocaleString()} MXN</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link href={urlProducto(p)} style={{ padding: '10px 18px', border: '1px solid #E8E4DA', borderRadius: '100px', color: '#E8E4DA', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Ver detalle</Link>
                        <button onClick={() => handleAgregar(p)} style={{ padding: '10px 18px', background: SAGE, color: '#0E0E0E', border: 'none', borderRadius: '100px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: 600 }}>+ Agregar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grid de productos con imagenes */}
          {video.productos && video.productos.length > 0 && (
            <>
              <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: SAGE, textAlign: 'center', marginBottom: '8px' }}>Mencionados en el video</div>
              <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', color: '#E8E4DA', textAlign: 'center', margin: '0 0 32px' }}>Productos</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '24px' }}>
                {video.productos.map(p => (
                  <Link key={p.id} href={urlProducto(p)} style={{ textDecoration: 'none' }}>
                    <div style={{ cursor: 'pointer', background: '#161616', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(168,181,160,0.15)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ aspectRatio: '1', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {getImagen(p) ? (
                          <img src={getImagen(p)} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', color: 'rgba(0,0,0,0.2)' }}>V</div>
                        )}
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: '6px' }}>{p.marca}</div>
                        <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 500, color: '#E8E4DA', marginBottom: '8px', lineHeight: 1.4 }}>{p.nombre}</h3>
                        <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 600, color: '#E8E4DA' }}>${p.precio.toLocaleString()} MXN</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
      <LoraChat />
    </main>
  )
}