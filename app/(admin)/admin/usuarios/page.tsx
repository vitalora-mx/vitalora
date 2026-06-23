'use client'
import { useState, useEffect } from 'react'

interface AdminUsuario {
  id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
  created_at: string
}

const ROLES = [
  { key: 'dueno', label: 'Dueño', desc: 'Acceso total + gestión de usuarios' },
  { key: 'gerente', label: 'Gerente', desc: 'Todo menos gestión de usuarios' },
  { key: 'editor', label: 'Editor', desc: 'Catálogo, productos, ritual, reseñas' },
  { key: 'ventas', label: 'Ventas', desc: 'Pedidos, facturas, inventario, clientes' },
]

function rolLabel(rol: string) {
  return ROLES.find(r => r.key === rol)?.label || rol
}

export default function AdminUsuariosPage() {
  const [yo, setYo] = useState<{ id: string; rol: string } | null>(null)
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [mostrarInvitar, setMostrarInvitar] = useState(false)

  // Formulario de invitación
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoRol, setNuevoRol] = useState('ventas')
  const [invitando, setInvitando] = useState(false)

  useEffect(() => {
    const guardado = localStorage.getItem('vitalora-admin-user')
    if (guardado) {
      try {
        const u = JSON.parse(guardado)
        setYo({ id: u.id, rol: u.rol })
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (yo) cargar()
  }, [yo])

  async function cargar() {
    if (!yo) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/usuarios?solicitanteId=${yo.id}`)
      const data = await res.json()
      if (data.error) setMensaje('Error: ' + data.error)
      else setUsuarios(data.usuarios || [])
    } catch {
      setMensaje('Error al cargar usuarios.')
    }
    setLoading(false)
  }

  async function invitar() {
    if (!yo) return
    if (!nuevoEmail.trim() || !nuevoNombre.trim()) {
      setMensaje('Completa el correo y el nombre.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    setInvitando(true)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteId: yo.id, email: nuevoEmail, nombre: nuevoNombre, rol: nuevoRol }),
      })
      const data = await res.json()
      if (data.error) {
        setMensaje('Error: ' + data.error)
      } else {
        setMensaje('✓ Invitación enviada por correo.')
        setNuevoEmail(''); setNuevoNombre(''); setNuevoRol('ventas')
        setMostrarInvitar(false)
        cargar()
      }
    } catch {
      setMensaje('Error al invitar.')
    }
    setInvitando(false)
    setTimeout(() => setMensaje(''), 4000)
  }

  async function cambiarRol(id: string, rol: string) {
    if (!yo) return
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteId: yo.id, id, rol }),
      })
      const data = await res.json()
      if (data.error) setMensaje('Error: ' + data.error)
      else { setMensaje('✓ Rol actualizado.'); cargar() }
    } catch {
      setMensaje('Error al cambiar rol.')
    }
    setTimeout(() => setMensaje(''), 3000)
  }

  async function toggleActivo(id: string, activo: boolean) {
    if (!yo) return
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteId: yo.id, id, activo: !activo }),
      })
      const data = await res.json()
      if (data.error) setMensaje('Error: ' + data.error)
      else { setMensaje(activo ? 'Usuario desactivado.' : 'Usuario reactivado.'); cargar() }
    } catch {
      setMensaje('Error al actualizar.')
    }
    setTimeout(() => setMensaje(''), 3000)
  }

  // Si no es dueño, no mostrar nada (el layout ya bloquea, esto es respaldo)
  if (yo && yo.rol !== 'dueno') {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#6B6B6B' }}>Solo el Dueño puede gestionar usuarios.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0E0E0E', margin: 0 }}>Usuarios del admin</h1>
        <button onClick={() => setMostrarInvitar(!mostrarInvitar)} style={{ padding: '10px 20px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          {mostrarInvitar ? 'Cancelar' : '+ Invitar usuario'}
        </button>
      </div>
      <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '6px', marginBottom: '24px', lineHeight: 1.6 }}>
        Invita a tu equipo y asígnale un rol. Cada rol ve solo las secciones que le corresponden.
      </p>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', background: mensaje.startsWith('Error') ? '#FEE2E2' : '#E8F0E5', color: mensaje.startsWith('Error') ? '#B91C1C' : '#3F6B33' }}>
          {mensaje}
        </div>
      )}

      {/* Formulario de invitación */}
      {mostrarInvitar && (
        <div style={{ background: 'white', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#0E0E0E', margin: '0 0 16px' }}>Invitar nuevo usuario</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6B6B6B', display: 'block', marginBottom: '4px' }}>Nombre completo</label>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej. María González"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6B6B6B', display: 'block', marginBottom: '4px' }}>Correo electrónico</label>
              <input type="email" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="correo@ejemplo.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6B6B6B', display: 'block', marginBottom: '4px' }}>Rol</label>
              <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' }}>
                {ROLES.filter(r => r.key !== 'dueno').map(r => (
                  <option key={r.key} value={r.key}>{r.label} — {r.desc}</option>
                ))}
              </select>
            </div>
            <button onClick={invitar} disabled={invitando} style={{ padding: '12px', background: invitando ? '#999' : '#C9A961', color: '#0E0E0E', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: invitando ? 'default' : 'pointer' }}>
              {invitando ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <p style={{ color: '#6B6B6B' }}>Cargando…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {usuarios.map(u => {
            const esYo = yo?.id === u.id
            return (
              <div key={u.id} style={{ background: 'white', border: '1px solid #E8E4DA', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', opacity: u.activo ? 1 : 0.55 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #C9A961, #D9BE7B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E0E0E', fontSize: '16px', fontWeight: 600, flexShrink: 0 }}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0E0E0E' }}>
                    {u.nombre} {esYo && <span style={{ fontSize: '11px', color: '#C9A961' }}>(tú)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{u.email}</div>
                  {!u.activo && <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '2px' }}>Desactivado</div>}
                </div>

                {/* Rol */}
                {esYo || u.rol === 'dueno' ? (
                  <span style={{ fontSize: '13px', color: '#0E0E0E', padding: '6px 12px', background: '#F5F0E8', borderRadius: '6px', fontWeight: 500 }}>{rolLabel(u.rol)}</span>
                ) : (
                  <select value={u.rol} onChange={e => cambiarRol(u.id, e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '13px', background: 'white', fontFamily: 'inherit', cursor: 'pointer' }}>
                    {ROLES.filter(r => r.key !== 'dueno').map(r => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                )}

                {/* Activar/desactivar (no para uno mismo ni para otros dueños) */}
                {!esYo && u.rol !== 'dueno' && (
                  <button onClick={() => toggleActivo(u.id, u.activo)} style={{ padding: '6px 12px', background: u.activo ? 'white' : '#0E0E0E', color: u.activo ? '#B91C1C' : '#C9A961', border: u.activo ? '1px solid #E5B4B4' : 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {u.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
