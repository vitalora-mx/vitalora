'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Producto {
  id: number; slug: string; marca: string; categoria: string; nombre: string
  precio: number; precio_original: number | null; tag: string; descripcion: string; stock: number
  producto_imagenes: { url: string; posicion: number }[]
}

interface Props {
  categoriaActiva: string
}

export default function SuplementosProductos({ categoriaActiva }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [marcas, setMarcas] = useState<string[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([])
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])
  const [orden, setOrden] = useState('relevancia')
  const [loading, setLoading] = useState(true)
  const [marcasOpen, setMarcasOpen] = useState(false)
  const [catsOpen, setCatsOpen] = useState(false)
  const marcasRef = useRef<HTMLDivElement>(null)
  const catsRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    async function cargar() {
      const res = await fetch('/api/tienda/productos?tipo=suplemento')
      const data = await res.json()
      if (Array.isArray(data)) {
        setProductos(data)
        setMarcas([...new Set(data.map((p: Producto) => p.marca))].sort() as string[])
        setCategorias([...new Set(data.map((p: Producto) => p.categoria))].sort() as string[])
      }
      setLoading(false)
    }
    cargar()
  }, [])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (marcasRef.current && !marcasRef.current.contains(e.target as Node)) setMarcasOpen(false)
      if (catsRef.current && !catsRef.current.contains(e.target as Node)) setCatsOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function toggleMarca(m: string) { setMarcasSeleccionadas(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]) }
  function toggleCat(c: string) { setCategoriasSeleccionadas(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]) }
  function limpiarTodo() { setMarcasSeleccionadas([]); setCategoriasSeleccionadas([]) }

  let productosFiltrados = productos.filter(p => {
    const porMarca = marcasSeleccionadas.length === 0 || marcasSeleccionadas.includes(p.marca)
    const porCat = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(p.categoria)
    const porCatActiva = categoriaActiva === 'Todas' || p.categoria === categoriaActiva
    return porMarca && porCat && porCatActiva
  })

  if (orden === 'precio-asc') productosFiltrados.sort((a, b) => a.precio - b.precio)
  if (orden === 'precio-desc') productosFiltrados.sort((a, b) => b.precio - a.precio)

  function getImagen(p: Producto) {
    const imgs = p.producto_imagenes?.sort((a, b) => a.posicion - b.posicion)
    return imgs?.[0]?.url || null
  }

  const hayFiltros = marcasSeleccionadas.length > 0 || categoriasSeleccionadas.length > 0

  const dropBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '8px 14px' : '10px 20px',
    border: '1px solid', borderColor: active ? '#6B8F6B' : '#DDDDDD', borderRadius: '8px',
    background: active ? '#6B8F6B' : 'white', color: active ? 'white' : '#333333',
    fontSize: isMobile ? '12px' : '13px', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ background: '#FFFFFF', minHeight: '600px' }}>
      {/* Filtros */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EEEEEE', position: 'sticky', top: isMobile ? '61px' : '73px', zIndex: 90, padding: isMobile ? '12px 16px' : '14px 40px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flexWrap: 'wrap' }}>
            {/* Dropdown Marcas */}
            <div ref={marcasRef} style={{ position: 'relative' }}>
              <button onClick={() => setMarcasOpen(!marcasOpen)} style={dropBtnStyle(marcasSeleccionadas.length > 0)}>
                Marcas {marcasSeleccionadas.length > 0 ? `(${marcasSeleccionadas.length})` : ''} <span style={{ fontSize: '10px' }}>{marcasOpen ? '▲' : '▼'}</span>
              </button>
              {marcasOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white', border: '1px solid #EEE', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', padding: '12px', minWidth: '220px', maxWidth: isMobile ? '80vw' : 'none', maxHeight: '320px', overflowY: 'auto', zIndex: 200 }}>
                  {marcas.map(m => {
                    const sel = marcasSeleccionadas.includes(m)
                    return (
                      <button key={m} onClick={() => toggleMarca(m)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 10px', border: 'none', background: sel ? 'rgba(107,143,107,0.08)' : 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#333', textAlign: 'left' }}>
                        <div style={{ width: '18px', height: '18px', border: '1.5px solid', borderColor: sel ? '#6B8F6B' : '#DDD', borderRadius: '4px', background: sel ? '#6B8F6B' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                        </div>
                        {m}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {/* Dropdown Categorías */}
            <div ref={catsRef} style={{ position: 'relative' }}>
              <button onClick={() => setCatsOpen(!catsOpen)} style={dropBtnStyle(categoriasSeleccionadas.length > 0)}>
                Categoría {categoriasSeleccionadas.length > 0 ? `(${categoriasSeleccionadas.length})` : ''} <span style={{ fontSize: '10px' }}>{catsOpen ? '▲' : '▼'}</span>
              </button>
              {catsOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white', border: '1px solid #EEE', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', padding: '12px', minWidth: '220px', maxWidth: isMobile ? '80vw' : 'none', maxHeight: '320px', overflowY: 'auto', zIndex: 200 }}>
                  {categorias.map(c => {
                    const sel = categoriasSeleccionadas.includes(c)
                    return (
                      <button key={c} onClick={() => toggleCat(c)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 10px', border: 'none', background: sel ? 'rgba(107,143,107,0.08)' : 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#333', textAlign: 'left' }}>
                        <div style={{ width: '18px', height: '18px', border: '1.5px solid', borderColor: sel ? '#6B8F6B' : '#DDD', borderRadius: '4px', background: sel ? '#6B8F6B' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                        </div>
                        {c}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {hayFiltros && (
              <button onClick={limpiarTodo} style={{ padding: '8px 16px', border: '1px solid #DDD', borderRadius: '8px', background: 'none', fontSize: '12px', color: '#999', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Limpiar</button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isMobile && <Link href="/cosmeticos" style={{ padding: '8px 20px', border: '1px solid #6B8F6B', borderRadius: '8px', color: '#6B8F6B', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>Ver Cosméticos →</Link>}
            <select value={orden} onChange={e => setOrden(e.target.value)} style={{ padding: isMobile ? '8px 12px' : '8px 16px', border: '1px solid #DDD', borderRadius: '8px', background: 'white', fontSize: isMobile ? '12px' : '13px', color: '#333', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: Menor a Mayor</option>
              <option value="precio-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '24px 16px' : '40px' }}>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: isMobile ? '20px' : '32px' }}>
          {productosFiltrados.length} productos encontrados
          {marcasSeleccionadas.length > 0 && <span style={{ color: '#6B8F6B', marginLeft: '8px' }}>· {marcasSeleccionadas.join(', ')}</span>}
          {categoriasSeleccionadas.length > 0 && <span style={{ color: '#6B8F6B', marginLeft: '8px' }}>· {categoriasSeleccionadas.join(', ')}</span>}
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '60px' }}>Cargando productos...</p>
        ) : productosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🌿</div>
            <p>No hay productos con esos filtros.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '20px' }}>
            {productosFiltrados.map(producto => (
              <Link key={producto.id} href={`/suplementos/producto/${producto.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ cursor: 'pointer', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #EEE', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ aspectRatio: '1', background: '#F0F7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {producto.stock === 0 && <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '5px 12px', background: '#C0392B', color: 'white', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '100px', fontWeight: 700, zIndex: 3, textTransform: 'uppercase' }}>Agotado</div>}
                    {getImagen(producto) ? (
                      <img src={getImagen(producto)!} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: producto.stock === 0 ? 0.45 : 1, filter: producto.stock === 0 ? 'grayscale(60%)' : 'none' }} />
                    ) : (
                      <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'rgba(107,143,107,0.2)' }}>V</div>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '12px' : '16px' }}>
                    {producto.tag && producto.stock !== 0 && <div style={{ display: 'inline-block', marginBottom: '8px', padding: '4px 10px', background: '#6B8F6B', color: 'white', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '100px', fontWeight: 600 }}>{producto.tag}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B8F6B', fontWeight: 600 }}>{producto.categoria}</span>
                      <span style={{ fontSize: '10px', color: '#AAA' }}>{producto.marca}</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '16px' : '17px', fontWeight: 500, color: '#111', marginBottom: '4px', lineHeight: 1.4 }}>{producto.nombre}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        {producto.precio_original && producto.precio_original > producto.precio && (
                          <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through', marginRight: '6px' }}>${producto.precio_original.toLocaleString()}</span>
                        )}
                        <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '18px' : '20px', fontWeight: 600, color: '#111' }}>${producto.precio.toLocaleString()} MXN</span>
                      </div>
                      {!isMobile && <span style={{ padding: '8px 16px', background: '#6B8F6B', color: 'white', fontSize: '12px', borderRadius: '8px', fontWeight: 600 }}>+ Agregar</span>}
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
