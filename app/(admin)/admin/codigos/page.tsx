'use client'

import { useState, useEffect } from 'react'

interface Codigo {
  id: number; codigo: string; tipo: string; valor: number; minimo_compra: number
  max_usos: number | null; usos_actuales: number; fecha_inicio: string
  fecha_fin: string | null; activo: boolean
}

export default function AdminCodigosPage() {
  const [codigos, setCodigos] = useState<Codigo[]>([])
  const [influencersLista, setInfluencersLista] = useState<{ id: number; nombre: string; codigo: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [form, setForm] = useState({
    codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '', influencer_id: '',
  })

  useEffect(() => { cargar(); cargarInfluencers() }, [])

  async function cargarInfluencers() {
    try {
      const res = await fetch('/api/admin/influencers')
      const data = await res.json()
      const lista = (data.influencers || []).filter((i: any) => i.estado === 'aprobado')
      setInfluencersLista(lista.map((i: any) => ({ id: i.id, nombre: i.nombre, codigo: i.codigo })))
    } catch {}
  }

  async function cargar() {
    setLoading(true)
    const res = await fetch('/api/admin/codigos')
    const data = await res.json()
    setCodigos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function crear() {
    if (!form.codigo || !form.valor) { setMensaje('Código y valor son obligatorios'); return }
    setSaving(true)
    const res = await fetch('/api/admin/codigos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        valor: parseFloat(form.valor),
        minimo_compra: form.minimo_compra ? parseFloat(form.minimo_compra) : 0,
        max_usos: form.max_usos ? parseInt(form.max_usos) : null,
        fecha_fin: form.fecha_fin || null,
        descuento_envio: form.descuento_envio || 'ninguno',
        envio_precio_fijo: form.descuento_envio === 'fijo' && form.envio_precio_fijo ? parseFloat(form.envio_precio_fijo) : 0,
        ciudad_restringida: form.ciudad_restringida ? form.ciudad_restringida.trim() : null,
        influencer_id: form.influencer_id ? parseInt(form.influencer_id) : null,
        es_influencer: form.influencer_id ? true : false,
      }),
    })
    const data = await res.json()
    if (data.error) setMensaje('Error: ' + data.error)
    else { setMensaje('Código creado'); setShowForm(false); setForm({ codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '', influencer_id: '' }); cargar() }
    setSaving(false); setTimeout(() => setMensaje(''), 3000)
  }

  async function toggleActivo(id: number, activo: boolean) {
    await fetch('/api/admin/codigos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, activo: !activo }) })
    cargar()
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este código?')) return
    await fetch(`/api/admin/codigos?id=${id}`, { method: 'DELETE' })
    cargar()
  }

  const S: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }
  const L: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '6px', letterSpacing: '0.05em' }

  return (
    <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Códigos de Descuento</h1>
          <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>{codigos.length} códigos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '12px 24px', background: showForm ? '#888' : '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{showForm ? '✕ Cerrar' : '+ Nuevo Código'}</button>
      </div>

      {mensaje && <div style={{ padding: '12px 16px', background: mensaje.includes('Error') ? '#FEE' : '#EFE', border: `1px solid ${mensaje.includes('Error') ? '#FAA' : '#ADA'}`, borderRadius: '6px', marginBottom: '24px', fontSize: '14px', color: mensaje.includes('Error') ? '#A33' : '#3A3' }}>{mensaje}</div>}

      {showForm && (
        <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E5E5', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Nuevo Código</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={L}>Código *</label>
              <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="Ej: BIENVENIDO10" style={{ ...S, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em' }} />
            </div>
            <div>
              <label style={L}>Tipo *</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={S}>
                <option value="porcentaje">% Porcentaje</option>
                <option value="monto_fijo">$ Monto fijo</option>
              </select>
            </div>
            <div>
              <label style={L}>Valor * {form.tipo === 'porcentaje' ? '(%)' : '(MXN)'}</label>
              <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder={form.tipo === 'porcentaje' ? 'Ej: 10' : 'Ej: 100'} style={S} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={L}>Compra mínima (MXN)</label>
              <input type="number" value={form.minimo_compra} onChange={e => setForm({ ...form, minimo_compra: e.target.value })} placeholder="0 = sin mínimo" style={S} />
            </div>
            <div>
              <label style={L}>Descuento de envío</label>
              <select value={form.descuento_envio} onChange={e => setForm({ ...form, descuento_envio: e.target.value })} style={S}>
                <option value="ninguno">Ninguno (envío normal)</option>
                <option value="gratis">Envío gratis</option>
                <option value="fijo">Precio fijo</option>
              </select>
            </div>
            {form.descuento_envio === 'fijo' && (
              <div>
                <label style={L}>Precio fijo de envío (MXN)</label>
                <input type="number" value={form.envio_precio_fijo} onChange={e => setForm({ ...form, envio_precio_fijo: e.target.value })} placeholder="Ej: 49" style={S} />
              </div>
            )}
            <div>
              <label style={L}>Restringir a ciudad (opcional)</label>
              <input type="text" value={form.ciudad_restringida} onChange={e => setForm({ ...form, ciudad_restringida: e.target.value })} placeholder="Ej: Irapuato — vacío = todo México" style={S} />
            </div>
            <div>
              <label style={L}>Asignar a influencer (opcional)</label>
              <select value={form.influencer_id} onChange={e => setForm({ ...form, influencer_id: e.target.value })} style={S}>
                <option value="">Ninguno (código general)</option>
                {influencersLista.map(inf => (
                  <option key={inf.id} value={inf.id}>{inf.nombre}{inf.codigo ? ' — ' + inf.codigo : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={L}>Máximo de usos</label>
              <input type="number" value={form.max_usos} onChange={e => setForm({ ...form, max_usos: e.target.value })} placeholder="Vacío = ilimitado" style={S} />
            </div>
            <div>
              <label style={L}>Fecha de expiración</label>
              <input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} style={S} />
            </div>
          </div>
          <button onClick={crear} disabled={saving} style={{ padding: '12px 24px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Creando...' : '✦ Crear Código'}</button>
        </div>
      )}

      {loading ? <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Cargando...</p> : codigos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888', background: 'white', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏷️</div>
          <p>No hay códigos de descuento</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {codigos.map(c => {
            const expirado = c.fecha_fin && new Date(c.fecha_fin) < new Date()
            const agotado = c.max_usos && c.usos_actuales >= c.max_usos
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'white', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                <div style={{ padding: '8px 16px', background: c.activo && !expirado && !agotado ? '#111' : '#EEE', borderRadius: '6px', fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, letterSpacing: '0.15em', color: c.activo && !expirado && !agotado ? 'white' : '#999' }}>{c.codigo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>
                    {c.tipo === 'porcentaje' ? `${c.valor}% de descuento` : `$${c.valor} MXN de descuento`}
                    {c.minimo_compra > 0 && <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>· Min. ${c.minimo_compra.toLocaleString()}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    Usos: {c.usos_actuales}{c.max_usos ? `/${c.max_usos}` : ' (ilimitado)'}
                    {c.fecha_fin && <span> · Expira: {new Date(c.fecha_fin).toLocaleDateString('es-MX')}</span>}
                    {expirado && <span style={{ color: '#D33', marginLeft: '8px' }}>EXPIRADO</span>}
                    {agotado && <span style={{ color: '#D33', marginLeft: '8px' }}>AGOTADO</span>}
                  </div>
                </div>
                <button onClick={() => toggleActivo(c.id, c.activo)} style={{ padding: '6px 14px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', color: c.activo ? '#3A3' : '#A33' }}>{c.activo ? '✓ Activo' : '✕ Inactivo'}</button>
                <button onClick={() => eliminar(c.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#A33', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
