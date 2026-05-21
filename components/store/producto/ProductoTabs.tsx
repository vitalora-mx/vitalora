'use client'

import { useState } from 'react'

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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '64px', lineHeight: 1, color: 'var(--black)' }}>4.9</div>
                <div style={{ color: 'var(--gold)', fontSize: '20px', letterSpacing: '3px', margin: '8px 0' }}>★★★★★</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>142 reseñas</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '12px' }}>{star}</span>
                    <span style={{ color: 'var(--gold)', fontSize: '12px' }}>★</span>
                    <div style={{ flex: 1, height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', borderRadius: '3px', width: star === 5 ? '85%' : star === 4 ? '10%' : '5%' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px' }}>
                      {star === 5 ? '120' : star === 4 ? '14' : '8'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reseñas individuales */}
            {[
              { nombre: 'María G.', fecha: 'Mayo 2026', texto: 'Increíble producto. Lo uso desde hace 3 meses y mi piel se ve mucho más hidratada y luminosa. Lo recomiendo totalmente.', estrellas: 5 },
              { nombre: 'Sofía R.', fecha: 'Abril 2026', texto: 'Mi favorito de toda mi rutina. La textura es ligera y se absorbe rápidamente. No deja sensación grasosa.', estrellas: 5 },
              { nombre: 'Ana L.', fecha: 'Marzo 2026', texto: 'Excelente calidad, auténtico y llegó bien empaquetado. Definitivamente volvería a comprar.', estrellas: 5 },
            ].map((resena, i) => (
              <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-cream-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-italiana), serif', fontSize: '16px', color: 'var(--text-muted)' }}>
                      {resena.nombre[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--black)' }}>{resena.nombre}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{resena.fecha}</div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--gold)', fontSize: '14px', letterSpacing: '2px' }}>★★★★★</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-muted)' }}>{resena.texto}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}