'use client'

import { useState, useEffect } from 'react'

interface DashboardData {
  kpis: {
    ventasHoy: number; ventasTrend: number; pedidosHoy: number; pedidosTrend: number
    ticketPromedio: number; ticketTrend: number; clientesNuevos: number
  }
  alertas: {
    esperandoGuia: number; facturasPendientes: number
    stockBajo: { nombre: string; stock: number }[]; resenasPendientes: number
    cambiosFiscalesPendientes: number
    clabesCambiadas: { id: number; nombre: string; clabe: string; clabe_anterior: string; fecha: string }[]
  }
  grafica: { dias: { label: string; total: number; esHoy: boolean }[]; total7dias: number; pedidos7dias: number }
  topProductos: { nombre: string; cantidad: number; total: number }[]
  recientes: { id: number; nombre: string; total: number; estado: string; created_at: string; numProductos: number }[]
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: '#F0A030', pagado: '#3080D0', preparando: '#8060C0', enviado: '#6B8F6B',
}
const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', pagado: 'Pagado', preparando: 'Preparando', enviado: 'Enviado',
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  const maxGrafica = data ? Math.max(...data.grafica.dias.map(d => d.total), 1) : 1

  function fechaRel(f: string) {
    const diff = Date.now() - new Date(f).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `Hace ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `Hace ${h}h`
    return new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', fontFamily: "'Inter', -apple-system, sans-serif", color: '#2C2C2C' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Italiana&display=swap');
        .dash-serif { font-family: 'Cormorant Garamond', serif; }
        .dash-display { font-family: 'Italiana', serif; letter-spacing: 0.05em; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A8A8A8', marginBottom: '8px' }}>{fecha}</div>
            <h1 className="dash-display" style={{ fontSize: '36px', color: '#0E0E0E', fontWeight: 400 }}>
              {saludo}, <em className="dash-serif" style={{ color: '#C9A961', fontStyle: 'italic' }}>Vitalora</em>
            </h1>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#A8A8A8' }}>Cargando métricas...</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#A8A8A8' }}>No se pudieron cargar las métricas.</div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: 'Ventas Hoy', value: `$${data.kpis.ventasHoy.toLocaleString()}`, trend: data.kpis.ventasTrend, suffix: '%', comp: 'vs ayer' },
                { label: 'Pedidos Hoy', value: `${data.kpis.pedidosHoy}`, trend: data.kpis.pedidosTrend, suffix: '', comp: 'vs ayer' },
                { label: 'Ticket Promedio', value: `$${data.kpis.ticketPromedio.toLocaleString()}`, trend: data.kpis.ticketTrend, suffix: '%', comp: 'vs ayer' },
                { label: 'Clientes Hoy', value: `${data.kpis.clientesNuevos}`, trend: null, suffix: '', comp: 'pedidos únicos' },
              ].map((k, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: 'radial-gradient(circle at top right, rgba(201,169,97,0.08), transparent 70%)' }} />
                  <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '12px' }}>{k.label}</div>
                  <div className="dash-serif" style={{ fontSize: '32px', fontWeight: 600, color: '#0E0E0E', lineHeight: 1 }}>{k.value}</div>
                  {k.trend !== null && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: k.trend >= 0 ? '#4ADE80' : '#EF4444' }}>
                        {k.trend >= 0 ? '↑' : '↓'} {Math.abs(k.trend)}{k.suffix}
                      </span>
                      <span style={{ fontSize: '11px', color: '#A8A8A8' }}>{k.comp}</span>
                    </div>
                  )}
                  {k.trend === null && <div style={{ marginTop: '10px', fontSize: '11px', color: '#A8A8A8' }}>{k.comp}</div>}
                </div>
              ))}
            </div>

            {/* ACCESOS RÁPIDOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {[
                { label: 'Pedidos', href: '/admin/pedidos', icon: '📦' },
                { label: 'Productos', href: '/admin/productos', icon: '🧴' },
                { label: 'Reseñas', href: '/admin/resenas', icon: '★' },
                { label: 'Cupones', href: '/admin/codigos', icon: '🎟️' },
              ].map(a => (
                <a key={a.href} href={a.href} style={{ background: '#FFFFFF', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '18px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', color: '#2C2C2C', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '20px' }}>{a.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{a.label}</span>
                </a>
              ))}
            </div>

            {/* ALERTAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {data.alertas.esperandoGuia > 0 && (
                <AlertCard color="#F59E0B" icon="⏰" title={`${data.alertas.esperandoGuia} pedido${data.alertas.esperandoGuia > 1 ? 's' : ''} esperando guía`} desc="Agrega el número de guía para enviarlos." />
              )}
              {data.alertas.resenasPendientes > 0 && (
                <AlertCard color="#5B7C99" icon="★" title={`${data.alertas.resenasPendientes} reseña${data.alertas.resenasPendientes > 1 ? 's' : ''} por moderar`} desc="Apruébalas para que aparezcan en los productos." />
              )}
              {data.alertas.cambiosFiscalesPendientes > 0 && (
                <AlertCard color="#C9A961" icon="📋" title={`${data.alertas.cambiosFiscalesPendientes} cambio${data.alertas.cambiosFiscalesPendientes > 1 ? 's' : ''} fiscal${data.alertas.cambiosFiscalesPendientes > 1 ? 'es' : ''} por revisar`} desc="Embajadoras solicitaron modificar sus datos fiscales." />
              )}
              {data.alertas.clabesCambiadas.length > 0 && (
                <AlertCard color="#EF4444" icon="🏦" title={`${data.alertas.clabesCambiadas.length} CLABE${data.alertas.clabesCambiadas.length > 1 ? 's' : ''} modificada${data.alertas.clabesCambiadas.length > 1 ? 's' : ''}`} desc={data.alertas.clabesCambiadas.slice(0, 3).map(c => c.nombre).join(', ') + '. Revisa en Influencers.'} />
              )}
              {data.alertas.stockBajo.length > 0 && (
                <AlertCard color="#F59E0B" icon="📦" title={`${data.alertas.stockBajo.length} producto${data.alertas.stockBajo.length > 1 ? 's' : ''} con stock bajo`} desc={data.alertas.stockBajo.slice(0, 3).map(p => `${p.nombre} (${p.stock})`).join(', ')} />
              )}
              {data.alertas.esperandoGuia === 0 && data.alertas.resenasPendientes === 0 && data.alertas.stockBajo.length === 0 && data.alertas.cambiosFiscalesPendientes === 0 && data.alertas.clabesCambiadas.length === 0 && (
                <AlertCard color="#4ADE80" icon="✓" title="Todo en orden" desc="No hay alertas pendientes por ahora." />
              )}
            </div>

            {/* GRÁFICA + TOP PRODUCTOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Gráfica */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="dash-serif" style={{ fontSize: '18px', color: '#0E0E0E', fontWeight: 600 }}>Ventas de los últimos 7 días</h3>
                  <p style={{ fontSize: '13px', color: '#A8A8A8' }}>Total: ${data.grafica.total7dias.toLocaleString()} MXN · {data.grafica.pedidos7dias} pedidos</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px' }}>
                  {data.grafica.dias.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '10px', color: '#6B6B6B', fontWeight: 500 }}>${(d.total / 1000).toFixed(1)}k</div>
                      <div style={{ width: '100%', maxWidth: '48px', height: `${Math.max((d.total / maxGrafica) * 100, 3)}%`, background: d.esHoy ? 'linear-gradient(to top, #C9A961, #D9BE7B)' : '#E8E4DA', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} />
                      <div style={{ fontSize: '11px', color: d.esHoy ? '#C9A961' : '#A8A8A8', fontWeight: d.esHoy ? 600 : 400 }}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top productos */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '24px' }}>
                <h3 className="dash-serif" style={{ fontSize: '18px', color: '#0E0E0E', fontWeight: 600, marginBottom: '4px' }}>Más vendidos</h3>
                <p style={{ fontSize: '13px', color: '#A8A8A8', marginBottom: '20px' }}>Productos con más ventas confirmadas</p>
                {data.topProductos.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#A8A8A8', padding: '20px 0', textAlign: 'center' }}>Aún no hay ventas registradas.</p>
                ) : (
                  data.topProductos.map((p, i) => {
                    const max = data.topProductos[0].cantidad || 1
                    const colores = ['#C9A961', '#E8C9C0', '#A8B5A0', '#C9A961', '#E8C9C0']
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: i < data.topProductos.length - 1 ? '1px solid #F0EDE5' : 'none' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: colores[i], flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#0E0E0E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                          <div style={{ fontSize: '12px', color: '#A8A8A8', marginBottom: '4px' }}>{p.cantidad} vendidos · ${p.total.toLocaleString()}</div>
                          <div style={{ height: '4px', background: '#F0EDE5', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#C9A961', width: `${(p.cantidad / max) * 100}%`, borderRadius: '2px' }} />
                          </div>
                        </div>
                        <div className="dash-serif" style={{ fontSize: '18px', color: '#E8E4DA', fontWeight: 600 }}>0{i + 1}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* PEDIDOS RECIENTES */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 className="dash-serif" style={{ fontSize: '18px', color: '#0E0E0E', fontWeight: 600 }}>Pedidos recientes</h3>
                  <p style={{ fontSize: '13px', color: '#A8A8A8' }}>Últimas órdenes</p>
                </div>
                <a href="/admin/pedidos" style={{ fontSize: '12px', color: '#6B6B6B', textDecoration: 'none', padding: '8px 16px', border: '1px solid #E8E4DA', borderRadius: '6px' }}>Ver todos →</a>
              </div>
              {data.recientes.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#A8A8A8', padding: '20px 0', textAlign: 'center' }}>Aún no hay pedidos.</p>
              ) : (
                data.recientes.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: i < data.recientes.length - 1 ? '1px solid #F0EDE5' : 'none' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600, color: '#C9A961', flexShrink: 0 }}>
                      {p.nombre[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#0E0E0E' }}>{p.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#A8A8A8' }}>#{p.id} · {fechaRel(p.created_at)} · {p.numProductos} producto{p.numProductos !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="dash-serif" style={{ fontSize: '16px', fontWeight: 600, color: '#0E0E0E' }}>${p.total.toLocaleString()}</div>
                      <div style={{ fontSize: '11px', color: ESTADO_COLOR[p.estado] || '#A8A8A8', fontWeight: 500 }}>{ESTADO_LABEL[p.estado] || p.estado}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            
          </>
        )}
      </div>
    </div>
  )
}

function AlertCard({ color, icon, title, desc }: { color: string; icon: string; title: string; desc: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DA', borderLeft: `3px solid ${color}`, borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0E0E0E', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  )
}
