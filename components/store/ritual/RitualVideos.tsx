'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const SAGE = '#A8B5A0'

interface Tema { id: number; nombre: string }
interface Video {
  id: number; slug: string; titulo: string; descripcion: string
  youtube_id: string; tipo: string; posicion: number | null
  tema_id: number | null; ritual_temas: { nombre: string } | null
}

interface Props {
  videosIniciales?: Video[]
  temasIniciales?: Tema[]
}

export default function RitualVideos({ videosIniciales, temasIniciales }: Props) {
  const [videos, setVideos] = useState<Video[]>(videosIniciales || [])
  const [temas, setTemas] = useState<Tema[]>(temasIniciales || [])
  const [temasSeleccionados, setTemasSeleccionados] = useState<number[]>([])
  const isMobile = useIsMobile()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [orden, setOrden] = useState('relevancia')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(!videosIniciales || videosIniciales.length === 0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (videosIniciales && videosIniciales.length > 0) return
    async function cargar() {
      const [resVideos, resTemas] = await Promise.all([
        fetch('/api/tienda/ritual'),
        fetch('/api/tienda/ritual-temas'),
      ])
      const dataVideos = await resVideos.json()
      const dataTemas = await resTemas.json()
      if (Array.isArray(dataVideos)) setVideos(dataVideos)
      if (Array.isArray(dataTemas)) setTemas(dataTemas)
      setLoading(false)
    }
    cargar()
  }, [videosIniciales])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleTema(id: number) {
    setTemasSeleccionados(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }
  function limpiarTemas() { setTemasSeleccionados([]) }

  const q = busqueda.trim().toLowerCase()
  const videosFiltrados = videos.filter(v => {
    const porTema = temasSeleccionados.length === 0 || (v.tema_id !== null && temasSeleccionados.includes(v.tema_id))
    const porTipo = orden === 'relevancia' || v.tipo === orden || v.tipo === 'ambos'
    const porBusqueda = q === '' ||
      v.titulo.toLowerCase().includes(q) ||
      (v.descripcion || '').toLowerCase().includes(q) ||
      (v.ritual_temas?.nombre || '').toLowerCase().includes(q)
    return porTema && porTipo && porBusqueda
  })

  return (
    <div style={{ background: '#0E0E0E', minHeight: '600px' }}>
      {/* Barra de filtros */}
      <div style={{ background: '#161616', borderBottom: '1px solid rgba(168,181,160,0.15)', position: 'sticky', top: '73px', zIndex: 90, padding: '14px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>

          {/* Filtro de Temas */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '1px solid', borderColor: temasSeleccionados.length > 0 ? SAGE : 'rgba(168,181,160,0.25)', borderRadius: '100px', background: temasSeleccionados.length > 0 ? SAGE : 'transparent', color: temasSeleccionados.length > 0 ? '#0E0E0E' : '#E8E4DA', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              Temas {temasSeleccionados.length > 0 ? `(${temasSeleccionados.length})` : ''} <span style={{ fontSize: '10px' }}>{dropdownOpen ? '▲' : '▼'}</span>
            </button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#1A1A1A', border: '1px solid rgba(168,181,160,0.2)', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '16px', minWidth: '280px', zIndex: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(168,181,160,0.15)' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888780' }}>Selecciona temas</span>
                  {temasSeleccionados.length > 0 && <button onClick={limpiarTemas} style={{ background: 'none', border: 'none', fontSize: '11px', color: SAGE, cursor: 'pointer', fontFamily: 'inherit' }}>Limpiar</button>}
                </div>
                {temas.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#888780', margin: 0 }}>Aún no hay temas.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                    {temas.map(tema => {
                      const sel = temasSeleccionados.includes(tema.id)
                      return (
                        <button key={tema.id} onClick={() => toggleTema(tema.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: sel ? 'rgba(168,181,160,0.12)' : 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#E8E4DA', textAlign: 'left' }}>
                          <div style={{ width: '18px', height: '18px', border: '1.5px solid', borderColor: sel ? SAGE : 'rgba(168,181,160,0.4)', borderRadius: '3px', background: sel ? SAGE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <span style={{ color: '#0E0E0E', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                          </div>
                          {tema.nombre}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Barra de busqueda exclusiva de videos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(168,181,160,0.25)', borderRadius: '100px', padding: '8px 16px', background: '#0E0E0E', flex: '1 1 260px', maxWidth: '360px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar videos por título, tema..."
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', color: '#E8E4DA', width: '100%', fontFamily: 'inherit' }}
            />
          </div>

          {/* Botones Cosmeticos / Suplementos + Orden */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/cosmeticos" style={{ padding: '8px 20px', border: `1px solid ${SAGE}`, borderRadius: '100px', color: SAGE, textDecoration: 'none', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>Cosméticos</Link>
            <Link href="/suplementos" style={{ padding: '8px 20px', border: `1px solid ${SAGE}`, borderRadius: '100px', color: SAGE, textDecoration: 'none', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>Suplementos</Link>
            <span style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780' }}>Ver:</span>
            <select value={orden} onChange={e => setOrden(e.target.value)} style={{ padding: '8px 16px', border: '1px solid rgba(168,181,160,0.25)', borderRadius: '100px', background: '#161616', fontSize: '12px', color: '#E8E4DA', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              <option value="relevancia">Relevancia</option>
              <option value="cosmetico">Videos de Cosméticos</option>
              <option value="suplemento">Videos de Suplementos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de videos */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        <p style={{ fontSize: '13px', color: '#888780', marginBottom: '32px' }}>
          {videosFiltrados.length} videos
          {q && <span style={{ color: SAGE, marginLeft: '8px' }}>· &quot;{busqueda}&quot;</span>}
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888780', padding: '60px' }}>Cargando videos...</p>
        ) : videosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#888780' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', marginBottom: '16px', color: SAGE }}>✦</div>
            <p>No hay videos que coincidan todavía.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '24px' }}>
            {videosFiltrados.map(video => (
              <Link key={video.id} href={`/ritual/${video.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ cursor: 'pointer', background: '#161616', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(168,181,160,0.15)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  {/* Portada con play */}
                  <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative', overflow: 'hidden' }}>
                    <img src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`} alt={video.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(232,228,218,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#0E0E0E"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                    {video.ritual_temas?.nombre && (
                      <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', background: SAGE, color: '#0E0E0E', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '2px' }}>{video.ritual_temas.nombre}</div>
                    )}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '17px', fontWeight: 500, color: '#E8E4DA', lineHeight: 1.4, margin: 0 }}>{video.titulo}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Boton Ver mas */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link href="/ritual/videos" style={{ display: 'inline-block', padding: '14px 40px', border: `1px solid ${SAGE}`, borderRadius: '100px', color: SAGE, textDecoration: 'none', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
            Ver todos los videos →
          </Link>
        </div>
      </div>
    </div>
  )
}