'use client'

// Campo de contraseña con botón de ojo para mostrarla u ocultarla.
// Lo usan /cuenta, /rewards (InscripcionRewards) y /recuperar/nueva.
// `visible` y `onAlternar` vienen de fuera para que contraseña y confirmación
// se muestren u oculten juntas con un solo estado.

function Ojo({ abierto }: { abierto: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!abierto && <path d="M4 4l16 16" />}
    </svg>
  )
}

export default function CampoContrasena({
  id, etiqueta, valor, onCambio, visible, onAlternar,
  autoComplete = 'current-password', placeholder, onEnter, estiloEtiqueta, estiloInput,
}: {
  id: string
  etiqueta: string
  valor: string
  onCambio: (v: string) => void
  visible: boolean
  onAlternar: () => void
  autoComplete?: 'current-password' | 'new-password'
  placeholder?: string
  onEnter?: () => void
  estiloEtiqueta?: React.CSSProperties
  estiloInput?: React.CSSProperties
}) {
  return (
    <div>
      <label htmlFor={id} style={estiloEtiqueta}>{etiqueta}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={valor}
          onChange={e => onCambio(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter() }}
          placeholder={placeholder}
          style={{ ...estiloInput, paddingRight: '48px' }}
        />
        <button
          type="button"
          onClick={onAlternar}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          style={{
            position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A8A', padding: 0,
          }}
        >
          <Ojo abierto={!visible} />
        </button>
      </div>
    </div>
  )
}
