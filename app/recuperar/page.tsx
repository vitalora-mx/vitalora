'use client'

import { useState } from 'react'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function solicitar() {
    if (!email) return
    setEnviando(true)
    try {
      await fetch('/api/recuperar/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setEnviado(true)
    } catch {
      setEnviado(true) // por seguridad mostramos lo mismo
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Italiana&display=swap');`}</style>
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'white', maxWidth: '420px', width: '100%', padding: '48px 40px', borderRadius: '4px', border: '1px solid #E8E4DA' }}>

          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>✉️</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 600, color: '#0E0E0E', marginBottom: '12px' }}>Revisa tu correo</h1>
              <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7 }}>
                Si existe una cuenta con ese correo, te enviamos un enlace para crear una nueva contraseña. Revisa tu bandeja (y la carpeta de spam).
              </p>
              <a href="/cuenta" style={{ display: 'inline-block', marginTop: '24px', fontSize: '13px', color: '#C9A961', textDecoration: 'none' }}>← Volver al inicio de sesión</a>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <img src="/images/logo/logo-header.png" alt="Vitalora" style={{ height: '36px', width: 'auto', marginBottom: '20px' }} />
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 600, color: '#0E0E0E', marginBottom: '8px' }}>Recupera tu contraseña</h1>
                <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6 }}>Ingresa tu correo y te enviaremos un enlace para crear una nueva.</p>
              </div>

              <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') solicitar() }}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E4DA', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }} />

              <button onClick={solicitar} disabled={enviando || !email}
                style={{ width: '100%', padding: '14px', background: (enviando || !email) ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: (enviando || !email) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {enviando ? 'Enviando…' : 'Enviar enlace'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '20px' }}>
                <a href="/cuenta" style={{ fontSize: '13px', color: '#C9A961', textDecoration: 'none' }}>← Volver al inicio de sesión</a>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
