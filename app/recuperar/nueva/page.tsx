'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function NuevaPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const destino = searchParams.get('destino') ?? ''

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita uno nuevo.')
  }, [token])

  async function cambiar() {
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }

    setGuardando(true)
    try {
      const res = await fetch('/api/recuperar/cambiar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al cambiar la contraseña.')
      } else {
        setExito(true)
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  if (exito) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>✓</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 600, color: '#0E0E0E', marginBottom: '12px' }}>¡Contraseña actualizada!</h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '24px' }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <a href={destino === 'admin' ? "/admin" : "/cuenta"} style={{ display: 'inline-block', padding: '12px 28px', background: '#0E0E0E', color: '#C9A961', textDecoration: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>{destino === 'admin' ? 'Entrar al admin' : 'Iniciar sesion'}</a>
      </div>
    )
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img src="/images/logo/logo-header.png" alt="Vitalora" style={{ height: '36px', width: 'auto', marginBottom: '20px' }} />
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 600, color: '#0E0E0E', marginBottom: '8px' }}>Crea tu nueva contraseña</h1>
      </div>

      <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Nueva contraseña</label>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input type={verPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1px solid #E8E4DA', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        <button type="button" onClick={() => setVerPass(!verPass)}
          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>
          {verPass ? '🙈' : '👁️'}
        </button>
      </div>

      <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Confirma tu contraseña</label>
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input type={verPass ? 'text' : 'password'} value={password2} onChange={e => setPassword2(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') cambiar() }}
          style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1px solid #E8E4DA', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        <button type="button" onClick={() => setVerPass(!verPass)}
          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>
          {verPass ? '🙈' : '👁️'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#EF4444' }}>{error}</div>
      )}

      <button onClick={cambiar} disabled={guardando || !token}
        style={{ width: '100%', padding: '14px', background: (guardando || !token) ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: (guardando || !token) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        {guardando ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </>
  )
}

export default function NuevaPasswordPage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Italiana&display=swap');`}</style>
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'white', maxWidth: '420px', width: '100%', padding: '48px 40px', borderRadius: '4px', border: '1px solid #E8E4DA' }}>
          <Suspense fallback={<p style={{ textAlign: 'center', color: '#A8A8A8' }}>Cargando…</p>}>
            <NuevaPasswordForm />
          </Suspense>
        </div>
      </div>
    </>
  )
}
