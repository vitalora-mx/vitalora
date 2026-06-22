'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export default function PortalInfluencerPage() {
  const { user, isLoggedIn } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [data, setData] = useState<any>(null)
  const [esInfluencer, setEsInfluencer] = useState<boolean | null>(null)

  // Solicitud de pago
  const [mostrarModal, setMostrarModal] = useState(false)
  const [facturaFile, setFacturaFile] = useState<File | null>(null)
  const [enviandoPago, setEnviandoPago] = useState(false)
  const [errorPago, setErrorPago] = useState('')
  const [exitoPago, setExitoPago] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const cargar = useCallback(async () => {
    if (!user?.email) return
    setCargando(true)
    try {
      const res = await fetch('/api/influencer/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      const d = await res.json()
      if (!d.esInfluencer) {
        setEsInfluencer(false)
      } else {
        setEsInfluencer(true)
        setData(d)
      }
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [user?.email])

  useEffect(() => {
    if (mounted && user?.email) cargar()
    else if (mounted && !user) setCargando(false)
  }, [mounted, user, cargar])

  async function solicitarPago() {
    setErrorPago('')
    if (!facturaFile) { setErrorPago('Debes adjuntar tu factura CFDI en PDF.'); return }
    if (facturaFile.type !== 'application/pdf') { setErrorPago('La factura debe ser un PDF.'); return }

    setEnviandoPago(true)
    try {
      const fd = new FormData()
      fd.append('email', user!.email!)
      fd.append('factura', facturaFile)
      const res = await fetch('/api/influencer/solicitar-pago', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) {
        setErrorPago(d.error ?? 'Error al solicitar el pago.')
      } else {
        setExitoPago(true)
        await cargar()
      }
    } catch {
      setErrorPago('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviandoPago(false)
    }
  }

  function copiarCodigo() {
    if (data?.influencer?.codigo) {
      navigator.clipboard.writeText(data.influencer.codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  // ─── Estados de carga / acceso ───
  if (!mounted || cargando) {
    return <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#A8A8A8' }}>Cargando…</div>
  }

  if (!isLoggedIn || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', maxWidth: '420px', padding: '48px 40px', borderRadius: '4px', border: '1px solid #E8E4DA', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#0E0E0E', marginBottom: '12px' }}>Portal de Embajadoras</h1>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '24px' }}>Inicia sesión con tu cuenta para ver tu panel.</p>
          <a href="/cuenta" style={{ display: 'inline-block', padding: '12px 28px', background: '#0E0E0E', color: '#C9A961', textDecoration: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600 }}>Iniciar sesión</a>
        </div>
      </div>
    )
  }

  if (esInfluencer === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', maxWidth: '440px', padding: '48px 40px', borderRadius: '4px', border: '1px solid #E8E4DA', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#0E0E0E', marginBottom: '12px' }}>No tienes acceso al portal</h1>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '24px' }}>
            Este correo no está registrado como embajadora activa. Si quieres unirte al programa, completa tu registro.
          </p>
          <a href="/influencer/registro" style={{ display: 'inline-block', padding: '12px 28px', background: '#0E0E0E', color: '#C9A961', textDecoration: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600 }}>Quiero registrarme</a>
        </div>
      </div>
    )
  }

  const inf = data.influencer
  const fin = data.finanzas
  const fiscal = data.datosFiscalesVitalora

  // Estado pendiente de aprobación
  if (inf.estado === 'pendiente') {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', maxWidth: '440px', padding: '48px 40px', borderRadius: '4px', border: '1px solid #E8E4DA', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#0E0E0E', marginBottom: '12px' }}>Tu solicitud está en revisión</h1>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7 }}>Estamos revisando tu registro. Te contactaremos por correo cuando sea aprobado.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Italiana&display=swap');
        .card { background: white; border: 1px solid #E8E4DA; border-radius: 8px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          {/* Encabezado */}
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '6px' }}>Portal de embajadora</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', color: '#0E0E0E', lineHeight: 1 }}>Hola, {inf.nombre.split(' ')[0]}</h1>
          </div>

          {/* Alerta de saldo alto */}
          {data.nivelAlerta && (
            <div style={{ padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', background: data.nivelAlerta === 'pausar' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.1)', border: `1px solid ${data.nivelAlerta === 'pausar' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
              <p style={{ fontSize: '13px', color: data.nivelAlerta === 'pausar' ? '#EF4444' : '#D97706', lineHeight: 1.6 }}>
                {data.nivelAlerta === 'pausar'
                  ? '⚠️ Tu código fue pausado por tener saldo acumulado sin solicitar. Solicita tu pago y sube tu factura para reactivarlo.'
                  : data.nivelAlerta === 'duro'
                  ? '⏰ Tu saldo superó $5,000 hace más de 15 días. Por favor solicita tu pago y sube tu factura lo antes posible.'
                  : '📋 Tu saldo superó $5,000. Te recomendamos solicitar tu pago y subir tu factura pronto.'}
              </p>
            </div>
          )}

          {/* Tarjeta de código */}
          <div className="card" style={{ padding: '24px', marginBottom: '20px', background: '#0E0E0E', border: '1px solid #C9A961' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,97,0.7)', marginBottom: '10px' }}>Tu código de descuento</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.1em', color: '#C9A961' }}>{inf.codigo}</span>
              <button onClick={copiarCodigo}
                style={{ padding: '6px 14px', background: 'rgba(201,169,97,0.15)', border: '1px solid rgba(201,169,97,0.4)', borderRadius: '4px', color: '#C9A961', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(245,240,232,0.6)', marginTop: '12px', lineHeight: 1.6 }}>
              Compártelo con tu comunidad. Da 5% de descuento (máx. 3 usos por persona) y ganas 5% de comisión por cada venta.
            </p>
          </div>

          {/* Finanzas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '18px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Saldo disponible</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#C9A961', lineHeight: 1 }}>{fmt(fin.saldoDisponible)}</p>
            </div>
            <div className="card" style={{ padding: '18px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Total ganado</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#0E0E0E', lineHeight: 1 }}>{fmt(fin.totalGanado)}</p>
            </div>
            <div className="card" style={{ padding: '18px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '8px' }}>Ventas</p>
              <p style={{ fontFamily: "'Italiana', serif", fontSize: '26px', color: '#0E0E0E', lineHeight: 1 }}>{fin.numVentas}</p>
            </div>
          </div>

          {/* Solicitar pago */}
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#0E0E0E' }}>Solicitar pago</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '2px' }}>Mínimo {fmt(fin.minimoRetiro)}. Se retira el saldo completo.</p>
              </div>
              {data.solicitudPendiente ? (
                <span style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '100px', background: 'rgba(245,158,11,0.1)', color: '#D97706', fontWeight: 500 }}>
                  Solicitud en proceso: {fmt(data.solicitudPendiente.monto)}
                </span>
              ) : (
                <button onClick={() => { setMostrarModal(true); setExitoPago(false); setErrorPago(''); setFacturaFile(null) }}
                  disabled={!fin.puedeRetirar}
                  style={{ padding: '11px 22px', background: fin.puedeRetirar ? '#0E0E0E' : '#E8E4DA', color: fin.puedeRetirar ? '#C9A961' : '#A8A8A8', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: fin.puedeRetirar ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  Solicitar {fmt(fin.saldoDisponible)}
                </button>
              )}
            </div>
            {!fin.puedeRetirar && !data.solicitudPendiente && fin.saldoDisponible < fin.minimoRetiro && (
              <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '12px' }}>Aún no alcanzas el mínimo de {fmt(fin.minimoRetiro)} para solicitar pago.</p>
            )}
          </div>

          {/* Datos fiscales de Vitalora para facturar */}
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#0E0E0E', marginBottom: '4px' }}>Datos para tu factura</p>
            <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '16px' }}>Emite tu CFDI a nombre de estos datos al solicitar tu pago.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Razón social', fiscal.razon_social],
                ['RFC', fiscal.rfc],
                ['Régimen fiscal', fiscal.regimen],
                ['Código postal', fiscal.cp],
                ['Uso de CFDI', fiscal.uso_cfdi],
                ['Concepto', fiscal.concepto],
              ].map(([label, valor], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', paddingBottom: '8px', borderBottom: i < 5 ? '1px solid #F0EDE5' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#6B6B6B', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#0E0E0E', fontWeight: 500, textAlign: 'right' }}>{valor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historial de pagos */}
          {data.pagos.length > 0 && (
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#0E0E0E', marginBottom: '16px' }}>Mis pagos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.pagos.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F0EDE5' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0E0E0E', fontFamily: "'Cormorant Garamond', serif" }}>{fmt(p.monto)}</p>
                      <p style={{ fontSize: '11px', color: '#A8A8A8' }}>Solicitado {fechaCorta(p.solicitado_at)}</p>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', fontWeight: 500,
                      background: p.estado === 'pagado' ? 'rgba(168,181,160,0.2)' : p.estado === 'solicitado' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: p.estado === 'pagado' ? '#6A8A62' : p.estado === 'solicitado' ? '#D97706' : '#EF4444' }}>
                      {p.estado === 'pagado' ? 'Pagado' : p.estado === 'solicitado' ? 'En proceso' : 'Rechazado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mis ventas */}
          {data.ventas.length > 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#0E0E0E', marginBottom: '4px' }}>Ventas pendientes de cobro</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '16px' }}>Por privacidad, no mostramos los datos de tus compradores.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.ventas.map((v: any) => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0EDE5' }}>
                    <span style={{ fontSize: '12px', color: '#6B6B6B' }}>Venta del {fechaCorta(v.fecha)}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#C9A961', fontFamily: "'Cormorant Garamond', serif" }}>+{fmt(v.comision)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#A8A8A8', marginTop: '24px' }}>
            <a href="/influencer/terminos" target="_blank" style={{ color: '#C9A961', textDecoration: 'none' }}>Términos del programa</a>
            {'  ·  '}
            <a href="/cuenta" style={{ color: '#C9A961', textDecoration: 'none' }}>Mi cuenta</a>
          </p>
        </div>
      </div>

      {/* Modal solicitar pago */}
      {mostrarModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '440px', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #E8E4DA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Solicitar pago</p>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#C9A961' }}>{fmt(fin.saldoDisponible)}</h2>
                </div>
                <button onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px' }}>✕</button>
              </div>
            </div>

            {exitoPago ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
                <p style={{ fontSize: '15px', color: '#0E0E0E', fontWeight: 600, marginBottom: '8px' }}>Solicitud enviada</p>
                <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, marginBottom: '20px' }}>Revisaremos tu factura y procesaremos tu pago por transferencia SPEI. Te avisaremos cuando esté listo.</p>
                <button onClick={() => setMostrarModal(false)} style={{ padding: '11px 28px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Entendido</button>
              </div>
            ) : (
              <>
                <div style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, marginBottom: '16px' }}>
                    Adjunta tu factura CFDI (PDF) emitida a nombre de Vitalora por este monto. Revisa los datos fiscales en tu portal.
                  </p>
                  {facturaFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(168,181,160,0.12)', border: '1px solid rgba(168,181,160,0.4)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#6A8A62' }}>✓ {facturaFile.name}</span>
                      <button onClick={() => setFacturaFile(null)} style={{ background: 'none', border: 'none', color: '#A8A8A8', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>cambiar</button>
                    </div>
                  ) : (
                    <label style={{ display: 'block', padding: '20px', background: '#FAFAF7', border: '1px dashed #C9A961', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: '13px', color: '#8B7530' }}>📎 Subir factura CFDI (PDF)</span>
                      <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFacturaFile(e.target.files[0]) }} />
                    </label>
                  )}
                  {errorPago && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '12px' }}>{errorPago}</p>}
                </div>
                <div style={{ padding: '0 24px 24px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => setMostrarModal(false)} style={{ flex: 1, padding: '11px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', fontSize: '13px', cursor: 'pointer', color: '#6B6B6B', fontFamily: 'inherit', fontWeight: 500 }}>Cancelar</button>
                  <button onClick={solicitarPago} disabled={enviandoPago || !facturaFile}
                    style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '6px', background: (enviandoPago || !facturaFile) ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: (enviandoPago || !facturaFile) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    {enviandoPago ? 'Enviando…' : 'Confirmar solicitud'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
