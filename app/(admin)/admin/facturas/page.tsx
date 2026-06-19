'use client'

import { useState, useEffect, useCallback } from 'react'

interface Factura {
  id: string
  created_at: string
  total: number
  estado: string
  factura_estado: string | null
  factura_rfc: string | null
  factura_razon_social: string | null
  factura_uso_cfdi: string | null
  factura_regimen: string | null
  factura_cp: string | null
  email_invitado: string | null
  vence: string
  diasRestantes: number
  perfiles: { nombre: string | null; apellido: string | null; email: string | null } | null
}

interface Stats {
  pendientes: number
  emitidas: number
  total: number
  vencenProximo: number
}

type Filtro = 'pendientes' | 'emitidas' | 'todas'

function fechaRelativa(iso: string): string {
  const d = new Date(iso)
  const ahora = new Date()
  const diffMs = ahora.getTime() - d.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const h = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  if (diffDias === 0) return `Hoy ${h}`
  if (diffDias === 1) return `Ayer ${h}`
  return `Hace ${diffDias} días`
}

function etiquetaVencimiento(dias: number, estado: string | null): { texto: string; color: string } {
  if (estado === 'emitida') return { texto: '✓ Emitida', color: '#6A8A62' }
  if (dias < 0) return { texto: 'Vencida', color: '#EF4444' }
  if (dias === 0) return { texto: 'Hoy vence', color: '#EF4444' }
  if (dias === 1) return { texto: 'Mañana', color: '#EF4444' }
  if (dias <= 5) return { texto: `${dias} días`, color: '#F59E0B' }
  return { texto: `${dias} días`, color: '#6B6B6B' }
}

function iniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
}

