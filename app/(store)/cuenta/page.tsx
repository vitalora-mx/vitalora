'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Pedido {
  id: number; estado: string; total: number; subtotal: number; costo_envio: number
  nombre: string; apellido: string; calle: string; numero: string; ciudad: string
  estado_dir: string; cp: string; numero_guia: string | null; factura_url: string | null
  created_at: string; pedido_items: { nombre: string; marca: string; precio: number; cantidad: number }[]
}

interface Regimen { codigo: string; descripcion: string; tipo: string }

interface Direccion {
  id: number; nombre_etiqueta: string; calle: string; numero: string; interior: string
  colonia: string; ciudad: string; estado: string; cp: string; referencia: string; es_principal: boolean
}

const emptyDir = { nombre_etiqueta: 'Casa', calle: '', numero: '', interior: '', colonia: '', ciudad: '', estado: '', cp: '', referencia: '', es_principal: false }

export default function CuentaPage() {
  const isMobile = useIsMobile()
  const { user, session, perfil, setPerfil, logout, isLoggedIn } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState('perfil')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [regimenes, setRegimenes] = useState<Regimen[]>([])
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [authMode, setAuthMode] = useState<'login' | 'registro'>('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '', nombre: '', apellido: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [ayudaForm, setAyudaForm] = useState({ nombre: '', telefono: '', email: '', numeroPedido: '', mensaje: '' })
  const [ayudaEnviado, setAyudaEnviado] = useState(false)
  const [ayudaEnviando, setAyudaEnviando] = useState(false)
  const [ayudaError, setAyudaError] = useState('')

  // Direcciones
  const [showDirForm, setShowDirForm] = useState(false)
  const [editingDirId, setEditingDirId] = useState<number | null>(null)
  const [dirForm, setDirForm] = useState(emptyDir)

  const [perfilForm, setPerfilForm] = useState({
    nombre: '', apellido: '', telefono: '',
    rfc: '', razon_social: '', regimen_fiscal: '', email_facturacion: '',
    factura_misma_direccion: false,
    factura_calle: '', factura_numero: '', factura_interior: '', factura_colonia: '',
    factura_ciudad: '', factura_estado: '', factura_cp: '',
  })

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (user && session) { cargarPerfil(); cargarPedidos(); cargarRegimenes(); cargarDirecciones() } }, [user, session])

  async function cargarPerfil() {
    if (!user) return
    const res = await fetch('/api/cuenta/perfil', { headers: { 'x-user-id': user.id } })
    if (res.ok) {
      const data = await res.json()
      setPerfil(data)
      setPerfilForm({
        nombre: data.nombre || '', apellido: data.apellido || '', telefono: data.telefono || '',
        rfc: data.rfc || '', razon_social: data.razon_social || '',
        regimen_fiscal: data.regimen_fiscal || '', email_facturacion: data.email_facturacion || '',
        factura_misma_direccion: data.factura_misma_direccion || false,
        factura_calle: data.factura_calle || '', factura_numero: data.factura_numero || '',
        factura_interior: data.factura_interior || '', factura_colonia: data.factura_colonia || '',
        factura_ciudad: data.factura_ciudad || '', factura_estado: data.factura_estado || '',
        factura_cp: data.factura_cp || '',
      })
      setAyudaForm(prev => ({ ...prev, nombre: `${data.nombre || ''} ${data.apellido || ''}`.trim(), telefono: data.telefono || '', email: user.email || '' }))
    }
  }

  async function cargarPedidos() { if (!user) return; const res = await fetch('/api/cuenta/mis-pedidos', { headers: { 'x-user-id': user.id } }); if (res.ok) { const data = await res.json(); setPedidos(Array.isArray(data) ? data : []) } }
  async function cargarRegimenes() { const res = await fetch('/api/cuenta/regimenes'); if (res.ok) { const data = await res.json(); setRegimenes(Array.isArray(data) ? data : []) } }
  async function cargarDirecciones() { if (!user) return; const res = await fetch('/api/cuenta/direcciones', { headers: { 'x-user-id': user.id } }); if (res.ok) { const data = await res.json(); setDirecciones(Array.isArray(data) ? data : []) } }

  async function handleAuth() {
    setAuthLoading(true); setAuthError('')
    const res = await fetch('/api/cuenta/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: authMode, ...authForm }) })
    const data = await res.json()
    if (data.error) { setAuthError(data.error); setAuthLoading(false); return }
    useAuthStore.getState().setAuth(data.user, data.session); setAuthLoading(false)
  }

  async function guardarPerfil() {
    if (!user) return; setSaving(true); setMensaje('')
    const res = await fetch('/api/cuenta/perfil', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }, body: JSON.stringify(perfilForm) })
    const data = await res.json()
    if (data.error) setMensaje('Error: ' + data.error)
    else { setMensaje('Datos guardados'); setPerfil(data) }
    setSaving(false)
  }

  async function guardarDireccion() {
    if (!user || !dirForm.calle || !dirForm.numero || !dirForm.cp) { setMensaje('Completa calle, número y CP'); return }
    setSaving(true); setMensaje('')

    if (editingDirId) {
      await fetch('/api/cuenta/direcciones', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }, body: JSON.stringify({ id: editingDirId, ...dirForm }) })
    } else {
      // Si es la primera, hacerla principal
      const esPrimera = direcciones.length === 0
      await fetch('/api/cuenta/direcciones', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }, body: JSON.stringify({ ...dirForm, es_principal: esPrimera || dirForm.es_principal }) })
    }

    setMensaje(editingDirId ? 'Dirección actualizada' : 'Dirección agregada')
    setShowDirForm(false); setEditingDirId(null); setDirForm(emptyDir); cargarDirecciones(); setSaving(false)
  }

  async function marcarPrincipal(id: number) {
    if (!user) return
    await fetch('/api/cuenta/direcciones', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }, body: JSON.stringify({ id, es_principal: true }) })
    cargarDirecciones()
  }

  async function eliminarDireccion(id: number) {
    if (!user || !confirm('¿Eliminar esta dirección?')) return
    await fetch(`/api/cuenta/direcciones?id=${id}`, { method: 'DELETE', headers: { 'x-user-id': user.id } })
    cargarDirecciones()
  }

  function editarDireccion(d: Direccion) {
    setEditingDirId(d.id)
    setDirForm({ nombre_etiqueta: d.nombre_etiqueta, calle: d.calle, numero: d.numero, interior: d.interior || '', colonia: d.colonia || '', ciudad: d.ciudad || '', estado: d.estado || '', cp: d.cp, referencia: d.referencia || '', es_principal: d.es_principal })
    setShowDirForm(true)
  }

  async function enviarAyuda() {
    if (!ayudaForm.nombre || !ayudaForm.telefono || !ayudaForm.mensaje) { setAyudaError('Nombre, teléfono y mensaje son obligatorios'); return }
    setAyudaEnviando(true); setAyudaError('')
    const res = await fetch('/api/cuenta/ayuda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ayudaForm) })
    const data = await res.json()
    if (data.error) { setAyudaError(data.error); setAyudaEnviando(false); return }
    setAyudaEnviado(true); setAyudaEnviando(false)
  }

  function handlePerfilChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setPerfilForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  function handleDirChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target
    setDirForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  function handleLogout() { logout(); setTab('perfil') }

  if (!mounted) return null

  const S: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }
  const L: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '6px', letterSpacing: '0.05em' }

  const dirPrincipal = direcciones.find(d => d.es_principal)

  // No logueado
  if (!isLoggedIn()) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'white', borderRadius: '12px', padding: isMobile ? '28px 20px' : '48px', border: '1px solid #E5E5E5', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}><img src="/images/logo/logo-header.png" alt="Vitalora" style={{ height: '40px', width: 'auto', display: 'block' }} /></Link>
            <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'var(--gold)', marginTop: '4px' }}>WELLNESS</div>
          </div>
          <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '1px solid #EEE' }}>
            {(['login', 'registro'] as const).map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthError('') }} style={{ flex: 1, padding: '12px', border: 'none', borderBottom: authMode === m ? '2px solid var(--black)' : '2px solid transparent', background: 'none', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: authMode === m ? 600 : 400, color: authMode === m ? 'var(--black)' : '#999', cursor: 'pointer', fontFamily: 'inherit' }}>{m === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</button>
            ))}
          </div>
          {authMode === 'registro' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={L}>Nombre</label><input value={authForm.nombre} onChange={e => setAuthForm({ ...authForm, nombre: e.target.value })} style={S} /></div>
              <div><label style={L}>Apellido</label><input value={authForm.apellido} onChange={e => setAuthForm({ ...authForm, apellido: e.target.value })} style={S} /></div>
            </div>
          )}
          <div style={{ marginBottom: '12px' }}><label style={L}>Correo electrónico</label><input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="correo@ejemplo.com" style={S} /></div>
          <div style={{ marginBottom: '20px' }}><label style={L}>Contraseña</label><input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" style={S} onKeyDown={e => e.key === 'Enter' && handleAuth()} /></div>
          {authError && <p style={{ fontSize: '13px', color: '#D33', marginBottom: '12px' }}>{authError}</p>}
          <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', padding: '16px', background: authLoading ? '#888' : 'var(--black)', color: 'var(--bg-cream)', border: 'none', borderRadius: '6px', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{authLoading ? 'Procesando...' : authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</button>
          {authMode === 'registro' && <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>Al crear tu cuenta obtienes <strong style={{ color: 'var(--gold)' }}>5% de descuento</strong> en tu primera compra</p>}
          <div style={{ textAlign: 'center', marginTop: '24px' }}><Link href="/" style={{ fontSize: '12px', color: '#999', textDecoration: 'none' }}>← Volver a la tienda</Link></div>
        </div>
      </main>
    )
  }

  const estadoColor: Record<string, string> = { pendiente: '#F0A030', pagado: '#3080D0', enviado: '#6B8F6B', entregado: '#3A3', cancelado: '#D33' }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-cream)', padding: isMobile ? '24px 16px' : '40px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none' }}><img src="/images/logo/logo-header.png" alt="Vitalora" style={{ height: '32px', width: 'auto', display: 'inline-block', verticalAlign: 'middle' }} /></Link>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111', margin: '8px 0 0' }}>Mi Cuenta</h1>
            <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar Sesión</button>
        </div>

        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #DDD', marginBottom: '32px', overflowX: 'auto' }}>
          {[{ key: 'perfil', label: 'Perfil' }, { key: 'direcciones', label: 'Mis Direcciones' }, { key: 'facturacion', label: 'Facturación' }, { key: 'pedidos', label: 'Mis Pedidos' }, { key: 'ayuda', label: 'Ayuda' }].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setMensaje('') }} style={{ padding: '14px 24px', border: 'none', borderBottom: tab === t.key ? '2px solid #111' : '2px solid transparent', background: 'none', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#111' : '#999', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px', whiteSpace: 'nowrap' }}>{t.label}</button>
          ))}
        </div>

        {mensaje && <div style={{ padding: '12px 16px', background: mensaje.includes('Error') ? '#FEE' : '#EFE', border: `1px solid ${mensaje.includes('Error') ? '#FAA' : '#ADA'}`, borderRadius: '6px', marginBottom: '24px', fontSize: '14px', color: mensaje.includes('Error') ? '#A33' : '#3A3' }}>{mensaje}</div>}

        {/* PERFIL */}
        {tab === 'perfil' && (
          <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Datos Personales</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div><label style={L}>Nombre</label><input name="nombre" value={perfilForm.nombre} onChange={handlePerfilChange} style={S} /></div>
              <div><label style={L}>Apellido</label><input name="apellido" value={perfilForm.apellido} onChange={handlePerfilChange} style={S} /></div>
              <div><label style={L}>Teléfono</label><input name="telefono" value={perfilForm.telefono} onChange={handlePerfilChange} placeholder="10 dígitos" style={S} /></div>
              <div><label style={L}>Email</label><input value={user?.email || ''} disabled style={{ ...S, background: '#F5F5F5', color: '#999' }} /></div>
            </div>
            <button onClick={guardarPerfil} disabled={saving} style={{ padding: '14px 32px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        )}

        {/* MIS DIRECCIONES */}
        {tab === 'direcciones' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Mis Direcciones</h2>
              <button onClick={() => { setShowDirForm(true); setEditingDirId(null); setDirForm(emptyDir) }} style={{ padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nueva Dirección</button>
            </div>

            {/* Formulario dirección */}
            {showDirForm && (
              <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #E5E5E5', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>{editingDirId ? 'Editar Dirección' : 'Nueva Dirección'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={L}>Etiqueta</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['Casa', 'Oficina', 'Otro'].map(et => (
                        <button key={et} onClick={() => setDirForm({ ...dirForm, nombre_etiqueta: et })} style={{ padding: '8px 16px', border: '1px solid', borderColor: dirForm.nombre_etiqueta === et ? '#111' : '#DDD', borderRadius: '6px', background: dirForm.nombre_etiqueta === et ? '#111' : 'white', color: dirForm.nombre_etiqueta === et ? 'white' : '#333', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>{et}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}><label style={L}>Calle *</label><input name="calle" value={dirForm.calle} onChange={handleDirChange} style={S} /></div>
                  <div><label style={L}>Número exterior *</label><input name="numero" value={dirForm.numero} onChange={handleDirChange} style={S} /></div>
                  <div><label style={L}>Interior (opcional)</label><input name="interior" value={dirForm.interior} onChange={handleDirChange} style={S} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={L}>Colonia</label><input name="colonia" value={dirForm.colonia} onChange={handleDirChange} style={S} /></div>
                  <div><label style={L}>Ciudad</label><input name="ciudad" value={dirForm.ciudad} onChange={handleDirChange} style={S} /></div>
                  <div><label style={L}>Estado</label><input name="estado" value={dirForm.estado} onChange={handleDirChange} style={S} /></div>
                  <div><label style={L}>Código Postal *</label><input name="cp" value={dirForm.cp} onChange={handleDirChange} maxLength={5} style={S} /></div>
                  <div><label style={L}>Referencia</label><input name="referencia" value={dirForm.referencia} onChange={handleDirChange} style={S} /></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" name="es_principal" checked={dirForm.es_principal} onChange={handleDirChange} style={{ width: '18px', height: '18px', accentColor: '#111' }} />
                      <span style={{ fontSize: '14px', color: '#333' }}>Marcar como dirección principal</span>
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={guardarDireccion} disabled={saving} style={{ padding: '12px 24px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Guardando...' : editingDirId ? 'Guardar Cambios' : 'Agregar Dirección'}</button>
                  <button onClick={() => { setShowDirForm(false); setEditingDirId(null); setDirForm(emptyDir) }} style={{ padding: '12px 24px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', fontSize: '13px', color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Lista de direcciones */}
            {direcciones.length === 0 && !showDirForm ? (
              <div style={{ background: 'white', padding: isMobile ? '32px 20px' : '60px', borderRadius: '12px', border: '1px solid #E5E5E5', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📍</div>
                <p style={{ fontSize: '16px', color: '#888' }}>No tienes direcciones guardadas</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {direcciones.map(d => (
                  <div key={d.id} style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: d.es_principal ? '2px solid #111' : '1px solid #E5E5E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{d.nombre_etiqueta}</span>
                        {d.es_principal && <span style={{ fontSize: '10px', padding: '3px 10px', background: '#111', color: 'white', borderRadius: '100px', fontWeight: 600, letterSpacing: '0.05em' }}>PRINCIPAL</span>}
                      </div>
                      <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6, margin: 0 }}>
                        {d.calle} {d.numero}{d.interior ? `, Int. ${d.interior}` : ''}<br />
                        {d.colonia && `${d.colonia}, `}{d.ciudad}, {d.estado} CP {d.cp}
                        {d.referencia && <><br /><span style={{ color: '#999' }}>Ref: {d.referencia}</span></>}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {!d.es_principal && <button onClick={() => marcarPrincipal(d.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#111', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>★ Principal</button>}
                      <button onClick={() => editarDireccion(d)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#111', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Editar</button>
                      <button onClick={() => eliminarDireccion(d.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#A33', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FACTURACIÓN */}
        {tab === 'facturacion' && (
          <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Datos de Facturación</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div><label style={L}>RFC</label><input name="rfc" value={perfilForm.rfc} onChange={handlePerfilChange} placeholder="XAXX010101000" style={S} /></div>
              <div><label style={L}>Razón Social</label><input name="razon_social" value={perfilForm.razon_social} onChange={handlePerfilChange} style={S} /></div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={L}>Régimen Fiscal</label>
                <select name="regimen_fiscal" value={perfilForm.regimen_fiscal} onChange={handlePerfilChange} style={S}>
                  <option value="">Selecciona...</option>
                  {regimenes.map(r => <option key={r.codigo} value={r.codigo}>{r.codigo} — {r.descripcion}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={L}>Email para facturación</label>
                <input name="email_facturacion" value={perfilForm.email_facturacion} onChange={handlePerfilChange} placeholder={user?.email || 'correo@ejemplo.com'} style={S} />
                <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>Déjalo vacío para usar tu email de cuenta</p>
              </div>
            </div>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #EEE' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}>
                <input type="checkbox" name="factura_misma_direccion" checked={perfilForm.factura_misma_direccion} onChange={handlePerfilChange} style={{ width: '18px', height: '18px', accentColor: '#111' }} />
                <span style={{ fontSize: '14px', color: '#333' }}>Misma dirección que mi dirección principal{dirPrincipal ? ` (${dirPrincipal.nombre_etiqueta})` : ''}</span>
              </label>
              {!perfilForm.factura_misma_direccion && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: 'span 2' }}><label style={L}>Calle fiscal</label><input name="factura_calle" value={perfilForm.factura_calle} onChange={handlePerfilChange} style={S} /></div>
                  <div><label style={L}>Número</label><input name="factura_numero" value={perfilForm.factura_numero} onChange={handlePerfilChange} style={S} /></div>
                  <div><label style={L}>Interior</label><input name="factura_interior" value={perfilForm.factura_interior} onChange={handlePerfilChange} style={S} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={L}>Colonia</label><input name="factura_colonia" value={perfilForm.factura_colonia} onChange={handlePerfilChange} style={S} /></div>
                  <div><label style={L}>Ciudad</label><input name="factura_ciudad" value={perfilForm.factura_ciudad} onChange={handlePerfilChange} style={S} /></div>
                  <div><label style={L}>Estado</label><input name="factura_estado" value={perfilForm.factura_estado} onChange={handlePerfilChange} style={S} /></div>
                  <div><label style={L}>Código Postal</label><input name="factura_cp" value={perfilForm.factura_cp} onChange={handlePerfilChange} maxLength={5} style={S} /></div>
                </div>
              )}
            </div>
            <button onClick={guardarPerfil} disabled={saving} style={{ marginTop: '20px', padding: '14px 32px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Guardando...' : 'Guardar Facturación'}</button>
          </div>
        )}

        {/* PEDIDOS */}
        {tab === 'pedidos' && (
          <div>
            {pedidos.length === 0 ? (
              <div style={{ background: 'white', padding: isMobile ? '32px 20px' : '60px', borderRadius: '12px', border: '1px solid #E5E5E5', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
                <p style={{ fontSize: '16px', color: '#888', marginBottom: '16px' }}>No tienes pedidos aún</p>
                <Link href="/cosmeticos" style={{ padding: '12px 24px', background: '#111', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '13px' }}>Ir a comprar</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pedidos.map(p => (
                  <div key={p.id} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Pedido #{p.id}</span>
                        <span style={{ fontSize: '12px', color: '#888', marginLeft: '12px' }}>{new Date(p.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', background: `${estadoColor[p.estado] || '#888'}20`, color: estadoColor[p.estado] || '#888' }}>{p.estado}</span>
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#111' }}>${p.total?.toLocaleString()} MXN</span>
                      </div>
                    </div>
                    {p.pedido_items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i === 0 ? '1px solid #EEE' : 'none', fontSize: '14px' }}>
                        <span style={{ color: '#333' }}>{item.marca} — {item.nombre} <span style={{ color: '#999' }}>x{item.cantidad}</span></span>
                        <span style={{ color: '#333', fontWeight: 500 }}>${(item.precio * item.cantidad).toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #EEE' }}>
                      {p.numero_guia && <div style={{ fontSize: '12px', color: '#6B8F6B' }}>📦 Guía: <strong>{p.numero_guia}</strong></div>}
                      {p.factura_url && <a href={p.factura_url} target="_blank" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>📄 Descargar factura</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AYUDA */}
        {tab === 'ayuda' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Envíanos un mensaje</h2>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Responderemos lo más pronto posible por WhatsApp o correo.</p>
              {ayudaEnviado ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
                  <h3 style={{ fontSize: '18px', color: '#111', marginBottom: '8px' }}>Mensaje enviado</h3>
                  <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>Nos pondremos en contacto contigo pronto.</p>
                  <button onClick={() => { setAyudaEnviado(false); setAyudaForm(prev => ({ ...prev, numeroPedido: '', mensaje: '' })) }} style={{ padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Enviar otro mensaje</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}><label style={L}>Nombre *</label><input value={ayudaForm.nombre} onChange={e => setAyudaForm({ ...ayudaForm, nombre: e.target.value })} style={S} /></div>
                  <div style={{ marginBottom: '12px' }}><label style={L}>WhatsApp / Teléfono * <span style={{ color: '#D33', fontWeight: 400 }}>(obligatorio)</span></label><input value={ayudaForm.telefono} onChange={e => setAyudaForm({ ...ayudaForm, telefono: e.target.value })} placeholder="10 dígitos" style={S} /></div>
                  <div style={{ marginBottom: '12px' }}><label style={L}>Correo electrónico (opcional)</label><input type="email" value={ayudaForm.email} onChange={e => setAyudaForm({ ...ayudaForm, email: e.target.value })} style={S} /></div>
                  <div style={{ marginBottom: '12px' }}><label style={L}>Número de pedido (opcional)</label><input value={ayudaForm.numeroPedido} onChange={e => setAyudaForm({ ...ayudaForm, numeroPedido: e.target.value })} placeholder="Ej: 123" style={S} /></div>
                  <div style={{ marginBottom: '20px' }}><label style={L}>Mensaje * <span style={{ color: '#D33', fontWeight: 400 }}>(obligatorio)</span></label><textarea value={ayudaForm.mensaje} onChange={e => setAyudaForm({ ...ayudaForm, mensaje: e.target.value })} rows={5} placeholder="Describe tu duda o problema..." style={{ ...S, resize: 'vertical' }} /></div>
                  {ayudaError && <p style={{ fontSize: '13px', color: '#D33', marginBottom: '12px' }}>{ayudaError}</p>}
                  <button onClick={enviarAyuda} disabled={ayudaEnviando} style={{ width: '100%', padding: '14px', background: ayudaEnviando ? '#888' : '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: ayudaEnviando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{ayudaEnviando ? 'Enviando...' : 'Enviar mensaje'}</button>
                </>
              )}
            </div>
            <div>
              <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #E5E5E5', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '20px' }}>Contacto directo</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>📧</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Correo electrónico</div>
                    <a href="mailto:hola@vitalora.com.mx" style={{ fontSize: '14px', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>hola@vitalora.com.mx</a>
                  </div>
                </div>
              </div>
              <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '20px' }}>Horario de atención</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#555' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lunes a Viernes</span><span style={{ fontWeight: 500 }}>9:00 AM — 6:00 PM</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sábado</span><span style={{ color: '#999' }}>Cerrado</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Domingo</span><span style={{ color: '#999' }}>Cerrado</span></div>
                </div>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '16px', lineHeight: 1.6 }}>Responderemos en un máximo de 24 horas hábiles.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
