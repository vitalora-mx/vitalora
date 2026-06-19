'use client'

import { useState, useEffect, useCallback } from 'react'

interface Variante {
  id: string
  nombre: string
  stock: number
}

interface Producto {
  id: string
  nombre: string
  slug: string
  sku: string | null
  categoria: string | null
  precio: number | null
  stock: number | null
  activo: boolean
  producto_variantes: Variante[]
}

interface Stats {
  stockBajo: number
  sinStock: number
  saludable: number
  valorTotal: number
  total: number
}

type Filtro = 'todos' | 'bajo' | 'sinstock'

function getEstado(p: Producto): 'ok' | 'bajo' | 'sinstock' {
  const tieneVariantes = p.producto_variantes?.length > 0
  if (tieneVariantes) {
    if (p.producto_variantes.every(v => v.stock === 0)) return 'sinstock'
    if (p.producto_variantes.some(v => v.stock > 0 && v.stock <= 5)) return 'bajo'
    return 'ok'
  }
  const s = p.stock ?? 0
  if (s === 0) return 'sinstock'
  if (s <= 5) return 'bajo'
  return 'ok'
}

function getStockTotal(p: Producto): number {
  if (p.producto_variantes?.length > 0)
    return p.producto_variantes.reduce((a, v) => a + (v.stock ?? 0), 0)
  return p.stock ?? 0
}

// ─── Modal ajuste de stock ───────────────────────────────────────────────────

