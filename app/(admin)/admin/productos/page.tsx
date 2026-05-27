'use client'

import { useState, useEffect } from 'react'

interface Producto {
  id: number; slug: string; nombre: string; marca: string; categoria: string; tipo: string
  precio: number; precio_original: number | null; descripcion: string; ingredientes: string
  como_usar: string; como_tomar: string; tag: string; certificaciones: string[]; beneficios: string[]
  para_quien: string; advertencias: string; video_url: string; peso_g: number | null
  alto_cm: number | null; ancho_cm: number | null; largo_cm: number | null
  stock: number; sku: string | null; codigo_barras: string | null; activo: boolean
  producto_imagenes: { id: number; url: string; posicion: number }[]
  producto_videos: { id: number; youtube_url: string; titulo: string; posicion: number }[]
}

interface Marca { id: number; nombre: string; tipo: string }
interface KitComponente { producto_id: number; cantidad: number }
interface VideoItem { youtube_url: string; titulo: string }
interface ImagenExistente { id: number; url: string }

const categoriasCosmeticos = ['Sérum', 'Crema & Balm', 'Limpiador & Exfoliante', 'Tónico & Mist', 'Protector Solar', 'Cuidado de Ojos', 'Mascarillas & Parche', 'Parches para Acné', 'Labios', 'Make Up', 'Cuidado del Cabello', 'Beauty Dispositivo', 'Kits', 'Cuidado Corporal']
const categoriasSuplementos = ['Vitaminas', 'Minerales', 'Proteínas', 'Colágeno', 'Probióticos', 'Omega 3', 'Antioxidantes', 'Energía', 'Cabello y Piel', 'Digestión', 'Sueño', 'Kits']

