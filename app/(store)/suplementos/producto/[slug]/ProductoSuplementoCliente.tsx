'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import SuplementosHeader from '@/components/store/suplementos/SuplementosHeader'
import ProductoVideos from '@/components/store/producto/ProductoVideos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { useCartStore } from '@/store/cartStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import MetodosPago from '@/components/store/MetodosPago'
import ResenasProducto from '@/components/store/producto/ResenasProducto'

interface ProductoVideo { id: number; youtube_url: string; titulo: string; posicion: number }
interface VarianteImagen { id: number; url: string; posicion: number }
interface Variante {
  id: number; nombre: string; tipo: string | null; sku: string | null
  codigo_barras: string | null; stock: number; precio: number | null; posicion: number
  variante_imagenes: VarianteImagen[]
}

interface Producto {
  id: number; slug: string; nombre: string; marca: string; categoria: string
  precio: number; precio_original: number | null; tag: string; descripcion: string
  ingredientes: string; como_tomar: string; beneficios: string[]; certificaciones: string[]
  para_quien: string; advertencias: string; video_url: string; stock: number
  seo_title: string | null; seo_description: string | null
  producto_imagenes: { id: number; url: string; posicion: number }[]
  producto_videos: ProductoVideo[]
  producto_variantes: Variante[]
}

