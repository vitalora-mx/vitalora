'use client'

import { useState, useEffect, useCallback } from 'react'

interface PedidoItem {
  cantidad: number
  precio_unitario: number
  nombre_producto: string
  variante_nombre: string | null
}

interface Pedido {
  id: string
  created_at: string
  total: number
  subtotal: number | null
  costo_envio: number | null
  estado: string
  forma_pago: string | null
  email_invitado: string | null
  perfiles: { nombre: string | null; apellido: string | null; email: string | null } | null
  pedido_items: PedidoItem[]
}

interface Resumen {
  totalBruto: number
  totalEnvio: number
  ivaEstimado: number
  comisionMP: number
  neto: number
  totalPedidos: number
}

const PERIODOS = [
  { label: 'Hoy', dias: 0, esHoy: true },
  { label: '7 días', dias: 7 },
  { label: '30 días', dias: 30 },
  { label: 'Este mes', esEsteMes: true },
  { label: '3 meses', dias: 90 },
  { label: 'Este año', esteAnio: true },
  { label: 'Personalizado', esPersonalizado: true },
]

function calcularRango(opcion: typeof PERIODOS[0]): { desde: string; hasta: string } {
  const hoy = new Date()
  const hasta = hoy.toISOString().split('T')[0]

  if (opcion.esHoy) return { desde: hasta, hasta }
  if (opcion.esEsteMes) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return { desde: inicio.toISOString().split('T')[0], hasta }
  }
  if (opcion.esteAnio) {
    const inicio = new Date(hoy.getFullYear(), 0, 1)
    return { desde: inicio.toISOString().split('T')[0], hasta }
  }
  const inicio = new Date()
  inicio.setDate(hoy.getDate() - (opcion.dias ?? 30))
  return { desde: inicio.toISOString().split('T')[0], hasta }
}

const TIPOS_REPORTE = [
  {
    titulo: 'Ventas Detallado',
    desc: 'Cada pedido desglosado: productos, cantidades, precios, envío, IVA, comisiones y monto neto.',
    tag: 'El más usado',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  },
  {
    titulo: 'IVA Cobrado',
    desc: 'Reporte mensual del IVA recaudado, ideal para tu declaración mensual al SAT.',
    tag: 'Para el SAT',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  },
  {
    titulo: 'Comisiones MP',
    desc: 'Total de comisiones cobradas por Mercado Pago. Gastos deducibles para tu declaración.',
    tag: 'Deducibles',
    icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  },
  {
    titulo: 'Productos y Margen',
    desc: 'Unidades vendidas por producto, precio de venta y margen estimado.',
    tag: 'Rentabilidad',
    icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  },
  {
    titulo: 'Envíos',
    desc: 'Cuánto cobraste por envío vs cuánto pagaste. Ingresos vs gastos logísticos.',
    tag: 'Logística',
    icon: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  },
  {
    titulo: 'Facturas CFDI',
    desc: 'Lista de pedidos con factura solicitada y emitida. Incluye RFC y datos fiscales.',
    tag: 'CFDI',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  },
]

