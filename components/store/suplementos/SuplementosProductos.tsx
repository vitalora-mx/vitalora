'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const todasLasMarcas = ['B Life', 'Beyond Vitamins', 'Birdman', 'NOW Foods', 'Nutricost']

const todasLasCategorias = [
  'Antioxidantes', 'Cabello y Piel', 'Colágeno', 'Digestión',
  'Energía', 'Kits', 'Minerales', 'Omega 3',
  'Probióticos', 'Proteínas', 'Sueño', 'Vitaminas',
]

const productos = [
  { id: 1, slug: 'colageno-marino', marca: 'B Life', categoria: 'Colágeno', nombre: 'Colágeno Marino Tipo I & III', sub: '60 cápsulas · Alta biodisponibilidad', precio: '$520 MXN', tag: 'Best Seller', color: '#F0F7F0' },
  { id: 2, slug: 'vitamina-d3-k2', marca: 'Birdman', categoria: 'Vitaminas', nombre: 'Vitamina D3 + K2', sub: '90 cápsulas · 5000 UI', precio: '$380 MXN', tag: 'Nuevo', color: '#F0F5F0' },
  { id: 3, slug: 'vital-defense-pro', marca: 'NOW Foods', categoria: 'Energía', nombre: 'Vital Defense Pro', sub: 'Multivitamínico · 90 días', precio: '$745 MXN', tag: 'Best Seller', color: '#F5F5F0' },
  { id: 4, slug: 'biotina-zinc-complex', marca: 'Nutricost', categoria: 'Cabello y Piel', nombre: 'Biotina + Zinc Complex', sub: '60 cápsulas · Cabello y uñas', precio: '$390 MXN', tag: '', color: '#F0F7F0' },
  { id: 5, slug: 'omega-3-platinum', marca: 'Beyond Vitamins', categoria: 'Omega 3', nombre: 'Omega 3 Platinum', sub: '60 cápsulas · EPA & DHA', precio: '$460 MXN', tag: 'Popular', color: '#F0F5F0' },
  { id: 6, slug: 'probiotico-50-billones', marca: 'B Life', categoria: 'Probióticos', nombre: 'Probiótico 50 Billones', sub: '30 cápsulas · 10 cepas', precio: '$580 MXN', tag: '', color: '#F0F7F0' },
  { id: 7, slug: 'magnesio-glicinato', marca: 'NOW Foods', categoria: 'Minerales', nombre: 'Magnesio Glicinato', sub: '120 cápsulas · Alta absorción', precio: '$420 MXN', tag: 'Best Seller', color: '#F5F5F0' },
  { id: 8, slug: 'vitamina-c-liposomal', marca: 'Birdman', categoria: 'Antioxidantes', nombre: 'Vitamina C Liposomal', sub: '60 cápsulas · 1000mg', precio: '$490 MXN', tag: 'Nuevo', color: '#F0F5F0' },
  { id: 9, slug: 'melatonina-magnesio', marca: 'Nutricost', categoria: 'Sueño', nombre: 'Melatonina + Magnesio', sub: '60 cápsulas · Descanso profundo', precio: '$350 MXN', tag: '', color: '#F0F7F0' },
  { id: 10, slug: 'enzimas-digestivas-pro', marca: 'Beyond Vitamins', categoria: 'Digestión', nombre: 'Enzimas Digestivas Pro', sub: '60 cápsulas · 18 enzimas', precio: '$440 MXN', tag: '', color: '#F0F5F0' },
  { id: 11, slug: 'proteina-vegana-vainilla', marca: 'Birdman', categoria: 'Proteínas', nombre: 'Proteína Vegana Vainilla', sub: '500g · 20g proteína por porción', precio: '$680 MXN', tag: 'Vegano', color: '#F5F5F0' },
  { id: 12, slug: 'complejo-b-total', marca: 'NOW Foods', categoria: 'Vitaminas', nombre: 'Complejo B Total', sub: '60 cápsulas · B1 B2 B3 B6 B12', precio: '$360 MXN', tag: '', color: '#F0F7F0' },
  { id: 13, slug: 'colageno-hidrolizado-polvo', marca: 'B Life', categoria: 'Colágeno', nombre: 'Colágeno Hidrolizado Polvo', sub: '300g · Sin sabor', precio: '$550 MXN', tag: 'Best Seller', color: '#F0F5F0' },
  { id: 14, slug: 'glutation-reducido', marca: 'Beyond Vitamins', categoria: 'Antioxidantes', nombre: 'Glutatión Reducido', sub: '60 cápsulas · 500mg', precio: '$620 MXN', tag: 'Nuevo', color: '#F5F5F0' },
  { id: 15, slug: 'ashwagandha-ksm-66', marca: 'Nutricost', categoria: 'Energía', nombre: 'Ashwagandha KSM-66', sub: '60 cápsulas · Adaptógeno', precio: '$480 MXN', tag: 'Popular', color: '#F0F7F0' },
  { id: 16, slug: 'zinc-cobre-balance', marca: 'NOW Foods', categoria: 'Minerales', nombre: 'Zinc + Cobre Balance', sub: '60 cápsulas · Inmunidad', precio: '$320 MXN', tag: '', color: '#F0F5F0' },
  { id: 17, slug: 'krill-oil-premium', marca: 'B Life', categoria: 'Omega 3', nombre: 'Krill Oil Premium', sub: '60 cápsulas · Astaxantina', precio: '$590 MXN', tag: 'Best Seller', color: '#F0F7F0' },
  { id: 18, slug: 'simbiotico-pro', marca: 'Birdman', categoria: 'Probióticos', nombre: 'Simbiótico Pro', sub: '30 sobres · Pre + Probiótico', precio: '$640 MXN', tag: 'Nuevo', color: '#F5F5F0' },
  { id: 19, slug: 'msm-vitamina-c', marca: 'Beyond Vitamins', categoria: 'Cabello y Piel', nombre: 'MSM + Vitamina C', sub: '120 cápsulas · Articulaciones', precio: '$410 MXN', tag: '', color: '#F0F5F0' },
  { id: 20, slug: 'kit-bienestar-completo', marca: 'Nutricost', categoria: 'Kits', nombre: 'Kit Bienestar Completo', sub: 'Colágeno + Omega 3 + Vitamina D', precio: '$1,190 MXN', tag: 'Kit', color: '#F0F7F0' },
]

