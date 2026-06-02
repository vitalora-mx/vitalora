'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

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
  const isMobile = useIsMobile()

  function botonStyle(activo: boolean): React.CSSProperties {
    return {
      padding: isMobile ? '8px 14px' : '10px 20px',
      border: '1px solid',
      borderColor: activo ? 'var(--gold)' : '#E8E0D5',
      borderRadius: '100px',
      background: activo ? 'var(--gold)' : 'white',
      color: activo ? 'white' : '#2C2C2C',
      fontSize: isMobile ? '11px' : '12px',
      letterSpacing: '0.08em',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: activo ? 500 : 300,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }
  }

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #E8E0D5',
      padding: isMobile ? '20px 16px' : '32px 40px',
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
          marginBottom: isMobile ? '14px' : '20px',
        }}>
          Explora por categoría
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          justifyContent: isMobile ? 'flex-start' : 'center',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '8px' : 0,
          WebkitOverflowScrolling: 'touch',
        }}>
          <button onClick={() => setRutinaActiva('Todas')} style={botonStyle(rutinaActiva === 'Todas')}>
            ✦ Todas
          </button>
          {rutinas.map((r) => (
            <button key={r.nombre} onClick={() => setRutinaActiva(r.nombre)} style={botonStyle(rutinaActiva === r.nombre)}>
              <span>{r.icono}</span>
              {r.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
