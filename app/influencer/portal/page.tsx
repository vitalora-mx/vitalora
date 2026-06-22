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

  // Login propio del portal
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginVerPass, setLoginVerPass] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginCargando, setLoginCargando] = useState(false)

  // Solicitud de pago
  const [mostrarModal, setMostrarModal] = useState(false)
  const [facturaFile, setFacturaFile] = useState<File | null>(null)
  const [enviandoPago, setEnviandoPago] = useState(false)
  const [errorPago, setErrorPago] = useState('')
  const [exitoPago, setExitoPago] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Cambio de contraseña
  const [mostrarPass, setMostrarPass] = useState(false)
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passNueva2, setPassNueva2] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)
  const [errorPass, setErrorPass] = useState('')
  const [exitoPass, setExitoPass] = useState(false)

  // Reporte de ventas
  const hoyStr = new Date().toISOString().split('T')[0]
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [repDesde, setRepDesde] = useState(hace30)
  const [repHasta, setRepHasta] = useState(hoyStr)
  const [repVentas, setRepVentas] = useState<any[]>([])
  const [repTotales, setRepTotales] = useState<any>(null)
  const [repCargando, setRepCargando] = useState(false)
  const [descargando, setDescargando] = useState(false)

  // Edición de datos
  const [mostrarEditar, setMostrarEditar] = useState(false)
  const [tabEditar, setTabEditar] = useState<'personales' | 'fiscales'>('personales')
  const [formDatos, setFormDatos] = useState<any>(null)
  const [cambioFiscalPendiente, setCambioFiscalPendiente] = useState<any>(null)
  const [guardandoDatos, setGuardandoDatos] = useState(false)
  const [msgDatos, setMsgDatos] = useState('')
  const [errorDatos, setErrorDatos] = useState('')
  const [constanciaNuevaPath, setConstanciaNuevaPath] = useState('')
  const [constanciaNuevaNombre, setConstanciaNuevaNombre] = useState('')
  const [subiendoConstancia, setSubiendoConstancia] = useState(false)

  const REGIMENES = [
    { codigo: '605', desc: 'Sueldos y Salarios' },
    { codigo: '606', desc: 'Arrendamiento' },
    { codigo: '608', desc: 'Demás ingresos' },
    { codigo: '612', desc: 'Personas Físicas con Actividades Empresariales' },
    { codigo: '621', desc: 'Incorporación Fiscal' },
    { codigo: '625', desc: 'Plataformas Tecnológicas' },
    { codigo: '626', desc: 'RESICO' },
    { codigo: '601', desc: 'General de Ley Personas Morales' },
    { codigo: '603', desc: 'Personas Morales Fines no Lucrativos' },
  ]

  async function abrirEditar() {
    setMostrarEditar(true)
    setMsgDatos(''); setErrorDatos('')
    try {
      const res = await fetch('/api/influencer/editar-datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email, accion: 'obtener' }),
      })
      const d = await res.json()
      setFormDatos(d.datos ?? null)
      setCambioFiscalPendiente(d.cambioFiscalPendiente ?? null)
    } catch { /* silencioso */ }
  }

  const setCampo = (k: string, v: string) => setFormDatos((f: any) => ({ ...f, [k]: v }))

  async function guardarPersonales() {
    setErrorDatos(''); setMsgDatos('')
    if (formDatos.clabe && !/^\d{18}$/.test(formDatos.clabe)) {
      setErrorDatos('La CLABE debe tener exactamente 18 dígitos.')
      return
    }
    setGuardandoDatos(true)
    try {
      const res = await fetch('/api/influencer/editar-datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email, accion: 'guardar_personales', datos: formDatos }),
      })
      const d = await res.json()
      if (!res.ok) setErrorDatos(d.error ?? 'Error al guardar.')
      else { setMsgDatos('Datos actualizados correctamente.'); await cargar() }
    } catch {
      setErrorDatos('Error de conexión.')
    } finally {
      setGuardandoDatos(false)
    }
  }

  async function subirConstanciaNueva(file: File) {
    setErrorDatos('')
    if (file.type !== 'application/pdf') { setErrorDatos('La constancia debe ser PDF.'); return }
    if (file.size > 5 * 1024 * 1024) { setErrorDatos('Máximo 5 MB.'); return }
    setSubiendoConstancia(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/influencer/constancia-cambio', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) setErrorDatos(d.error ?? 'Error al subir.')
      else { setConstanciaNuevaPath(d.path); setConstanciaNuevaNombre(file.name) }
    } catch {
      setErrorDatos('Error al subir el archivo.')
    } finally {
      setSubiendoConstancia(false)
    }
  }

  async function solicitarCambioFiscal() {
    setErrorDatos(''); setMsgDatos('')
    if (!formDatos.fiscal_rfc || !formDatos.fiscal_razon_social || !formDatos.fiscal_regimen) {
      setErrorDatos('Completa RFC, razón social y régimen.')
      return
    }
    setGuardandoDatos(true)
    try {
      const res = await fetch('/api/influencer/editar-datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user!.email,
          accion: 'solicitar_fiscal',
          datos: {
            fiscal_rfc: formDatos.fiscal_rfc,
            fiscal_razon_social: formDatos.fiscal_razon_social,
            fiscal_regimen: formDatos.fiscal_regimen,
            fiscal_cp: formDatos.fiscal_cp,
            constancia_url: constanciaNuevaPath || null,
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) setErrorDatos(d.error ?? 'Error al enviar la solicitud.')
      else {
        setMsgDatos('Solicitud de cambio fiscal enviada. La revisaremos pronto.')
        setConstanciaNuevaPath(''); setConstanciaNuevaNombre('')
        await abrirEditar() // recargar para ver el pendiente
      }
    } catch {
      setErrorDatos('Error de conexión.')
    } finally {
      setGuardandoDatos(false)
    }
  }

  const cargarReporte = useCallback(async (desde: string, hasta: string) => {
    if (!user?.email) return
    setRepCargando(true)
    try {
      const res = await fetch('/api/influencer/reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, desde, hasta }),
      })
      const d = await res.json()
      if (d.esInfluencer) {
        setRepVentas(d.ventas ?? [])
        setRepTotales(d.totales ?? null)
      }
    } catch { /* silencioso */ }
    finally { setRepCargando(false) }
  }, [user?.email])

  async function descargarExcel() {
    if (!user?.email) return
    setDescargando(true)
    try {
      const res = await fetch('/api/influencer/reporte-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, desde: repDesde, hasta: repHasta }),
      })
      if (!res.ok) throw new Error('Error')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-ventas-${repDesde}-${repHasta}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('No se pudo descargar el reporte. Intenta de nuevo.')
    } finally {
      setDescargando(false)
    }
  }

  async function cambiarPassword() {
    setErrorPass('')
    if (passNueva.length < 6) { setErrorPass('La nueva contraseña debe tener al menos 6 caracteres.'); return }
    if (passNueva !== passNueva2) { setErrorPass('Las contraseñas nuevas no coinciden.'); return }

    setCambiandoPass(true)
    try {
      const res = await fetch('/api/influencer/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email, passwordActual: passActual, passwordNueva: passNueva }),
      })
      const d = await res.json()
      if (!res.ok) {
        setErrorPass(d.error ?? 'Error al cambiar la contraseña.')
      } else {
        setExitoPass(true)
        setPassActual(''); setPassNueva(''); setPassNueva2('')
      }
    } catch {
      setErrorPass('Error de conexión.')
    } finally {
      setCambiandoPass(false)
    }
  }

  useEffect(() => { setMounted(true) }, [])

  async function iniciarSesion() {
    setLoginError('')
    if (!loginEmail || !loginPass) { setLoginError('Ingresa tu correo y contraseña.'); return }
    setLoginCargando(true)
    try {
      const res = await fetch('/api/cuenta/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail, password: loginPass }),
      })
      const d = await res.json()
      if (d.error) {
        setLoginError(d.error)
        setLoginCargando(false)
        return
      }
      // Verificar que sea influencer antes de dar acceso
      const resInf = await fetch('/api/influencer/es-influencer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: d.user.email }),
      })
      const infData = await resInf.json()
      if (!infData.esInfluencer) {
        setLoginError('Este correo no está registrado como embajadora. Si eres cliente, inicia sesión en tu cuenta.')
        setLoginCargando(false)
        return
      }
      // Guardar sesión y recargar datos del portal
      useAuthStore.getState().setAuth(d.user, d.session)
      setLoginCargando(false)
    } catch {
      setLoginError('Error al iniciar sesión. Intenta de nuevo.')
      setLoginCargando(false)
    }
  }

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
    if (mounted && user?.email) { cargar(); cargarReporte(hace30, hoyStr) }
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
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Italiana&display=swap');`}</style>
        <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ background: 'white', maxWidth: '420px', width: '100%', padding: '48px 40px', borderRadius: '4px', border: '1px solid #E8E4DA' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <img src="/images/logo/logo-header.png" alt="Vitalora" style={{ height: '36px', width: 'auto', marginBottom: '16px' }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '8px' }}>Portal de embajadoras</p>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, color: '#0E0E0E' }}>Inicia sesión</h1>
            </div>

            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Correo electrónico</label>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E4DA', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />

            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Contraseña</label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input type={loginVerPass ? 'text' : 'password'} value={loginPass} onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') iniciarSesion() }}
                style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1px solid #E8E4DA', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setLoginVerPass(!loginVerPass)}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>
                {loginVerPass ? '🙈' : '👁️'}
              </button>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <a href="/recuperar" style={{ fontSize: '12px', color: '#C9A961', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
            </div>

            {loginError && (
              <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#EF4444' }}>{loginError}</div>
            )}

            <button onClick={iniciarSesion} disabled={loginCargando}
              style={{ width: '100%', padding: '14px', background: loginCargando ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loginCargando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loginCargando ? 'Entrando…' : 'Iniciar sesión'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#A8A8A8', marginTop: '20px', lineHeight: 1.6 }}>
              ¿Quieres ser embajadora?<br />
              <a href="/influencer/registro" style={{ color: '#C9A961', textDecoration: 'none' }}>Regístrate aquí</a>
            </p>
          </div>
        </div>
      </>
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
          <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '6px' }}>Portal de embajadora</p>
              <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', color: '#0E0E0E', lineHeight: 1 }}>Hola, {inf.nombre.split(' ')[0]}</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="/cuenta"
                style={{ padding: '10px 20px', background: '#0E0E0E', border: '1px solid #0E0E0E', borderRadius: '6px', color: '#C9A961', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Mi cuenta de cliente
              </a>
              <button onClick={() => { useAuthStore.getState().logout(); window.location.href = '/cuenta' }}
                style={{ padding: '10px 20px', border: '1px solid #DDD', borderRadius: '6px', background: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Cerrar sesión
              </button>
            </div>
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

          {/* Reporte de ventas */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#0E0E0E' }}>Mis ventas</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '2px' }}>Detalle de tus comisiones. Por privacidad, no mostramos datos de tus compradores.</p>
              </div>
              <button onClick={descargarExcel} disabled={descargando || repVentas.length === 0}
                style={{ padding: '9px 16px', background: (descargando || repVentas.length === 0) ? '#E8E4DA' : '#0E0E0E', color: (descargando || repVentas.length === 0) ? '#A8A8A8' : '#C9A961', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: (descargando || repVentas.length === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {descargando ? 'Generando…' : '⬇ Descargar Excel'}
              </button>
            </div>

            {/* Filtro de fechas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', padding: '12px 14px', background: '#FAFAF7', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 500 }}>Desde</label>
                <input type="date" value={repDesde} max={repHasta} onChange={e => setRepDesde(e.target.value)}
                  style={{ padding: '6px 9px', border: '1px solid #E8E4DA', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', color: '#2C2C2C', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 500 }}>Hasta</label>
                <input type="date" value={repHasta} min={repDesde} max={hoyStr} onChange={e => setRepHasta(e.target.value)}
                  style={{ padding: '6px 9px', border: '1px solid #E8E4DA', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', color: '#2C2C2C', outline: 'none', background: '#fff' }} />
              </div>
              <button onClick={() => cargarReporte(repDesde, repHasta)} disabled={repCargando}
                style={{ padding: '7px 16px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {repCargando ? 'Cargando…' : 'Ver'}
              </button>
            </div>

            {/* Resumen del periodo */}
            {repTotales && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                {[
                  { label: 'Ventas', valor: String(repTotales.numVentas) },
                  { label: 'Comisión total', valor: fmt(repTotales.totalComision) },
                  { label: 'Pagado', valor: fmt(repTotales.totalPagado), color: '#6A8A62' },
                  { label: 'Pendiente', valor: fmt(repTotales.totalPendiente), color: '#C9A961' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '12px', background: '#FAFAF7', borderRadius: '8px' }}>
                    <p style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px' }}>{s.label}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 600, color: s.color ?? '#0E0E0E' }}>{s.valor}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tabla de detalle */}
            {repCargando ? (
              <p style={{ textAlign: 'center', color: '#A8A8A8', fontSize: '13px', padding: '24px' }}>Cargando…</p>
            ) : repVentas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#A8A8A8', fontSize: '13px', padding: '24px' }}>No hay ventas en este periodo.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '460px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E8E4DA' }}>
                      {['Fecha', 'Pedido', 'Venta', 'Comisión', 'Estado'].map((h, i) => (
                        <th key={i} style={{ textAlign: i >= 2 && i <= 3 ? 'right' : 'left', padding: '8px 10px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {repVentas.map((v: any) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #F0EDE5' }}>
                        <td style={{ padding: '10px', fontSize: '12px', color: '#6B6B6B', whiteSpace: 'nowrap' }}>{fechaCorta(v.fecha)}</td>
                        <td style={{ padding: '10px', fontSize: '12px', color: '#6B6B6B', fontFamily: 'monospace' }}>#{String(v.pedido_id).slice(-6).toUpperCase()}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', color: '#2C2C2C' }}>{fmt(v.subtotal)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#0E0E0E', fontFamily: "'Cormorant Garamond', serif" }}>{fmt(v.comision)}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '100px', fontWeight: 500, background: v.estado === 'pagada' ? 'rgba(168,181,160,0.2)' : 'rgba(201,169,97,0.15)', color: v.estado === 'pagada' ? '#6A8A62' : '#8B7530' }}>
                            {v.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botones de gestión de cuenta */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
            <button onClick={abrirEditar}
              style={{ flex: 1, minWidth: '200px', padding: '14px 20px', background: '#fff', border: '1.5px solid #C9A961', borderRadius: '8px', color: '#8B7530', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              ✎ Editar mis datos
            </button>
            <button onClick={() => { setMostrarPass(true); setExitoPass(false); setErrorPass('') }}
              style={{ flex: 1, minWidth: '200px', padding: '14px 20px', background: '#fff', border: '1.5px solid #C9A961', borderRadius: '8px', color: '#8B7530', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              🔑 Cambiar contraseña
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#A8A8A8', marginTop: '20px' }}>
            <a href="/influencer/terminos" target="_blank" style={{ color: '#C9A961', textDecoration: 'none' }}>Términos del programa</a>
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
      {/* Modal editar datos */}
      {mostrarEditar && formDatos && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7', position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: '#0E0E0E' }}>Editar mis datos</h2>
              <button onClick={() => setMostrarEditar(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0' }}>
              <button onClick={() => { setTabEditar('personales'); setMsgDatos(''); setErrorDatos('') }}
                style={{ padding: '8px 16px', fontSize: '13px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, background: tabEditar === 'personales' ? '#0E0E0E' : 'transparent', color: tabEditar === 'personales' ? '#C9A961' : '#6B6B6B' }}>
                Personales y bancarios
              </button>
              <button onClick={() => { setTabEditar('fiscales'); setMsgDatos(''); setErrorDatos('') }}
                style={{ padding: '8px 16px', fontSize: '13px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, background: tabEditar === 'fiscales' ? '#0E0E0E' : 'transparent', color: tabEditar === 'fiscales' ? '#C9A961' : '#6B6B6B' }}>
                Datos fiscales
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {msgDatos && <div style={{ padding: '10px 14px', background: 'rgba(168,181,160,0.15)', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', color: '#6A8A62' }}>{msgDatos}</div>}
              {errorDatos && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', color: '#EF4444' }}>{errorDatos}</div>}

              {tabEditar === 'personales' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { k: 'nombre', label: 'Nombre completo' },
                    { k: 'telefono', label: 'Teléfono' },
                    { k: 'instagram', label: 'Instagram' },
                    { k: 'tiktok', label: 'TikTok' },
                    { k: 'youtube', label: 'YouTube' },
                    { k: 'facebook', label: 'Facebook' },
                    { k: 'otra_red', label: 'Otra plataforma' },
                    { k: 'seguidores', label: 'Seguidores (aprox.)' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>{f.label}</label>
                      <input value={formDatos[f.k] ?? ''} onChange={e => setCampo(f.k, e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}

                  <div style={{ height: '1px', background: '#F0EDE5', margin: '4px 0' }} />
                  <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8B5A0', fontWeight: 600 }}>Datos bancarios (SPEI)</p>
                  {[
                    { k: 'banco', label: 'Banco' },
                    { k: 'titular_cuenta', label: 'Titular de la cuenta' },
                  ].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>{f.label}</label>
                      <input value={formDatos[f.k] ?? ''} onChange={e => setCampo(f.k, e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>CLABE (18 dígitos)</label>
                    <input value={formDatos.clabe ?? ''} maxLength={18} onChange={e => setCampo('clabe', e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <button onClick={guardarPersonales} disabled={guardandoDatos}
                    style={{ marginTop: '8px', padding: '12px', background: guardandoDatos ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: guardandoDatos ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {guardandoDatos ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cambioFiscalPendiente ? (
                    <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#D97706', fontWeight: 600, marginBottom: '4px' }}>⏳ Tienes un cambio fiscal en revisión</p>
                      <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.6 }}>Tus datos fiscales actuales siguen vigentes mientras revisamos tu solicitud. Te avisaremos cuando se apruebe.</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '12px 14px', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: '6px' }}>
                        <p style={{ fontSize: '12px', color: '#8B7530', lineHeight: 1.6 }}>📋 Los cambios fiscales requieren revisión. Tus datos actuales siguen vigentes hasta que aprobemos la solicitud.</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>RFC</label>
                        <input value={formDatos.fiscal_rfc ?? ''} onChange={e => setCampo('fiscal_rfc', e.target.value.toUpperCase())}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>Razón social</label>
                        <input value={formDatos.fiscal_razon_social ?? ''} onChange={e => setCampo('fiscal_razon_social', e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>Régimen fiscal</label>
                        <select value={formDatos.fiscal_regimen ?? ''} onChange={e => setCampo('fiscal_regimen', e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                          <option value="">Selecciona tu régimen</option>
                          {REGIMENES.map(r => <option key={r.codigo} value={r.codigo}>{r.codigo} — {r.desc}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>Código postal fiscal</label>
                        <input value={formDatos.fiscal_cp ?? ''} onChange={e => setCampo('fiscal_cp', e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '5px', display: 'block' }}>Nueva Constancia de Situación Fiscal (PDF) *</label>
                        <p style={{ fontSize: '11px', color: '#A8A8A8', marginBottom: '8px' }}>Obligatoria. No mayor a 3 meses de antigüedad.</p>
                        {constanciaNuevaPath ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(168,181,160,0.12)', border: '1px solid rgba(168,181,160,0.4)', borderRadius: '6px' }}>
                            <span style={{ fontSize: '13px', color: '#6A8A62' }}>✓ {constanciaNuevaNombre}</span>
                            <button onClick={() => { setConstanciaNuevaPath(''); setConstanciaNuevaNombre('') }} style={{ background: 'none', border: 'none', color: '#A8A8A8', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>cambiar</button>
                          </div>
                        ) : (
                          <label style={{ display: 'block', padding: '14px', background: '#FAFAF7', border: '1px dashed #C9A961', borderRadius: '6px', textAlign: 'center', cursor: subiendoConstancia ? 'wait' : 'pointer' }}>
                            <span style={{ fontSize: '13px', color: '#8B7530' }}>{subiendoConstancia ? 'Subiendo…' : '📎 Subir constancia actualizada'}</span>
                            <input type="file" accept="application/pdf" style={{ display: 'none' }} disabled={subiendoConstancia}
                              onChange={e => { if (e.target.files?.[0]) subirConstanciaNueva(e.target.files[0]) }} />
                          </label>
                        )}
                      </div>
                      <button onClick={solicitarCambioFiscal} disabled={guardandoDatos || !constanciaNuevaPath}
                        style={{ marginTop: '4px', padding: '12px', background: (guardandoDatos || !constanciaNuevaPath) ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: (guardandoDatos || !constanciaNuevaPath) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        {guardandoDatos ? 'Enviando…' : 'Solicitar cambio fiscal'}
                      </button>
                      {!constanciaNuevaPath && <p style={{ fontSize: '11px', color: '#A8A8A8', textAlign: 'center' }}>Debes subir tu constancia actualizada para solicitar el cambio.</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {mostrarPass && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.55)', backdropFilter: 'blur(4px)', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #E8E4DA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: '#0E0E0E' }}>Cambiar contraseña</h2>
              <button onClick={() => setMostrarPass(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A8', fontSize: '20px' }}>✕</button>
            </div>

            {exitoPass ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
                <p style={{ fontSize: '14px', color: '#0E0E0E', fontWeight: 600, marginBottom: '20px' }}>Contraseña actualizada</p>
                <button onClick={() => setMostrarPass(false)} style={{ padding: '11px 28px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Entendido</button>
              </div>
            ) : (
              <>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', display: 'block' }}>Contraseña actual</label>
                    <input type="password" value={passActual} onChange={e => setPassActual(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', display: 'block' }}>Nueva contraseña</label>
                    <input type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', display: 'block' }}>Confirma la nueva contraseña</label>
                    <input type="password" value={passNueva2} onChange={e => setPassNueva2(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  {errorPass && <p style={{ fontSize: '12px', color: '#EF4444' }}>{errorPass}</p>}
                </div>
                <div style={{ padding: '0 24px 24px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => setMostrarPass(false)} style={{ flex: 1, padding: '11px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', fontSize: '13px', cursor: 'pointer', color: '#6B6B6B', fontFamily: 'inherit', fontWeight: 500 }}>Cancelar</button>
                  <button onClick={cambiarPassword} disabled={cambiandoPass}
                    style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '6px', background: cambiandoPass ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', fontSize: '13px', cursor: cambiandoPass ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    {cambiandoPass ? 'Guardando…' : 'Cambiar contraseña'}
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