interface Props {
  categoriaActiva: string
}

function CheckboxDropdown({
  label, opciones, seleccionadas, onToggle, onLimpiar, disabled
}: {
  label: string
  opciones: string[]
  seleccionadas: string[]
  onToggle: (op: string) => void
  onLimpiar: () => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', border: '1px solid',
          borderColor: seleccionadas.length > 0 ? '#6B8F6B' : '#DDDDDD',
          borderRadius: '8px',
          background: seleccionadas.length > 0 ? '#6B8F6B' : 'white',
          color: seleccionadas.length > 0 ? 'white' : disabled ? '#CCCCCC' : '#333333',
          fontSize: '13px', letterSpacing: '0.05em',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontWeight: 500,
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        {label} {seleccionadas.length > 0 ? `(${seleccionadas.length})` : ''} <span style={{ fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white', border: '1px solid #EEEEEE', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', padding: '12px', minWidth: '220px', zIndex: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #EEEEEE' }}>
            <span style={{ fontSize: '11px', color: '#999999', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Selecciona</span>
            {seleccionadas.length > 0 && (
              <button onClick={onLimpiar} style={{ background: 'none', border: 'none', fontSize: '11px', color: '#6B8F6B', cursor: 'pointer', fontFamily: 'inherit' }}>Limpiar</button>
            )}
          </div>
          {opciones.map((op) => {
            const sel = seleccionadas.includes(op)
            return (
              <button key={op} onClick={() => onToggle(op)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 10px', border: 'none', background: sel ? 'rgba(107,143,107,0.08)' : 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#333333', textAlign: 'left', transition: 'background 0.2s' }}>
                <div style={{ width: '18px', height: '18px', border: '1.5px solid', borderColor: sel ? '#6B8F6B' : '#DDDDDD', borderRadius: '4px', background: sel ? '#6B8F6B' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {sel && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                </div>
                {op}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SuplementosProductos({ categoriaActiva }: Props) {
  const [marcas, setMarcas] = useState<string[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [orden, setOrden] = useState('relevancia')

  function toggleMarca(m: string) { setMarcas(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]) }
  function toggleCategoria(c: string) { setCategorias(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]) }
  function limpiarTodo() { setMarcas([]); setCategorias([]) }

  const productosFiltrados = productos.filter(p => {
    const porMarca = marcas.length === 0 || marcas.includes(p.marca)
    const porCategoria = categorias.length === 0 || categorias.includes(p.categoria)
    const porCategoriaActiva = categoriaActiva === 'Todas' || p.categoria === categoriaActiva
    return porMarca && porCategoria && porCategoriaActiva
  })

  const categoriasDisponibles = marcas.length > 0
    ? [...new Set(productos.filter(p => marcas.includes(p.marca)).map(p => p.categoria))].sort()
    : todasLasCategorias

  const hayFiltros = marcas.length > 0 || categorias.length > 0

  return (
    <div style={{ background: '#FFFFFF', minHeight: '600px' }}>

      {/* Barra de filtros */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EEEEEE', position: 'sticky', top: '73px', zIndex: 90, padding: '14px 40px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <CheckboxDropdown label="Marcas" opciones={todasLasMarcas} seleccionadas={marcas} onToggle={toggleMarca} onLimpiar={() => setMarcas([])} />
            <CheckboxDropdown label="Categoría" opciones={categoriasDisponibles} seleccionadas={categorias} onToggle={toggleCategoria} onLimpiar={() => setCategorias([])} />
            {hayFiltros && (
              <button onClick={limpiarTodo} style={{ padding: '8px 16px', border: '1px solid #DDDDDD', borderRadius: '8px', background: 'none', fontSize: '12px', color: '#999999', cursor: 'pointer', fontFamily: 'inherit' }}>
                ✕ Limpiar todo
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/cosmeticos" style={{ padding: '8px 20px', border: '1px solid #6B8F6B', borderRadius: '8px', color: '#6B8F6B', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
              Ver Cosméticos →
            </Link>
            <span style={{ fontSize: '12px', color: '#999999' }}>Ordenar por:</span>
            <select value={orden} onChange={(e) => setOrden(e.target.value)} style={{ padding: '8px 16px', border: '1px solid #DDDDDD', borderRadius: '8px', background: 'white', fontSize: '13px', color: '#333333', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: Menor a Mayor</option>
              <option value="precio-desc">Precio: Mayor a Menor</option>
              <option value="nuevo">Más Nuevos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        <p style={{ fontSize: '13px', color: '#999999', marginBottom: '32px' }}>
          {productosFiltrados.length} productos encontrados
          {marcas.length > 0 && <span style={{ color: '#6B8F6B', marginLeft: '8px' }}>· {marcas.join(', ')}</span>}
          {categorias.length > 0 && <span style={{ color: '#6B8F6B', marginLeft: '8px' }}>· {categorias.join(', ')}</span>}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {productosFiltrados.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', color: '#999999' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🌿</div>
              <p style={{ fontSize: '15px', marginBottom: '16px' }}>No hay productos con esos filtros.</p>
              <button onClick={limpiarTodo} style={{ padding: '10px 24px', background: '#6B8F6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            productosFiltrados.map((producto) => (
              <Link
                key={producto.id}
                href={`/suplementos/producto/${producto.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{ cursor: 'pointer', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #EEEEEE', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ aspectRatio: '1', background: producto.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {producto.tag && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 10px', background: '#6B8F6B', color: 'white', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '100px', fontWeight: 600 }}>
                        {producto.tag}
                      </div>
                    )}
                    <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'rgba(107,143,107,0.2)' }}>V</div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B8F6B', fontWeight: 600 }}>{producto.categoria}</span>
                      <span style={{ fontSize: '10px', color: '#AAAAAA' }}>{producto.marca}</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '17px', fontWeight: 500, color: '#111111', marginBottom: '4px', lineHeight: 1.4 }}>{producto.nombre}</h3>
                    <p style={{ fontSize: '12px', color: '#999999', marginBottom: '16px' }}>{producto.sub}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: '#111111' }}>{producto.precio}</span>
                      <span style={{ padding: '8px 16px', background: '#6B8F6B', color: 'white', fontSize: '12px', borderRadius: '8px', fontWeight: 600 }}>+ Agregar</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}