'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Pedido {
  id: string
  estado: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  total: number
  subtotal: number
  costo_envio: number
  numero_guia: string | null
  factura_rfc: string | null
  factura_estado: string | null
  created_at: string
  pedido_items: { nombre: string; marca: string; precio: number; cantidad: number; variante_nombre?: string }[]
}

const ESTADOS = [
  { value: 'pendiente',    label: 'Pendiente',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { value: 'pagado',       label: 'Pagado',       color: '#5B7C99', bg: 'rgba(91,124,153,0.1)' },
  { value: 'preparando',   label: 'Preparando',   color: '#8060C0', bg: 'rgba(128,96,192,0.1)' },
  { value: 'enviado',      label: 'Enviado',      color: '#6A8A62', bg: 'rgba(106,138,98,0.1)' },
  { value: 'entregado',    label: 'Entregado',    color: '#3A8A3A', bg: 'rgba(58,138,58,0.1)'  },
  { value: 'cancelado',    label: 'Cancelado',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
  { value: 'reembolsado',  label: 'Reembolsado',  color: '#A8A8A8', bg: 'rgba(168,168,168,0.1)'},
]

function estadoInfo(estado: string) {
  return ESTADOS.find(e => e.value === estado) ?? { label: estado, color: '#888', bg: '#F0EDE5' }
}

function botonGuia(pedido: Pedido) {
  const { estado, numero_guia } = pedido
  if (estado === 'entregado') return { label: '✓ Entregado', color: '#3A8A3A', bg: 'rgba(58,138,58,0.1)', border: 'rgba(58,138,58,0.3)' }
  if (estado === 'reembolsado') return { label: '↩ Devolución', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' }
  if (estado === 'enviado') return { label: '🚚 En camino · Reimprimir', color: '#6A8A62', bg: 'rgba(106,138,98,0.1)', border: 'rgba(106,138,98,0.3)' }
  if (numero_guia) return { label: '✓ Impreso · Reimprimir', color: '#5B7C99', bg: 'rgba(91,124,153,0.1)', border: 'rgba(91,124,153,0.3)' }
  return { label: '🖨 Imprimir guía', color: '#C9A961', bg: 'rgba(201,169,97,0.1)', border: 'rgba(201,169,97,0.4)' }
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [mostrarFechas, setMostrarFechas] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await fetch('/api/admin/pedidos')
    const data = await res.json()
    setPedidos(Array.isArray(data) ? data : [])
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function actualizarEstado(id: string, estado: string) {
    await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    mostrarMensaje(`Estado actualizado → ${estado}`)
    cargar()
  }

  function mostrarMensaje(msg: string) {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 3000)
  }

  function imprimirGuia(pedido: Pedido) {
    if (!pedido.numero_guia) {
      mostrarMensaje('Este pedido no tiene número de guía aún.')
      return
    }
    // Abrir URL de impresión de Mercado Envíos
    window.open(`https://www.mercadolibre.com.mx/envios/label/print?shipment_id=${pedido.numero_guia}`, '_blank')
  }

  // Filtrado
  const lista = pedidos.filter(p => {
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
    if (desde && p.created_at < desde) return false
    if (hasta) {
      const hastaFin = hasta + 'T23:59:59'
      if (p.created_at > hastaFin) return false
    }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase()
      const productos = p.pedido_items?.map(i => i.nombre.toLowerCase()).join(' ') ?? ''
      return (
        nombreCompleto.includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.telefono ?? '').includes(q) ||
        p.id.toString().includes(q) ||
        productos.includes(q)
      )
    }
    return true
  })

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .ped-row:hover { background: #FAFAF7 !important; }
        .ped-filtro { padding: 6px 14px; font-size: 12px; border: none; background: none; cursor: pointer; border-radius: 4px; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; white-space: nowrap; }
        .ped-filtro.activo { background: #0E0E0E; color: #C9A961; }
        .ped-filtro:not(.activo):hover { background: #F0EDE5; }
        .date-input { padding: 7px 10px; border: 1px solid #E8E4DA; border-radius: 6px; font-family: inherit; font-size: 12px; color: #2C2C2C; outline: none; background: #fff; }
        .date-input:focus { border-color: #C9A961; }
        .ped-estado-select { padding: 5px 8px; border: 1px solid #E8E4DA; border-radius: 4px; font-size: 11px; font-family: inherit; color: #2C2C2C; background: #fff; cursor: pointer; outline: none; }
        .ped-estado-select:focus { border-color: #C9A961; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Operación</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
              Gestión de <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>pedidos</em>
            </h1>
          </div>
          <button onClick={cargar}
            style={{ padding: '8px 16px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ↻ Actualizar
          </button>
        </div>

        {/* ── Mensaje ── */}
        {mensaje && (
          <div style={{ padding: '10px 16px', background: 'rgba(168,181,160,0.2)', border: '1px solid rgba(168,181,160,0.4)', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#6A8A62' }}>
            {mensaje}
          </div>
        )}

        {/* ── Filtros de estado ── */}
        <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '6px', border: '1px solid #E8E4DA', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setFiltroEstado('todos')} className={`ped-filtro${filtroEstado === 'todos' ? ' activo' : ''}`}>
            Todos
            <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '100px', fontSize: '10px', background: filtroEstado === 'todos' ? 'rgba(201,169,97,0.2)' : 'rgba(0,0,0,0.06)', color: filtroEstado === 'todos' ? '#C9A961' : '#6B6B6B' }}>{pedidos.length}</span>
          </button>
          {ESTADOS.map(e => {
            const count = pedidos.filter(p => p.estado === e.value).length
            if (count === 0) return null
            return (
              <button key={e.value} onClick={() => setFiltroEstado(e.value)}
                className={`ped-filtro${filtroEstado === e.value ? ' activo' : ''}`}>
                {e.label}
                <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '100px', fontSize: '10px', background: filtroEstado === e.value ? 'rgba(201,169,97,0.2)' : 'rgba(0,0,0,0.06)', color: filtroEstado === e.value ? '#C9A961' : '#6B6B6B' }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── Búsqueda + Fechas ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Buscar por nombre, email, teléfono, # pedido o producto…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, minWidth: '280px', padding: '8px 12px', border: '1px solid #E8E4DA', background: '#fff', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', color: '#2C2C2C', outline: 'none' }} />

          <button onClick={() => setMostrarFechas(!mostrarFechas)}
            style={{ padding: '8px 14px', border: `1px solid ${mostrarFechas ? '#C9A961' : '#E8E4DA'}`, background: mostrarFechas ? 'rgba(201,169,97,0.08)' : '#fff', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: mostrarFechas ? '#C9A961' : '#6B6B6B', fontWeight: 500, whiteSpace: 'nowrap' }}>
            📅 {desde && hasta ? `${fechaCorta(desde)} → ${fechaCorta(hasta)}` : 'Rango de fechas'}
          </button>

          {(desde || hasta) && (
            <button onClick={() => { setDesde(''); setHasta(''); setMostrarFechas(false) }}
              style={{ padding: '8px 10px', border: '1px solid #E8E4DA', background: '#fff', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', color: '#6B6B6B' }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Panel de fechas */}
        {mostrarFechas && (
          <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500 }}>Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="date-input" max={hasta || undefined} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500 }}>Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="date-input" min={desde || undefined} max={new Date().toISOString().split('T')[0]} />
            </div>
            {desde && hasta && (
              <button onClick={() => setMostrarFechas(false)}
                style={{ padding: '7px 14px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Aplicar
              </button>
            )}
          </div>
        )}

        {/* ── Tabla ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando pedidos…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📦</p>
              <p style={{ fontSize: '13px', color: '#A8A8A8' }}>
                {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay pedidos en esta categoría.'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                <tr>
                  {['Pedido', 'Cliente', 'Productos', 'Total', 'Estado', 'Guía MP', 'Detalle'].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(p => {
                  const info = estadoInfo(p.estado)
                  const guia = botonGuia(p)
                  const productos = p.pedido_items?.map(i => `${i.nombre}${i.variante_nombre ? ` (${i.variante_nombre})` : ''} ×${i.cantidad}`).join(', ') ?? '—'

                  return (
                    <tr key={p.id} className="ped-row" style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s' }}>

                      {/* Pedido */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '15px', color: '#0E0E0E', lineHeight: 1 }}>#{String(p.id).slice(-6).toUpperCase()}</p>
                        <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '3px' }}>{fechaCorta(p.created_at)}</p>
                      </td>

                      {/* Cliente */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', minWidth: '160px' }}>
                        <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px', lineHeight: 1.2 }}>{p.nombre} {p.apellido}</p>
                        <p style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '2px' }}>{p.email}</p>
                        {p.telefono && <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '1px' }}>{p.telefono}</p>}
                      </td>

                      {/* Productos */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '220px' }}>
                        <p style={{ fontSize: '12px', color: '#6B6B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productos}</p>
                        <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '2px' }}>{p.pedido_items?.length ?? 0} producto{(p.pedido_items?.length ?? 0) !== 1 ? 's' : ''}</p>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 600, color: '#0E0E0E' }}>{fmt(p.total)}</p>
                        {p.factura_rfc && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: p.factura_estado === 'emitida' ? 'rgba(168,181,160,0.2)' : 'rgba(245,158,11,0.1)', color: p.factura_estado === 'emitida' ? '#6A8A62' : '#D97706', fontWeight: 500 }}>
                            {p.factura_estado === 'emitida' ? '✓ Facturado' : '⏳ Factura pend.'}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <select value={p.estado} onChange={e => actualizarEstado(p.id, e.target.value)}
                          className="ped-estado-select"
                          style={{ borderLeft: `3px solid ${info.color}` }}>
                          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                      </td>

                      {/* Guía MP */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <button onClick={() => imprimirGuia(p)}
                          style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, border: `1px solid ${guia.border}`, background: guia.bg, color: guia.color, borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                          {guia.label}
                        </button>
                        {p.numero_guia && (
                          <p style={{ fontSize: '10px', color: '#A8A8A8', marginTop: '3px', fontFamily: 'monospace' }}>{p.numero_guia}</p>
                        )}
                      </td>

                      {/* Detalle */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <Link href={`/admin/pedidos/${p.id}`}
                          style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid #E8E4DA', background: '#fff', borderRadius: '5px', color: '#6B6B6B', textDecoration: 'none', fontWeight: 500, transition: 'all 0.15s', display: 'inline-block' }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#C9A961'; (e.target as HTMLElement).style.color = '#C9A961' }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#E8E4DA'; (e.target as HTMLElement).style.color = '#6B6B6B' }}>
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {!cargando && (
          <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '12px', textAlign: 'right' }}>
            {lista.length} de {pedidos.length} pedidos
          </p>
        )}
      </div>
    </>
  )
}
