'use client'

import { useState, useEffect, useCallback } from 'react'

interface Influencer {
  id: number
  nombre: string
  email: string
  telefono: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  facebook: string | null
  otra_red: string | null
  seguidores: string | null
  codigo: string | null
  fiscal_rfc: string | null
  fiscal_razon_social: string | null
  fiscal_regimen: string | null
  fiscal_cp: string | null
  constancia_url: string | null
  banco: string | null
  clabe: string | null
  clabe_anterior: string | null
  clabe_cambiada_at: string | null
  clabe_cambio_revisado: boolean | null
  titular_cuenta: string | null
  estado: string
  tipo_comision?: string
  comision_valor?: number
  notas_admin: string | null
  created_at: string
  aprobado_at: string | null
}

interface Stats {
  pendientes: number
  aprobados: number
  total: number
}

type Filtro = 'pendiente' | 'aprobado' | 'rechazado' | 'pausado' | 'todos'

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: '#D97706', bg: 'rgba(245,158,11,0.1)' },
  aprobado:  { label: 'Aprobado',  color: '#6A8A62', bg: 'rgba(168,181,160,0.18)' },
  rechazado: { label: 'Rechazado', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  pausado:   { label: 'Pausado',   color: '#A8A8A8', bg: 'rgba(168,168,168,0.12)' },
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Modal detalle ───
function ModalDetalle({ inf, onClose, onAccion }: {
  inf: Influencer
  onClose: () => void
  onAccion: (id: number, accion: string) => Promise<void>
}) {
  const [procesando, setProcesando] = useState(false)
  const [verConstancia, setVerConstancia] = useState(false)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState('')

  const esPendiente = inf.estado === 'pendiente'
  const esAprobado = inf.estado === 'aprobado'
  const esPausado = inf.estado === 'pausado'

  async function ejecutar(accion: string) {
    setProcesando(true)
    await onAccion(inf.id, accion)
    setProcesando(false)
    onClose()
  }

  async function editarComision() {
    const tipoRaw = window.prompt('Tipo de comision para ' + inf.nombre + ':\n\nEscribe "porcentaje" o "fijo"', 'porcentaje')
    if (tipoRaw === null) return
    const tipo = tipoRaw.trim().toLowerCase()
    if (tipo !== 'porcentaje' && tipo !== 'fijo') {
      window.alert('Debes escribir exactamente "porcentaje" o "fijo".')
      return
    }
    const tipo_comision = tipo === 'fijo' ? 'monto_fijo' : 'porcentaje'
    const mensajeValor = tipo === 'fijo' ? 'Monto fijo por cada pieza vendida (ej. 30):' : 'Porcentaje de comision (ej. 5, 8, 10):'
    const valorRaw = window.prompt(mensajeValor, '5')
    if (valorRaw === null) return
    const comision_valor = Number(valorRaw)
    if (isNaN(comision_valor) || comision_valor < 0) {
      window.alert('El valor debe ser un numero mayor o igual a 0.')
      return
    }
    if (tipo_comision === 'porcentaje' && comision_valor > 100) {
      window.alert('El porcentaje no puede ser mayor a 100.')
      return
    }
    setProcesando(true)
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inf.id, accion: 'editar_comision', tipo_comision, comision_valor }),
      })
      const data = await res.json()
      if (!res.ok) {
        window.alert(data.error || 'No se pudo actualizar la comision.')
      } else {
        window.alert('Comision actualizada correctamente.')
        await onAccion(inf.id, 'recargar')
        onClose()
      }
    } catch {
      window.alert('Error al actualizar la comision.')
    }
    setProcesando(false)
  }

  async function ejecutarBorrado() {
    setProcesando(true)
    setErrorBorrar('')
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inf.id, accion: 'eliminar' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorBorrar(data.error ?? 'No se pudo eliminar.')
        setProcesando(false)
      } else {
        // Recargar la lista cerrando el modal
        await onAccion(inf.id, 'recargar')
        onClose()
      }
    } catch {
      setErrorBorrar('Error al eliminar.')
      setProcesando(false)
    }
  }

  async function abrirConstancia() {
    if (!inf.constancia_url) return
    setVerConstancia(true)
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: inf.constancia_url }),
      })
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
    } catch { /* silencioso */ }
    finally { setVerConstancia(false) }
  }

  const redes = [
    inf.instagram && `IG: ${inf.instagram}`,
    inf.tiktok && `TikTok: ${inf.tiktok}`,
    inf.youtube && `YouTube: ${inf.youtube}`,
    inf.facebook && `FB: ${inf.facebook}`,
    inf.otra_red && `Otra: ${inf.otra_red}`,
  ].filter(Boolean).join(' · ')

  const Campo = ({ label, valor, mono }: { label: string; valor: string | null; mono?: boolean }) => (
    <div>
      <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A8A8', marginBottom: '3px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#0E0E0E', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 500 }}>{valor || '—'}</p>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7', position: 'sticky', top: 0, zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, color: '#0E0E0E' }}>{inf.nombre}</h2>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', fontWeight: 500, background: ESTADO_CONFIG[inf.estado]?.bg, color: ESTADO_CONFIG[inf.estado]?.color }}>
                  {ESTADO_CONFIG[inf.estado]?.label}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Solicitud del {fechaCorta(inf.created_at)}</p>
              {inf.codigo && (
                <p style={{ fontSize: '13px', color: '#C9A961', fontWeight: 600, fontFamily: 'monospace', marginTop: '6px' }}>Código: {inf.codigo}</p>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px', padding: '2px' }}>✕</button>
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Contacto y redes */}
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '12px', fontWeight: 600 }}>Contacto y redes</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="Email" valor={inf.email} />
              <Campo label="Teléfono" valor={inf.telefono} />
              <Campo label="Seguidores" valor={inf.seguidores} />
            </div>
            {redes && <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '10px', lineHeight: 1.6 }}>{redes}</p>}
          </div>

          {/* Comisión actual */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #F0EDE5' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '12px', fontWeight: 600 }}>Comisión actual</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#0E0E0E' }}>
                {inf.tipo_comision === 'monto_fijo' ? '$' + (inf.comision_valor ?? 0) + ' por pieza' : (inf.comision_valor ?? 5) + '%'}
              </span>
              {(inf.tipo_comision === 'monto_fijo' || (inf.comision_valor ?? 5) !== 5) && (
                <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '100px', background: 'rgba(201,169,97,0.15)', color: '#8B7530', fontWeight: 700 }}>VIP</span>
              )}
            </div>
          </div>
          {/* Datos fiscales */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #F0EDE5' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '12px', fontWeight: 600 }}>Datos fiscales</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="RFC" valor={inf.fiscal_rfc} mono />
              <Campo label="CP fiscal" valor={inf.fiscal_cp} />
              <Campo label="Razón social" valor={inf.fiscal_razon_social} />
              <Campo label="Régimen" valor={inf.fiscal_regimen} />
            </div>
            {inf.constancia_url && (
              <button onClick={abrirConstancia} disabled={verConstancia}
                style={{ marginTop: '12px', padding: '8px 14px', border: '1px solid #C9A961', background: 'rgba(201,169,97,0.08)', color: '#8B7530', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                {verConstancia ? 'Abriendo…' : '📄 Ver Constancia de Situación Fiscal'}
              </button>
            )}
          </div>

          {/* Datos bancarios */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #F0EDE5' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '12px', fontWeight: 600 }}>Datos bancarios (SPEI)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="Banco" valor={inf.banco} />
              <Campo label="Titular" valor={inf.titular_cuenta} />
              <Campo label="CLABE" valor={inf.clabe} mono />
              {inf.clabe_cambio_revisado === false && (
                <div style={{ gridColumn: '1 / -1', marginTop: '8px', padding: '12px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, marginBottom: '4px' }}>{'\u26A0'} CLABE modificada recientemente</p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5 }}>
                    {inf.clabe_anterior ? `Anterior: ${inf.clabe_anterior}` : ''}
                    {inf.clabe_cambiada_at ? ` \u00b7 ${new Date(inf.clabe_cambiada_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </p>
                  <button onClick={() => ejecutar('marcar_clabe_revisada')} disabled={procesando}
                    style={{ marginTop: '8px', padding: '7px 14px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {'\u2713'} Marcar como revisada
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #E8E4DA', position: 'sticky', bottom: 0, background: '#fff' }}>
          {confirmarBorrar ? (
            <div>
              <p style={{ fontSize: '13px', color: '#0E0E0E', fontWeight: 500, marginBottom: '6px' }}>¿Eliminar a {inf.nombre} permanentemente?</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5, marginBottom: '12px' }}>Se borrará su registro, código, cuenta de acceso e historial. El correo quedará libre para registrarse de nuevo. Esta acción no se puede deshacer.</p>
              {errorBorrar && <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '10px' }}>{errorBorrar}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setConfirmarBorrar(false); setErrorBorrar('') }} disabled={procesando}
                  style={{ flex: 1, padding: '11px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', fontSize: '13px', cursor: 'pointer', color: '#6B6B6B', fontFamily: 'inherit', fontWeight: 500 }}>
                  Cancelar
                </button>
                <button onClick={ejecutarBorrado} disabled={procesando}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '6px', background: procesando ? '#A8A8A8' : '#EF4444', color: '#fff', fontSize: '13px', cursor: procesando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  {procesando ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '11px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', fontSize: '13px', cursor: 'pointer', color: '#6B6B6B', fontFamily: 'inherit', fontWeight: 500 }}>
                Cerrar
              </button>

              {esPendiente && (
                <>
                  <button onClick={() => ejecutar('rechazar')} disabled={procesando}
                    style={{ flex: 1, padding: '11px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', fontSize: '13px', cursor: 'pointer', color: '#EF4444', fontFamily: 'inherit', fontWeight: 500 }}>
                    Rechazar
                  </button>
                  <button onClick={() => ejecutar('aprobar')} disabled={procesando}
                    style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '6px', background: procesando ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: procesando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    {procesando ? 'Procesando…' : '✓ Aprobar y generar código'}
                  </button>
                </>
              )}

              {esAprobado && (
                <button onClick={() => ejecutar('pausar')} disabled={procesando}
                  style={{ flex: 1, padding: '11px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#fff', color: '#6B6B6B', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                  Pausar
                </button>
              )}

              {esPausado && (
                <button onClick={() => ejecutar('reactivar')} disabled={procesando}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '6px', background: '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Reactivar
                </button>
              )}

              {/* Editar comision (normal / VIP) */}
              <button onClick={editarComision} disabled={procesando}
                style={{ flex: '0 0 auto', padding: '11px 14px', border: '1px solid rgba(201,169,97,0.4)', borderRadius: '6px', background: 'rgba(201,169,97,0.08)', fontSize: '13px', cursor: 'pointer', color: '#B8912F', fontFamily: 'inherit', fontWeight: 500 }}>
                Editar comisión
              </button>
              {/* Botón eliminar disponible para todos los estados */}
              <button onClick={() => setConfirmarBorrar(true)} disabled={procesando}
                style={{ flex: '0 0 auto', padding: '11px 14px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', fontSize: '13px', cursor: 'pointer', color: '#EF4444', fontFamily: 'inherit', fontWeight: 500 }}>
                🗑 Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ───
export default function AdminInfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [detalle, setDetalle] = useState<Influencer | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/influencers')
      const data = await res.json()
      setInfluencers(data.influencers ?? [])
      setStats(data.stats ?? null)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function ejecutarAccion(id: number, accion: string) {
    if (accion === 'recargar') {
      await cargar()
      return
    }
    await fetch('/api/admin/influencers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, accion }),
    })
    await cargar()
  }

  const lista = influencers.filter(i => {
    if (filtro !== 'todos' && i.estado !== filtro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return i.nombre.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.codigo ?? '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .inf-row:hover { background: #FAFAF7 !important; cursor: pointer; }
        .inf-filtro { padding: 6px 14px; font-size: 12px; border: none; background: none; cursor: pointer; border-radius: 4px; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .inf-filtro.activo { background: #0E0E0E; color: #C9A961; }
        .inf-filtro:not(.activo):hover { background: #F0EDE5; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        {/* Encabezado */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Marketing</p>
          <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
            Programa de <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>embajadoras</em>
          </h1>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: `3px solid ${stats.pendientes > 0 ? '#F59E0B' : '#8A9882'}`, borderRadius: '8px', padding: '18px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Pendientes de revisar</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '32px', color: '#0E0E0E', lineHeight: 1 }}>{stats.pendientes}</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #8A9882', borderRadius: '8px', padding: '18px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Embajadoras activas</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '32px', color: '#0E0E0E', lineHeight: 1 }}>{stats.aprobados}</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #C9A961', borderRadius: '8px', padding: '18px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Total solicitudes</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '32px', color: '#0E0E0E', lineHeight: 1 }}>{stats.total}</p>
            </div>
          </div>
        )}

        {/* Filtros + búsqueda */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '6px', border: '1px solid #E8E4DA' }}>
            {([
              { key: 'pendiente', label: 'Pendientes' },
              { key: 'aprobado', label: 'Aprobadas' },
              { key: 'pausado', label: 'Pausadas' },
              { key: 'rechazado', label: 'Rechazadas' },
              { key: 'todos', label: 'Todas' },
            ] as const).map(f => {
              const count = f.key === 'todos' ? influencers.length : influencers.filter(i => i.estado === f.key).length
              return (
                <button key={f.key} onClick={() => setFiltro(f.key)} className={`inf-filtro${filtro === f.key ? ' activo' : ''}`}>
                  {f.label}
                  <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '100px', fontSize: '10px', background: filtro === f.key ? 'rgba(201,169,97,0.2)' : 'rgba(0,0,0,0.06)', color: filtro === f.key ? '#C9A961' : '#6B6B6B' }}>{count}</span>
                </button>
              )
            })}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <input type="text" placeholder="Buscar por nombre, email o código…" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #E8E4DA', background: '#fff', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', color: '#2C2C2C', outline: 'none', width: '260px' }} />
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>✦</p>
              <p style={{ fontSize: '13px', color: '#A8A8A8' }}>{filtro === 'pendiente' ? 'No hay solicitudes pendientes.' : 'Sin resultados.'}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                <tr>
                  {['Nombre', 'Contacto', 'Código', 'Solicitud', 'Estado', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(inf => {
                  const ec = ESTADO_CONFIG[inf.estado]
                  return (
                    <tr key={inf.id} className="inf-row" onClick={() => setDetalle(inf)} style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px' }}>{inf.nombre}</p>
                        {inf.seguidores && <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '1px' }}>{inf.seguidores}</p>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '12px', color: '#6B6B6B' }}>{inf.email}</p>
                        {inf.instagram && <p style={{ fontSize: '11px', color: '#A8A8A8' }}>{inf.instagram}</p>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {inf.codigo ? (
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#C9A961', fontWeight: 600 }}>{inf.codigo}</span>
                        ) : <span style={{ fontSize: '12px', color: '#D0CCC2' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6B6B6B', whiteSpace: 'nowrap' }}>{fechaCorta(inf.created_at)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', fontWeight: 500, background: ec?.bg, color: ec?.color }}>{ec?.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', color: '#C9A961', fontWeight: 500 }}>Ver →</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detalle && (
        <ModalDetalle inf={detalle} onClose={() => setDetalle(null)} onAccion={ejecutarAccion} />
      )}
    </>
  )
}
