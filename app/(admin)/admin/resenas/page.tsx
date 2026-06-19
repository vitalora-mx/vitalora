'use client'

import { useState, useEffect } from 'react'

interface Resena {
  id: number
  producto_id: number
  autor_nombre: string
  estrellas: number
  titulo: string | null
  comentario: string | null
  fotos: string[]
  estado: string
  created_at: string
  productos: { nombre: string; slug: string; tipo: string } | null
}

const ESTADOS = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobada', label: 'Aprobadas' },
  { key: 'rechazada', label: 'Rechazadas' },
  { key: 'todas', label: 'Todas' },
]

export default function AdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')
  const [mensaje, setMensaje] = useState('')
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null)

  useEffect(() => { cargar() }, [filtro])

  async function cargar() {
    setLoading(true)
    const res = await fetch(`/api/admin/resenas?estado=${filtro}`)
    const data = await res.json()
    setResenas(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function cambiarEstado(id: number, estado: string) {
    const res = await fetch('/api/admin/resenas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    const data = await res.json()
    if (data.error) setMensaje('Error: ' + data.error)
    else { setMensaje(estado === 'aprobada' ? 'Reseña aprobada y publicada' : estado === 'rechazada' ? 'Reseña rechazada' : 'Reseña actualizada'); cargar() }
    setTimeout(() => setMensaje(''), 3000)
  }

  async function borrar(id: number) {
    if (!confirm('¿Borrar esta reseña definitivamente? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/admin/resenas?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) setMensaje('Error: ' + data.error)
    else { setMensaje('Reseña borrada'); cargar() }
    setTimeout(() => setMensaje(''), 3000)
  }

  function fecha(f: string) {
    try { return new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '' }
  }

  function colorEstado(estado: string) {
    if (estado === 'aprobada') return { bg: '#E8F5E9', color: '#2E7D32', label: 'Aprobada' }
    if (estado === 'rechazada') return { bg: '#FFEBEE', color: '#C62828', label: 'Rechazada' }
    return { bg: '#FFF8E1', color: '#F57F17', label: 'Pendiente' }
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Moderación de reseñas</h1>
      <p style={{ fontSize: '14px', color: '#777', marginBottom: '24px' }}>Aprueba las reseñas para que aparezcan en la página del producto.</p>

      {/* Pestañas de filtro */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {ESTADOS.map(e => (
          <button key={e.key} onClick={() => setFiltro(e.key)}
            style={{ padding: '8px 18px', borderRadius: '100px', border: '1px solid', borderColor: filtro === e.key ? '#111' : '#DDD', background: filtro === e.key ? '#111' : 'white', color: filtro === e.key ? 'white' : '#555', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
            {e.label}
          </button>
        ))}
      </div>

      {mensaje && <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#F0F7F0', border: '1px solid #C8E6C9', borderRadius: '8px', fontSize: '14px', color: '#2E7D32' }}>{mensaje}</div>}

      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Cargando...</p>
      ) : resenas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FAFAFA', borderRadius: '12px', color: '#999' }}>
          No hay reseñas {filtro !== 'todas' ? `en estado "${filtro}"` : ''}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resenas.map(r => {
            const est = colorEstado(r.estado)
            return (
              <div key={r.id} style={{ border: '1px solid #EEE', borderRadius: '12px', padding: '20px', background: 'white' }}>
                {/* Encabezado: producto + estado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>{r.productos?.nombre || `Producto #${r.producto_id}`}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{r.productos?.tipo === 'suplemento' ? 'Suplemento' : 'Cosmético'} · {fecha(r.created_at)}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '100px', background: est.bg, color: est.color, fontSize: '12px', fontWeight: 600 }}>{est.label}</span>
                </div>

                {/* Autor y estrellas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{r.autor_nombre}</span>
                  <span style={{ color: '#C9A961', fontSize: '15px', letterSpacing: '2px' }}>
                    {'★'.repeat(r.estrellas)}<span style={{ color: '#DDD' }}>{'★'.repeat(5 - r.estrellas)}</span>
                  </span>
                </div>

                {/* Contenido */}
                {r.titulo && <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>{r.titulo}</div>}
                {r.comentario && <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#555', margin: '0 0 12px' }}>{r.comentario}</p>}

                {/* Fotos */}
                {r.fotos && r.fotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {r.fotos.map((foto, i) => (
                      <img key={i} src={foto} alt={`Foto ${i + 1}`} onClick={() => setFotoAmpliada(foto)}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #EEE' }} />
                    ))}
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #F5F5F5', paddingTop: '14px' }}>
                  {r.estado !== 'aprobada' && (
                    <button onClick={() => cambiarEstado(r.id, 'aprobada')}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2E7D32', color: 'white', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                      ✓ Aprobar
                    </button>
                  )}
                  {r.estado !== 'rechazada' && (
                    <button onClick={() => cambiarEstado(r.id, 'rechazada')}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #C62828', background: 'white', color: '#C62828', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                      Rechazar
                    </button>
                  )}
                  {r.estado !== 'pendiente' && (
                    <button onClick={() => cambiarEstado(r.id, 'pendiente')}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #DDD', background: 'white', color: '#777', fontSize: '13px', cursor: 'pointer' }}>
                      Volver a pendiente
                    </button>
                  )}
                  <button onClick={() => borrar(r.id)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #EEE', background: 'white', color: '#999', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}>
                    Borrar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', cursor: 'pointer' }}>
          <img src={fotoAmpliada} alt="Foto" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
    </main>
  )
}
