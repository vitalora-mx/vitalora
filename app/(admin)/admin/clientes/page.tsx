'use client'

import { useState, useEffect, useCallback } from 'react'

interface Cliente {
  id: string
  nombre: string
  email: string
  created_at: string
  compras: number
  total: number
  ultima_compra: string | null
  tipo: 'nuevo' | 'recurrente'
}

interface Stats {
  total: number
  nuevosEsteMes: number
  recurrentes: number
  valorPromedio: number
}

type Filtro = 'todos' | 'recurrentes' | 'nuevos' | 'sinccompras'

function fechaRelativa(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const ahora = new Date()
  const diffMs = ahora.getTime() - d.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDias === 0) return 'Hoy'
  if (diffDias === 1) return 'Ayer'
  if (diffDias < 7) return `Hace ${diffDias} días`
  if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} sem.`
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function iniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/clientes')
      const data = await res.json()
      setClientes(data.clientes ?? [])
      setStats(data.stats ?? null)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const lista = clientes.filter(c => {
    if (filtro === 'recurrentes' && c.compras < 2) return false
    if (filtro === 'nuevos' && c.compras !== 1) return false
    if (filtro === 'sinccompras' && c.compras !== 0) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    }
    return true
  })

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

  const tipoConfig = (tipo: string, compras: number) => {
    if (compras >= 3) return { label: 'VIP', bg: 'rgba(201,169,97,0.15)', color: '#8B7530' }
    if (compras >= 2) return { label: 'Recurrente', bg: 'rgba(168,181,160,0.2)', color: '#6A8A62' }
    if (compras === 1) return { label: 'Nueva', bg: 'rgba(91,124,153,0.12)', color: '#5B7C99' }
    return { label: 'Sin compras', bg: '#F0EDE5', color: '#A8A8A8' }
  }

  const avatarColor = (nombre: string) => {
    const colores = ['#C9A961', '#A8B5A0', '#E8C9C0', '#5B7C99', '#8A9882']
    let hash = 0
    for (const c of nombre) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return colores[Math.abs(hash) % colores.length]
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .cli-row:hover { background: #FAFAF7 !important; }
        .cli-btn { padding: 6px 12px; font-size: 11px; border: 1px solid #E8E4DA; background: white; border-radius: 4px; cursor: pointer; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .cli-btn:hover { border-color: #C9A961; color: #C9A961; }
        .cli-filtro { padding: 6px 14px; font-size: 12px; border: none; background: none; cursor: pointer; border-radius: 4px; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .cli-filtro.activo { background: #0E0E0E; color: #C9A961; }
        .cli-filtro:not(.activo):hover { background: #F0EDE5; }
        .kpi-card { background: #fff; border: 1px solid #E8E4DA; border-radius: 8px; padding: 20px 24px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #C9A961, #D9BE7B); }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Personas</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
              Tus <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>clientes</em>
            </h1>
          </div>
        </div>

        {/* ── KPIs ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div className="kpi-card">
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Total registradas</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '36px', color: '#0E0E0E', lineHeight: 1 }}>{stats.total}</p>
              <p style={{ fontSize: '12px', color: '#A8B5A0', marginTop: '6px' }}>↑ {stats.nuevosEsteMes} este mes</p>
            </div>
            <div className="kpi-card">
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Recurrentes</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '36px', color: '#0E0E0E', lineHeight: 1 }}>{stats.recurrentes}</p>
              <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '6px' }}>2+ compras realizadas</p>
            </div>
            <div className="kpi-card">
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Valor promedio</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 600, color: '#C9A961', lineHeight: 1 }}>{fmt(stats.valorPromedio)}</p>
              <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '6px' }}>por cliente con compras</p>
            </div>
            <div className="kpi-card">
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Sin compras</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '36px', color: '#0E0E0E', lineHeight: 1 }}>{stats.total - clientes.filter(c => c.compras > 0).length}</p>
              <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '6px' }}>cuentas registradas</p>
            </div>
          </div>
        )}

        {/* ── Filtros + búsqueda ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '6px', border: '1px solid #E8E4DA' }}>
            {([
              { key: 'todos', label: 'Todos', count: clientes.length },
              { key: 'recurrentes', label: 'Recurrentes', count: clientes.filter(c => c.compras >= 2).length },
              { key: 'nuevos', label: 'Nuevas', count: clientes.filter(c => c.compras === 1).length },
              { key: 'sinccompras', label: 'Sin compras', count: clientes.filter(c => c.compras === 0).length },
            ] as const).map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className={`cli-filtro${filtro === f.key ? ' activo' : ''}`}>
                {f.label}
                <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '100px', fontSize: '10px', background: filtro === f.key ? 'rgba(201,169,97,0.2)' : 'rgba(0,0,0,0.06)', color: filtro === f.key ? '#C9A961' : '#6B6B6B' }}>{f.count}</span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <input type="text" placeholder="Buscar por nombre o email…" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #E8E4DA', background: '#fff', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', color: '#2C2C2C', outline: 'none', width: '240px' }} />
          </div>
        </div>

        {/* ── Tabla ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando clientes…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>
              {busqueda ? 'Sin resultados.' : 'No hay clientes en esta categoría.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                <tr>
                  {['Cliente', 'Tipo', 'Compras', 'Valor total', 'Última compra', 'Registrada'].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(c => {
                  const tc = tipoConfig(c.tipo, c.compras)
                  const color = avatarColor(c.nombre)
                  return (
                    <tr key={c.id} className="cli-row" style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s' }}>

                      {/* Cliente */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color + '33', border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Italiana', serif", fontSize: '13px', color, flexShrink: 0 }}>
                            {iniciales(c.nombre)}
                          </div>
                          <div>
                            <p style={{ fontWeight: 500, color: '#0E0E0E', fontSize: '13px', lineHeight: 1.2 }}>{c.nombre}</p>
                            <p style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '1px' }}>{c.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', fontWeight: 500, background: tc.bg, color: tc.color }}>{tc.label}</span>
                      </td>

                      {/* Compras */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#0E0E0E' }}>{c.compras}</span>
                      </td>

                      {/* Valor total */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 600, color: c.total > 0 ? '#0E0E0E' : '#A8A8A8' }}>
                          {c.total > 0 ? fmt(c.total) : '—'}
                        </span>
                      </td>

                      {/* Última compra */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#6B6B6B' }}>
                        {fechaRelativa(c.ultima_compra)}
                      </td>

                      {/* Registrada */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#6B6B6B' }}>
                        {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' })}
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
            {lista.length} de {clientes.length} clientes
          </p>
        )}
      </div>
    </>
  )
}
