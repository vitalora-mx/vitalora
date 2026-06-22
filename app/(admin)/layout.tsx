'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const ICON = (path: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
)

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badgeKey?: 'pedidos' | 'resenas' | 'facturas'
}

const SECCIONES: { label: string; items: NavItem[] }[] = [
  {
    label: 'Operación',
    items: [
      { label: 'Dashboard', href: '/admin', icon: ICON('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') },
      { label: 'Pedidos', href: '/admin/pedidos', badgeKey: 'pedidos', icon: ICON('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>') },
      { label: 'Facturas', href: '/admin/facturas', badgeKey: 'facturas', icon: ICON('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>') },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { label: 'Inventario', href: '/admin/inventario', icon: ICON('<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>') },
      { label: 'Productos', href: '/admin/productos', icon: ICON('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>') },
      { label: 'Ritual', href: '/admin/ritual', icon: ICON('<path d="M12 2v20M2 12h20"/>') },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Reseñas', href: '/admin/resenas', badgeKey: 'resenas', icon: ICON('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>') },
      { label: 'Cupones', href: '/admin/codigos', icon: ICON('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
      { label: 'Influencers', href: '/admin/influencers', icon: ICON('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
    ],
  },
  {
    label: 'Personas',
    items: [
      { label: 'Clientes', href: '/admin/clientes', icon: ICON('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
    ],
  },
  {
    label: 'Contabilidad',
    items: [
      { label: 'Reportes', href: '/admin/reportes', icon: ICON('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>') },
    ],
  },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [badges, setBadges] = useState<{ pedidos: number; resenas: number; facturas: number }>({ pedidos: 0, resenas: 0, facturas: 0 })

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.alertas) setBadges({ pedidos: d.alertas.esperandoGuia || 0, resenas: d.alertas.resenasPendientes || 0, facturas: d.alertas.facturasPendientes || 0 })
      })
      .catch(() => {})
  }, [pathname])

  function esActivo(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside style={{ background: '#0E0E0E', color: 'rgba(245,240,232,0.7)', padding: '24px 0', width: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ fontFamily: "'Italiana', serif", fontSize: '24px', letterSpacing: '0.2em', color: '#F5F0E8', textAlign: 'center', padding: '0 24px 24px', borderBottom: '1px solid rgba(245,240,232,0.1)', marginBottom: '16px' }}>VITALORA</div>

      <div style={{ flex: 1 }}>
        {SECCIONES.map(sec => (
          <div key={sec.label} style={{ padding: '12px 0' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', padding: '0 24px', marginBottom: '8px' }}>{sec.label}</div>
            {sec.items.map(item => {
              const activo = esActivo(item.href)
              const badge = item.badgeKey ? badges[item.badgeKey] : 0
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', color: activo ? '#C9A961' : 'rgba(245,240,232,0.7)', background: activo ? 'rgba(201,169,97,0.08)' : 'transparent', borderLeft: activo ? '2px solid #C9A961' : '2px solid transparent', textDecoration: 'none', fontSize: '13px', fontWeight: activo ? 500 : 400, transition: 'all 0.2s' }}>
                  {item.icon}
                  <span>{item.label}</span>
                  {badge > 0 && <span style={{ marginLeft: 'auto', background: '#C9A961', color: '#0E0E0E', fontSize: '10px', padding: '1px 7px', borderRadius: '100px', fontWeight: 600 }}>{badge}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', color: 'rgba(245,240,232,0.5)', textDecoration: 'none', fontSize: '12px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Ver tienda
        </Link>
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(245,240,232,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #C9A961, #D9BE7B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Italiana', serif", color: '#0E0E0E', fontSize: '14px', flexShrink: 0 }}>V</div>
          <div>
            <div style={{ fontSize: '13px', color: '#F5F0E8', fontWeight: 500 }}>Vitalora MX</div>
            <div style={{ fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>Administradora</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const [menuAbierto, setMenuAbierto] = useState(false)

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
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="Contraseña"
            style={{ width: '100%', padding: '14px 16px', border: '1px solid #DDD', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', textAlign: 'center' }} autoFocus />
          {error && <p style={{ fontSize: '13px', color: '#D33', marginBottom: '12px' }}>{error}</p>}
          <button onClick={handleLogin} style={{ width: '100%', padding: '14px', background: '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Entrar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAF7' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Italiana&display=swap');
        @media (max-width: 900px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-bar { display: flex !important; }
          .admin-content-wrap { padding-top: 56px; }
        }
        @media (min-width: 901px) {
          .admin-mobile-bar { display: none !important; }
        }
      `}</style>

      <div className="admin-sidebar-desktop"><Sidebar /></div>

      <div className="admin-mobile-bar" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: '#0E0E0E', zIndex: 100, alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <span style={{ fontFamily: "'Italiana', serif", fontSize: '20px', letterSpacing: '0.2em', color: '#F5F0E8' }}>VITALORA</span>
        <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: 'none', border: 'none', color: '#F5F0E8', cursor: 'pointer', padding: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      {menuAbierto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMenuAbierto(false)}>
          <div onClick={e => e.stopPropagation()} style={{ marginTop: '56px' }}><Sidebar onNavigate={() => setMenuAbierto(false)} /></div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }} className="admin-content-wrap">
        {children}
      </div>
    </div>
  )
}
