'use client'

import { useState, useEffect } from 'react'

interface Props {
  producto: any
}

export default function ProductoGaleria({ producto }: Props) {
  const [seleccionada, setSeleccionada] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const imagenes = [
    { color: producto.color },
    { color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)' },
    { color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)' },
    { color: 'linear-gradient(135deg, #F5F0E8, #EDE6D8)' },
  ]

  if (!mounted) return null

  return (
    <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '600px' }}>
      {/* Miniaturas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
        {imagenes.map((img, i) => (
          <button
            key={i}
            onClick={() => setSeleccionada(i)}
            style={{
              width: '72px',
              height: '72px',
              border: '2px solid',
              borderColor: seleccionada === i ? 'var(--gold)' : '#E8E0D5',
              borderRadius: '4px',
              background: img.color,
              cursor: 'pointer',
              padding: 0,
              transition: 'border-color 0.2s',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Imagen principal */}
      <div style={{
        flex: 1,
        minWidth: 0,
        aspectRatio: '1 / 1',
        background: imagenes[seleccionada].color,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {producto.tag && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '6px 14px',
            background: 'var(--gold)',
            color: 'white',
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 600,
            borderRadius: '2px',
          }}>
            {producto.tag}
          </div>
        )}
        <div style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: '80px',
          color: 'rgba(0,0,0,0.1)',
          userSelect: 'none',
        }}>V</div>
      </div>
    </div>
  )
}
