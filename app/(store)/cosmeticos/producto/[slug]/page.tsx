'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import CosmeticosHeader from '@/components/store/cosmeticos/CosmeticosHeader'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { useCartStore } from '@/store/cartStore'

interface Producto {
  id: number; slug: string; nombre: string; marca: string; categoria: string
  precio: number; precio_original: number | null; tag: string; descripcion: string
  ingredientes: string; como_usar: string; video_url: string; stock: number
  seo_title: string | null; seo_description: string | null
  producto_imagenes: { id: number; url: string; posicion: number }[]
}

export default function ProductoCosmeticoPage() {
  const params = useParams()
  const slug = params.slug as string
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [seleccionada, setSeleccionada] = useState(0)
  const [tabActiva, setTabActiva] = useState('Descripción')
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { agregarItem } = useCartStore()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function cargar() {
      const res = await fetch(`/api/tienda/productos?slug=${slug}`)
      if (res.ok) {
        const data = await res.json()
        setProducto(data)
        // SEO dinámico
        const title = data.seo_title || `${data.nombre} — ${data.marca} | Vitalora K-Beauty México`
        const desc = data.seo_description || `${data.descripcion?.slice(0, 155) || data.nombre}. Envío a todo México. Compra en Vitalora.`
        document.title = title
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) metaDesc.setAttribute('content', desc)
        else { const m = document.createElement('meta'); m.name = 'description'; m.content = desc; document.head.appendChild(m) }
        // Open Graph
        function setOG(prop: string, content: string) {
          let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement
          if (el) el.content = content
          else { el = document.createElement('meta') as HTMLMetaElement; el.setAttribute('property', prop); el.content = content; document.head.appendChild(el) }
        }
        setOG('og:title', title)
        setOG('og:description', desc)
        setOG('og:type', 'product')
        setOG('og:url', `https://vitalora.com.mx/cosmeticos/producto/${data.slug}`)
        if (data.producto_imagenes?.[0]?.url) setOG('og:image', data.producto_imagenes[0].url)
      }
      setLoading(false)
    }
    if (slug) cargar()
  }, [slug])

  if (!mounted) return null

  if (loading) return (
    <main style={{ background: 'white' }}>
      <CosmeticosHeader />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontSize: '16px' }}>Cargando producto...</p>
      </div>
      <Footer />
    </main>
  )

  if (!producto) return (
    <main style={{ background: 'white' }}>
      <CosmeticosHeader />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>✦</div>
        <p style={{ color: '#888', fontSize: '16px' }}>Producto no encontrado</p>
      </div>
      <Footer />
    </main>
  )

  const imagenes = producto.producto_imagenes?.sort((a, b) => a.posicion - b.posicion) || []
  const agotado = producto.stock <= 0

  function handleAgregar() {
    if (!producto || agotado) return
    for (let i = 0; i < cantidad; i++) {
      agregarItem({
        id: producto.id,
        slug: producto.slug,
        nombre: producto.nombre,
        marca: producto.marca,
        precio: producto.precio,
        imagen: imagenes[0]?.url || '',
        tipo: 'cosmetico',
      })
    }
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  const tabs = ['Descripción', 'Ingredientes', 'Cómo usar', 'Reseñas']

  return (
    <main style={{ background: 'white' }}>
      <CosmeticosHeader />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '80px' }}>

          {/* Galería */}
          <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '600px' }}>
            {imagenes.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                {imagenes.map((img, i) => (
                  <button key={img.id} onClick={() => setSeleccionada(i)}
                    style={{ width: '72px', height: '72px', border: '2px solid', borderColor: seleccionada === i ? 'var(--gold)' : '#E8E0D5', borderRadius: '4px', cursor: 'pointer', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, aspectRatio: '1 / 1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: '#F5F0E8' }}>
              {producto.tag && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '6px 14px', background: 'var(--gold)', color: 'white', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '2px', zIndex: 2 }}>{producto.tag}</div>
              )}
              {agotado && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 14px', background: '#D33', color: 'white', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '2px', zIndex: 2 }}>Agotado</div>
              )}
              {imagenes[seleccionada] ? (
                <img src={imagenes[seleccionada].url} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: agotado ? 0.5 : 1 }} />
              ) : (
                <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '80px', color: 'rgba(0,0,0,0.1)' }}>V</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>{producto.marca}</span>
              <span style={{ color: '#D9D2C4' }}>·</span>
              <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{producto.categoria}</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, letterSpacing: '0.02em', color: 'var(--black)' }}>{producto.nombre}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--gold)', fontSize: '16px', letterSpacing: '2px' }}>★★★★★</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>4.9 · 142 reseñas</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              {producto.precio_original && producto.precio_original > producto.precio && (
                <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', color: '#999', textDecoration: 'line-through' }}>${producto.precio_original.toLocaleString()}</span>
              )}
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '40px', fontWeight: 600, color: 'var(--black)' }}>${producto.precio.toLocaleString()} MXN</span>
            </div>

            <div style={{ height: '1px', background: 'var(--line)' }} />

            {producto.descripcion && (
              <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-muted)' }}>{producto.descripcion.split('.')[0]}.</p>
            )}

            {/* Cantidad */}
            {!agotado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cantidad</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: '2px' }}>
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>{cantidad}</span>
                  <button onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            )}

            {/* Botón agregar o agotado */}
            {agotado ? (
              <div style={{ padding: '20px', background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '2px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, color: '#999', marginBottom: '8px' }}>Producto agotado</div>
                <p style={{ fontSize: '12px', color: '#AAA', margin: 0 }}>Este producto no está disponible por el momento</p>
              </div>
            ) : (
              <button onClick={handleAgregar}
                style={{ padding: '20px', background: agregado ? 'var(--sage-deep)' : 'var(--black)', color: 'var(--bg-cream)', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.3s', borderRadius: '2px' }}>
                {agregado ? '✓ Agregado al carrito' : '+ Agregar al carrito'}
              </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[{ icon: '✦', text: 'Envío gratis +$1,000 MXN' }, { icon: '✦', text: '100% Auténtico' }, { icon: '✦', text: 'Pago seguro' }, { icon: '✦', text: 'Devolución 30 días' }].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--gold)', fontSize: '10px' }}>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '60px', marginBottom: '80px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '48px' }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setTabActiva(tab)}
                style={{ padding: '16px 32px', border: 'none', borderBottom: tabActiva === tab ? '2px solid var(--black)' : '2px solid transparent', background: 'none', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: tabActiva === tab ? 600 : 400, color: tabActiva === tab ? 'var(--black)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px' }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ maxWidth: '800px' }}>
            {tabActiva === 'Descripción' && <p style={{ fontSize: '16px', lineHeight: 1.9, color: 'var(--text-muted)' }}>{producto.descripcion || 'Sin descripción disponible.'}</p>}
            {tabActiva === 'Ingredientes' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', marginBottom: '20px', color: 'var(--black)' }}>Ingredientes</h3>
                <p style={{ fontSize: '14px', lineHeight: 2, color: 'var(--text-muted)', fontStyle: 'italic' }}>{producto.ingredientes || 'No especificados.'}</p>
              </div>
            )}
            {tabActiva === 'Cómo usar' && producto.como_usar && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', marginBottom: '20px', color: 'var(--black)' }}>Modo de uso</h3>
                {producto.como_usar.split('\n').map((paso, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--black)', color: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)', paddingTop: '4px' }}>{paso.replace(/^\d+\.\s/, '')}</p>
                  </div>
                ))}
              </div>
            )}
            {tabActiva === 'Reseñas' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '64px', lineHeight: 1, color: 'var(--black)' }}>4.9</div>
                    <div style={{ color: 'var(--gold)', fontSize: '20px', letterSpacing: '3px', margin: '8px 0' }}>★★★★★</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>142 reseñas</div>
                  </div>
                </div>
                {[{ nombre: 'María G.', fecha: 'Mayo 2026', texto: 'Increíble producto. Mi piel se ve mucho más hidratada y luminosa.' },
                  { nombre: 'Sofía R.', fecha: 'Abril 2026', texto: 'Mi favorito de toda mi rutina. La textura es ligera y se absorbe rápidamente.' },
                  { nombre: 'Ana L.', fecha: 'Marzo 2026', texto: 'Excelente calidad, auténtico y llegó bien empaquetado.' }].map((r, i) => (
                  <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-cream-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'var(--text-muted)' }}>{r.nombre[0]}</div>
                        <div><div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--black)' }}>{r.nombre}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.fecha}</div></div>
                      </div>
                      <span style={{ color: 'var(--gold)', fontSize: '14px', letterSpacing: '2px' }}>★★★★★</span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-muted)' }}>{r.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {producto.video_url && (
        <section style={{ padding: '80px 40px', background: 'var(--black)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>Aprende más</div>
            <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'var(--bg-cream)', marginBottom: '32px' }}>Video del producto</h2>
            <div style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '16/9' }}>
              <iframe width="100%" height="100%" src={producto.video_url.replace('watch?v=', 'embed/')} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ display: 'block' }} />
            </div>
          </div>
        </section>
      )}

      <Footer />
      <LoraChat />
    </main>
  )
}
