'use client'

import { useEffect, useState } from 'react'
import { mensajeCompartir } from '@/lib/rewards-config'

// Código personal de Rewards con botones de copiar y compartir.
export default function TarjetaCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false)
  const [puedeCompartir, setPuedeCompartir] = useState(false)

  // navigator.share solo existe en algunos navegadores (sobre todo celulares)
  useEffect(() => { setPuedeCompartir(typeof navigator !== 'undefined' && typeof navigator.share === 'function') }, [])
  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
    } catch {
      window.prompt('Copia tu código:', codigo)
    }
  }

  async function compartir() {
    try { await navigator.share({ text: mensajeCompartir(codigo) }) } catch { /* el cliente cerró el menú */ }
  }

  const boton: React.CSSProperties = {
    flex: '1 1 0', minWidth: 0, padding: '12px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
    textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap', transition: 'background-color 150ms ease, color 150ms ease',
  }

  return (
    <div style={{ background: '#0E0E0E', borderRadius: '8px', padding: '28px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.6)', margin: '0 0 10px' }}>Tu código personal</p>
      <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 9vw, 44px)', letterSpacing: '0.14em', color: '#C9A961', lineHeight: 1.1, marginBottom: '24px', userSelect: 'all' }}>
        {codigo}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={copiar} style={{ ...boton, background: copiado ? '#C9A961' : 'transparent', color: copiado ? '#0E0E0E' : '#C9A961', border: '1px solid #C9A961' }}>
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(mensajeCompartir(codigo))}`} target="_blank" rel="noopener noreferrer"
          style={{ ...boton, background: '#C9A961', color: '#0E0E0E', border: '1px solid #C9A961' }}>
          WhatsApp
        </a>
        {puedeCompartir && (
          <button type="button" onClick={compartir} style={{ ...boton, background: 'transparent', color: '#F5F0E8', border: '1px solid rgba(245,240,232,0.4)' }}>
            Compartir
          </button>
        )}
      </div>
    </div>
  )
}
