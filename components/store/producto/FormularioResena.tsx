'use client'

import { useState } from 'react'

interface Props {
  productoId: number
  productoNombre: string
  userId: string
  onCerrar: () => void
  onEnviada: () => void
}

export default function FormularioResena({ productoId, productoNombre, userId, onCerrar, onEnviada }: Props) {
  const [estrellas, setEstrellas] = useState(0)
  const [hover, setHover] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [comentario, setComentario] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fotos.length >= 3) { setError('Máximo 3 fotos.'); return }
    setError('')
    setSubiendoFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('producto_id', String(productoId))
      const res = await fetch('/api/resenas/upload', {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setFotos([...fotos, data.url])
      } else {
        setError(data.error || 'No se pudo subir la foto.')
      }
    } catch {
      setError('Error al subir la foto.')
    }
    setSubiendoFoto(false)
    e.target.value = ''
  }

  function quitarFoto(url: string) {
    setFotos(fotos.filter(f => f !== url))
  }

  async function enviar() {
    setError('')
    if (estrellas < 1) { setError('Selecciona una calificación.'); return }
    if (!comentario.trim()) { setError('Escribe un comentario.'); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ producto_id: productoId, estrellas, titulo, comentario, fotos }),
      })
      const data = await res.json()
      if (res.ok) {
        onEnviada()
      } else {
        setError(data.error || 'No se pudo enviar la reseña.')
      }
    } catch {
      setError('Error al enviar la reseña.')
    }
    setEnviando(false)
  }

  return (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '12px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', color: 'var(--black)', margin: 0 }}>Escribe tu reseña</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{productoNombre}</p>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Estrellas */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Tu calificación *</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                onClick={() => setEstrellas(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                style={{ fontSize: '32px', cursor: 'pointer', color: (hover || estrellas) >= n ? 'var(--gold)' : 'var(--line)', transition: 'color 0.15s' }}
              >★</span>
            ))}
          </div>
        </div>

        {/* Título */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Título (opcional)</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Resume tu experiencia" maxLength={80}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Comentario */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Tu comentario *</label>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Cuéntanos cómo te fue con este producto" rows={4} maxLength={600}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        {/* Fotos */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Fotos (opcional, máx 3)</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {fotos.map((foto, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={foto} alt={`Foto ${i + 1}`} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }} />
                <button onClick={() => quitarFoto(foto)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--black)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
              </div>
            ))}
            {fotos.length < 3 && (
              <label style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: subiendoFoto ? 'default' : 'pointer', color: 'var(--text-muted)', fontSize: '24px' }}>
                {subiendoFoto ? '…' : '+'}
                <input type="file" accept="image/*" onChange={subirFoto} disabled={subiendoFoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        {error && <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#FFF5F5', border: '1px solid #F0C0C0', borderRadius: '8px', fontSize: '13px', color: '#C0392B' }}>{error}</div>}

        <button onClick={enviar} disabled={enviando} style={{ width: '100%', padding: '15px', background: 'var(--black)', color: 'var(--bg-cream)', border: 'none', borderRadius: '100px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.6 : 1, fontFamily: 'inherit' }}>
          {enviando ? 'Enviando...' : 'Enviar reseña'}
        </button>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
          Tu reseña será revisada antes de publicarse.
        </p>
      </div>
    </div>
  )
}
