'use client'
import { useState, useEffect } from 'react'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    const saved = localStorage.getItem('vitalora-admin')
    if (saved === 'true') setAutenticado(true)
    setChecking(false)
  }, [])
  function handleLogin() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem('vitalora-admin', 'true')
      setAutenticado(true)
      setError('')
    } else {
      setError('Contraseña incorrecta')
    }
  }
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }
  if (checking) return null
  if (!autenticado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '12px', border: '1px solid #E5E5E5', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <img src="/images/logo/logo-header.png" alt="Vitalora" style={{ height: '40px', width: 'auto', display: 'block', marginBottom: '8px' }} />
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#C9A961', marginBottom: '32px' }}>PANEL DE ADMINISTRACIÓN</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Contraseña"
            style={{ width: '100%', padding: '14px 16px', border: '1px solid #DDD', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', textAlign: 'center' }}
            autoFocus
          />
          {error && <p style={{ fontSize: '13px', color: '#D33', marginBottom: '12px' }}>{error}</p>}
          <button
            onClick={handleLogin}
            style={{ width: '100%', padding: '14px', background: '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