export default function ProductoSuplementoCliente({ producto }: { producto: Producto }) {
  const [seleccionada, setSeleccionada] = useState(0)
  const [tabActiva, setTabActiva] = useState('Descripción')
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { agregarItem } = useCartStore()
  const isMobile = useIsMobile()

  const variantesIniciales = (producto.producto_variantes || []).slice().sort((a, b) => a.posicion - b.posicion)
  const varianteInicial = variantesIniciales.length > 0
    ? (variantesIniciales.find(v => v.stock > 0)?.id ?? variantesIniciales[0].id)
    : null
  const [varianteSel, setVarianteSel] = useState<number | null>(varianteInicial)

  useEffect(() => { setMounted(true) }, [])

  const variantes = variantesIniciales
  const tieneVariantes = variantes.length > 0
  const variante = tieneVariantes ? (variantes.find(v => v.id === varianteSel) || variantes[0]) : null

  const imagenesVariante = variante && variante.variante_imagenes?.length > 0
    ? variante.variante_imagenes.slice().sort((a, b) => a.posicion - b.posicion).map(img => ({ id: img.id, url: img.url, posicion: img.posicion }))
    : null
  const imagenes = imagenesVariante || (producto.producto_imagenes?.slice().sort((a, b) => a.posicion - b.posicion) || [])

  const precioEfectivo = variante ? (variante.precio != null ? variante.precio : producto.precio) : producto.precio
  const stockEfectivo = tieneVariantes ? (variante ? variante.stock : 0) : producto.stock
  const agotado = tieneVariantes
    ? variantes.every(v => v.stock <= 0)
    : producto.stock <= 0
  const varianteAgotada = tieneVariantes && variante ? variante.stock <= 0 : false

  const videosOrdenados = (producto.producto_videos || [])
    .slice()
    .sort((a, b) => a.posicion - b.posicion)
  let videosParaMostrar = videosOrdenados.map(v => ({ id: v.youtube_url, titulo: v.titulo }))
  if (videosParaMostrar.length === 0 && producto.video_url) {
    videosParaMostrar = [{ id: producto.video_url, titulo: 'Video del producto' }]
  }

  function seleccionarVariante(id: number) {
    setVarianteSel(id)
    setSeleccionada(0)
    setCantidad(1)
  }

  function handleAgregar() {
    if (!producto) return
    if (tieneVariantes) {
      if (!variante || variante.stock <= 0) return
      for (let i = 0; i < cantidad; i++) {
        agregarItem({
          id: producto.id, slug: producto.slug, nombre: producto.nombre, marca: producto.marca,
          precio: precioEfectivo, imagen: imagenes[0]?.url || '', tipo: 'suplemento',
          varianteId: variante.id,
          varianteNombre: variante.tipo ? `${variante.tipo}: ${variante.nombre}` : variante.nombre,
        })
      }
    } else {
      if (agotado) return
      for (let i = 0; i < cantidad; i++) {
        agregarItem({
          id: producto.id, slug: producto.slug, nombre: producto.nombre, marca: producto.marca,
          precio: producto.precio, imagen: imagenes[0]?.url || '', tipo: 'suplemento',
        })
      }
    }
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  const tabs = ['Descripción', 'Beneficios', 'Ingredientes', 'Cómo tomar', 'Advertencias', 'Reseñas']

  return (
    <main style={{ background: 'white' }}>
      <SuplementosHeader />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '24px 16px' : '60px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '32px' : '80px', marginBottom: isMobile ? '48px' : '80px' }}>

          {/* Galería */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', width: '100%', maxWidth: isMobile ? 'none' : '600px' }}>
            <div style={{ order: isMobile ? 1 : 2, flex: 1, minWidth: 0, aspectRatio: '1 / 1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: '#F0F7F0' }}>
              {producto.tag && !agotado && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '6px 14px', background: '#6B8F6B', color: 'white', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '100px', zIndex: 2 }}>{producto.tag}</div>
              )}
              {(agotado || varianteAgotada) && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 14px', background: '#C0392B', color: 'white', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, borderRadius: '100px', zIndex: 2 }}>Agotado</div>
              )}
              {imagenes[seleccionada] ? (
                <img src={imagenes[seleccionada].url} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: (agotado || varianteAgotada) ? 0.5 : 1, filter: (agotado || varianteAgotada) ? 'grayscale(60%)' : 'none' }} />
              ) : (
                <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '80px', color: 'rgba(107,143,107,0.2)' }}>V</div>
              )}
            </div>
            {imagenes.length > 1 && (
              <div style={{ order: isMobile ? 2 : 1, display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '12px', flexShrink: 0, overflowX: isMobile ? 'auto' : 'visible' }}>
                {imagenes.map((img, i) => (
                  <button key={img.id} onClick={() => setSeleccionada(i)}
                    style={{ width: '72px', height: '72px', border: '2px solid', borderColor: seleccionada === i ? '#6B8F6B' : '#EEE', borderRadius: '4px', cursor: 'pointer', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '18px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B8F6B', fontWeight: 600 }}>{producto.marca}</span>
              <span style={{ color: '#DDD' }}>·</span>
              <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999' }}>{producto.categoria}</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1, letterSpacing: '0.02em', color: '#111' }}>{producto.nombre}</h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              {producto.precio_original && producto.precio_original > precioEfectivo && (
                <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', color: '#999', textDecoration: 'line-through' }}>${producto.precio_original.toLocaleString()}</span>
              )}
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '32px' : '40px', fontWeight: 600, color: '#111' }}>${precioEfectivo.toLocaleString()} MXN</span>
            </div>

            <div style={{ height: '1px', background: '#EEE' }} />

            {producto.beneficios && producto.beneficios.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {producto.beneficios.slice(0, 3).map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#444' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#6B8F6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>
                    </div>
                    {b}
                  </div>
                ))}
              </div>
            )}

            {producto.certificaciones && producto.certificaciones.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {producto.certificaciones.map(cert => (
                  <span key={cert} style={{ padding: '4px 12px', border: '1px solid #6B8F6B', borderRadius: '100px', fontSize: '11px', color: '#6B8F6B', letterSpacing: '0.08em', fontWeight: 500 }}>{cert}</span>
                ))}
              </div>
            )}

            {/* Selector de variantes */}
            {tieneVariantes && (
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999', marginBottom: '10px' }}>
                  {variante?.tipo ? variante.tipo : 'Variante'}: <strong style={{ color: '#111' }}>{variante?.nombre}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {variantes.map(v => {
                    const sel = v.id === varianteSel
                    const vAgotada = v.stock <= 0
                    return (
                      <button key={v.id} onClick={() => seleccionarVariante(v.id)}
                        style={{
                          padding: '10px 18px', borderRadius: '8px', cursor: vAgotada ? 'not-allowed' : 'pointer',
                          border: '1px solid', borderColor: sel ? '#111' : '#DDD',
                          background: sel ? '#111' : 'white',
                          color: sel ? 'white' : (vAgotada ? '#BBB' : '#333'),
                          fontSize: '13px', fontFamily: 'inherit',
                          textDecoration: vAgotada ? 'line-through' : 'none',
                        }}>
                        {v.nombre}{vAgotada ? ' (agotado)' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {!agotado && !varianteAgotada && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999' }}>Cantidad</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EEE', borderRadius: '8px' }}>
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>{cantidad}</span>
                  <button onClick={() => setCantidad(Math.min(stockEfectivo, cantidad + 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            )}

            {(agotado || varianteAgotada) ? (
              <div style={{ padding: '20px', background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, color: '#999', marginBottom: '8px' }}>{varianteAgotada && !agotado ? 'Esta variante está agotada' : 'Producto agotado'}</div>
                <p style={{ fontSize: '12px', color: '#AAA', margin: 0 }}>{varianteAgotada && !agotado ? 'Elige otra variante disponible' : 'Este producto no está disponible por el momento'}</p>
              </div>
            ) : (
              <button onClick={handleAgregar}
                style={{ padding: '20px', background: agregado ? '#4A7A4A' : '#0E0E0E', color: 'white', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.3s', borderRadius: '8px' }}>
                {agregado ? '✓ Agregado al carrito' : '+ Agregar al carrito'}
              </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[{ icon: '🚚', text: 'Envío gratis +$1,000 MXN' }, { icon: '✓', text: '100% Auténtico' }, { icon: '🔒', text: 'Pago seguro' }, { icon: '↩', text: 'Devolución 30 días' }].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#999' }}>
                  <span style={{ fontSize: '14px' }}>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
              <MetodosPago variante="claro" titulo="Pago seguro con" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderTop: '1px solid #EEE', paddingTop: isMobile ? '40px' : '60px', marginBottom: isMobile ? '48px' : '80px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #EEE', marginBottom: isMobile ? '32px' : '48px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setTabActiva(tab)}
                style={{ padding: isMobile ? '14px 18px' : '16px 24px', border: 'none', borderBottom: tabActiva === tab ? '2px solid #111' : '2px solid transparent', background: 'none', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: tabActiva === tab ? 700 : 400, color: tabActiva === tab ? '#111' : '#999', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ maxWidth: '800px' }}>
            {tabActiva === 'Descripción' && (
              <div style={{ fontSize: '16px', lineHeight: 1.9, color: '#666' }} className="md-contenido">
                <ReactMarkdown>{producto.descripcion || 'Sin descripción disponible.'}</ReactMarkdown>
              </div>
            )}
            {tabActiva === 'Beneficios' && producto.beneficios && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {producto.para_quien && <p style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>{producto.para_quien}</p>}
                {producto.beneficios.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#F8FBF8', borderRadius: '8px', border: '1px solid #E8F0E8' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6B8F6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ fontSize: '15px', color: '#333' }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
            {tabActiva === 'Ingredientes' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', marginBottom: '20px', color: '#111' }}>Ingredientes</h3>
                <div style={{ fontSize: '14px', lineHeight: 2, color: '#666' }} className="md-contenido">
                  <ReactMarkdown>{producto.ingredientes || 'No especificados.'}</ReactMarkdown>
                </div>
              </div>
            )}
            {tabActiva === 'Cómo tomar' && producto.como_tomar && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', marginBottom: '24px', color: '#111' }}>Modo de uso</h3>
                {producto.como_tomar.split('\n').filter(p => p.trim()).map((paso, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6B8F6B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#666', paddingTop: '4px' }} className="md-contenido">
                      <ReactMarkdown>{paso.replace(/^\d+\.\s/, '')}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tabActiva === 'Advertencias' && producto.advertencias && (
              <div style={{ padding: '24px', background: '#FFFBF0', border: '1px solid #F0E8C8', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>ADVERTENCIAS Y PRECAUCIONES</h4>
                    <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#666' }} className="md-contenido">
                      <ReactMarkdown>{producto.advertencias}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tabActiva === 'Reseñas' && (
              <ResenasProducto productoId={producto.id} />
            )}
          </div>
        </div>
      </div>

      <ProductoVideos videos={videosParaMostrar} />

      <Footer />
      <LoraChat />

      <style>{`
        .md-contenido p { margin: 0 0 16px 0; }
        .md-contenido p:last-child { margin-bottom: 0; }
        .md-contenido strong { color: #111; font-weight: 600; }
        .md-contenido ul, .md-contenido ol { padding-left: 20px; margin: 0 0 16px 0; }
        .md-contenido li { margin-bottom: 8px; }
      `}</style>
    </main>
  )
}