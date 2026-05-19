'use client'

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
  return (
    <div style={{
      background: '#FFFFFF',
      borderBottom: '2px solid #EEEEEE',
      padding: '0 40px',
      overflowX: 'auto',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        gap: '0',
        alignItems: 'center',
      }}>
        {/* Botón Todas */}
        <button
          onClick={() => setCategoriaActiva('Todas')}
          style={{
            padding: '18px 24px',
            border: 'none',
            borderBottom: categoriaActiva === 'Todas' ? '2px solid #333333' : '2px solid transparent',
            background: 'none',
            color: categoriaActiva === 'Todas' ? '#111111' : '#888888',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: categoriaActiva === 'Todas' ? 700 : 400,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            marginBottom: '-2px',
          }}
        >
          Todas
        </button>

        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCategoriaActiva(c)}
            style={{
              padding: '18px 24px',
              border: 'none',
              borderBottom: categoriaActiva === c ? '2px solid #333333' : '2px solid transparent',
              background: 'none',
              color: categoriaActiva === c ? '#111111' : '#888888',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: categoriaActiva === c ? 700 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              marginBottom: '-2px',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}