'use client'

import { useState } from 'react'
import ResenasProducto from '@/components/store/producto/ResenasProducto'

interface Props {
  producto: any
}

const tabs = ['Descripción', 'Beneficios', 'Tabla Nutrimental', 'Cómo tomar', 'Advertencias', 'Combinaciones', 'Preguntas frecuentes', 'Reseñas']

export default function SuplementoTabs({ producto }: Props) {
  const [tabActiva, setTabActiva] = useState('Descripción')

  return (
    <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: '60px', marginBottom: '80px' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #EEEEEE', marginBottom: '48px', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: tabActiva === tab ? '2px solid #111111' : '2px solid transparent',
              background: 'none',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: tabActiva === tab ? 700 : 400,
              color: tabActiva === tab ? '#111111' : '#999999',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
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
          <p style={{ fontSize: '16px', lineHeight: 1.9, color: '#666666' }}>
            {producto.descripcion}
          </p>
        )}

        {tabActiva === 'Beneficios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: '#999999', marginBottom: '8px' }}>
              {producto.paraQuien}
            </p>
            {producto.beneficios.map((b: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#F8FBF8', borderRadius: '8px', border: '1px solid #E8F0E8' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6B8F6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>✓</span>
                </div>
                <span style={{ fontSize: '15px', color: '#333333' }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {tabActiva === 'Tabla Nutrimental' && (
          <div>
            <p style={{ fontSize: '13px', color: '#999999', marginBottom: '24px' }}>
              Tamaño de porción: 3 cápsulas · Porciones por envase: 20
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FBF8' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B8F6B', borderBottom: '2px solid #E8F0E8' }}>Ingrediente</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B8F6B', borderBottom: '2px solid #E8F0E8' }}>Cantidad</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B8F6B', borderBottom: '2px solid #E8F0E8' }}>% VD</th>
                </tr>
              </thead>
              <tbody>
                {producto.tablanutrimental.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #EEEEEE', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#333333' }}>{row.nombre}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#333333', textAlign: 'right', fontWeight: 500 }}>{row.cantidad}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#999999', textAlign: 'right' }}>{row.vd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '11px', color: '#AAAAAA', marginTop: '16px' }}>
              *VD = Valor Diario con base en una dieta de 2,000 kcal. — = No establecido.
            </p>
          </div>
        )}

        {tabActiva === 'Cómo tomar' && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', marginBottom: '24px', color: '#111111' }}>
              Modo de uso
            </h3>
            {producto.comoTomar.split('\n').map((paso: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6B8F6B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#666666', paddingTop: '4px' }}>
                  {paso.replace(/^\d+\.\s/, '')}
                </p>
              </div>
            ))}
          </div>
        )}

        {tabActiva === 'Advertencias' && (
          <div style={{ padding: '24px', background: '#FFFBF0', border: '1px solid #F0E8C8', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#333333', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  ADVERTENCIAS Y PRECAUCIONES
                </h4>
                <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#666666' }}>
                  {producto.advertencias}
                </p>
              </div>
            </div>
          </div>
        )}

        {tabActiva === 'Combinaciones' && (
          <div>
            <p style={{ fontSize: '15px', color: '#666666', marginBottom: '32px', lineHeight: 1.7 }}>
              Este producto se complementa perfectamente con los siguientes suplementos para maximizar sus beneficios:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {producto.combinaciones.map((combo: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: '#F8FBF8', border: '1px solid #E8F0E8', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#6B8F6B', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-italiana), serif', fontSize: '20px', color: 'white' }}>V</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#111111', marginBottom: '4px' }}>{combo.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#6B8F6B' }}>✦ {combo.motivo}</div>
                    </div>
                  </div>
                  <a href={`/suplementos/producto/${combo.slug}`} style={{ padding: '8px 20px', background: '#111111', color: 'white', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.1em', borderRadius: '6px', fontWeight: 500 }}>
                    Ver producto
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {tabActiva === 'Preguntas frecuentes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {producto.faqs.map((faq: any, i: number) => (
              <div key={i} style={{ padding: '20px 24px', border: '1px solid #EEEEEE', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111111', marginBottom: '10px' }}>
                  {faq.pregunta}
                </h4>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#666666' }}>
                  {faq.respuesta}
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
