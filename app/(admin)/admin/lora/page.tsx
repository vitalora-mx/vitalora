'use client'
import { useState, useEffect } from 'react'

export default function AdminLoraPage() {
  const [personalidad, setPersonalidad] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [actualizadoAt, setActualizadoAt] = useState<string | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/lora')
      const data = await res.json()
      setPersonalidad(data.personalidad || '')
      setOriginal(data.personalidad || '')
      setActualizadoAt(data.actualizado_at || null)
    } catch {
      setMensaje('Error al cargar la configuración.')
    }
    setLoading(false)
  }

  async function guardar() {
    if (personalidad.trim().length < 50) {
      setMensaje('La personalidad debe tener al menos 50 caracteres.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/lora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalidad }),
      })
      const data = await res.json()
      if (data.error) {
        setMensaje('Error: ' + data.error)
      } else {
        setMensaje('✓ Personalidad de LORA guardada. Los cambios se aplican en unos minutos.')
        setOriginal(personalidad)
        setActualizadoAt(new Date().toISOString())
      }
    } catch {
      setMensaje('Error al guardar.')
    }
    setGuardando(false)
    setTimeout(() => setMensaje(''), 5000)
  }

  const hayCambios = personalidad !== original

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0E0E0E', margin: 0 }}>LORA — Asistente de la tienda</h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '6px', lineHeight: 1.6 }}>
          Aquí defines la personalidad e instrucciones de LORA. El catálogo de productos se agrega solo automáticamente, así que no necesitas incluirlo aquí.
        </p>
      </div>

      {actualizadoAt && (
        <p style={{ fontSize: '12px', color: '#A8A8A8', marginBottom: '20px' }}>
          Última actualización: {new Date(actualizadoAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}

      <div style={{ padding: '14px 16px', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#8B7530', lineHeight: 1.6, margin: 0 }}>
          💡 <strong>Consejo:</strong> escribe en segunda persona ("Eres Lora…", "Tu misión es…"). Puedes ajustar su tono, las preguntas del diagnóstico, las reglas de recomendación y el aviso médico. Evita borrar el aviso médico por seguridad de los clientes.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#6B6B6B' }}>Cargando…</p>
      ) : (
        <>
          <textarea
            value={personalidad}
            onChange={e => setPersonalidad(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '460px',
              padding: '16px',
              border: '1px solid #E8E4DA',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              lineHeight: 1.7,
              color: '#2C2C2C',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical',
              background: 'white',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button
              onClick={guardar}
              disabled={guardando || !hayCambios}
              style={{
                padding: '12px 28px',
                background: (guardando || !hayCambios) ? '#C9C4BA' : '#0E0E0E',
                color: (guardando || !hayCambios) ? '#fff' : '#C9A961',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: (guardando || !hayCambios) ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>

            {hayCambios && (
              <button
                onClick={() => setPersonalidad(original)}
                disabled={guardando}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  color: '#6B6B6B',
                  border: '1px solid #DDD',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Descartar
              </button>
            )}

            {mensaje && (
              <span style={{ fontSize: '13px', color: mensaje.startsWith('Error') ? '#EF4444' : '#6A8A62' }}>
                {mensaje}
              </span>
            )}
          </div>

          <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '12px' }}>
            {personalidad.length.toLocaleString('es-MX')} caracteres
          </p>
        </>
      )}
    </div>
  )
}