const emptyForm = {
  nombre: '', marca: '', categoria: '', tipo: 'cosmetico', precio: '', precio_original: '',
  descripcion: '', ingredientes: '', como_usar: '', tag: '', certificaciones: '', beneficios: '',
  para_quien: '', advertencias: '', como_tomar: '', video_url: '', peso_g: '', alto_cm: '',
  ancho_cm: '', largo_cm: '', stock: '0', sku: '', codigo_barras: '',
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([])
  const [previewsNuevas, setPreviewsNuevas] = useState<string[]>([])
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenExistente[]>([])
  const [componentes, setComponentes] = useState<KitComponente[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [form, setForm] = useState(emptyForm)
  const [showNuevaMarca, setShowNuevaMarca] = useState(false)
  const [nuevaMarca, setNuevaMarca] = useState('')

  useEffect(() => { cargarProductos(); cargarMarcas() }, [])

  async function cargarProductos() {
    setLoading(true)
    const res = await fetch('/api/admin/productos')
    const data = await res.json()
    setProductos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function cargarMarcas() {
    const res = await fetch('/api/admin/marcas')
    const data = await res.json()
    setMarcas(Array.isArray(data) ? data : [])
  }

  function marcasPorTipo() {
    return marcas.filter(m => m.tipo === form.tipo || m.tipo === 'ambos').sort((a, b) => a.nombre.localeCompare(b.nombre))
  }

  async function agregarMarca() {
    if (!nuevaMarca.trim()) return
    const res = await fetch('/api/admin/marcas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nuevaMarca.trim(), tipo: form.tipo }) })
    const data = await res.json()
    if (!data.error) { await cargarMarcas(); setForm({ ...form, marca: nuevaMarca.trim() }); setNuevaMarca(''); setShowNuevaMarca(false) }
    else setMensaje('Error: ' + data.error)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleImagenes(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setImagenesNuevas(prev => [...prev, ...files])
    setPreviewsNuevas(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  function quitarImagenNueva(i: number) {
    setImagenesNuevas(prev => prev.filter((_, idx) => idx !== i))
    setPreviewsNuevas(prev => prev.filter((_, idx) => idx !== i))
  }

  async function quitarImagenExistente(imgId: number) {
    await fetch(`/api/admin/delete-image?id=${imgId}`, { method: 'DELETE' })
    setImagenesExistentes(prev => prev.filter(img => img.id !== imgId))
  }

  function generarSlug(nombre: string) {
    return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function agregarVideo() { setVideos(prev => [...prev, { youtube_url: '', titulo: '' }]) }
  function actualizarVideo(i: number, field: string, value: string) { setVideos(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v)) }
  function quitarVideo(i: number) { setVideos(prev => prev.filter((_, idx) => idx !== i)) }

  function agregarComponente() { setComponentes(prev => [...prev, { producto_id: 0, cantidad: 1 }]) }
  function actualizarComponente(i: number, field: string, value: any) { setComponentes(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c)) }
  function quitarComponente(i: number) { setComponentes(prev => prev.filter((_, idx) => idx !== i)) }

  const productosIndividuales = productos.filter(p => p.categoria !== 'Kits' && p.id !== editingId)

  function calcularStockKit(comps: KitComponente[]) {
    if (comps.length === 0) return 0
    const stocks = comps.map(c => { const prod = productos.find(p => p.id === c.producto_id); return prod ? Math.floor(prod.stock / c.cantidad) : 0 })
    return Math.min(...stocks)
  }

  function abrirEdicion(p: Producto) {
    setEditingId(p.id)
    setForm({
      nombre: p.nombre, marca: p.marca, categoria: p.categoria, tipo: p.tipo,
      precio: String(p.precio), precio_original: p.precio_original ? String(p.precio_original) : '',
      descripcion: p.descripcion || '', ingredientes: p.ingredientes || '',
      como_usar: p.como_usar || '', tag: p.tag || '',
      certificaciones: (p.certificaciones || []).join(', '), beneficios: (p.beneficios || []).join(', '),
      para_quien: p.para_quien || '', advertencias: p.advertencias || '',
      como_tomar: p.como_tomar || '', video_url: p.video_url || '',
      peso_g: p.peso_g ? String(p.peso_g) : '', alto_cm: p.alto_cm ? String(p.alto_cm) : '',
      ancho_cm: p.ancho_cm ? String(p.ancho_cm) : '', largo_cm: p.largo_cm ? String(p.largo_cm) : '',
      stock: String(p.stock || 0), sku: p.sku || '', codigo_barras: p.codigo_barras || '',
    })
    setComponentes([])
    setVideos(p.producto_videos?.sort((a, b) => a.posicion - b.posicion).map(v => ({ youtube_url: v.youtube_url, titulo: v.titulo })) || [])
    setImagenesNuevas([])
    setPreviewsNuevas([])
    setImagenesExistentes(p.producto_imagenes?.sort((a, b) => a.posicion - b.posicion).map(img => ({ id: img.id, url: img.url })) || [])
    setShowForm(true)
  }

  function abrirNuevo() { setEditingId(null); setForm(emptyForm); setImagenesNuevas([]); setPreviewsNuevas([]); setImagenesExistentes([]); setComponentes([]); setVideos([]); setShowForm(true) }
  function cerrarForm() { setShowForm(false); setEditingId(null); setForm(emptyForm); setImagenesNuevas([]); setPreviewsNuevas([]); setImagenesExistentes([]); setComponentes([]); setVideos([]) }

  async function handleSubmit() {
    if (!form.nombre || !form.marca || !form.categoria || !form.precio) { setMensaje('Completa: nombre, marca, categoría y precio'); return }
    setSaving(true); setMensaje('')
    const esKit = form.categoria === 'Kits'
    const payload = {
      ...form, slug: generarSlug(form.nombre), precio: parseFloat(form.precio),
      precio_original: form.precio_original ? parseFloat(form.precio_original) : null,
      peso_g: form.peso_g ? parseFloat(form.peso_g) : null, alto_cm: form.alto_cm ? parseFloat(form.alto_cm) : null,
      ancho_cm: form.ancho_cm ? parseFloat(form.ancho_cm) : null, largo_cm: form.largo_cm ? parseFloat(form.largo_cm) : null,
      stock: esKit ? calcularStockKit(componentes) : (parseInt(form.stock) || 0),
      certificaciones: form.certificaciones ? form.certificaciones.split(',').map(s => s.trim()) : [],
      beneficios: form.beneficios ? form.beneficios.split(',').map(s => s.trim()) : [],
      componentes: esKit ? componentes.filter(c => c.producto_id > 0) : [],
      videos: videos.filter(v => v.youtube_url && v.titulo),
    }
    try {
      let producto: any
      if (editingId) {
        const res = await fetch('/api/admin/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) })
        producto = await res.json()
      } else {
        const res = await fetch('/api/admin/productos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        producto = await res.json()
      }
      if (producto.error) { setMensaje('Error: ' + producto.error); setSaving(false); return }

      // Subir solo imágenes nuevas
      const startPos = imagenesExistentes.length
      for (let i = 0; i < imagenesNuevas.length; i++) {
        const fd = new FormData(); fd.append('file', imagenesNuevas[i]); fd.append('producto_id', String(editingId || producto.id)); fd.append('posicion', String(startPos + i))
        await fetch('/api/admin/upload', { method: 'POST', body: fd })
      }

      setMensaje(editingId ? 'Producto actualizado' : 'Producto creado exitosamente')
      cerrarForm(); cargarProductos()
    } catch { setMensaje('Error al guardar') }
    setSaving(false)
  }

  async function eliminarProducto(id: number) {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/api/admin/productos?id=${id}`, { method: 'DELETE' }); cargarProductos()
  }

  const S: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }
  const L: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '6px', letterSpacing: '0.05em' }
  const esKit = form.categoria === 'Kits'

  return (
    <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div><h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Productos</h1><p style={{ fontSize: '14px', color: '#888', margin: 0 }}>{productos.length} registrados</p></div>
        <button onClick={() => showForm ? cerrarForm() : abrirNuevo()} style={{ padding: '12px 24px', background: showForm ? '#888' : '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{showForm ? '✕ Cerrar' : '+ Nuevo Producto'}</button>
      </div>

      {mensaje && <div style={{ padding: '12px 16px', background: mensaje.includes('Error') ? '#FEE' : '#EFE', border: `1px solid ${mensaje.includes('Error') ? '#FAA' : '#ADA'}`, borderRadius: '6px', marginBottom: '24px', fontSize: '14px', color: mensaje.includes('Error') ? '#A33' : '#3A3' }}>{mensaje}</div>}

      {showForm && (
        <div style={{ background: 'white', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '32px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111', margin: '0 0 24px' }}>{editingId ? '✏️ Editar Producto' : '+ Nuevo Producto'}</h2>

          {/* Tipo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={L}>Tipo *</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['cosmetico', 'suplemento'].map(t => (
                <button key={t} onClick={() => setForm({ ...form, tipo: t, marca: '', categoria: '' })} style={{ padding: '10px 24px', border: '1px solid', borderColor: form.tipo === t ? '#111' : '#DDD', borderRadius: '8px', background: form.tipo === t ? '#111' : 'white', color: form.tipo === t ? 'white' : '#333', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit' }}>{t === 'cosmetico' ? '✦ Cosmético' : '🌿 Suplemento'}</button>
              ))}
            </div>
          </div>

          {/* SKU, Código barras */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div><label style={L}>SKU *</label><input name="sku" value={form.sku} onChange={handleChange} placeholder="VIT-COL-001" style={S} /></div>
            <div><label style={L}>Código de barras (opcional)</label><input name="codigo_barras" value={form.codigo_barras} onChange={handleChange} placeholder="7501234567890" style={S} /></div>
          </div>

          {/* Nombre, Marca, Categoría */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div><label style={L}>Nombre *</label><input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Hydra Glow Essence" style={S} /></div>
            <div>
              <label style={L}>Marca *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select name="marca" value={form.marca} onChange={handleChange} style={{ ...S, flex: 1 }}><option value="">Selecciona...</option>{marcasPorTipo().map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}</select>
                <button onClick={() => setShowNuevaMarca(!showNuevaMarca)} style={{ padding: '0 12px', background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>+</button>
              </div>
              {showNuevaMarca && <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}><input value={nuevaMarca} onChange={e => setNuevaMarca(e.target.value)} placeholder="Nueva marca..." style={{ ...S, flex: 1 }} /><button onClick={agregarMarca} style={{ padding: '8px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Agregar</button></div>}
            </div>
            <div><label style={L}>Categoría *</label><select name="categoria" value={form.categoria} onChange={handleChange} style={S}><option value="">Selecciona...</option>{(form.tipo === 'cosmetico' ? categoriasCosmeticos : categoriasSuplementos).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>

          {/* Precios, Stock, Tag */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div><label style={L}>Precio MXN *</label><input name="precio" value={form.precio} onChange={handleChange} type="number" placeholder="520" style={S} /></div>
            <div><label style={L}>Precio original</label><input name="precio_original" value={form.precio_original} onChange={handleChange} type="number" placeholder="650" style={S} /><p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>Se muestra tachado</p></div>
            <div><label style={L}>{esKit ? 'Stock (auto)' : 'Stock'}</label><input name="stock" value={esKit ? String(calcularStockKit(componentes)) : form.stock} onChange={handleChange} type="number" style={S} disabled={esKit} /></div>
            <div><label style={L}>Tag</label><input name="tag" value={form.tag} onChange={handleChange} placeholder="Best Seller, Nuevo..." style={S} /></div>
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: '16px' }}><label style={L}>Descripción</label><textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} style={{ ...S, resize: 'vertical' }} /></div>

          {/* Ingredientes y Cómo usar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div><label style={L}>Ingredientes</label><textarea name="ingredientes" value={form.ingredientes} onChange={handleChange} rows={3} style={{ ...S, resize: 'vertical' }} /></div>
            <div><label style={L}>{form.tipo === 'cosmetico' ? 'Cómo usar' : 'Cómo tomar'}</label><textarea name={form.tipo === 'cosmetico' ? 'como_usar' : 'como_tomar'} value={form.tipo === 'cosmetico' ? form.como_usar : form.como_tomar} onChange={handleChange} rows={3} style={{ ...S, resize: 'vertical' }} /></div>
          </div>

          {/* Suplemento extras */}
          {form.tipo === 'suplemento' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div><label style={L}>Beneficios (coma)</label><textarea name="beneficios" value={form.beneficios} onChange={handleChange} rows={2} style={{ ...S, resize: 'vertical' }} /></div>
              <div><label style={L}>Certificaciones (coma)</label><input name="certificaciones" value={form.certificaciones} onChange={handleChange} style={S} /></div>
              <div><label style={L}>Para quién</label><textarea name="para_quien" value={form.para_quien} onChange={handleChange} rows={2} style={{ ...S, resize: 'vertical' }} /></div>
              <div><label style={L}>Advertencias</label><textarea name="advertencias" value={form.advertencias} onChange={handleChange} rows={2} style={{ ...S, resize: 'vertical' }} /></div>
            </div>
          )}

          {/* Kit componentes */}
          {esKit && (
            <div style={{ marginBottom: '16px', padding: '20px', background: '#F9F9F5', borderRadius: '8px', border: '1px solid #E5E5D5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ ...L, margin: 0 }}>📦 Componentes del Kit</label>
                <button onClick={agregarComponente} style={{ padding: '6px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Agregar</button>
              </div>
              {componentes.length === 0 ? <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Agrega productos del kit</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {componentes.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <select value={c.producto_id} onChange={e => actualizarComponente(i, 'producto_id', parseInt(e.target.value))} style={{ ...S, flex: 2 }}><option value={0}>Selecciona...</option>{productosIndividuales.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.marca} — {p.nombre} (Stock: {p.stock})</option>)}</select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><label style={{ fontSize: '12px', color: '#888' }}>Cant:</label><input type="number" min={1} value={c.cantidad} onChange={e => actualizarComponente(i, 'cantidad', parseInt(e.target.value) || 1)} style={{ ...S, width: '60px' }} /></div>
                      <button onClick={() => quitarComponente(i)} style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#FEE', border: '1px solid #FAA', color: '#A33', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                  <div style={{ marginTop: '8px', padding: '10px', background: '#EFE', borderRadius: '6px', fontSize: '13px', color: '#3A3' }}>Stock kit: <strong>{calcularStockKit(componentes)}</strong></div>
                </div>
              )}
            </div>
          )}

          {/* Dimensiones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div><label style={L}>Peso (g)</label><input name="peso_g" value={form.peso_g} onChange={handleChange} type="number" style={S} /></div>
            <div><label style={L}>Alto (cm)</label><input name="alto_cm" value={form.alto_cm} onChange={handleChange} type="number" style={S} /></div>
            <div><label style={L}>Ancho (cm)</label><input name="ancho_cm" value={form.ancho_cm} onChange={handleChange} type="number" style={S} /></div>
            <div><label style={L}>Largo (cm)</label><input name="largo_cm" value={form.largo_cm} onChange={handleChange} type="number" style={S} /></div>
          </div>

          {/* Videos YouTube */}
          <div style={{ marginBottom: '20px', padding: '20px', background: '#F5F5FF', borderRadius: '8px', border: '1px solid #E0E0F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ ...L, margin: 0 }}>🎬 Videos YouTube</label>
              <button onClick={agregarVideo} style={{ padding: '6px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Agregar video</button>
            </div>
            {videos.length === 0 ? <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Sin videos</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {videos.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input value={v.titulo} onChange={e => actualizarVideo(i, 'titulo', e.target.value)} placeholder="Título" style={{ ...S, flex: 1 }} />
                    <input value={v.youtube_url} onChange={e => actualizarVideo(i, 'youtube_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ ...S, flex: 2 }} />
                    <button onClick={() => quitarVideo(i)} style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#FEE', border: '1px solid #FAA', color: '#A33', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Imágenes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={L}>Imágenes del producto</label>

            {/* Imágenes existentes */}
            {imagenesExistentes.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Imágenes actuales — click en ✕ para eliminar de Supabase:</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {imagenesExistentes.map(img => (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <img src={img.url} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #DDD', background: 'white' }} />
                      <button onClick={() => quitarImagenExistente(img.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agregar nuevas */}
            <input type="file" accept="image/*" multiple onChange={handleImagenes} style={{ marginBottom: '12px' }} />
            {previewsNuevas.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {previewsNuevas.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #4A4', background: 'white' }} />
                    <button onClick={() => quitarImagenNueva(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✕</button>
                    <div style={{ position: 'absolute', bottom: '4px', left: '4px', padding: '2px 6px', background: '#4A4', color: 'white', fontSize: '9px', borderRadius: '3px' }}>Nueva</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSubmit} disabled={saving} style={{ padding: '14px 32px', background: saving ? '#888' : '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Guardando...' : editingId ? '✦ Guardar Cambios' : '✦ Crear Producto'}</button>
            <button onClick={cerrarForm} style={{ padding: '14px 24px', background: 'none', border: '1px solid #DDD', borderRadius: '8px', fontSize: '14px', color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Cargando...</p> : productos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888', background: 'white', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div><p>No hay productos todavía</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {productos.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'white', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '1px solid #EEE' }}>
                {p.producto_imagenes?.[0] ? <img src={p.producto_imagenes[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '24px', color: '#CCC' }}>V</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>{p.nombre}</span>
                  {p.tag && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#F5F0E8', borderRadius: '4px', color: '#888' }}>{p.tag}</span>}
                  {p.categoria === 'Kits' && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#E8F0E8', borderRadius: '4px', color: '#3A3' }}>📦 Kit</span>}
                  {p.producto_videos?.length > 0 && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#F0F0FF', borderRadius: '4px', color: '#55A' }}>🎬 {p.producto_videos.length}</span>}
                  {p.producto_imagenes?.length > 0 && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#FFF5E5', borderRadius: '4px', color: '#A85' }}>📷 {p.producto_imagenes.length}</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>{p.sku && <span style={{ color: '#666', marginRight: '8px' }}>[{p.sku}]</span>}{p.marca} · {p.categoria}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {p.precio_original && p.precio_original > p.precio && <div style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>${p.precio_original.toLocaleString()}</div>}
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>${p.precio.toLocaleString()}</div>
              </div>
              <div style={{ fontSize: '12px', color: p.stock > 0 ? '#3A3' : '#A33', flexShrink: 0 }}>Stock: {p.stock}</div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => abrirEdicion(p)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#111', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Editar</button>
                <button onClick={() => eliminarProducto(p.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#A33', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