export default function ReportesPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [periodoIdx, setPeriodoIdx] = useState(2) // "30 días" por defecto
  const [desdeCustom, setDesdeCustom] = useState('')
  const [hastaCustom, setHastaCustom] = useState('')
  const [cargando, setCargando] = useState(true)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [errorRango, setErrorRango] = useState('')

  const esPersonalizado = PERIODOS[periodoIdx].esPersonalizado

  const cargar = useCallback(async (idx: number, desdeC?: string, hastaC?: string) => {
    const opcion = PERIODOS[idx]
    let desde: string
    let hasta: string

    if (opcion.esPersonalizado) {
      if (!desdeC || !hastaC) return
      desde = desdeC
      hasta = hastaC
    } else {
      const rango = calcularRango(opcion)
      desde = rango.desde
      hasta = rango.hasta
    }

    setCargando(true)
    try {
      const res = await fetch(`/api/admin/reportes?desde=${desde}&hasta=${hasta}`)
      const data = await res.json()
      setPedidos(data.pedidos ?? [])
      setResumen(data.resumen ?? null)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => {
    if (!esPersonalizado) cargar(periodoIdx)
  }, [cargar, periodoIdx, esPersonalizado])

  const aplicarPersonalizado = () => {
    setErrorRango('')
    if (!desdeCustom || !hastaCustom) {
      setErrorRango('Selecciona ambas fechas.')
      return
    }
    if (desdeCustom > hastaCustom) {
      setErrorRango('La fecha inicial debe ser anterior a la final.')
      return
    }
    cargar(periodoIdx, desdeCustom, hastaCustom)
  }

  const toggleExpand = (id: string) => {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

  const nombreCliente = (p: Pedido) => {
    if (p.perfiles?.nombre) return [p.perfiles.nombre, p.perfiles.apellido].filter(Boolean).join(' ')
    return p.email_invitado ?? 'Invitado'
  }

  const formaPago = (fp: string | null) => {
    const mapa: Record<string, string> = {
      credit_card: 'Tarjeta', debit_card: 'Débito', account_money: 'MP Saldo',
      ticket: 'OXXO', bank_transfer: 'SPEI',
    }
    return fp ? (mapa[fp] ?? fp) : '—'
  }

  // Etiqueta del período activo para mostrar en el subtítulo
  const etiquetaPeriodo = () => {
    if (esPersonalizado && desdeCustom && hastaCustom) {
      return `${new Date(desdeCustom + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} → ${new Date(hastaCustom + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return PERIODOS[periodoIdx].label
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .rep-row:hover { background: #FAFAF7 !important; }
        .rep-sub-row td { background: #FAFAF7 !important; font-size: 12px !important; color: #6B6B6B !important; }
        .periodo-btn { padding: 6px 13px; font-size: 12px; border: 1px solid #E8E4DA; background: #fff; border-radius: 6px; cursor: pointer; color: #6B6B6B; font-weight: 500; transition: all 0.15s; font-family: inherit; white-space: nowrap; }
        .periodo-btn.activo { background: #0E0E0E; color: #C9A961; border-color: #0E0E0E; }
        .periodo-btn:not(.activo):hover { border-color: #C9A961; color: #C9A961; }
        .reporte-card { background: #fff; border: 1px solid #E8E4DA; border-radius: 8px; padding: 20px; cursor: default; transition: all 0.2s; }
        .reporte-card:hover { border-color: #C9A961; box-shadow: 0 4px 16px rgba(201,169,97,0.1); transform: translateY(-1px); }
        .expand-btn { width: 20px; height: 20px; border: 1px solid #E8E4DA; background: #FAFAF7; border-radius: 4px; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; color: #6B6B6B; font-family: inherit; flex-shrink: 0; }
        .date-input { padding: 7px 10px; border: 1px solid #E8E4DA; border-radius: 6px; font-family: inherit; font-size: 12px; color: #2C2C2C; outline: none; background: #fff; cursor: pointer; }
        .date-input:focus { border-color: #C9A961; }
        .btn-aplicar { padding: 7px 16px; background: #0E0E0E; color: #C9A961; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-aplicar:hover { background: #C9A961; color: #0E0E0E; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        {/* ── Encabezado ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Contabilidad</p>
          <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
            Reportes <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>contables</em>
          </h1>
        </div>

        {/* ── Tarjetas de tipos de reporte ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '36px' }}>
          {TIPOS_REPORTE.map((r, i) => (
            <div key={i} className="reporte-card">
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(201,169,97,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A961', marginBottom: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" dangerouslySetInnerHTML={{ __html: r.icon }} />
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 600, color: '#0E0E0E', marginBottom: '6px' }}>{r.titulo}</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5, marginBottom: '12px' }}>{r.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#A8B5A0', fontWeight: 500 }}>{r.tag}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['XLSX', 'CSV'].map(f => (
                    <span key={f} style={{ fontSize: '10px', padding: '2px 6px', background: '#F0EDE5', color: '#6B6B6B', borderRadius: '3px', fontWeight: 600 }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Título Vista previa + selector de período ── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: esPersonalizado ? '12px' : '0' }}>
            <div>
              <h2 style={{ fontFamily: "'Italiana', serif", fontSize: '24px', letterSpacing: '0.02em', color: '#0E0E0E' }}>
                Vista previa: <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>Reporte de ventas</em>
              </h2>
              {resumen && !cargando && (
                <p style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '4px' }}>{etiquetaPeriodo()} · {resumen.totalPedidos} pedidos</p>
              )}
            </div>

            {/* Botones de período */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {PERIODOS.map((p, i) => (
                <button key={i} onClick={() => { setPeriodoIdx(i); setErrorRango('') }}
                  className={`periodo-btn${periodoIdx === i ? ' activo' : ''}`}
                  style={ p.esPersonalizado && periodoIdx === i ? { background: '#0E0E0E', color: '#C9A961', borderColor: '#0E0E0E', borderStyle: 'dashed' } : p.esPersonalizado ? { borderStyle: 'dashed' } : {} }>
                  {p.esPersonalizado ? '📅 Personalizado' : p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel de fechas personalizadas */}
          {esPersonalizado && (
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500, whiteSpace: 'nowrap' }}>Desde</label>
                <input type="date" value={desdeCustom} onChange={e => setDesdeCustom(e.target.value)}
                  className="date-input" max={hastaCustom || undefined} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500, whiteSpace: 'nowrap' }}>Hasta</label>
                <input type="date" value={hastaCustom} onChange={e => setHastaCustom(e.target.value)}
                  className="date-input" min={desdeCustom || undefined} max={new Date().toISOString().split('T')[0]} />
              </div>
              <button className="btn-aplicar" onClick={aplicarPersonalizado}>
                Ver reporte
              </button>
              {errorRango && (
                <p style={{ fontSize: '12px', color: '#EF4444', margin: 0 }}>{errorRango}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Barra de resumen ── */}
        {resumen && !cargando && (
          <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '20px 24px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0', borderTop: '3px solid #C9A961' }}>
            {[
              { label: 'Total Bruto', valor: fmt(resumen.totalBruto), sub: `${resumen.totalPedidos} pedidos`, color: '#0E0E0E' },
              { label: 'IVA estimado (16%)', valor: fmt(resumen.ivaEstimado), sub: 'Incluido en precio', color: '#0E0E0E' },
              { label: 'Comisiones MP', valor: `−${fmt(resumen.comisionMP)}`, sub: '~4.18% del total', color: '#F59E0B' },
              { label: 'Costo de envíos', valor: fmt(resumen.totalEnvio), sub: 'Cobrado al cliente', color: '#0E0E0E' },
              { label: 'Neto estimado', valor: fmt(resumen.neto), sub: 'En tu cuenta MP', color: '#6A8A62' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '0 20px', borderRight: i < 4 ? '1px solid #E8E4DA' : 'none' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px' }}>{s.label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: s.color }}>{s.valor}</p>
                <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '3px' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabla de pedidos ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando reporte…</div>
          ) : esPersonalizado && !desdeCustom ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📅</p>
              <p style={{ fontSize: '13px', color: '#A8A8A8' }}>Selecciona un rango de fechas y presiona "Ver reporte".</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Sin pedidos en este período.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E4DA' }}>
                  <tr>
                    {['Pedido', 'Fecha', 'Cliente', 'Subtotal', 'Envío', 'Total', 'Pago', 'Comisión MP', 'Neto'].map((h, i) => (
                      <th key={i} style={{ textAlign: i >= 3 ? 'right' : 'left', padding: '12px 14px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => {
                    const expandido = expandidos.has(p.id)
                    const subtotal = p.subtotal ?? (p.total - (p.costo_envio ?? 0))
                    const comision = p.total * 0.0418
                    const neto = p.total - comision

                    return (
                      <>
                        <tr key={p.id} className="rep-row" style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s' }}>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {p.pedido_items.length > 0 && (
                                <button className="expand-btn" onClick={() => toggleExpand(p.id)}>{expandido ? '−' : '+'}</button>
                              )}
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '14px', color: '#0E0E0E' }}>#{p.id.slice(-6).toUpperCase()}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: '12px', color: '#6B6B6B', whiteSpace: 'nowrap' }}>
                            {new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            <br /><span style={{ fontSize: '10px' }}>{new Date(p.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: '13px', color: '#2C2C2C', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombreCliente(p)}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: 600 }}>{fmt(subtotal)}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontSize: '13px', color: '#6B6B6B' }}>{fmt(p.costo_envio ?? 0)}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: 600 }}>{fmt(p.total)}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: '12px', color: '#6B6B6B' }}>{formaPago(p.forma_pago)}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontSize: '13px', color: '#F59E0B' }}>−{fmt(comision)}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: 600, color: '#6A8A62' }}>{fmt(neto)}</td>
                        </tr>
                        {expandido && p.pedido_items.map((item, j) => (
                          <tr key={`${p.id}-${j}`} className="rep-sub-row" style={{ borderBottom: '1px solid #F0EDE5' }}>
                            <td colSpan={3} style={{ padding: '8px 14px 8px 52px', fontSize: '12px', color: '#6B6B6B' }}>
                              <span style={{ color: '#C9A961', marginRight: '4px' }}>→</span>
                              {item.nombre_producto}{item.variante_nombre ? ` · ${item.variante_nombre}` : ''}
                            </td>
                            <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: '12px', color: '#6B6B6B' }}>{item.cantidad} × {fmt(item.precio_unitario)}</td>
                            <td colSpan={5} style={{ padding: '8px 14px', textAlign: 'right', fontSize: '12px', color: '#6B6B6B' }}>{fmt(item.cantidad * item.precio_unitario)}</td>
                          </tr>
                        ))}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!cargando && pedidos.length > 0 && (
          <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '12px', textAlign: 'right' }}>
            {pedidos.length} pedidos · Comisiones MP estimadas al 4.18%
          </p>
        )}
      </div>
    </>
  )
}
