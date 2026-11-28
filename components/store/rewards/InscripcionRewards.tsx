'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore, fetchCliente } from '@/store/authStore'
import TarjetaCodigo from '@/components/store/rewards/TarjetaCodigo'
import CampoContrasena from '@/components/store/CampoContrasena'

// Mismas opciones que COMO_SE_ENTERO en lib/rewards.ts (el servidor las vuelve a revisar).
const OPCIONES_COMO_SE_ENTERO = ['Instagram', 'TikTok', 'Facebook', 'Recomendación de un amigo', 'Google', 'Otro']

const S: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box', color: '#111' }
const L: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '6px', letterSpacing: '0.05em' }
const BOTON: React.CSSProperties = { width: '100%', padding: '16px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '4px', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

// Inscripción en la página /rewards. Tres caminos:
//  1) con sesión → formulario de Rewards
//  2) con cuenta, sin sesión → "Iniciar sesión" y luego el formulario
//  3) sin cuenta → "Crear cuenta" y luego el formulario
// `codigo`: undefined = cargando, null = no es miembro, string = ya es miembro.
export default function InscripcionRewards({ codigo, onInscrito, isMobile }: {
  codigo: string | null | undefined
  onInscrito: (codigo: string) => void
  isMobile: boolean
}) {
  const user = useAuthStore(s => s.user)

  // Paso de cuenta
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [cuenta, setCuenta] = useState({ email: '', password: '', passwordConfirmacion: '', nombre: '', apellido: '' })
  const [verPass, setVerPass] = useState(false)
  const [errorCuenta, setErrorCuenta] = useState('')
  const [enviandoCuenta, setEnviandoCuenta] = useState(false)

  // Paso de Rewards
  const [faltaNombre, setFaltaNombre] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', comoSeEntero: '', mayorEdad: false, aceptaTerminos: false })
  const [errorForm, setErrorForm] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recienInscrito, setRecienInscrito] = useState(false)

  // Con sesión: revisar qué falta del perfil y precargar el teléfono
  useEffect(() => {
    if (!user || codigo !== null) return
    let vigente = true
    fetchCliente('/api/cuenta/perfil').then(async res => {
      if (!res.ok || !vigente) return
      const p = await res.json()
      setFaltaNombre(!String(p.nombre || '').trim() || !String(p.apellido || '').trim())
      setForm(f => ({
        ...f,
        nombre: f.nombre || p.nombre || '',
        apellido: f.apellido || p.apellido || '',
        telefono: f.telefono || String(p.telefono || '').replace(/\D/g, '').slice(-10),
      }))
    }).catch(() => {})
    return () => { vigente = false }
  }, [user?.id, codigo])

  async function entrar() {
    setErrorCuenta('')
    if (!cuenta.email.trim() || !cuenta.password) { setErrorCuenta('Escribe tu correo y contraseña.'); return }
    if (modo === 'registro') {
      if (!cuenta.nombre.trim() || !cuenta.apellido.trim()) { setErrorCuenta('Escribe tu nombre y apellido.'); return }
      if (cuenta.password.length < 8) { setErrorCuenta('La contraseña debe tener al menos 8 caracteres.'); return }
      if (cuenta.password !== cuenta.passwordConfirmacion) { setErrorCuenta('Las contraseñas no coinciden. Escríbela igual en los dos campos.'); return }
    }
    setEnviandoCuenta(true)
    try {
      const res = await fetch('/api/cuenta/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: modo, ...cuenta }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) { setErrorCuenta(data.error || 'No se pudo continuar. Intenta de nuevo.'); return }
      if (modo === 'registro') setForm(f => ({ ...f, nombre: cuenta.nombre.trim(), apellido: cuenta.apellido.trim() }))
      useAuthStore.getState().setAuth(data.user) // la página carga si ya es miembro
    } catch {
      setErrorCuenta('Sin conexión. Intenta de nuevo.')
    } finally {
      setEnviandoCuenta(false)
    }
  }

  async function inscribirme() {
    setErrorForm('')
    if (faltaNombre && (!form.nombre.trim() || !form.apellido.trim())) { setErrorForm('Escribe tu nombre y apellido.'); return }
    const telefono = form.telefono.replace(/\D/g, '')
    if (telefono.length !== 10) { setErrorForm('Escribe tu teléfono a 10 dígitos.'); return }
    if (!form.comoSeEntero) { setErrorForm('Cuéntanos cómo te enteraste de Vitalora Rewards.'); return }
    if (!form.mayorEdad) { setErrorForm('Para unirte necesitas confirmar que eres mayor de 18 años.'); return }
    if (!form.aceptaTerminos) { setErrorForm('Para unirte necesitas aceptar los términos de Vitalora Rewards.'); return }

    setEnviando(true)
    try {
      const res = await fetchCliente('/api/rewards/inscripcion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, telefono }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) { setErrorForm('Tu sesión expiró. Inicia sesión de nuevo.'); return }
      if (!res.ok) { setErrorForm(data.error || 'No pudimos completar tu inscripción. Intenta de nuevo.'); return }
      setRecienInscrito(true)
      onInscrito(data.miembro.codigo)
    } catch {
      setErrorForm('Sin conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const caja: React.CSSProperties = { maxWidth: '480px', width: '100%', margin: '0 auto', background: 'white', borderRadius: '8px', border: '1px solid #E8E4DA', padding: isMobile ? '28px 20px' : '40px', boxSizing: 'border-box', textAlign: 'left' }

  // Ya es miembro
  if (user && codigo) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 600, color: '#0E0E0E', marginBottom: '6px', textAlign: 'center' }}>
          {recienInscrito ? '¡Ya eres parte de Vitalora Rewards!' : 'Ya eres parte de Vitalora Rewards'}
        </p>
        <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '20px', textAlign: 'center' }}>
          {recienInscrito ? 'Te enviamos tu código por correo. Compártelo y empieza a ganar puntos.' : 'Comparte tu código y sigue ganando puntos.'}
        </p>
        <TarjetaCodigo codigo={codigo} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/cuenta?tab=rewards" style={{ fontSize: '13px', color: '#C9A961', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.05em' }}>Ver mi Monedero →</Link>
        </div>
      </div>
    )
  }

  // Sin sesión: iniciar sesión o crear cuenta
  if (!user) {
    return (
      <div style={caja}>
        <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, margin: '0 0 20px', textAlign: 'center' }}>
          Para unirte necesitas tu cuenta Vitalora.
        </p>
        <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '1px solid #EEE' }}>
          {(['login', 'registro'] as const).map(m => (
            <button key={m} type="button" onClick={() => { setModo(m); setErrorCuenta(''); setCuenta(c => ({ ...c, passwordConfirmacion: '' })) }} style={{ flex: 1, padding: '12px 4px', border: 'none', borderBottom: modo === m ? '2px solid #0E0E0E' : '2px solid transparent', background: 'none', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: modo === m ? 600 : 400, color: modo === m ? '#0E0E0E' : '#999', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px' }}>
              {m === 'login' ? 'Ya tengo cuenta' : 'Crear cuenta'}
            </button>
          ))}
        </div>
        {modo === 'registro' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: '12px', marginBottom: '12px' }}>
            <div><label style={L} htmlFor="rw-c-nombre">Nombre</label><input id="rw-c-nombre" autoComplete="given-name" value={cuenta.nombre} onChange={e => setCuenta({ ...cuenta, nombre: e.target.value })} style={S} /></div>
            <div><label style={L} htmlFor="rw-c-apellido">Apellido</label><input id="rw-c-apellido" autoComplete="family-name" value={cuenta.apellido} onChange={e => setCuenta({ ...cuenta, apellido: e.target.value })} style={S} /></div>
          </div>
        )}
        <div style={{ marginBottom: '12px' }}>
          <label style={L} htmlFor="rw-c-email">Correo electrónico</label>
          <input id="rw-c-email" type="email" autoComplete="email" value={cuenta.email} onChange={e => setCuenta({ ...cuenta, email: e.target.value })} placeholder="correo@ejemplo.com" style={S} />
        </div>
        <div style={{ marginBottom: modo === 'registro' ? '12px' : '20px' }}>
          <CampoContrasena id="rw-c-pass" etiqueta="Contraseña" valor={cuenta.password} onCambio={v => setCuenta({ ...cuenta, password: v })}
            visible={verPass} onAlternar={() => setVerPass(v => !v)} autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            placeholder={modo === 'registro' ? 'Mínimo 8 caracteres' : ''} onEnter={modo === 'login' ? entrar : undefined} estiloEtiqueta={L} estiloInput={S} />
        </div>
        {modo === 'registro' && (
          <div style={{ marginBottom: '20px' }}>
            <CampoContrasena id="rw-c-pass2" etiqueta="Confirmar contraseña" valor={cuenta.passwordConfirmacion} onCambio={v => setCuenta({ ...cuenta, passwordConfirmacion: v })}
              visible={verPass} onAlternar={() => setVerPass(v => !v)} autoComplete="new-password" onEnter={entrar} estiloEtiqueta={L} estiloInput={S} />
          </div>
        )}
        {modo === 'login' && <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}><a href="/recuperar" style={{ fontSize: '12px', color: '#C9A961', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a></div>}
        {errorCuenta && <p role="alert" style={{ fontSize: '13px', color: '#C33', marginBottom: '12px' }}>{errorCuenta}</p>}
        <button type="button" onClick={entrar} disabled={enviandoCuenta} style={{ ...BOTON, opacity: enviandoCuenta ? 0.6 : 1, cursor: enviandoCuenta ? 'not-allowed' : 'pointer' }}>
          {enviandoCuenta ? 'Procesando…' : modo === 'login' ? 'Iniciar sesión y continuar' : 'Crear cuenta y continuar'}
        </button>
      </div>
    )
  }

  // Con sesión, cargando si ya es miembro
  if (codigo === undefined) {
    return <div style={{ ...caja, textAlign: 'center', color: '#888', fontSize: '14px' }}>Cargando…</div>
  }

  // Con sesión: formulario de Rewards
  return (
    <div style={caja}>
      {faltaNombre && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: '12px', marginBottom: '12px' }}>
          <div><label style={L} htmlFor="rw-nombre">Nombre</label><input id="rw-nombre" autoComplete="given-name" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={S} /></div>
          <div><label style={L} htmlFor="rw-apellido">Apellido</label><input id="rw-apellido" autoComplete="family-name" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} style={S} /></div>
        </div>
      )}
      <div style={{ marginBottom: '12px' }}>
        <label style={L} htmlFor="rw-tel">Teléfono (10 dígitos)</label>
        <input id="rw-tel" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Ej. 4151234567" style={S} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={L} htmlFor="rw-como">¿Cómo te enteraste de Vitalora Rewards?</label>
        <select id="rw-como" value={form.comoSeEntero} onChange={e => setForm({ ...form, comoSeEntero: e.target.value })} style={{ ...S, color: form.comoSeEntero ? '#111' : '#999' }}>
          <option value="" disabled>Elige una opción</option>
          {OPCIONES_COMO_SE_ENTERO.map(o => <option key={o} value={o} style={{ color: '#111' }}>{o}</option>)}
        </select>
      </div>
      <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#444', lineHeight: 1.6, marginBottom: '12px', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.mayorEdad} onChange={e => setForm({ ...form, mayorEdad: e.target.checked })} style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#0E0E0E', flexShrink: 0 }} />
        Confirmo que soy mayor de 18 años.
      </label>
      <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#444', lineHeight: 1.6, marginBottom: '20px', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.aceptaTerminos} onChange={e => setForm({ ...form, aceptaTerminos: e.target.checked })} style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#0E0E0E', flexShrink: 0 }} />
        <span>Acepto los <a href="/rewards/terminos" target="_blank" style={{ color: '#C9A961', textDecoration: 'none', fontWeight: 600 }}>términos de Vitalora Rewards</a>.</span>
      </label>
      {errorForm && <p role="alert" style={{ fontSize: '13px', color: '#C33', marginBottom: '12px' }}>{errorForm}</p>}
      <button type="button" onClick={inscribirme} disabled={enviando} style={{ ...BOTON, opacity: enviando ? 0.6 : 1, cursor: enviando ? 'not-allowed' : 'pointer' }}>
        {enviando ? 'Inscribiendo…' : 'Unirme a Rewards'}
      </button>
      <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '14px' }}>Sesión iniciada como {user.email}</p>
    </div>
  )
}
