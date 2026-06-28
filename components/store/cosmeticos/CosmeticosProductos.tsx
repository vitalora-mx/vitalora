'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Producto {
  id: number; slug: string; marca: string; categoria: string; nombre: string
  precio: number; precio_original: number | null; tag: string; stock: number
  producto_imagenes: { url: string; posicion: number }[]
}

interface Props {
  rutinaActiva: string
  marcaActiva: string
  setMarcaActiva: (m: string) => void
}

export default function CosmeticosProductos({ rutinaActiva }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [marcas, setMarcas] = useState<string[]>([])
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [orden, setOrden] = useState('relevancia')
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    async function cargar() {
      const res = await fetch('/api/tienda/productos?tipo=cosmetico')
      const data = await res.json()
      if (Array.isArray(data)) {
        setProductos(data)
        const marcasUnicas = [...new Set(data.map((p: Producto) => p.marca))].sort() as string[]
        setMarcas(marcasUnicas)
      }
      setLoading(false)
    }
    cargar()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleMarca(marca: string) {
    setMarcasSeleccionadas(prev => prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca])
  }

  function limpiarMarcas() { setMarcasSeleccionadas([]) }

  let productosFiltrados = productos.filter(p => {
    const porRutina = rutinaActiva === 'Todas' || p.categoria === rutinaActiva
    const porMarca = marcasSeleccionadas.length === 0 || marcasSeleccionadas.includes(p.marca)
    return porRutina && porMarca
  })

  if (orden === 'precio-asc') productosFiltrados.sort((a, b) => a.precio - b.precio)
  if (orden === 'precio-desc') productosFiltrados.sort((a, b) => b.precio - a.precio)

  function getImagen(p: Producto) {
    const imgs = p.producto_imagenes?.sort((a, b) => a.posicion - b.posicion)
    return imgs?.[0]?.url || null
  }

  function getSegundaImagen(p: Producto) {
    const imgs = p.producto_imagenes?.sort((a, b) => a.posicion - b.posicion)
    return imgs?.[1]?.url || null
  }

  return (
    <div style={{ background: '#F9F5F0', minHeight: '600px' }}>
      {/* Barra de filtros */}
      <div style={{ background: 'white', borderBottom: '1px solid #E8E0D5', position: 'sticky', top: isMobile ? '61px' : '73px', zIndex: 90, padding: isMobile ? '12px 16px' : '14px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? '10px' : '16px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '8px 16px' : '10px 20px', border: '1px solid', borderColor: marcasSeleccionadas.length > 0 ? 'var(--gold)' : '#E8E0D5', borderRadius: '100px', background: marcasSeleccionadas.length > 0 ? 'var(--gold)' : 'white', color: marcasSeleccionadas.length > 0 ? 'white' : '#2C2C2C', fontSize: isMobile ? '11px' : '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              Marcas {marcasSeleccionadas.length > 0 ? `(${marcasSeleccionadas.length})` : ''} <span style={{ fontSize: '10px' }}>{dropdownOpen ? '▲' : '▼'}</span>
            </button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white', border: '1px solid #E8E0D5', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', padding: '16px', minWidth: isMobile ? '240px' : '280px', maxWidth: isMobile ? '85vw' : 'none', zIndex: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E8E0D5' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6B6B' }}>Selecciona marcas</span>
                  {marcasSeleccionadas.length > 0 && <button onClick={limpiarMarcas} style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit' }}>Limpiar</button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                  {marcas.map(marca => {
                    const sel = marcasSeleccionadas.includes(marca)
                    return (
                      <button key={marca} onClick={() => toggleMarca(marca)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: sel ? 'rgba(201,169,97,0.08)' : 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#2C2C2C', textAlign: 'left' }}>
                        <div style={{ width: '18px', height: '18px', border: '1.5px solid', borderColor: sel ? 'var(--gold)' : '#D9D2C4', borderRadius: '3px', background: sel ? 'var(--gold)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                        </div>
                        {marca}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
            {!isMobile && <Link href="/suplementos" style={{ padding: '8px 20px', border: '1px solid var(--gold)', borderRadius: '100px', color: 'var(--gold)', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>Suplementos →</Link>}
            {!isMobile && <span style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B' }}>Ordenar:</span>}
            <select value={orden} onChange={e => setOrden(e.target.value)} style={{ padding: isMobile ? '8px 12px' : '8px 16px', border: '1px solid #E8E0D5', borderRadius: '100px', background: 'white', fontSize: isMobile ? '11px' : '12px', color: '#2C2C2C', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: Menor a Mayor</option>
              <option value="precio-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '24px 16px' : '40px' }}>
        <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: isMobile ? '20px' : '32px' }}>
          {productosFiltrados.length} productos encontrados
          {rutinaActiva !== 'Todas' && <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>· {rutinaActiva}</span>}
          {marcasSeleccionadas.length > 0 && <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>· {marcasSeleccionadas.join(', ')}</span>}
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6B6B6B', padding: '60px' }}>Cargando productos...</p>
        ) : productosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#6B6B6B' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', marginBottom: '16px', color: 'var(--gold)' }}>✦</div>
            <p>No hay productos en esta categoría todavía.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '24px' }}>
            {productosFiltrados.map(producto => (
              <Link key={producto.id} href={`/cosmeticos/producto/${producto.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ cursor: 'pointer', background: 'white', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E8E0D5', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; const pri = e.currentTarget.querySelector('.prod-img-principal') as HTMLElement | null; const sec = e.currentTarget.querySelector('.prod-img-secundaria') as HTMLElement | null; if (sec) { if (pri) pri.style.opacity = '0'; sec.style.opacity = '1' } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; const pri = e.currentTarget.querySelector('.prod-img-principal') as HTMLElement | null; const sec = e.currentTarget.querySelector('.prod-img-secundaria') as HTMLElement | null; if (sec) { if (pri) pri.style.opacity = producto.stock === 0 ? '0.45' : '1'; sec.style.opacity = '0' } }}>
                  <div style={{ aspectRatio: '1', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {producto.stock === 0 && <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '5px 12px', background: '#C0392B', color: 'white', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '2px', zIndex: 3, fontWeight: 700, textTransform: 'uppercase' }}>Agotado</div>}
                    {getImagen(producto) ? (
                      <>
                        <img src={getImagen(producto)!} alt={producto.nombre} className="prod-img-principal" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: producto.stock === 0 ? 0.45 : 1, filter: producto.stock === 0 ? 'grayscale(60%)' : 'none', transition: 'opacity 0.4s ease' }} />
                        {getSegundaImagen(producto) && producto.stock !== 0 && (
                          <img src={getSegundaImagen(producto)!} alt={producto.nombre} className="prod-img-secundaria" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0, transition: 'opacity 0.4s ease' }} />
                        )}
                      </>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', color: 'rgba(0,0,0,0.2)' }}>V</div>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '12px' : '16px' }}>
                    {producto.tag && producto.stock !== 0 && <div style={{ display: 'inline-block', marginBottom: '8px', padding: '4px 10px', background: 'var(--gold)', color: 'white', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '2px' }}>{producto.tag}</div>}
                    <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px' }}>{producto.marca}</div>
                    <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '15px' : '16px', fontWeight: 500, color: '#0E0E0E', marginBottom: '8px', lineHeight: 1.4 }}>{producto.nombre}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        {producto.precio_original && producto.precio_original > producto.precio && (
                          <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through', marginRight: '6px' }}>${producto.precio_original.toLocaleString()}</span>
                        )}
                        <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#0E0E0E' }}>${producto.precio.toLocaleString()} MXN</span>
                      </div>
                      {!isMobile && <span style={{ padding: '8px 16px', background: '#0E0E0E', color: 'white', fontSize: '11px', letterSpacing: '0.1em', borderRadius: '2px' }}>+ Agregar</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
