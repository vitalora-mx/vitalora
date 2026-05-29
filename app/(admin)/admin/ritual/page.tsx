'use client'

import { useState, useEffect } from 'react'

interface Tema { id: number; nombre: string }
interface ProductoLite { id: number; nombre: string; marca: string; precio: number; tipo: string }
interface VideoProd { producto_id: number; posicion: number }
interface Video {
  id: number; slug: string; titulo: string; descripcion: string
  youtube_url: string; youtube_id: string; tema_id: number | null
  tipo: string; posicion: number | null
  ritual_temas: { nombre: string } | null
  ritual_video_productos: VideoProd[]
}

const emptyForm = { titulo: '', descripcion: '', youtube_url: '', tema_id: '', tipo: 'ambos', posicion: '' }

export default function AdminRitualPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [temas, setTemas] = useState<Tema[]>([])
  const [productos, setProductos] = useState<ProductoLite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [form, setForm] = useState(emptyForm)

  // Productos relacionados seleccionados (ids en orden)
  const [productosSel, setProductosSel] = useState<number[]>([])
  const [busquedaProd, setBusquedaProd] = useState('')

  // Nuevo tema
  const [showNuevoTema, setShowNuevoTema] = useState(false)
  const [nuevoTema, setNuevoTema] = useState('')

  useEffect(() => { cargarTodo() }, [])

  async function cargarTodo() {
    setLoading(true)
    const [rV, rT, rP] = await Promise.all([
      fetch('/api/admin/ritual-videos'),
      fetch('/api/admin/ritual-temas'),
      fetch('/api/admin/productos'),
    ])
    const dV = await rV.json()
    const dT = await rT.json()
    const dP = await rP.json()
    setVideos(Array.isArray(dV) ? dV : [])
    setTemas(Array.isArray(dT) ? dT : [])
    setProductos(Array.isArray(dP) ? dP.map((p: ProductoLite) => ({ id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio, tipo: p.tipo })) : [])
    setLoading(false)
  }

  function abrirNuevo() {
    setForm(emptyForm)
    setProductosSel([])
    setEditingId(null)
    setBusquedaProd('')
    setMensaje('')
    setShowForm(true)
  }

  function abrirEditar(v: Video) {
    setForm({
      titulo: v.titulo,
      descripcion: v.descripcion || '',
      youtube_url: v.youtube_url,
      tema_id: v.tema_id ? String(v.tema_id) : '',
      tipo: v.tipo,
      posicion: v.posicion ? String(v.posicion) : '',
    })
    const sel = (v.ritual_video_productos || [])
      .slice()
      .sort((a, b) => a.posicion - b.posicion)
      .map(r => r.producto_id)
    setProductosSel(sel)
    setEditingId(v.id)
    setBusquedaProd('')
    setMensaje('')
    setShowForm(true)
  }

  async function guardar() {
    if (!form.titulo || !form.youtube_url) { setMensaje('Faltan título o URL de YouTube'); return }
    setSaving(true)
    setMensaje('')
    const res = await fetch('/api/admin/ritual-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        ...form,
        tema_id: form.tema_id ? Number(form.tema_id) : null,
        productos: productosSel,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMensaje(data.error || 'Error al guardar'); return }
    setShowForm(false)
    cargarTodo()
  }

  async function borrar(id: number) {
    if (!confirm('¿Borrar este video?')) return
    await fetch(`/api/admin/ritual-videos?id=${id}`, { method: 'DELETE' })
    cargarTodo()
  }

  async function crearTema() {
    if (!nuevoTema.trim()) return
    const res = await fetch('/api/admin/ritual-temas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoTema }),
    })
    const data = await res.json()
    if (!res.ok) { setMensaje(data.error || 'Error al crear tema'); return }
    setNuevoTema('')
    setShowNuevoTema(false)
    const rT = await fetch('/api/admin/ritual-temas')
    const dT = await rT.json()
    setTemas(Array.isArray(dT) ? dT : [])
    setForm(f => ({ ...f, tema_id: String(data.id) }))
  }

  function toggleProducto(id: number) {
    setProductosSel(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  // Buscador inteligente: todas las palabras deben aparecer en "marca + nombre"
  const palabras = busquedaProd.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const productosFiltrados = palabras.length === 0
    ? productos.slice(0, 30)
    : productos.filter(p => {
        const texto = `${p.marca} ${p.nombre}`.toLowerCase()
        return palabras.every(w => texto.includes(w))
      })

  const productosSeleccionadosObj = productosSel
    .map(id => productos.find(p => p.id === id))
    .filter(Boolean) as ProductoLite[]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0E0E0E', margin: 0 }}>Ritual · Videos</h1>
        <button onClick={abrirNuevo} style={{ padding: '10px 20px', background: '#0E0E0E', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>+ Nuevo video</button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E8E0D5' }}>
          <thead>
            <tr style={{ background: '#F9F5F0', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B6B6B' }}>
              <th style={{ padding: '12px 16px' }}>Pos.</th>
              <th style={{ padding: '12px 16px' }}>Título</th>
              <th style={{ padding: '12px 16px' }}>Tema</th>
              <th style={{ padding: '12px 16px' }}>Tipo</th>
              <th style={{ padding: '12px 16px' }}>Productos</th>
              <th style={{ padding: '12px 16px' }}></th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>No hay videos todavía.</td></tr>
            ) : videos.map(v => (
              <tr key={v.id} style={{ borderTop: '1px solid #F5F0E8', fontSize: '14px' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: v.posicion ? 'var(--gold)' : '#CCC' }}>{v.posicion ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>{v.titulo}</td>
                <td style={{ padding: '12px 16px', color: '#6B6B6B' }}>{v.ritual_temas?.nombre || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#6B6B6B', textTransform: 'capitalize' }}>{v.tipo}</td>
                <td style={{ padding: '12px 16px', color: '#6B6B6B' }}>{v.ritual_video_productos?.length || 0}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => abrirEditar(v)} style={{ marginRight: '8px', padding: '6px 12px', background: 'none', border: '1px solid #E8E0D5', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Editar</button>
                  <button onClick={() => borrar(v.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #E8B4B4', color: '#C0392B', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '720px', width: '100%', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 24px' }}>{editingId ? 'Editar video' : 'Nuevo video'}</h2>

            {mensaje && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{mensaje}</div>}

            {/* Titulo */}
            <label style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>Título</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={inputStyle} />

            {/* URL */}
            <label style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', margin: '16px 0 6px' }}>URL de YouTube</label>
            <input value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." style={inputStyle} />

            {/* Descripcion */}
            <label style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', margin: '16px 0 6px' }}>Descripción breve</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
              {/* Tema */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>Tema</label>
                <select value={form.tema_id} onChange={e => setForm({ ...form, tema_id: e.target.value })} style={inputStyle}>
                  <option value="">Sin tema</option>
                  {temas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <button onClick={() => setShowNuevoTema(!showNuevoTema)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '12px', cursor: 'pointer', marginTop: '6px', padding: 0 }}>+ Nuevo tema</button>
                {showNuevoTema && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <input value={nuevoTema} onChange={e => setNuevoTema(e.target.value)} placeholder="Nombre" style={{ ...inputStyle, marginBottom: 0 }} />
                    <button onClick={crearTema} style={{ padding: '0 14px', background: '#0E0E0E', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>OK</button>
                  </div>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>Tipo</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                  <option value="ambos">Ambos</option>
                  <option value="cosmetico">Cosmético</option>
                  <option value="suplemento">Suplemento</option>
                </select>
              </div>

              {/* Posicion 1-20 */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>Posición (1-20)</label>
                <input type="number" min={1} max={20} value={form.posicion} onChange={e => setForm({ ...form, posicion: e.target.value })} placeholder="Top 20" style={inputStyle} />
              </div>
            </div>

            {/* Productos relacionados con buscador inteligente */}
            <label style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', margin: '24px 0 6px' }}>Productos relacionados</label>

            {/* Seleccionados */}
            {productosSeleccionadosObj.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {productosSeleccionadosObj.map(p => (
                  <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(201,169,97,0.12)', borderRadius: '100px', fontSize: '13px', color: '#0E0E0E' }}>
                    {p.marca} · {p.nombre}
                    <button onClick={() => toggleProducto(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', fontSize: '14px', padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Buscador */}
            <input value={busquedaProd} onChange={e => setBusquedaProd(e.target.value)} placeholder="Buscar producto (ej. skin1004 poremizing)" style={inputStyle} />
            <div style={{ border: '1px solid #E8E0D5', borderRadius: '6px', maxHeight: '220px', overflowY: 'auto', marginTop: '8px' }}>
              {productosFiltrados.length === 0 ? (
                <p style={{ padding: '16px', color: '#999', fontSize: '13px', margin: 0 }}>Sin resultados.</p>
              ) : productosFiltrados.map(p => {
                const sel = productosSel.includes(p.id)
                return (
                  <button key={p.id} onClick={() => toggleProducto(p.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: 'none', borderBottom: '1px solid #F5F0E8', background: sel ? 'rgba(201,169,97,0.08)' : 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', textAlign: 'left' }}>
                    <div style={{ width: '18px', height: '18px', border: '1.5px solid', borderColor: sel ? 'var(--gold)' : '#D9D2C4', borderRadius: '3px', background: sel ? 'var(--gold)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ color: 'var(--gold)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>{p.marca}</span>
                    <span style={{ color: '#0E0E0E' }}>{p.nombre}</span>
                    <span style={{ marginLeft: 'auto', color: '#6B6B6B' }}>${p.precio.toLocaleString()}</span>
                  </button>
                )
              })}
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: 'none', border: '1px solid #E8E0D5', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ padding: '10px 24px', background: '#0E0E0E', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #E8E0D5', borderRadius: '6px',
  fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
