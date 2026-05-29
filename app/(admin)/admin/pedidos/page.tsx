'use client'

import { useState, useEffect } from 'react'

interface Pedido {
  id: number; estado: string; mp_payment_id: string | null; mp_preference_id: string | null
  nombre: string; apellido: string; email: string; telefono: string
  calle: string; numero: string; interior: string; colonia: string; ciudad: string
  estado_dir: string; cp: string; referencia: string
  subtotal: number; costo_envio: number; total: number
  numero_guia: string | null; factura_url: string | null
  created_at: string
  pedido_items: { nombre: string; marca: string; precio: number; cantidad: number }[]
}

const estados = [
  { value: 'pendiente', label: 'Pendiente', color: '#F0A030' },
  { value: 'pagado', label: 'Pagado', color: '#3080D0' },
  { value: 'preparando', label: 'Preparando', color: '#8060C0' },
  { value: 'enviado', label: 'Enviado', color: '#6B8F6B' },
  { value: 'entregado', label: 'Entregado', color: '#3A8A3A' },
  { value: 'cancelado', label: 'Cancelado', color: '#D33' },
  { value: 'reembolsado', label: 'Reembolsado', color: '#888' },
]

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => { cargarPedidos() }, [])

  async function cargarPedidos() {
    setLoading(true)
    const res = await fetch('/api/admin/pedidos')
    const data = await res.json()
    setPedidos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function actualizarEstado(id: number, estado: string) {
    await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    setMensaje(`Pedido #${id} → ${estado}`)
    cargarPedidos()
    setTimeout(() => setMensaje(''), 3000)
  }

  async function actualizarGuia(id: number) {
    const guia = prompt('Ingresa el número de guía:')
    if (!guia) return
    await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, numero_guia: guia, estado: 'enviado' }),
    })
    setMensaje(`Guía agregada al pedido #${id}`)
    cargarPedidos()
    setTimeout(() => setMensaje(''), 3000)
  }

  async function subirFactura(id: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pedido_id', String(id))
    const res = await fetch('/api/admin/pedidos/factura', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) {
      setMensaje(`Factura subida al pedido #${id}`)
      cargarPedidos()
    }
    setTimeout(() => setMensaje(''), 3000)
  }

  const pedidosFiltrados = filtroEstado === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtroEstado)
  const estadoInfo = (estado: string) => estados.find(e => e.value === estado) || { label: estado, color: '#888' }

  return (
    <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Pedidos</h1>
          <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>{pedidos.length} pedidos totales</p>
        </div>
        <button onClick={cargarPedidos} style={{ padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>↻ Actualizar</button>
      </div>

      {mensaje && <div style={{ padding: '12px 16px', background: '#EFE', border: '1px solid #ADA', borderRadius: '6px', marginBottom: '24px', fontSize: '14px', color: '#3A3' }}>{mensaje}</div>}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => setFiltroEstado('todos')} style={{ padding: '8px 16px', border: '1px solid', borderColor: filtroEstado === 'todos' ? '#111' : '#DDD', borderRadius: '100px', background: filtroEstado === 'todos' ? '#111' : 'white', color: filtroEstado === 'todos' ? 'white' : '#333', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Todos ({pedidos.length})</button>
        {estados.map(e => {
          const count = pedidos.filter(p => p.estado === e.value).length
          if (count === 0) return null
          return (
            <button key={e.value} onClick={() => setFiltroEstado(e.value)} style={{ padding: '8px 16px', border: '1px solid', borderColor: filtroEstado === e.value ? e.color : '#DDD', borderRadius: '100px', background: filtroEstado === e.value ? e.color : 'white', color: filtroEstado === e.value ? 'white' : '#333', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>{e.label} ({count})</button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Cargando pedidos...</p>
      ) : pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888', background: 'white', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
          <p>No hay pedidos {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pedidosFiltrados.map(p => {
            const info = estadoInfo(p.estado)
            const abierto = expandido === p.id
            return (
              <div key={p.id} style={{ background: 'white', borderRadius: '8px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
                {/* Header del pedido */}
                <div onClick={() => setExpandido(abierto ? null : p.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', minWidth: '80px' }}>#{p.id}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{p.nombre} {p.apellido}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{p.email} · {new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: `${info.color}20`, color: info.color }}>{info.label}</span>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111' }}>${p.total?.toLocaleString()}</div>
                  <span style={{ fontSize: '16px', color: '#888', transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </div>

                {/* Detalle expandido */}
                {abierto && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #EEE' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
                      {/* Items */}
                      <div>
                        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '12px' }}>Productos</div>
                        {p.pedido_items?.map((item, i) => (
                          <div key={i} style={{ fontSize: '13px', color: '#333', marginBottom: '6px', lineHeight: 1.5 }}>
                            {item.marca} — {item.nombre} <span style={{ color: '#888' }}>x{item.cantidad}</span> <span style={{ fontWeight: 500 }}>${(item.precio * item.cantidad).toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #EEE', fontSize: '12px', color: '#888' }}>
                          Subtotal: ${p.subtotal?.toLocaleString()} · Envío: {p.costo_envio === 0 ? 'Gratis' : '$' + p.costo_envio}
                        </div>
                      </div>

                      {/* Dirección */}
                      <div>
                        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '12px' }}>Dirección</div>
                        <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.7 }}>
                          {p.calle} {p.numero}{p.interior ? `, Int. ${p.interior}` : ''}<br />
                          {p.colonia}<br />
                          {p.ciudad}, {p.estado_dir} CP {p.cp}
                          {p.referencia && <><br /><span style={{ color: '#888' }}>Ref: {p.referencia}</span></>}
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '13px' }}>
                          📞 {p.telefono}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div>
                        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '12px' }}>Acciones</div>

                        {/* Cambiar estado */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '12px', color: '#555', marginBottom: '4px', display: 'block' }}>Estado:</label>
                          <select value={p.estado} onChange={e => actualizarEstado(p.id, e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}>
                            {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                          </select>
                        </div>

                        {/* Guía */}
                        <div style={{ marginBottom: '12px' }}>
                          {p.numero_guia ? (
                            <div style={{ fontSize: '13px', color: '#6B8F6B' }}>📦 Guía: <strong>{p.numero_guia}</strong></div>
                          ) : (
                            <button onClick={() => actualizarGuia(p.id)} style={{ width: '100%', padding: '8px', background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>📦 Agregar guía</button>
                          )}
                        </div>

                        {/* Factura */}
                        <div>
                          {p.factura_url ? (
                            <a href={p.factura_url} target="_blank" style={{ fontSize: '13px', color: 'var(--gold)', textDecoration: 'none' }}>📄 Ver factura</a>
                          ) : (
                            <label style={{ display: 'block', width: '100%', padding: '8px', background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                              📄 Subir factura
                              <input type="file" accept=".pdf,.xml" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) subirFactura(p.id, e.target.files[0]) }} />
                            </label>
                          )}
                        </div>

                        {p.mp_payment_id && (
                          <div style={{ marginTop: '12px', fontSize: '11px', color: '#888' }}>MP ID: {p.mp_payment_id}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
