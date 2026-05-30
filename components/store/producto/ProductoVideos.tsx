'use client'

import { useState } from 'react'

interface Video {
  id: string
  titulo: string
  duracion?: string
}

interface Props {
  videos: Video[]
}

// Convierte cualquier formato de URL de YouTube (o un ID suelto) en el ID puro
function extraerYoutubeId(valor: string): string {
  if (!valor) return ''
  const patrones = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
  ]
  for (const p of patrones) {
    const m = valor.match(p)
    if (m && m[1]) return m[1]
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(valor.trim())) return valor.trim()
  return valor.trim()
}

export default function ProductoVideos({ videos }: Props) {
  const [videoActivo, setVideoActivo] = useState<string | null>(null)

  if (!videos || videos.length === 0) return null

  return (
    <section style={{
      padding: '80px 40px',
      background: 'var(--black)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>
            Aprende más
          </div>
          <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', letterSpacing: '0.02em', color: 'var(--bg-cream)' }}>
            {videos.length > 1 ? 'Videos relacionados' : 'Video del producto'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(videos.length, 3)}, 1fr)`, gap: '24px', maxWidth: videos.length === 1 ? '800px' : 'none', margin: videos.length === 1 ? '0 auto' : '0' }}>
          {videos.map((video, idx) => {
            const ytId = extraerYoutubeId(video.id)
            const key = `${video.id}-${idx}`
            return (
            <div key={key} style={{ cursor: 'pointer' }} onClick={() => setVideoActivo(key === videoActivo ? null : key)}>
              {videoActivo === key ? (
                <div style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '16/9' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                    title={video.titulo}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', aspectRatio: '16/9', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* Thumbnail de YouTube */}
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt={video.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                  />
                  {/* Overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #0E0E0E', marginLeft: '4px' }} />
                    </div>
                  </div>
                  {/* Duración (solo si existe) */}
                  {video.duracion && (
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '11px', padding: '3px 8px', borderRadius: '3px', fontWeight: 600 }}>
                      {video.duracion}
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding: '16px 0' }}>
                <h4 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 500, color: 'var(--bg-cream)', lineHeight: 1.4, textAlign: 'center' }}>
                  {video.titulo}
                </h4>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
