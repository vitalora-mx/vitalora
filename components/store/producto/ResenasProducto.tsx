'use client'

import { useState, useEffect } from 'react'

interface Resena {
  id: number
  autor_nombre: string
  estrellas: number
  titulo: string | null
  comentario: string | null
  fotos: string[]
  created_at: string
}

interface Props {
  productoId: number
}

function Estrellas({ valor, size = 14 }: { valor: number; size?: number }) {
  return (
    <span style={{ color: 'var(--gold)', fontSize: `${size}px`, letterSpacing: '2px' }}>
      {'★'.repeat(valor)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - valor)}</span>
    </span>
  )
}

export default function ResenasProducto({ productoId }: Props) {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [promedio, setPromedio] = useState(0)
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null)

  useEffect(() => {
    if (!productoId) return
    fetch(`/api/resenas?producto_id=${productoId}`)
      .then(r => r.json())
      .then(d => {
        if (d.resenas) {
          setResenas(d.resenas)
          setPromedio(d.promedio || 0)
          setTotal(d.total || 0)
        }
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [productoId])

  function formatearFecha(fecha: string) {
    try {
      const d = new Date(fecha)
      return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })
    } catch {
      return ''
    }
  }

  if (cargando) {
    return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Cargando reseñas...</div>
  }

  // Sin reseñas todavía
  if (total === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-cream)', borderRadius: '12px' }}>
        <div style={{ color: 'var(--line)', fontSize: '28px', letterSpacing: '4px', marginBottom: '12px' }}>★★★★★</div>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Este producto aún no tiene reseñas.<br />
          Si lo compraste, ¡sé la primera persona en opinar desde tu cuenta!
        </p>
      </div>
    )
  }

  // Conteo por estrella para las barras
  const conteo = [5, 4, 3, 2, 1].map(s => resenas.filter(r => r.estrellas === s).length)

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '64px', lineHeight: 1, color: 'var(--black)' }}>{promedio}</div>
          <div style={{ margin: '8px 0' }}><Estrellas valor={Math.round(promedio)} size={20} /></div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{total} {total === 1 ? 'reseña' : 'reseñas'}</div>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          {[5, 4, 3, 2, 1].map((star, idx) => (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '12px' }}>{star}</span>
              <span style={{ color: 'var(--gold)', fontSize: '12px' }}>★</span>
              <div style={{ flex: 1, height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--gold)', borderRadius: '3px', width: total > 0 ? `${(conteo[idx] / total) * 100}%` : '0%' }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px' }}>{conteo[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reseñas individuales */}
      {resenas.map((r) => (
        <div key={r.id} style={{ padding: '24px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-cream-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--black)', fontWeight: 500 }}>
                {r.autor_nombre[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--black)' }}>{r.autor_nombre}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatearFecha(r.created_at)}</div>
              </div>
            </div>
            <Estrellas valor={r.estrellas} />
          </div>
          {r.titulo && <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--black)', margin: '8px 0 4px' }}>{r.titulo}</div>}
          {r.comentario && <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>{r.comentario}</p>}
          {/* Fotos de la reseña */}
          {r.fotos && r.fotos.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {r.fotos.map((foto, i) => (
                <img
                  key={i}
                  src={foto}
                  alt={`Foto de reseña ${i + 1}`}
                  onClick={() => setFotoAmpliada(foto)}
                  style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--line)' }}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Lightbox de foto ampliada */}
      {fotoAmpliada && (
        <div
          onClick={() => setFotoAmpliada(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', cursor: 'pointer' }}
        >
          <img src={fotoAmpliada} alt="Foto ampliada" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  )
}
