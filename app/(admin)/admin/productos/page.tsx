'use client'

import { useState, useEffect, useMemo } from 'react'

interface Producto {
  id: number; slug: string; nombre: string; marca: string; categoria: string; tipo: string
  precio: number; precio_original: number | null
  stock: number; sku: string | null; codigo_barras: string | null; tag: string
  producto_imagenes: { id: number; url: string; posicion: number }[]
  producto_videos: { id: number; youtube_url: string; titulo: string; posicion: number }[]
}

type FiltroStock = 'todos' | 'agotados' | 'por_agotarse'

// Cambios pendientes de la edicion rapida: { [id]: { precio, stock } }
interface CambioPendiente { precio?: number; stock?: number }

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('todos')

  // Edicion rapida en linea
  const [cambios, setCambios] = useState<Record<number, CambioPendiente>>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarProductos() }, [])

  // Aviso al salir si hay cambios sin guardar
  useEffect(() => {
    const hayCambios = Object.keys(cambios).length > 0
    function antesDeSalir(e: BeforeUnloadEvent) {
      if (hayCambios) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', antesDeSalir)
    return () => window.removeEventListener('beforeunload', antesDeSalir)
  }, [cambios])

  async function cargarProductos() {
    setLoading(true)
    const res = await fetch('/api/admin/productos')
    const data = await res.json()
    setProductos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function eliminarProducto(id: number) {
    if (Object.keys(cambios).length > 0) {
      if (!confirm('Tienes cambios sin guardar que se perderán. ¿Continuar de todos modos?')) return
    }
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/api/admin/productos?id=${id}`, { method: 'DELETE' })
    setCambios(prev => { const n = { ...prev }; delete n[id]; return n })
    cargarProductos()
  }

  // --- Edicion rapida ---
  function valorPrecio(p: Producto): number {
    return cambios[p.id]?.precio !== undefined ? cambios[p.id].precio! : p.precio
  }
  function valorStock(p: Producto): number {
    return cambios[p.id]?.stock !== undefined ? cambios[p.id].stock! : p.stock
  }

  function editarPrecio(p: Producto, nuevo: string) {
    const num = nuevo === '' ? 0 : parseFloat(nuevo)
    setCambios(prev => {
      const actual = { ...(prev[p.id] || {}) }
      if (num === p.precio) delete actual.precio
      else actual.precio = num
      const n = { ...prev, [p.id]: actual }
      if (Object.keys(actual).length === 0) delete n[p.id]
      return n
    })
  }

  function editarStock(p: Producto, nuevo: string) {
    const num = nuevo === '' ? 0 : parseInt(nuevo)
    setCambios(prev => {
      const actual = { ...(prev[p.id] || {}) }
      if (num === p.stock) delete actual.stock
      else actual.stock = num
      const n = { ...prev, [p.id]: actual }
      if (Object.keys(actual).length === 0) delete n[p.id]
      return n
    })
  }

  const numCambios = Object.keys(cambios).length

  async function guardarTodos() {
    setGuardando(true); setMensaje('')
    try {
      const ids = Object.keys(cambios).map(Number)
      for (const id of ids) {
        const c = cambios[id]
        const payload: { id: number; precio?: number; stock?: number } = { id }
        if (c.precio !== undefined) payload.precio = c.precio
        if (c.stock !== undefined) payload.stock = c.stock
        await fetch('/api/admin/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setCambios({})
      setMensaje(`✓ ${ids.length} producto(s) actualizado(s)`)
      await cargarProductos()
    } catch {
      setMensaje('Error al guardar los cambios')
    }
    setGuardando(false)
  }

  function cancelarTodos() {
    if (!confirm('¿Descartar todos los cambios de precio y stock sin guardar?')) return
    setCambios({})
    setMensaje('')
  }

  // --- Filtros y busqueda ---
  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter(p => {
      const stockReal = valorStock(p)
      const porStock =
        filtroStock === 'todos' ? true :
        filtroStock === 'agotados' ? stockReal <= 0 :
        (stockReal >= 1 && stockReal <= 2)
      const porBusqueda = q === '' ||
        p.nombre.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.codigo_barras || '').toLowerCase().includes(q)
      return porStock && porBusqueda
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, busqueda, filtroStock, cambios])

  // Color del stock: rojo si 0, amarillo si 1-2, verde si mas
  function colorStock(n: number): string {
    if (n <= 0) return '#D33'
    if (n <= 2) return '#C90'
    return '#3A3'
  }
  function fondoStock(n: number): string {
    if (n <= 0) return '#FEE'
    if (n <= 2) return '#FFF8E0'
    return '#EFE'
  }

  const inputMini: React.CSSProperties = { width: '90px', padding: '6px 8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }

  return (
    <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div><h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Productos</h1><p style={{ fontSize: '14px', color: '#888', margin: 0 }}>{productos.length} registrados</p></div>
        <a href="/admin/productos/editar" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', background: '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>+ Nuevo Producto</a>
      </div>

      {mensaje && <div style={{ padding: '12px 16px', background: mensaje.includes('Error') ? '#FEE' : '#EFE', border: `1px solid ${mensaje.includes('Error') ? '#FAA' : '#ADA'}`, borderRadius: '6px', marginBottom: '24px', fontSize: '14px', color: mensaje.includes('Error') ? '#A33' : '#3A3' }}>{mensaje}</div>}

      {/* Buscador y filtro */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #DDD', borderRadius: '8px', padding: '10px 14px', background: 'white', flex: '1 1 320px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, SKU o código de barras..." style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', fontFamily: 'inherit' }} />
          {busqueda && <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}>✕</button>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([['todos', 'Todos'], ['agotados', 'Agotados'], ['por_agotarse', 'Por agotarse']] as [FiltroStock, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setFiltroStock(val)} style={{ padding: '10px 16px', border: '1px solid', borderColor: filtroStock === val ? '#111' : '#DDD', background: filtroStock === val ? '#111' : 'white', color: filtroStock === val ? 'white' : '#555', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: filtroStock === val ? 600 : 400 }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Barra de cambios pendientes */}
      {numCambios > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 48px)', maxWidth: '900px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px 24px', background: '#FFF8E0', border: '1px solid #E8D080', borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
          <span style={{ fontSize: '14px', color: '#876500', fontWeight: 500 }}>⚠️ Tienes cambios sin guardar en {numCambios} producto(s)</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={cancelarTodos} disabled={guardando} style={{ padding: '10px 20px', background: 'white', border: '1px solid #DDD', borderRadius: '8px', fontSize: '13px', color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={guardarTodos} disabled={guardando} style={{ padding: '10px 20px', background: guardando ? '#888' : '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{guardando ? 'Guardando...' : 'Guardar todos los cambios'}</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Cargando...</p> : productosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888', background: 'white', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
          <p>{productos.length === 0 ? 'No hay productos todavía' : 'Ningún producto coincide con la búsqueda o filtro'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {productosFiltrados.map(p => {
            const stockVal = valorStock(p)
            const precioVal = valorPrecio(p)
            const modificado = !!cambios[p.id]
            return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: modificado ? '#FFFDF5' : 'white', borderRadius: '8px', border: `1px solid ${modificado ? '#E8D080' : '#E5E5E5'}` }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '1px solid #EEE' }}>
                {p.producto_imagenes?.[0] ? <img src={p.producto_imagenes[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '24px', color: '#CCC' }}>V</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>{p.nombre}</span>
                  {p.tag && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#F5F0E8', borderRadius: '4px', color: '#888' }}>{p.tag}</span>}
                  {p.categoria === 'Kits' && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#E8F0E8', borderRadius: '4px', color: '#3A3' }}>📦 Kit</span>}
                  {p.producto_videos?.length > 0 && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#F0F0FF', borderRadius: '4px', color: '#55A' }}>🎬 {p.producto_videos.length}</span>}
                  {p.producto_imagenes?.length > 0 && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#FFF5E5', borderRadius: '4px', color: '#A85' }}>📷 {p.producto_imagenes.length}</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>{p.sku && <span style={{ color: '#666', marginRight: '8px' }}>[{p.sku}]</span>}{p.marca} · {p.categoria}</div>
              </div>

              {/* Edicion rapida: precio */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {p.precio_original && p.precio_original > precioVal && <div style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through' }}>${p.precio_original.toLocaleString()}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>$</span>
                  <input
                    type="number"
                    value={precioVal}
                    onChange={e => editarPrecio(p, e.target.value)}
                    style={{ ...inputMini, fontWeight: 600, color: '#111', borderColor: cambios[p.id]?.precio !== undefined ? '#C90' : '#DDD' }}
                  />
                </div>
              </div>

              {/* Edicion rapida: stock */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</span>
                <input
                  type="number"
                  value={stockVal}
                  onChange={e => editarStock(p, e.target.value)}
                  style={{ width: '70px', padding: '6px 8px', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', textAlign: 'center', fontWeight: 700, color: colorStock(stockVal), background: fondoStock(stockVal), border: `1px solid ${cambios[p.id]?.stock !== undefined ? '#C90' : (stockVal <= 0 ? '#FAA' : stockVal <= 2 ? '#E8D080' : '#ADA')}` }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <a href={`/admin/productos/editar?id=${p.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#111', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}>✏️ Editar</a>
                <button onClick={() => eliminarProducto(p.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#A33', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
