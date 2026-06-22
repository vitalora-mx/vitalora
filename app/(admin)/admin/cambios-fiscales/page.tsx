'use client'

import { useState, useEffect, useCallback } from 'react'

interface InfluencerData {
  id: number
  nombre: string
  email: string
  fiscal_rfc: string | null
  fiscal_razon_social: string | null
  fiscal_regimen: string | null
  fiscal_cp: string | null
}

interface Solicitud {
  id: number
  influencer_id: number
  fiscal_rfc: string | null
  fiscal_razon_social: string | null
  fiscal_regimen: string | null
  fiscal_cp: string | null
  constancia_url: string | null
  estado: string
  notas_admin: string | null
  created_at: string
  resuelto_at: string | null
  influencers: InfluencerData | null
}

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

function ModalCambio({ sol, onClose, onAccion }: {
  sol: Solicitud
  onClose: () => void
  onAccion: (id: number, accion: string) => Promise<void>
}) {
  const [procesando, setProcesando] = useState(false)
  const inf = sol.influencers

  async function verConstancia() {
    if (!sol.constancia_url) return
    const res = await fetch('/api/admin/cambios-fiscales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: sol.constancia_url }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  async function ejecutar(accion: string) {
    setProcesando(true)
    await onAccion(sol.id, accion)
    setProcesando(false)
    onClose()
  }

  // Comparación: dato actual vs nuevo
  const Comparar = ({ label, actual, nuevo }: { label: string; actual: string | null; nuevo: string | null }) => {
    const cambio = (actual ?? '') !== (nuevo ?? '')
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0EDE5' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A8A8A8' }}>{label}</span>
        <span style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: cambio ? 'line-through' : 'none' }}>{actual || '—'}</span>
        <span style={{ fontSize: '13px', color: cambio ? '#6A8A62' : '#6B6B6B', fontWeight: cambio ? 600 : 400 }}>
          {cambio && '→ '}{nuevo || '—'}
        </span>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Cambio de datos fiscales</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, color: '#0E0E0E' }}>{inf?.nombre}</h2>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '2px' }}>{inf?.email} · Solicitado {fechaCorta(sol.created_at)}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '12px', marginBottom: '4px' }}>
            <span></span>
            <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A8A8', fontWeight: 600 }}>Actual</span>
            <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8B5A0', fontWeight: 600 }}>Solicitado</span>
          </div>
          <Comparar label="RFC" actual={inf?.fiscal_rfc ?? null} nuevo={sol.fiscal_rfc} />
          <Comparar label="Razón social" actual={inf?.fiscal_razon_social ?? null} nuevo={sol.fiscal_razon_social} />
          <Comparar label="Régimen" actual={inf?.fiscal_regimen ?? null} nuevo={sol.fiscal_regimen} />
          <Comparar label="CP fiscal" actual={inf?.fiscal_cp ?? null} nuevo={sol.fiscal_cp} />

          {sol.constancia_url && (
            <button onClick={verConstancia}
              style={{ marginTop: '16px', padding: '8px 14px', border: '1px solid #C9A961', background: 'rgba(201,169,97,0.08)', color: '#8B7530', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              📄 Ver nueva constancia
            </button>
          )}

          {sol.estado === 'pendiente' && (
            <div style={{ padding: '12px 14px', background: 'rgba(201,169,97,0.08)', borderRadius: '6px', marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: '#8B7530', lineHeight: 1.6 }}>Al aprobar, estos datos reemplazarán los datos fiscales actuales del influencer. Al rechazar, los datos actuales se mantienen.</p>
            </div>
          )}

          {sol.estado !== 'pendiente' && (
            <div style={{ padding: '12px 14px', background: sol.estado === 'aprobado' ? 'rgba(168,181,160,0.15)' : 'rgba(239,68,68,0.08)', borderRadius: '6px', marginTop: '16px' }}>
              <p style={{ fontSize: '13px', color: sol.estado === 'aprobado' ? '#6A8A62' : '#EF4444', fontWeight: 500 }}>
                {sol.estado === 'aprobado' ? '✓ Aprobado' : '✕ Rechazado'} {sol.resuelto_at && `el ${fechaCorta(sol.resuelto_at)}`}
              </p>
            </div>
          )}
        </div>

        {sol.estado === 'pendiente' && (
          <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #E8E4DA', display: 'flex', gap: '8px' }}>
            <button onClick={() => ejecutar('rechazar')} disabled={procesando}
              style={{ flex: 1, padding: '11px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', fontSize: '13px', cursor: 'pointer', color: '#EF4444', fontFamily: 'inherit', fontWeight: 500 }}>
              Rechazar
            </button>
            <button onClick={() => ejecutar('aprobar')} disabled={procesando}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '6px', background: procesando ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: procesando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {procesando ? 'Procesando…' : '✓ Aprobar cambio'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminCambiosFiscalesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [detalle, setDetalle] = useState<Solicitud | null>(null)
  const [filtro, setFiltro] = useState<'pendiente' | 'todos'>('pendiente')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/cambios-fiscales')
      const data = await res.json()
      setSolicitudes(data.solicitudes ?? [])
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function ejecutarAccion(id: number, accion: string) {
    await fetch('/api/admin/cambios-fiscales', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, accion }),
    })
    await cargar()
  }

  const lista = solicitudes.filter(s => filtro === 'todos' || s.estado === 'pendiente')

  const estadoBadge = (estado: string) => {
    if (estado === 'aprobado') return { label: 'Aprobado', bg: 'rgba(168,181,160,0.2)', color: '#6A8A62' }
    if (estado === 'rechazado') return { label: 'Rechazado', bg: 'rgba(239,68,68,0.1)', color: '#EF4444' }
    return { label: 'Pendiente', bg: 'rgba(245,158,11,0.1)', color: '#D97706' }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .cf-row:hover { background: #FAFAF7 !important; cursor: pointer; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1100px' }}>
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Marketing · Influencers</p>
          <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
            Cambios <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>fiscales</em>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '6px', border: '1px solid #E8E4DA', marginBottom: '20px', width: 'fit-content' }}>
          <button onClick={() => setFiltro('pendiente')} style={{ padding: '8px 18px', fontSize: '13px', border: 'none', background: filtro === 'pendiente' ? '#0E0E0E' : 'none', color: filtro === 'pendiente' ? '#C9A961' : '#6B6B6B', cursor: 'pointer', borderRadius: '6px', fontFamily: 'inherit', fontWeight: 500 }}>Pendientes</button>
          <button onClick={() => setFiltro('todos')} style={{ padding: '8px 18px', fontSize: '13px', border: 'none', background: filtro === 'todos' ? '#0E0E0E' : 'none', color: filtro === 'todos' ? '#C9A961' : '#6B6B6B', cursor: 'pointer', borderRadius: '6px', fontFamily: 'inherit', fontWeight: 500 }}>Todos</button>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '28px', marginBottom: '8px' }}>✓</p>
              <p style={{ fontSize: '13px', color: '#A8A8A8' }}>No hay cambios fiscales {filtro === 'pendiente' ? 'pendientes' : ''}.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                <tr>
                  {['Embajadora', 'RFC solicitado', 'Fecha', 'Estado', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(s => {
                  const badge = estadoBadge(s.estado)
                  return (
                    <tr key={s.id} className="cf-row" onClick={() => setDetalle(s)} style={{ borderBottom: '1px solid #F0EDE5' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px' }}>{s.influencers?.nombre}</p>
                        <p style={{ fontSize: '11px', color: '#6B6B6B' }}>{s.influencers?.email}</p>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#2C2C2C', fontFamily: 'monospace' }}>{s.fiscal_rfc}</td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6B6B6B' }}>{fechaCorta(s.created_at)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', fontWeight: 500, background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', color: '#C9A961', fontWeight: 500 }}>Revisar →</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detalle && <ModalCambio sol={detalle} onClose={() => setDetalle(null)} onAccion={ejecutarAccion} />}
    </>
  )
}
