'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

const categorias = [
  'Antioxidantes', 'Cabello y Piel', 'Colágeno', 'Digestión',
  'Energía', 'Kits', 'Minerales', 'Omega 3',
  'Probióticos', 'Proteínas', 'Sueño', 'Vitaminas',
]

interface Props {
  categoriaActiva: string
  setCategoriaActiva: (c: string) => void
}

export default function SuplementosCategorias({ categoriaActiva, setCategoriaActiva }: Props) {
  const isMobile = useIsMobile()

  function btnStyle(activo: boolean): React.CSSProperties {
    return {
      padding: isMobile ? '14px 16px' : '18px 24px',
      border: 'none',
      borderBottom: activo ? '2px solid #333333' : '2px solid transparent',
      background: 'none',
      color: activo ? '#111111' : '#888888',
      fontSize: isMobile ? '11px' : '12px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      fontWeight: activo ? 700 : 400,
      cursor: 'pointer',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s',
      marginBottom: '-2px',
    }
  }

  return (
    <div style={{
      background: '#FFFFFF',
      borderBottom: '2px solid #EEEEEE',
      padding: isMobile ? '0 16px' : '0 40px',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        gap: '0',
        alignItems: 'center',
      }}>
        <button onClick={() => setCategoriaActiva('Todas')} style={btnStyle(categoriaActiva === 'Todas')}>
          Todas
        </button>
        {categorias.map((c) => (
          <button key={c} onClick={() => setCategoriaActiva(c)} style={btnStyle(categoriaActiva === c)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