function ModalAjuste({ producto, onClose, onGuardado }: {
  producto: Producto
  onClose: () => void
  onGuardado: () => void
}) {
  const tieneVariantes = producto.producto_variantes?.length > 0
  type StockItem = { id: string; nombre: string; stock: number; tipo: 'variante' | 'producto' }
  const [stocks, setStocks] = useState<StockItem[]>(
    tieneVariantes
      ? producto.producto_variantes.map(v => ({ id: v.id, nombre: v.nombre, stock: v.stock, tipo: 'variante' as const }))
      : [{ id: producto.id, nombre: 'Stock general', stock: producto.stock ?? 0, tipo: 'producto' as const }]
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cambiar = (i: number, delta: number) =>
    setStocks(s => s.map((x, j) => j === i ? { ...x, stock: Math.max(0, x.stock + delta) } : x))

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      for (const item of stocks) {
        const res = await fetch('/api/admin/inventario', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: item.tipo, id: item.id, stock: item.stock }),
        })
        if (!res.ok) throw new Error()
      }
      onGuardado()
      onClose()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '440px', margin: '0 16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #E8E4DA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Ajustar stock</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, color: '#0E0E0E', lineHeight: 1.2 }}>{producto.nombre}</h2>
              {producto.sku && <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#A8A8A8', marginTop: '4px' }}>{producto.sku}</p>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px', lineHeight: 1, padding: '2px' }}>✕</button>
          </div>
        </div>

        {/* Campos */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stocks.map((item, i) => (
            <div key={item.id}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '8px', fontWeight: 500 }}>{item.nombre}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => cambiar(i, -1)}
                  style={{ width: '36px', height: '36px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B', fontWeight: 300 }}>−</button>
                <input type="number" min="0" value={item.stock}
                  onChange={e => setStocks(s => s.map((x, j) => j === i ? { ...x, stock: Math.max(0, parseInt(e.target.value) || 0) } : x))}
                  style={{ flex: 1, textAlign: 'center', border: '1px solid #E8E4DA', borderRadius: '6px', padding: '8px', fontSize: '15px', fontWeight: 600, color: '#0E0E0E', outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={() => cambiar(i, 1)}
                  style={{ width: '36px', height: '36px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B', fontWeight: 300 }}>+</button>
              </div>
            </div>
          ))}
          {error && <p style={{ fontSize: '12px', color: '#EF4444', textAlign: 'center' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '8px' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', fontSize: '13px', cursor: 'pointer', color: '#6B6B6B', fontFamily: 'inherit', fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', background: guardando ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.03em' }}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<Producto | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/inventario')
      const data = await res.json()
      setProductos(data.productos ?? [])
      setStats(data.stats ?? null)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const lista = productos.filter(p => {
    const e = getEstado(p)
    if (filtro === 'bajo' && e !== 'bajo') return false
    if (filtro === 'sinstock' && e !== 'sinstock') return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return p.nombre.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

  const pillEstado = (e: 'ok' | 'bajo' | 'sinstock') => {
    const config = {
      sinstock: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', dot: '#EF4444', label: 'Sin stock' },
      bajo:     { bg: 'rgba(245,158,11,0.1)', color: '#D97706', dot: '#F59E0B', label: 'Stock bajo' },
      ok:       { bg: 'rgba(168,181,160,0.18)', color: '#6A8A62', dot: '#8A9882', label: 'En stock' },
    }[e]
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 500, background: config.bg, color: config.color }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.dot, flexShrink: 0 }} />
        {config.label}
      </span>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .inv-row:hover { background: #FAFAF7 !important; }
        .inv-ajustar { padding: 6px 12px; font-size: 11px; border: 1px solid #E8E4DA; background: white; border-radius: 4px; cursor: pointer; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .inv-ajustar:hover { border-color: #C9A961; color: #C9A961; }
        .inv-filtro { padding: 6px 14px; font-size: 12px; border: none; background: none; cursor: pointer; border-radius: 4px; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .inv-filtro.activo { background: #0E0E0E; color: #C9A961; }
        .inv-filtro:not(.activo):hover { background: #F0EDE5; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Catálogo</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
              Control de <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>inventario</em>
            </h1>
          </div>
        </div>

        {/* ── Cards resumen ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            {/* Stock bajo */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #F59E0B', borderRadius: '8px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>⚠️</div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0E0E0E', marginBottom: '2px' }}>{stats.stockBajo} con stock bajo</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Nivel de 5 unidades o menos</p>
              </div>
            </div>

            {/* Valor */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #5B7C99', borderRadius: '8px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(91,124,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📊</div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0E0E0E', marginBottom: '2px' }}>Valor del inventario</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: '#C9A961' }}>{fmt(stats.valorTotal)}</p>
              </div>
            </div>

            {/* Saludable */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #8A9882', borderRadius: '8px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(168,181,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>✓</div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0E0E0E', marginBottom: '2px' }}>{stats.saludable} saludables</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Sin riesgo de quiebre próximo</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Filtros + búsqueda ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '6px', border: '1px solid #E8E4DA' }}>
            {([
              { key: 'todos', label: `Todos`, count: stats?.total ?? 0 },
              { key: 'bajo', label: 'Stock bajo', count: stats?.stockBajo ?? 0 },
              { key: 'sinstock', label: 'Sin stock', count: stats?.sinStock ?? 0 },
            ] as const).map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className={`inv-filtro${filtro === f.key ? ' activo' : ''}`}>
                {f.label}
                <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '100px', fontSize: '10px', background: filtro === f.key ? 'rgba(201,169,97,0.2)' : 'rgba(0,0,0,0.06)', color: filtro === f.key ? '#C9A961' : '#6B6B6B' }}>{f.count}</span>
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <input type="text" placeholder="Buscar producto o SKU…" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #E8E4DA', background: '#fff', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', color: '#2C2C2C', outline: 'none', width: '220px' }} />
          </div>
        </div>

        {/* ── Tabla ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando inventario…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>
              {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay productos en esta categoría.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                <tr>
                  {['Producto', 'SKU', 'Categoría', 'Stock', 'Estado', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: i >= 3 ? 'center' : 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(p => {
                  const estado = getEstado(p)
                  const stockTotal = getStockTotal(p)
                  const tieneVariantes = p.producto_variantes?.length > 0

                  return (
                    <tr key={p.id} className="inv-row" style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s', cursor: 'default' }}>

                      {/* Producto */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', minWidth: '200px' }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '15px', color: '#0E0E0E', lineHeight: 1.2, marginBottom: tieneVariantes ? '6px' : 0 }}>{p.nombre}</p>
                        {tieneVariantes && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {p.producto_variantes.map(v => (
                              <span key={v.id} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: v.stock === 0 ? 'rgba(239,68,68,0.08)' : v.stock <= 5 ? 'rgba(245,158,11,0.08)' : '#F0EDE5', color: v.stock === 0 ? '#EF4444' : v.stock <= 5 ? '#D97706' : '#6B6B6B' }}>
                                {v.nombre}: <strong>{v.stock}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                        {!p.activo && <span style={{ fontSize: '10px', color: '#A8A8A8', marginTop: '4px', display: 'inline-block' }}>· Inactivo</span>}
                      </td>

                      {/* SKU */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        {p.sku
                          ? <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6B6B6B', background: '#F0EDE5', padding: '3px 7px', borderRadius: '4px' }}>{p.sku}</span>
                          : <span style={{ color: '#D0CCC2', fontSize: '12px' }}>—</span>}
                      </td>

                      {/* Categoría */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', fontWeight: 500,
                          ...(p.categoria === 'cosmeticos' ? { background: 'rgba(232,201,192,0.3)', color: '#B5706A' }
                            : p.categoria === 'suplementos' ? { background: 'rgba(168,181,160,0.2)', color: '#6A8A62' }
                            : { background: '#F0EDE5', color: '#6B6B6B' }) }}>
                          {p.categoria === 'cosmeticos' ? 'Cosmético' : p.categoria === 'suplementos' ? 'Suplemento' : p.categoria ?? '—'}
                        </span>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: estado === 'sinstock' ? '#EF4444' : estado === 'bajo' ? '#D97706' : '#0E0E0E' }}>{stockTotal}</span>
                        <p style={{ fontSize: '10px', color: '#A8A8A8', marginTop: '1px' }}>uds.</p>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        {pillEstado(estado)}
                      </td>

                      {/* Acción */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <button className="inv-ajustar" onClick={() => setEditando(p)}>Ajustar</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Total */}
        {!cargando && (
          <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '12px', textAlign: 'right' }}>
            {lista.length} de {productos.length} productos
          </p>
        )}
      </div>

      {/* Modal */}
      {editando && (
        <ModalAjuste
          producto={editando}
          onClose={() => setEditando(null)}
          onGuardado={cargar}
        />
      )}
    </>
  )
}
