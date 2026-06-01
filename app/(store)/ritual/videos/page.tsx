'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RitualHeader from '@/components/store/ritual/RitualHeader'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

const SAGE = '#A8B5A0'

interface Video {
  id: number; slug: string; titulo: string; youtube_id: string
  tema_id: number | null; ritual_temas: { nombre: string } | null
}

export default function RitualTodosVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const res = await fetch('/api/tienda/ritual?todos=1')
      const data = await res.json()
      if (Array.isArray(data)) setVideos(data)
      setLoading(false)
    }
    cargar()
  }, [])

  // Agrupar por tema
  const grupos: { tema: string; videos: Video[] }[] = []
  const sinTema: Video[] = []
  videos.forEach(v => {
    const nombreTema = v.ritual_temas?.nombre
    if (!nombreTema) { sinTema.push(v); return }
    let grupo = grupos.find(g => g.tema === nombreTema)
    if (!grupo) { grupo = { tema: nombreTema, videos: [] }; grupos.push(grupo) }
    grupo.videos.push(v)
  })
  if (sinTema.length > 0) grupos.push({ tema: 'Otros', videos: sinTema })

  return (
    <main>
      <RitualHeader />
      <div style={{ background: '#0E0E0E', minHeight: '600px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 40px 80px' }}>

          <Link href="/ritual" style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: SAGE, textDecoration: 'none' }}>← Ritual</Link>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '42px', color: '#E8E4DA', margin: '20px 0 8px' }}>Todos los videos</h1>
          <p style={{ fontSize: '14px', color: '#888780', marginBottom: '48px' }}>Explora por tema</p>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#888780', padding: '60px' }}>Cargando videos...</p>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#888780' }}>
              <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', marginBottom: '16px', color: SAGE }}>✦</div>
              <p>Aún no hay videos.</p>
            </div>
          ) : (
            grupos.map(grupo => (
              <div key={grupo.tema} style={{ marginBottom: '48px' }}>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', color: '#E8E4DA', marginBottom: '20px' }}>{grupo.tema}</h2>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                  {grupo.videos.map(video => (
                    <Link key={video.id} href={`/ritual/${video.slug}`} style={{ textDecoration: 'none', flex: '0 0 300px' }}>
                      <div style={{ cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', transition: 'transform 0.3s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                        <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative', overflow: 'hidden' }}>
                          <img src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`} alt={video.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(232,228,218,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0E0E0E"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 500, color: '#E8E4DA', lineHeight: 1.4, margin: '12px 0 0' }}>{video.titulo}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
      <LoraChat />
    </main>
  )
}
