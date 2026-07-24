'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface VarianteImagen { id: number; url: string; posicion: number }
interface Variante {
  id?: number; producto_id?: number; nombre: string; tipo: string
  sku: string; codigo_barras: string; stock: string; precio: string; posicion: number
  variante_imagenes?: VarianteImagen[]
}

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

const categoriasCosmeticos = ['Sérum', 'Crema & Balm', 'Limpiador & Exfoliante', 'Tónico & Mist', 'Protector Solar', 'Cuidado de Ojos', 'Mascarillas & Parche', 'Parches para Acné', 'Labios', 'Make Up', 'Cuidado del Cabello', 'Beauty Dispositivo', 'Kits', 'Mini Kits', 'Cuidado Corporal']
const categoriasSuplementos = ['Energía y Rendimiento', 'Músculo y Recuperación', 'Control de Peso', 'Sueño y Relajación', 'Defensas e Inmunidad', 'Digestión', 'Belleza', 'Vitaminas y Minerales']

const emptyForm = {
  nombre: '', marca: '', categoria: '', tipo: 'cosmetico', precio: '', precio_original: '',
  descripcion: '', ingredientes: '', como_usar: '', tag: '', certificaciones: '', beneficios: '',
  para_quien: '', advertencias: '', como_tomar: '', video_url: '', peso_g: '', alto_cm: '',
  ancho_cm: '', largo_cm: '', stock: '0', sku: '', codigo_barras: '',
}

function EditarProductoInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idParam = searchParams.get('id')
  const editingId = idParam ? parseInt(idParam) : null

  const [productos, setProductos] = useState<Producto[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loadingInicial, setLoadingInicial] = useState(true)
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
  const [variantes, setVariantes] = useState<Variante[]>([])
  const [varianteMsg, setVarianteMsg] = useState('')

  useEffect(() => {
    async function init() {
      const [resProd, resMarcas] = await Promise.all([
        fetch('/api/admin/productos'),
        fetch('/api/admin/marcas'),
      ])
      const dataProd = await resProd.json()
      const dataMarcas = await resMarcas.json()
      const listaProd: Producto[] = Array.isArray(dataProd) ? dataProd : []
      setProductos(listaProd)
      setMarcas(Array.isArray(dataMarcas) ? dataMarcas : [])

      if (editingId) {
        const p = listaProd.find(x => x.id === editingId)
        if (p) {
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
          if (p.categoria === 'Kits') {
            try {
              const res = await fetch('/api/admin/productos/componentes?kit_id=' + p.id)
              const comps = await res.json()
              setComponentes(Array.isArray(comps) ? comps.map((c: { producto_id: number; cantidad: number }) => ({ producto_id: c.producto_id, cantidad: c.cantidad })) : [])
            } catch { setComponentes([]) }
          }
          setVideos(p.producto_videos?.sort((a, b) => a.posicion - b.posicion).map(v => ({ youtube_url: v.youtube_url, titulo: v.titulo })) || [])
          setImagenesExistentes(p.producto_imagenes?.sort((a, b) => a.posicion - b.posicion).map(img => ({ id: img.id, url: img.url })) || [])
          // Cargar variantes
          await cargarVariantes(p.id)
        }
      }
      setLoadingInicial(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  async function cargarVariantes(productoId: number) {
    try {
      const res = await fetch(`/api/admin/variantes?producto_id=${productoId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setVariantes(data.map((v: any) => ({
          id: v.id, producto_id: v.producto_id, nombre: v.nombre || '', tipo: v.tipo || '',
          sku: v.sku || '', codigo_barras: v.codigo_barras || '',
          stock: String(v.stock ?? 0), precio: v.precio != null ? String(v.precio) : '',
          posicion: v.posicion || 0,
          variante_imagenes: (v.variante_imagenes || []).sort((a: VarianteImagen, b: VarianteImagen) => a.posicion - b.posicion),
        })))
      }
    } catch { setVariantes([]) }
  }

  function marcasPorTipo() {
    return marcas.filter(m => m.tipo === form.tipo || m.tipo === 'ambos').sort((a, b) => a.nombre.localeCompare(b.nombre))
  }

  async function cargarMarcas() {
    const res = await fetch('/api/admin/marcas')
    const data = await res.json()
    setMarcas(Array.isArray(data) ? data : [])
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

  // Reordena una foto NUEVA (preview, antes de guardar). Mueve ambos arrays a la vez.
  function moverPreview(index: number, direccion: number) {
    const nuevoIndex = index + direccion
    if (nuevoIndex < 0 || nuevoIndex >= previewsNuevas.length) return
    setPreviewsNuevas(prev => {
      const arr = [...prev]
      const tmp = arr[index]; arr[index] = arr[nuevoIndex]; arr[nuevoIndex] = tmp
      return arr
    })
    setImagenesNuevas(prev => {
      const arr = [...prev]
      const tmp = arr[index]; arr[index] = arr[nuevoIndex]; arr[nuevoIndex] = tmp
      return arr
    })
  }

  // Hace que una foto NUEVA sea la principal (la mueve al inicio).
  function hacerPrincipalPreview(index: number) {
    if (index === 0) return
    setPreviewsNuevas(prev => {
      const arr = [...prev]
      const [item] = arr.splice(index, 1)
      arr.unshift(item)
      return arr
    })
    setImagenesNuevas(prev => {
      const arr = [...prev]
      const [item] = arr.splice(index, 1)
      arr.unshift(item)
      return arr
    })
  }

  async function quitarImagenExistente(imgId: number) {
    await fetch(`/api/admin/delete-image?id=${imgId}`, { method: 'DELETE' })
    setImagenesExistentes(prev => prev.filter(img => img.id !== imgId))
  }

  async function moverImagen(index: number, direccion: number) {
    const nuevoIndex = index + direccion
    if (nuevoIndex < 0 || nuevoIndex >= imagenesExistentes.length) return
    const nuevoArreglo = [...imagenesExistentes]
    const temp = nuevoArreglo[index]
    nuevoArreglo[index] = nuevoArreglo[nuevoIndex]
    nuevoArreglo[nuevoIndex] = temp
    setImagenesExistentes(nuevoArreglo)
    // Persistir el nuevo orden en Supabase
    try {
      await fetch('/api/admin/reordenar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: nuevoArreglo.map(img => img.id) }),
      })
    } catch (e) {
      console.error('Error al reordenar:', e)
    }
  }

  async function hacerPrincipal(index: number) {
    if (index === 0) return
    const nuevoArreglo = [...imagenesExistentes]
    const [elegida] = nuevoArreglo.splice(index, 1)
    nuevoArreglo.unshift(elegida)
    setImagenesExistentes(nuevoArreglo)
    try {
      await fetch('/api/admin/reordenar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: nuevoArreglo.map(img => img.id) }),
      })
    } catch (e) {
      console.error('Error al reordenar:', e)
    }
  }

  function generarSlug(nombre: string) {
    return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function agregarVideo() { setVideos(prev => [...prev, { youtube_url: '', titulo: '' }]) }
  function actualizarVideo(i: number, field: string, value: string) { setVideos(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v)) }
  function quitarVideo(i: number) { setVideos(prev => prev.filter((_, idx) => idx !== i)) }

  function agregarComponente() { setComponentes(prev => [...prev, { producto_id: 0, cantidad: 1 }]) }
  function actualizarComponente(i: number, field: string, value: number) { setComponentes(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c)) }
  function quitarComponente(i: number) { setComponentes(prev => prev.filter((_, idx) => idx !== i)) }

  // ---- VARIANTES ----
  function agregarVariante() {
    setVariantes(prev => [...prev, { nombre: '', tipo: '', sku: '', codigo_barras: '', stock: '0', precio: '', posicion: prev.length }])
  }
  function actualizarVariante(i: number, field: string, value: string) {
    setVariantes(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }
  async function guardarVariante(i: number) {
    if (!editingId) { setVarianteMsg('Primero guarda el producto'); return }
    const v = variantes[i]
    if (!v.nombre.trim()) { setVarianteMsg('La variante necesita un nombre'); return }
    setVarianteMsg('')
    const payload = {
      producto_id: editingId, nombre: v.nombre.trim(), tipo: v.tipo.trim(),
      sku: v.sku.trim(), codigo_barras: v.codigo_barras.trim(),
      stock: parseInt(v.stock) || 0,
      precio: v.precio.trim() === '' ? null : parseFloat(v.precio),
      posicion: v.posicion,
    }
    try {
      if (v.id) {
        const res = await fetch('/api/admin/variantes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: v.id, ...payload }) })
        const data = await res.json()
        if (data.error) { setVarianteMsg('Error: ' + data.error); return }
        setVarianteMsg('✓ Variante actualizada')
      } else {
        const res = await fetch('/api/admin/variantes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json()
        if (data.error) { setVarianteMsg('Error: ' + data.error); return }
        // Guardar el id devuelto en la variante local
        setVariantes(prev => prev.map((x, idx) => idx === i ? { ...x, id: data.id, producto_id: editingId, variante_imagenes: [] } : x))
        setVarianteMsg('✓ Variante guardada. Ahora puedes subir sus fotos.')
      }
    } catch { setVarianteMsg('Error al guardar variante') }
  }
  async function eliminarVariante(i: number) {
    const v = variantes[i]
    if (v.id) {
      if (!confirm('¿Eliminar esta variante y todas sus fotos?')) return
      await fetch(`/api/admin/variantes?id=${v.id}`, { method: 'DELETE' })
    }
    setVariantes(prev => prev.filter((_, idx) => idx !== i))
  }
  async function subirFotoVariante(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const v = variantes[i]
    if (!v.id) { setVarianteMsg('Guarda la variante antes de subir fotos'); return }
    const files = Array.from(e.target.files || [])
    const startPos = v.variante_imagenes?.length || 0
    for (let k = 0; k < files.length; k++) {
      const fd = new FormData()
      fd.append('file', files[k]); fd.append('variante_id', String(v.id)); fd.append('posicion', String(startPos + k))
      await fetch('/api/admin/upload-variante', { method: 'POST', body: fd })
    }
    await cargarVariantes(editingId!)
    setVarianteMsg('✓ Fotos subidas')
  }
  async function quitarFotoVariante(imgId: number) {
    await fetch(`/api/admin/upload-variante?id=${imgId}`, { method: 'DELETE' })
    await cargarVariantes(editingId!)
  }

  const productosIndividuales = productos.filter(p => p.categoria !== 'Kits' && p.id !== editingId)

  function calcularStockKit(comps: KitComponente[]) {
    if (comps.length === 0) return 0
    const stocks = comps.map(c => { const prod = productos.find(p => p.id === c.producto_id); return prod ? Math.floor(prod.stock / c.cantidad) : 0 })
    return Math.min(...stocks)
  }

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
      let producto: { id?: number; error?: string }
      if (editingId) {
        const res = await fetch('/api/admin/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) })
        producto = await res.json()
      } else {
        const res = await fetch('/api/admin/productos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        producto = await res.json()
      }
      if (producto.error) { setMensaje('Error: ' + producto.error); setSaving(false); return }

      const startPos = imagenesExistentes.length
      for (let i = 0; i < imagenesNuevas.length; i++) {
        const fd = new FormData(); fd.append('file', imagenesNuevas[i]); fd.append('producto_id', String(editingId || producto.id)); fd.append('posicion', String(startPos + i))
        await fetch('/api/admin/upload', { method: 'POST', body: fd })
      }

      setMensaje(editingId ? '✓ Producto actualizado. Puedes cerrar esta pestaña.' : '✓ Producto creado. Puedes cerrar esta pestaña.')
      setImagenesNuevas([]); setPreviewsNuevas([])
      if (!editingId && producto.id) {
        setTimeout(() => router.push('/admin/productos'), 1200)
      }
    } catch { setMensaje('Error al guardar') }
    setSaving(false)
  }

  const S: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }
  const L: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '6px', letterSpacing: '0.05em' }
  const esKit = form.categoria === 'Kits'

  if (loadingInicial) return <main style={{ padding: '60px', textAlign: 'center', color: '#888', fontFamily: 'system-ui, sans-serif' }}>Cargando...</main>

  return (
    <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', margin: 0 }}>{editingId ? '✏️ Editar Producto' : '+ Nuevo Producto'}</h1>
        <a href="/admin/productos" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>← Volver a la lista</a>
      </div>

      {mensaje && <div style={{ padding: '12px 16px', background: mensaje.includes('Error') ? '#FEE' : '#EFE', border: `1px solid ${mensaje.includes('Error') ? '#FAA' : '#ADA'}`, borderRadius: '6px', marginBottom: '24px', fontSize: '14px', color: mensaje.includes('Error') ? '#A33' : '#3A3' }}>{mensaje}</div>}

      <div style={{ background: 'white', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

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
          {imagenesExistentes.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Imágenes actuales — usa ◀ ▶ para reordenar o ★ para hacer principal · ✕ elimina:</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {imagenesExistentes.map((img, idx) => (
                    <div key={img.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={img.url} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: idx === 0 ? '2px solid #C9A961' : '1px solid #DDD', background: 'white' }} />
                        <button type="button" onClick={() => quitarImagenExistente(img.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>X</button>
                        {idx === 0 && (
                          <div style={{ position: 'absolute', bottom: '4px', left: '4px', padding: '2px 6px', background: '#C9A961', color: 'white', fontSize: '9px', borderRadius: '3px', fontWeight: 700 }}>Principal</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button type="button" onClick={() => moverImagen(idx, -1)} disabled={idx === 0} title="Mover a la izquierda" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: idx === 0 ? '#F5F5F5' : 'white', color: idx === 0 ? '#CCC' : '#333', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '12px' }}>{'<'}</button>
                        {idx !== 0 && (
                          <button type="button" onClick={() => hacerPrincipal(idx)} title="Hacer principal" style={{ padding: '0 8px', height: '24px', borderRadius: '4px', border: '1px solid #C9A961', background: 'white', color: '#8B7530', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>Principal</button>
                        )}
                        <button type="button" onClick={() => moverImagen(idx, 1)} disabled={idx === imagenesExistentes.length - 1} title="Mover a la derecha" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: idx === imagenesExistentes.length - 1 ? '#F5F5F5' : 'white', color: idx === imagenesExistentes.length - 1 ? '#CCC' : '#333', cursor: idx === imagenesExistentes.length - 1 ? 'default' : 'pointer', fontSize: '12px' }}>{'>'}</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="input-imagenes-producto" style={{ display: 'inline-block', cursor: 'pointer', padding: '12px 24px', background: 'white', border: '2px solid #C9A961', borderRadius: '6px', color: '#8B7530', fontSize: '14px', fontWeight: 600 }}>
              📎 Seleccionar imágenes
            </label>
            <input id="input-imagenes-producto" type="file" accept="image/*" multiple onChange={handleImagenes} style={{ display: 'none' }} />
            <span style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>Puedes seleccionar varias a la vez</span>
          </div>
          {previewsNuevas.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {previewsNuevas.map((src, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={src} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: i === 0 ? '2px solid #C9A961' : '1px solid #4A4', background: 'white' }} />
                      <button type="button" onClick={() => quitarImagenNueva(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>×</button>
                      <div style={{ position: 'absolute', bottom: '4px', left: '4px', padding: '2px 6px', background: i === 0 ? '#C9A961' : '#4A4', color: 'white', fontSize: '9px', borderRadius: '3px' }}>{i === 0 ? 'Principal' : 'Nueva'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button type="button" onClick={() => moverPreview(i, -1)} disabled={i === 0} title="Mover a la izquierda" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: i === 0 ? '#F5F5F5' : 'white', color: i === 0 ? '#CCC' : '#333', cursor: i === 0 ? 'default' : 'pointer', fontSize: '12px' }}>{'<'}</button>
                      {i !== 0 && (
                        <button type="button" onClick={() => hacerPrincipalPreview(i)} title="Hacer principal" style={{ padding: '0 8px', height: '24px', borderRadius: '4px', border: '1px solid #C9A961', background: 'white', color: '#8B7530', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>Principal</button>
                      )}
                      <button type="button" onClick={() => moverPreview(i, 1)} disabled={i === previewsNuevas.length - 1} title="Mover a la derecha" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: i === previewsNuevas.length - 1 ? '#F5F5F5' : 'white', color: i === previewsNuevas.length - 1 ? '#CCC' : '#333', cursor: i === previewsNuevas.length - 1 ? 'default' : 'pointer', fontSize: '12px' }}>{'>'}</button>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== VARIANTES ===== */}
        <div style={{ marginBottom: '24px', padding: '20px', background: '#FFF7F0', borderRadius: '8px', border: '1px solid #F0E0D0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...L, margin: 0 }}>🎨 Variantes (color, tamaño, etc.)</label>
            {editingId && <button onClick={agregarVariante} style={{ padding: '6px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Agregar variante</button>}
          </div>

          {!editingId ? (
            <p style={{ fontSize: '13px', color: '#A87', textAlign: 'center', padding: '12px' }}>Guarda primero el producto para poder agregar variantes.</p>
          ) : (
            <>
              <p style={{ fontSize: '12px', color: '#A87', marginBottom: '12px' }}>Si el producto tiene variantes, el cliente deberá elegir una. Deja el precio vacío para que herede el precio del producto. Guarda cada variante para subirle fotos.</p>
              {varianteMsg && <div style={{ padding: '8px 12px', background: varianteMsg.includes('Error') ? '#FEE' : '#EFE', border: `1px solid ${varianteMsg.includes('Error') ? '#FAA' : '#ADA'}`, borderRadius: '6px', marginBottom: '12px', fontSize: '13px', color: varianteMsg.includes('Error') ? '#A33' : '#3A3' }}>{varianteMsg}</div>}

              {variantes.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '8px' }}>Este producto no tiene variantes.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {variantes.map((v, i) => (
                    <div key={i} style={{ background: 'white', border: '1px solid #EEDDCC', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div><label style={L}>Nombre variante *</label><input value={v.nombre} onChange={e => actualizarVariante(i, 'nombre', e.target.value)} placeholder="Rojo, Talla M, 50ml..." style={S} /></div>
                        <div><label style={L}>Tipo</label><input value={v.tipo} onChange={e => actualizarVariante(i, 'tipo', e.target.value)} placeholder="Color, Tamaño, Sabor..." style={S} /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div><label style={L}>SKU</label><input value={v.sku} onChange={e => actualizarVariante(i, 'sku', e.target.value)} style={S} /></div>
                        <div><label style={L}>Código barras</label><input value={v.codigo_barras} onChange={e => actualizarVariante(i, 'codigo_barras', e.target.value)} style={S} /></div>
                        <div><label style={L}>Stock</label><input type="number" value={v.stock} onChange={e => actualizarVariante(i, 'stock', e.target.value)} style={S} /></div>
                        <div><label style={L}>Precio</label><input type="number" value={v.precio} onChange={e => actualizarVariante(i, 'precio', e.target.value)} placeholder="hereda" style={S} /></div>
                      </div>

                      {/* Fotos de la variante (solo si ya esta guardada) */}
                      {v.id ? (
                        <div style={{ marginBottom: '12px' }}>
                          <label style={L}>Fotos de esta variante</label>
                          {v.variante_imagenes && v.variante_imagenes.length > 0 && (
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              {v.variante_imagenes.map(img => (
                                <div key={img.id} style={{ position: 'relative' }}>
                                  <img src={img.url} alt="" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #DDD', background: 'white' }} />
                                  <button onClick={() => quitarFotoVariante(img.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <input type="file" accept="image/*" multiple onChange={e => subirFotoVariante(i, e)} style={{ fontSize: '13px' }} />
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#A87', marginBottom: '12px' }}>Guarda la variante para poder subirle fotos.</p>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => guardarVariante(i)} style={{ padding: '8px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{v.id ? 'Guardar cambios' : 'Guardar variante'}</button>
                        <button onClick={() => eliminarVariante(i)} style={{ padding: '8px 16px', background: '#FEE', border: '1px solid #FAA', color: '#A33', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '14px 32px', background: saving ? '#888' : '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Guardando...' : editingId ? '✦ Guardar Cambios' : '✦ Crear Producto'}</button>
          <a href="/admin/productos" style={{ padding: '14px 24px', background: 'none', border: '1px solid #DDD', borderRadius: '8px', fontSize: '14px', color: '#888', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Cancelar</a>
        </div>
      </div>
    </main>
  )
}

export default function EditarProductoPage() {
  return (
    <Suspense fallback={<main style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Cargando...</main>}>
      <EditarProductoInner />
    </Suspense>
  )
}
