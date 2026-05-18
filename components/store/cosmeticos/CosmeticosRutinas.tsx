'use client'

const rutinas = [
  { nombre: 'Limpiador & Exfoliante', icono: '🧴' },
  { nombre: 'Tónico & Mist', icono: '💧' },
  { nombre: 'Sérum', icono: '✨' },
  { nombre: 'Crema & Balm', icono: '🫧' },
  { nombre: 'Protector Solar', icono: '☀️' },
  { nombre: 'Cuidado de Ojos', icono: '👁️' },
  { nombre: 'Mascarillas & Parche', icono: '🎭' },
  { nombre: 'Parches para Acné', icono: '🩹' },
  { nombre: 'Labios', icono: '💋' },
  { nombre: 'Make Up', icono: '💄' },
  { nombre: 'Cuidado del Cabello', icono: '🌿' },
  { nombre: 'Beauty Dispositivo', icono: '⚡' },
  { nombre: 'Kits', icono: '🎁' },
  { nombre: 'Cuidado Corporal', icono: '🌸' },
]

interface Props {
  rutinaActiva: string
  setRutinaActiva: (r: string) => void
}

export default function CosmeticosRutinas({ rutinaActiva, setRutinaActiva }: Props) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #E8E0D5',
      padding: '32px 40px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          Explora por categoría
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => setRutinaActiva('Todas')}
            style={{
              padding: '10px 20px',
              border: '1px solid',
              borderColor: rutinaActiva === 'Todas' ? 'var(--gold)' : '#E8E0D5',
              borderRadius: '100px',
              background: rutinaActiva === 'Todas' ? 'var(--gold)' : 'white',
              color: rutinaActiva === 'Todas' ? 'white' : '#2C2C2C',
              fontSize: '12px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: rutinaActiva === 'Todas' ? 500 : 300,
              transition: 'all 0.2s',
            }}
          >
            ✦ Todas
          </button>
          {rutinas.map((r) => (
            <button
              key={r.nombre}
              onClick={() => setRutinaActiva(r.nombre)}
              style={{
                padding: '10px 20px',
                border: '1px solid',
                borderColor: rutinaActiva === r.nombre ? 'var(--gold)' : '#E8E0D5',
                borderRadius: '100px',
                background: rutinaActiva === r.nombre ? 'var(--gold)' : 'white',
                color: rutinaActiva === r.nombre ? 'white' : '#2C2C2C',
                fontSize: '12px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: rutinaActiva === r.nombre ? 500 : 300,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{r.icono}</span>
              {r.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}