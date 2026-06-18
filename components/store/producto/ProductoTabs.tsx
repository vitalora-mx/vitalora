'use client'

import { useState } from 'react'
import ResenasProducto from '@/components/store/producto/ResenasProducto'

interface Props {
  producto: any
}

const tabs = ['Descripción', 'Ingredientes', 'Cómo usar', 'Reseñas']

export default function ProductoTabs({ producto }: Props) {
  const [tabActiva, setTabActiva] = useState('Descripción')

  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '60px', marginBottom: '80px' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '48px' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            style={{
              padding: '16px 32px',
              border: 'none',
              borderBottom: tabActiva === tab ? '2px solid var(--black)' : '2px solid transparent',
              background: 'none',
              fontSize: '13px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: tabActiva === tab ? 600 : 400,
              color: tabActiva === tab ? 'var(--black)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '-1px',
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: '800px' }}>

        {tabActiva === 'Descripción' && (
          <div>
            <p style={{ fontSize: '16px', lineHeight: 1.9, color: 'var(--text-muted)', marginBottom: '24px' }}>
              {producto.descripcion}
            </p>
          </div>
        )}

        {tabActiva === 'Ingredientes' && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', marginBottom: '20px', color: 'var(--black)' }}>
              Ingredientes
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 2, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {producto.ingredientes}
            </p>
          </div>
        )}

        {tabActiva === 'Cómo usar' && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', marginBottom: '20px', color: 'var(--black)' }}>
              Modo de uso
            </h3>
            {producto.comoUsar.split('\n').map((paso: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--black)',
                  color: 'var(--bg-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)', paddingTop: '4px' }}>
                  {paso.replace(/^\d+\.\s/, '')}
                </p>
              </div>
            ))}
          </div>
        )}

        {tabActiva === 'Reseñas' && (
          <ResenasProducto productoId={producto?.id} />
        )}

      </div>
    </div>
  )
}
