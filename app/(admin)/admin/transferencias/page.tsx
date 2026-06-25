'use client'
import { useState, useEffect, useCallback } from 'react'

interface PedidoTransferencia {
  id: number
  estado: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  total: number
  comprobante_url: string | null
  comprobante_subido_at: string | null
  created_at: string
}

const FILTROS = [
  { key: 'comprobante_en_revision', label: 'Por revisar' },
  { key: 'comprobante_rechazado', label: 'Rechazados' },
  { key: 'esperando_comprobante', label: 'Esperando pago' },
  { key: 'pagado', label: 'Confirmados' },
  { key: 'cancelado', label: 'Cancelados' },
  { key: 'todos', label: 'Todos' },
]

function fecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminTransferenciasPage() {
  const [yo, setYo] = useState<{ id: string } | null>(null)
  const [pedidos, setPedidos] = useState<PedidoTransferencia[]>([])
  const [filtro, setFiltro] = useState('comprobante_en_revision')
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<number | null>(null)

  useEffect(() => {
    const guardado = localStorage.getItem('vitalora-admin-user')
    if (guardado) {
      try { setYo({ id: JSON.parse(guardado).id }) } catch {}
    }
  }, [])

  const cargar = useCallback(async () => {
    if (!yo) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/transferencias?solicitanteId=${yo.id}&filtro=${filtro}`)
      const data = await res.json()
      if (data.error) setMensaje('Error: ' + data.error)
      else setPedidos(data.pedidos || [])
    } catch {
      setMensaje('Error al cargar.')
    }
    setLoading(false)
  }, [yo, filtro])

  useEffect(() => { cargar() }, [cargar])

  async function verComprobante(pedidoId: number) {
    if (!yo) return
    try {
      const res = await fetch('/api/admin/transferencias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteId: yo.id, pedidoId }),
      })
      const data = await res.json()
      if (data.url) setComprobanteUrl(data.url)
      else setMensaje('No se pudo abrir el comprobante.')
    } catch {
      setMensaje('Error al abrir comprobante.')
    }
  }

  async function procesar(pedidoId: number, accion: 'aprobar' | 'rechazar') {
    if (!yo) return
    const confirmMsg = accion === 'aprobar'
      ? '¿Confirmar este pago? Se marcará el pedido como pagado, se descontará stock y se enviarán correos al cliente.'
      : '¿Estás seguro de RECHAZAR este comprobante?\n\nSe le avisará al cliente por correo de que hubo un problema. Podrás volver a aprobarlo después si fue un error, o el cliente podrá subir otro comprobante.\n\n¿Continuar con el rechazo?'
    if (!confirm(confirmMsg)) return

    setProcesando(pedidoId)
    try {
      const res = await fetch('/api/admin/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteId: yo.id, pedidoId, accion }),
      })
      const data = await res.json()
      if (data.error) setMensaje('Error: ' + data.error)
      else { setMensaje(accion === 'aprobar' ? '✓ Pago confirmado.' : 'Pago rechazado.'); cargar() }
    } catch {
      setMensaje('Error al procesar.')
    }
    setProcesando(null)
    setTimeout(() => setMensaje(''), 4000)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0E0E0E', margin: '0 0 6px' }}>Transferencias</h1>
      <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '24px' }}>Revisa los comprobantes de pago por transferencia y confirma o rechaza cada pedido.</p>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: filtro === f.key ? 600 : 400, background: filtro === f.key ? '#0E0E0E' : '#F0EDE5', color: filtro === f.key ? '#C9A961' : '#6B6B6B', fontFamily: 'inherit' }}>
            {f.label}
          </button>
        ))}
      </div>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', background: mensaje.startsWith('Error') ? '#FEE2E2' : '#E8F0E5', color: mensaje.startsWith('Error') ? '#B91C1C' : '#3F6B33' }}>
          {mensaje}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6B6B6B' }}>Cargando…</p>
      ) : pedidos.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'white', border: '1px solid #E8E4DA', borderRadius: '8px', color: '#A8A8A8' }}>
          No hay pedidos en esta categoría.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pedidos.map(p => (
            <div key={p.id} style={{ background: 'white', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#0E0E0E' }}>Pedido #{p.id}</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#0E0E0E' }}>${p.total?.toLocaleString('es-MX')} MXN</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#555' }}>{p.nombre} {p.apellido} · {p.email}</div>
                  <div style={{ fontSize: '13px', color: '#0E0E0E', marginTop: '4px', fontWeight: 600 }}>
                    📞 {p.telefono || 'Sin teléfono'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    Comprobante subido: {fecha(p.comprobante_subido_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {p.comprobante_url && (
                    <button onClick={() => verComprobante(p.id)} style={{ padding: '8px 14px', background: 'white', border: '1px solid #C9A961', color: '#8B7530', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                      Ver comprobante
                    </button>
                  )}
                  {p.estado === 'comprobante_en_revision' && (
                    <>
                      <button onClick={() => procesar(p.id, 'rechazar')} disabled={procesando === p.id}
                        style={{ padding: '8px 14px', background: 'white', border: '1px solid #E5B4B4', color: '#B91C1C', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Rechazar
                      </button>
                      <button onClick={() => procesar(p.id, 'aprobar')} disabled={procesando === p.id}
                        style={{ padding: '8px 18px', background: procesando === p.id ? '#999' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        {procesando === p.id ? 'Procesando…' : 'Confirmar pago'}
                      </button>
                    </>
                  )}
                  {p.estado === 'comprobante_rechazado' && (
                    <button onClick={() => procesar(p.id, 'aprobar')} disabled={procesando === p.id}
                      style={{ padding: '8px 18px', background: procesando === p.id ? '#999' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      {procesando === p.id ? 'Procesando…' : 'Confirmar pago de todas formas'}
                    </button>
                  )}
                  {p.estado === 'pagado' && <span style={{ fontSize: '12px', color: '#3F6B33', padding: '6px 12px', background: '#E8F0E5', borderRadius: '6px', fontWeight: 600 }}>Confirmado</span>}
                  {p.estado === 'esperando_comprobante' && <span style={{ fontSize: '12px', color: '#D97706', padding: '6px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', fontWeight: 600 }}>Esperando pago</span>}
                  {p.estado === 'comprobante_rechazado' && <span style={{ fontSize: '12px', color: '#B91C1C', padding: '6px 12px', background: '#FDEEEE', borderRadius: '6px', fontWeight: 600 }}>Rechazado</span>}
                  {(p.estado === 'cancelado' || p.estado === 'cancelado_sin_pago') && <span style={{ fontSize: '12px', color: '#999', padding: '6px 12px', background: '#F0EDE5', borderRadius: '6px' }}>Cancelado</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para ver comprobante */}
      {comprobanteUrl && (
        <div onClick={() => setComprobanteUrl(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '8px', padding: '16px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Comprobante de pago</span>
              <button onClick={() => setComprobanteUrl(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            {comprobanteUrl.toLowerCase().includes('.pdf') ? (
              <iframe src={comprobanteUrl} style={{ width: '80vw', height: '80vh', border: 'none' }} />
            ) : (
              <img src={comprobanteUrl} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }} />
            )}
            <a href={comprobanteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', color: '#C9A961' }}>Abrir en pestaña nueva</a>
          </div>
        </div>
      )}
    </div>
  )
}
