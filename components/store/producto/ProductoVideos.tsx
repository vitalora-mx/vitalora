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

type Plataforma = 'youtube' | 'tiktok' | 'instagram' | 'desconocido'

// Detecta la plataforma segun la URL
function detectarPlataforma(url: string): Plataforma {
  if (!url) return 'desconocido'
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('instagram.com')) return 'instagram'
  return 'desconocido'
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
  // Si no coincide con ningun patron, asumir que ya es un ID
  return valor.trim()
}

// Extrae el ID de un video de TikTok de su URL
// Formatos: tiktok.com/@usuario/video/1234567890  |  vm.tiktok.com/xxxx
function extraerTiktokId(url: string): string {
  const m = url.match(/\/video\/(\d+)/)
  if (m && m[1]) return m[1]
  return ''
}

// Genera la URL de embed de Instagram a partir del link de un reel o post
// Formatos: instagram.com/reel/CODIGO/  |  instagram.com/p/CODIGO/
function urlEmbedInstagram(url: string): string {
  // Limpiar parametros y quedarnos con la parte base
  const m = url.match(/instagram\.com\/(reel|reels|p|tv)\/([^/?#]+)/)
  if (m && m[2]) {
    const codigo = m[2]
    return `https://www.instagram.com/p/${codigo}/embed`
  }
  return ''
}

export default function ProductoVideos({ videos }: Props) {
  const [videoActivo, setVideoActivo] = useState<string | null>(null)

  if (!videos || videos.length === 0) return null

  return (
    <section style={{ background: 'var(--black)', padding: '80px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', color: 'var(--bg-cream)', textAlign: 'center', marginBottom: '48px' }}>
          {videos.length > 1 ? 'Videos relacionados' : 'Video del producto'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(videos.length, 3)}, 1fr)`, gap: '24px', maxWidth: videos.length === 1 ? '800px' : 'none', margin: videos.length === 1 ? '0 auto' : '0' }}>
          {videos.map((video, idx) => {
            const plataforma = detectarPlataforma(video.id)
            const key = `${video.id}-${idx}`

            // ─── YOUTUBE (horizontal, con miniatura y clic para reproducir) ───
            if (plataforma === 'youtube') {
              const ytId = extraerYoutubeId(video.id)
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
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={video.titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                          <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #0E0E0E', marginLeft: '4px' }} />
                        </div>
                      </div>
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
            }

            // ─── TIKTOK (vertical, embed directo) ───
            if (plataforma === 'tiktok') {
              const tkId = extraerTiktokId(video.id)
              return (
                <div key={key}>
                  <div style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '9/16', maxWidth: '340px', margin: '0 auto', background: '#000' }}>
                    {tkId ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.tiktok.com/embed/v2/${tkId}`}
                        title={video.titulo}
                        frameBorder="0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <div style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center' }}>
                        No se pudo cargar el video de TikTok
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px 0' }}>
                    <h4 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 500, color: 'var(--bg-cream)', lineHeight: 1.4, textAlign: 'center' }}>
                      {video.titulo}
                    </h4>
                  </div>
                </div>
              )
            }

            // ─── INSTAGRAM (vertical, embed directo) ───
            if (plataforma === 'instagram') {
              const igEmbed = urlEmbedInstagram(video.id)
              return (
                <div key={key}>
                  <div style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '9/16', maxWidth: '340px', margin: '0 auto', background: '#000' }}>
                    {igEmbed ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={igEmbed}
                        title={video.titulo}
                        frameBorder="0"
                        scrolling="no"
                        allowFullScreen
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <div style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center' }}>
                        No se pudo cargar el video de Instagram
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px 0' }}>
                    <h4 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 500, color: 'var(--bg-cream)', lineHeight: 1.4, textAlign: 'center' }}>
                      {video.titulo}
                    </h4>
                  </div>
                </div>
              )
            }

            // ─── DESCONOCIDO (no se reconoce la plataforma) ───
            return (
              <div key={key}>
                <div style={{ borderRadius: '4px', aspectRatio: '16/9', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
                  Formato de video no reconocido
                </div>
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
