'use client'

import { useState, useEffect, useCallback } from 'react'

interface InfluencerData {
  id: number
  nombre: string
  email: string
  banco: string | null
  clabe: string | null
  titular_cuenta: string | null
  fiscal_rfc: string | null
  fiscal_razon_social: string | null
}

interface Solicitud {
  id: number
  influencer_id: number
  monto: number
  factura_url: string | null
  estado: string
  referencia_pago: string | null
  notas_admin: string | null
  solicitado_at: string
  pagado_at: string | null
  influencers: InfluencerData | null
}

interface Saldo {
  influencer_id: number
  nombre: string
  email: string
  saldo: number
  ventas: number
  superaTope: boolean
  diasEnAlerta: number | null
  nivelAlerta: string | null
}

interface Stats {
  solicitudesPendientes: number
  totalPendientePago: number
  enAlerta: number
}

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

// Modal para procesar pago
function ModalPago({ solicitud, onClose, onProcesar }: {
  solicitud: Solicitud
  onClose: () => void
  onProcesar: (pagoId: number, accion: string, referencia?: string, notas?: string) => Promise<void>
}) {
  const [referencia, setReferencia] = useState('')
  const [notas, setNotas] = useState('')
  const [procesando, setProcesando] = useState(false)
  const inf = solicitud.influencers

  async function verFactura() {
    if (!solicitud.factura_url) return
    const res = await fetch('/api/admin/influencer-pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: solicitud.factura_url }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  async function ejecutar(accion: string) {
    setProcesando(true)
    await onProcesar(solicitud.id, accion, referencia, notas)
    setProcesando(false)
    onClose()
  }

  const Campo = ({ label, valor, mono }: { label: string; valor: string | null; mono?: boolean }) => (
    <div>
      <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A8A8', marginBottom: '3px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#0E0E0E', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 500 }}>{valor || '—'}</p>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ padding: '24px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Solicitud de pago</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, color: '#0E0E0E' }}>{inf?.nombre}</h2>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 600, color: '#C9A961', marginTop: '8px' }}>{fmt(solicitud.monto)}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Datos bancarios */}
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '12px', fontWeight: 600 }}>Transferir a (SPEI)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="Banco" valor={inf?.banco ?? null} />
              <Campo label="Titular" valor={inf?.titular_cuenta ?? null} />
            </div>
            <div style={{ marginTop: '12px' }}>
              <Campo label="CLABE" valor={inf?.clabe ?? null} mono />
            </div>
          </div>

          {/* Datos fiscales */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #F0EDE5' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '12px', fontWeight: 600 }}>Facturación</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="RFC" valor={inf?.fiscal_rfc ?? null} mono />
              <Campo label="Razón social" valor={inf?.fiscal_razon_social ?? null} />
            </div>
            {solicitud.factura_url ? (
              <button onClick={verFactura}
                style={{ marginTop: '12px', padding: '8px 14px', border: '1px solid #C9A961', background: 'rgba(201,169,97,0.08)', color: '#8B7530', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                📄 Ver factura CFDI
              </button>
            ) : (
              <p style={{ marginTop: '12px', fontSize: '12px', color: '#EF4444' }}>⚠️ El influencer no adjuntó factura todavía.</p>
            )}
          </div>

          {/* Procesar pago */}
          {solicitud.estado === 'solicitado' && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid #F0EDE5' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '12px', fontWeight: 600 }}>Procesar</p>
              <label style={{ fontSize: '12px', color: '#6B6B6B', display: 'block', marginBottom: '6px' }}>Referencia/folio de la transferencia SPEI</label>
              <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej. SPEI-20260622-001"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }} />
              <label style={{ fontSize: '12px', color: '#6B6B6B', display: 'block', marginBottom: '6px' }}>Notas (opcional)</label>
              <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          {solicitud.estado === 'pagado' && (
            <div style={{ padding: '12px 14px', background: 'rgba(168,181,160,0.15)', borderRadius: '6px' }}>
              <p style={{ fontSize: '13px', color: '#6A8A62', fontWeight: 500 }}>✓ Pagado el {solicitud.pagado_at ? fechaCorta(solicitud.pagado_at) : ''}</p>
              {solicitud.referencia_pago && <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '2px' }}>Ref: {solicitud.referencia_pago}</p>}
            </div>
          )}
        </div>

        {/* Acciones */}
        {solicitud.estado === 'solicitado' && (
          <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #E8E4DA', display: 'flex', gap: '8px' }}>
            <button onClick={() => ejecutar('rechazar')} disabled={procesando}
              style={{ flex: 1, padding: '11px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', fontSize: '13px', cursor: 'pointer', color: '#EF4444', fontFamily: 'inherit', fontWeight: 500 }}>
              Rechazar
            </button>
            <button onClick={() => ejecutar('pagar')} disabled={procesando}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '6px', background: procesando ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: procesando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {procesando ? 'Procesando…' : '✓ Marcar como pagado'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPagosPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [saldos, setSaldos] = useState<Saldo[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [cargando, setCargando] = useState(true)
  const [detalle, setDetalle] = useState<Solicitud | null>(null)
  const [tab, setTab] = useState<'solicitudes' | 'saldos'>('solicitudes')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/influencer-pagos')
      const data = await res.json()
      setSolicitudes(data.solicitudes ?? [])
      setSaldos(data.saldos ?? [])
      setStats(data.stats ?? null)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function procesar(pagoId: number, accion: string, referencia?: string, notas?: string) {
    await fetch('/api/admin/influencer-pagos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagoId, accion, referencia, notas }),
    })
    await cargar()
  }

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'solicitado')
  const solicitudesHistorial = solicitudes.filter(s => s.estado !== 'solicitado')

  const alertaConfig = (nivel: string | null) => {
    if (nivel === 'pausar') return { label: 'Código pausado', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
    if (nivel === 'duro') return { label: 'Aviso urgente', color: '#D97706', bg: 'rgba(245,158,11,0.12)' }
    if (nivel === 'suave') return { label: 'Aviso enviado', color: '#5B7C99', bg: 'rgba(91,124,153,0.1)' }
    return null
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .pag-row:hover { background: #FAFAF7 !important; }
        .pag-tab { padding: 8px 18px; font-size: 13px; border: none; background: none; cursor: pointer; border-radius: 6px; color: #6B6B6B; font-weight: 500; font-family: inherit; transition: all 0.15s; }
        .pag-tab.activo { background: #0E0E0E; color: #C9A961; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Marketing · Influencers</p>
          <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
            Pagos a <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>embajadoras</em>
          </h1>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: `3px solid ${stats.solicitudesPendientes > 0 ? '#F59E0B' : '#8A9882'}`, borderRadius: '8px', padding: '18px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Solicitudes pendientes</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '32px', color: '#0E0E0E', lineHeight: 1 }}>{stats.solicitudesPendientes}</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #C9A961', borderRadius: '8px', padding: '18px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Total por pagar</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 600, color: '#C9A961', lineHeight: 1 }}>{fmt(stats.totalPendientePago)}</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: `3px solid ${stats.enAlerta > 0 ? '#EF4444' : '#8A9882'}`, borderRadius: '8px', padding: '18px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>En alerta ($5,000+)</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '32px', color: '#0E0E0E', lineHeight: 1 }}>{stats.enAlerta}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '6px', border: '1px solid #E8E4DA', marginBottom: '20px', width: 'fit-content' }}>
          <button onClick={() => setTab('solicitudes')} className={`pag-tab${tab === 'solicitudes' ? ' activo' : ''}`}>Solicitudes</button>
          <button onClick={() => setTab('saldos')} className={`pag-tab${tab === 'saldos' ? ' activo' : ''}`}>Saldos acumulados</button>
        </div>

        {cargando ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando…</div>
        ) : tab === 'solicitudes' ? (
          <>
            {/* Solicitudes pendientes */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
              {solicitudesPendientes.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>✓</p>
                  <p style={{ fontSize: '13px', color: '#A8A8A8' }}>No hay solicitudes de pago pendientes.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                    <tr>
                      {['Embajadora', 'Monto', 'Factura', 'Solicitado', ''].map((h, i) => (
                        <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudesPendientes.map(s => (
                      <tr key={s.id} className="pag-row" style={{ borderBottom: '1px solid #F0EDE5' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px' }}>{s.influencers?.nombre}</p>
                          <p style={{ fontSize: '11px', color: '#6B6B6B' }}>{s.influencers?.email}</p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 600, color: '#0E0E0E' }}>{fmt(s.monto)}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {s.factura_url
                            ? <span style={{ fontSize: '11px', color: '#6A8A62' }}>✓ Adjunta</span>
                            : <span style={{ fontSize: '11px', color: '#EF4444' }}>⚠ Falta</span>}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6B6B6B' }}>{fechaCorta(s.solicitado_at)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => setDetalle(s)}
                            style={{ padding: '6px 14px', fontSize: '11px', border: 'none', background: '#0E0E0E', borderRadius: '4px', cursor: 'pointer', color: '#C9A961', fontWeight: 600, fontFamily: 'inherit' }}>
                            Procesar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Historial */}
            {solicitudesHistorial.length > 0 && (
              <>
                <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A8A8', marginBottom: '12px' }}>Historial</p>
                <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {solicitudesHistorial.map(s => (
                        <tr key={s.id} className="pag-row" style={{ borderBottom: '1px solid #F0EDE5', cursor: 'pointer' }} onClick={() => setDetalle(s)}>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px' }}>{s.influencers?.nombre}</p>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 600 }}>{fmt(s.monto)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: s.estado === 'pagado' ? 'rgba(168,181,160,0.2)' : 'rgba(239,68,68,0.1)', color: s.estado === 'pagado' ? '#6A8A62' : '#EF4444' }}>
                              {s.estado === 'pagado' ? 'Pagado' : 'Rechazado'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6B6B6B' }}>{s.pagado_at ? fechaCorta(s.pagado_at) : fechaCorta(s.solicitado_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          /* Tab de saldos acumulados */
          <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
            {saldos.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Ninguna embajadora tiene saldo acumulado todavía.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                  <tr>
                    {['Embajadora', 'Ventas', 'Saldo acumulado', 'Estado'].map((h, i) => (
                      <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {saldos.map(s => {
                    const alerta = alertaConfig(s.nivelAlerta)
                    return (
                      <tr key={s.influencer_id} className="pag-row" style={{ borderBottom: '1px solid #F0EDE5' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px' }}>{s.nombre}</p>
                          <p style={{ fontSize: '11px', color: '#6B6B6B' }}>{s.email}</p>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6B6B6B' }}>{s.ventas}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 600, color: s.superaTope ? '#EF4444' : '#0E0E0E' }}>{fmt(s.saldo)}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {alerta ? (
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: alerta.bg, color: alerta.color, fontWeight: 500 }}>
                              {alerta.label} {s.diasEnAlerta !== null && `(${s.diasEnAlerta}d)`}
                            </span>
                          ) : s.saldo >= 500 ? (
                            <span style={{ fontSize: '11px', color: '#6A8A62' }}>Puede solicitar pago</span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#A8A8A8' }}>Bajo el mínimo ($500)</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {detalle && (
        <ModalPago solicitud={detalle} onClose={() => setDetalle(null)} onProcesar={procesar} />
      )}
    </>
  )
}