// ─── Modal detalle de factura ─────────────────────────────────────────────────
function ModalDetalle({ factura, onClose, onCambiarEstado }: {
  factura: Factura
  onClose: () => void
  onCambiarEstado: (id: string, estado: string) => Promise<void>
}) {
  const [guardando, setGuardando] = useState(false)
  const nombreCliente = factura.perfiles?.nombre
    ? [factura.perfiles.nombre, factura.perfiles.apellido].filter(Boolean).join(' ')
    : factura.email_invitado ?? 'Invitado'
  const emailCliente = factura.perfiles?.email ?? factura.email_invitado ?? '—'
  const esPendiente = !factura.factura_estado || factura.factura_estado === 'pendiente'
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

  const marcarEmitida = async () => {
    setGuardando(true)
    await onCambiarEstado(factura.id, 'emitida')
    setGuardando(false)
    onClose()
  }

  const marcarPendiente = async () => {
    setGuardando(true)
    await onCambiarEstado(factura.id, 'pendiente')
    setGuardando(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', margin: '0 16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Solicitud de factura</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, color: '#0E0E0E' }}>
                Pedido #{factura.id.slice(-6).toUpperCase()}
              </h2>
              <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '4px' }}>{fechaRelativa(factura.created_at)}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px', padding: '2px' }}>✕</button>
          </div>
        </div>

        {/* Datos fiscales */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '14px', fontWeight: 600 }}>Datos fiscales del cliente</p>

          {[
            { label: 'Cliente', valor: nombreCliente },
            { label: 'Email', valor: emailCliente },
            { label: 'RFC', valor: factura.factura_rfc ?? '—', mono: true },
            { label: 'Razón social', valor: factura.factura_razon_social ?? '—' },
            { label: 'Uso CFDI', valor: factura.factura_uso_cfdi ?? '—' },
            { label: 'Régimen fiscal', valor: factura.factura_regimen ?? '—' },
            { label: 'Código postal', valor: factura.factura_cp ?? '—' },
            { label: 'Total a facturar', valor: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(factura.total), destacado: true },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 7 ? '1px solid #F0EDE5' : 'none' }}>
              <span style={{ fontSize: '12px', color: '#6B6B6B', flexShrink: 0, marginRight: '16px' }}>{f.label}</span>
              <span style={{
                fontSize: f.destacado ? '16px' : '13px',
                fontFamily: f.mono ? 'monospace' : f.destacado ? "'Cormorant Garamond', serif" : 'inherit',
                fontWeight: f.destacado ? 600 : f.mono ? 400 : 500,
                color: f.destacado ? '#C9A961' : '#0E0E0E',
                textAlign: 'right',
              }}>{f.valor}</span>
            </div>
          ))}
        </div>

        {/* Alerta vencimiento */}
        {esPendiente && factura.diasRestantes <= 5 && factura.diasRestantes >= 0 && (
          <div style={{ margin: '0 24px', padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', fontSize: '12px', color: '#D97706', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>⚠️</span>
            <span>Esta factura {factura.diasRestantes === 0 ? 'vence hoy' : factura.diasRestantes === 1 ? 'vence mañana' : `vence en ${factura.diasRestantes} días`}. El SAT permite hasta el último día del mes siguiente a la compra.</span>
          </div>
        )}

        {/* Acciones */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', gap: '8px' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', fontSize: '13px', cursor: 'pointer', color: '#6B6B6B', fontFamily: 'inherit', fontWeight: 500 }}>
            Cerrar
          </button>
          {esPendiente ? (
            <button onClick={marcarEmitida} disabled={guardando}
              style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '6px', background: guardando ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {guardando ? 'Guardando…' : '✓ Marcar como emitida'}
            </button>
          ) : (
            <button onClick={marcarPendiente} disabled={guardando}
              style={{ flex: 2, padding: '10px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#fff', color: '#6B6B6B', fontSize: '13px', cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              {guardando ? 'Guardando…' : 'Regresar a pendiente'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [detalle, setDetalle] = useState<Factura | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/facturas')
      const data = await res.json()
      setFacturas(data.facturas ?? [])
      setStats(data.stats ?? null)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEstado = async (pedidoId: string, estado: string) => {
    await fetch('/api/admin/facturas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId, estado }),
    })
    await cargar()
  }

  const lista = facturas.filter(f => {
    const esPendiente = !f.factura_estado || f.factura_estado === 'pendiente'
    if (filtro === 'pendientes' && !esPendiente) return false
    if (filtro === 'emitidas' && f.factura_estado !== 'emitida') return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const nombre = f.perfiles?.nombre ?? f.email_invitado ?? ''
      return (
        nombre.toLowerCase().includes(q) ||
        (f.factura_rfc ?? '').toLowerCase().includes(q) ||
        (f.factura_razon_social ?? '').toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      )
    }
    return true
  })

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .fac-row:hover { background: #FAFAF7 !important; cursor: pointer; }
        .fac-filtro { padding: 6px 14px; font-size: 12px; border: none; background: none; cursor: pointer; border-radius: 4px; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .fac-filtro.activo { background: #0E0E0E; color: #C9A961; }
        .fac-filtro:not(.activo):hover { background: #F0EDE5; }
        .fac-btn { padding: 6px 14px; font-size: 11px; border: 1px solid #E8E4DA; background: white; border-radius: 4px; cursor: pointer; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .fac-btn:hover { border-color: #C9A961; color: #C9A961; }
        .fac-btn-primary { padding: 6px 14px; font-size: 11px; border: none; background: #0E0E0E; border-radius: 4px; cursor: pointer; color: #C9A961; font-weight: 600; transition: all 0.15s; font-family: inherit; }
        .fac-btn-primary:hover { background: #C9A961; color: #0E0E0E; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Operación · Facturas</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
              Facturas <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>CFDI</em>
            </h1>
          </div>
        </div>

        {/* ── Alertas ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: `3px solid ${stats.vencenProximo > 0 ? '#F59E0B' : '#8A9882'}`, borderRadius: '8px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: stats.vencenProximo > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(168,181,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {stats.vencenProximo > 0 ? '⏰' : '✓'}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0E0E0E', marginBottom: '2px' }}>
                  {stats.vencenProximo > 0 ? `${stats.vencenProximo} factura${stats.vencenProximo > 1 ? 's' : ''} vencen pronto` : 'Sin vencimientos urgentes'}
                </p>
                <p style={{ fontSize: '12px', color: '#6B6B6B' }}>El SAT permite hasta el último día del mes siguiente.</p>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #8A9882', borderRadius: '8px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(168,181,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📄</div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0E0E0E', marginBottom: '2px' }}>{stats.emitidas} factura{stats.emitidas !== 1 ? 's' : ''} emitida{stats.emitidas !== 1 ? 's' : ''}</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B' }}>{stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''} de procesar</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Filtros + búsqueda ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '6px', border: '1px solid #E8E4DA' }}>
            {([
              { key: 'pendientes', label: 'Pendientes', count: stats?.pendientes ?? 0 },
              { key: 'emitidas', label: 'Emitidas', count: stats?.emitidas ?? 0 },
              { key: 'todas', label: 'Todas', count: stats?.total ?? 0 },
            ] as const).map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className={`fac-filtro${filtro === f.key ? ' activo' : ''}`}>
                {f.label}
                <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '100px', fontSize: '10px', background: filtro === f.key ? 'rgba(201,169,97,0.2)' : 'rgba(0,0,0,0.06)', color: filtro === f.key ? '#C9A961' : '#6B6B6B' }}>{f.count}</span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <input type="text" placeholder="Buscar por RFC, cliente o pedido…" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #E8E4DA', background: '#fff', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', color: '#2C2C2C', outline: 'none', width: '260px' }} />
          </div>
        </div>

        {/* ── Tabla ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando facturas…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>🧾</p>
              <p style={{ fontSize: '13px', color: '#A8A8A8' }}>
                {filtro === 'pendientes' ? 'No hay solicitudes de factura pendientes. ¡Todo al día!' : 'Sin facturas en esta categoría.'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                <tr>
                  {['Pedido', 'Cliente', 'RFC', 'Solicitada', 'Vence en', 'Total', 'Estado', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(f => {
                  const esPendiente = !f.factura_estado || f.factura_estado === 'pendiente'
                  const nombreCliente = f.perfiles?.nombre
                    ? [f.perfiles.nombre, f.perfiles.apellido].filter(Boolean).join(' ')
                    : f.email_invitado ?? 'Invitado'
                  const venc = etiquetaVencimiento(f.diasRestantes, f.factura_estado)
                  const init = iniciales(nombreCliente)

                  return (
                    <tr key={f.id} className="fac-row" onClick={() => setDetalle(f)}
                      style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s' }}>

                      {/* Pedido */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {esPendiente && f.diasRestantes <= 5 && f.diasRestantes >= 0 && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.diasRestantes <= 1 ? '#EF4444' : '#F59E0B', flexShrink: 0, display: 'inline-block' }} />
                          )}
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '15px', color: '#0E0E0E' }}>
                            #{f.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F5F0E8', border: '1px solid #E8C9C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Italiana', serif", fontSize: '11px', color: '#C9A961', flexShrink: 0 }}>
                            {init}
                          </div>
                          <div>
                            <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px', lineHeight: 1.2 }}>{nombreCliente}</p>
                            <p style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '1px' }}>{f.perfiles?.email ?? f.email_invitado ?? '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* RFC */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#2C2C2C', background: '#F0EDE5', padding: '3px 7px', borderRadius: '4px' }}>
                          {f.factura_rfc}
                        </span>
                      </td>

                      {/* Solicitada */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#6B6B6B', whiteSpace: 'nowrap' }}>
                        {fechaRelativa(f.created_at)}
                      </td>

                      {/* Vence */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: venc.color }}>{venc.texto}</span>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 600, color: '#0E0E0E' }}>{fmt(f.total)}</span>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        {esPendiente ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 500, background: 'rgba(245,158,11,0.1)', color: '#D97706' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
                            Pendiente
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 500, background: 'rgba(168,181,160,0.18)', color: '#6A8A62' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8A9882' }} />
                            Emitida
                          </span>
                        )}
                      </td>

                      {/* Acción */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                        {esPendiente ? (
                          <button className="fac-btn-primary" onClick={() => setDetalle(f)}>Ver datos</button>
                        ) : (
                          <button className="fac-btn" onClick={() => setDetalle(f)}>Ver</button>
                        )}
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
            {lista.length} de {facturas.length} solicitudes
          </p>
        )}
      </div>

      {detalle && (
        <ModalDetalle
          factura={detalle}
          onClose={() => setDetalle(null)}
          onCambiarEstado={cambiarEstado}
        />
      )}
    </>
  )
}
