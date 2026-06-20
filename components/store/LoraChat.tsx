'use client'

import { useState, useEffect, useRef } from 'react'

type Message = {
  role: 'lora' | 'user'
  content: string
}

type ApiMessage = {
  role: 'user' | 'assistant'
  content: string
}

const SUGERENCIA_DESTACADA = '✨ Quiero una rutina para atacar un problema'

const SUGERENCIAS = [
  'Tengo piel grasa con acné, ¿qué me recomiendas?',
  'Busco más energía y mejor piel desde adentro',
  '¿Cómo puedo reducir manchas oscuras?',
]

const LIMITE = 10

export default function LoraChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensajesEnviados, setMensajesEnviados] = useState(0)
  const [limitAlcanzado, setLimitAlcanzado] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          role: 'lora',
          content: '¡Hola! Soy Lora, tu asesora personal de Vitalora ✦ Estoy aquí para ayudarte a encontrar la rutina perfecta para ti. ¿En qué te puedo ayudar hoy?',
        }])
      }, 300)
    }
  }, [open, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Convertir historial al formato que espera la API
  function buildApiMessages(historial: Message[], nuevoMensaje: string): ApiMessage[] {
    const apiMsgs: ApiMessage[] = []
    // Solo los mensajes de conversación (no el saludo inicial de Lora)
    const conversacion = historial.filter((m, i) => !(i === 0 && m.role === 'lora'))
    for (const m of conversacion) {
      apiMsgs.push({
        role: m.role === 'lora' ? 'assistant' : 'user',
        content: m.content,
      })
    }
    apiMsgs.push({ role: 'user', content: nuevoMensaje })
    return apiMsgs
  }

  async function sendMessage(texto: string) {
    if (!texto.trim() || loading || limitAlcanzado) return

    const userMsg: Message = { role: 'user', content: texto }
    const nuevoHistorial = [...messages, userMsg]
    setMessages(nuevoHistorial)
    setInput('')
    setLoading(true)

    try {
      const apiMessages = buildApiMessages(messages, texto)

      const res = await fetch('/api/lora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          sessionMessageCount: mensajesEnviados,
        }),
      })

      const data = await res.json()

      setMessages(prev => [...prev, { role: 'lora', content: data.respuesta }])
      setMensajesEnviados(prev => prev + 1)

      if (data.limitAlcanzado) {
        setLimitAlcanzado(true)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'lora',
        content: 'Lo siento, tuve un problema técnico. Intenta de nuevo en un momento 🙏',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  const mensajesRestantes = LIMITE - mensajesEnviados

  return (
    <>
      {/* Botón flotante */}
      <button
        id="loraFab"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--black)',
          color: 'var(--gold)',
          border: '1px solid var(--gold)',
          cursor: 'pointer',
          zIndex: 998,
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-italiana), serif',
          fontSize: '22px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >L</button>

      {/* Chat */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '420px',
          height: '640px',
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--bg-cream)',
          border: '1px solid var(--line)',
          borderRadius: '4px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        }}>

          {/* Header */}
          <div style={{ background: 'var(--black)', color: 'var(--bg-cream)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--gold)', flexShrink: 0 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-light, #D9BE7B))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-italiana), serif', fontSize: '20px', color: 'var(--black)', flexShrink: 0 }}>L</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '18px', letterSpacing: '0.1em' }}>LORA</div>
              <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>● Asesora · En línea</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--bg-cream)', cursor: 'pointer', opacity: 0.6, fontSize: '20px', lineHeight: 1 }}>✕</button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted, #A8A8A8)', marginBottom: '6px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.role === 'lora' ? 'Lora' : 'Tú'}
                </div>
                <div style={{
                  padding: '14px 18px',
                  fontSize: '14px',
                  lineHeight: 1.65,
                  borderRadius: '4px',
                  background: msg.role === 'user' ? 'var(--black)' : 'white',
                  color: msg.role === 'user' ? 'var(--bg-cream)' : 'var(--text, #0E0E0E)',
                  border: msg.role === 'lora' ? '1px solid var(--line, #E8E4DA)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {/* Renderizar links, negritas y cursivas en las respuestas de Lora */}
                  {msg.role === 'lora' ? (
                    <span dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em style="color:#6B6B6B;font-size:12px;">$1</em>')
                        .replace(
                          /(https?:\/\/vitalora\.com\.mx\/[^\s]+)/g,
                          '<a href="$1" target="_blank" style="color:#C9A961;text-decoration:underline;font-weight:500;">Ver producto →</a>'
                        )
                    }} />
                  ) : msg.content}
                </div>
              </div>
            ))}

            {/* Sugerencias iniciales */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {/* Sugerencia destacada: rutina completa */}
                <button onClick={() => sendMessage(SUGERENCIA_DESTACADA)}
                  style={{ background: 'var(--black)', border: '1px solid var(--gold)', padding: '14px 16px', fontFamily: 'inherit', fontSize: '13px', color: 'var(--gold)', textAlign: 'left', cursor: 'pointer', borderRadius: '2px', fontWeight: 600, letterSpacing: '0.02em', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  {SUGERENCIA_DESTACADA}
                </button>
                {SUGERENCIAS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{ background: 'white', border: '1px solid var(--line, #E8E4DA)', padding: '12px 16px', fontFamily: 'inherit', fontSize: '13px', color: 'var(--text, #0E0E0E)', textAlign: 'left', cursor: 'pointer', borderRadius: '2px', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#C9A961')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line, #E8E4DA)')}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Indicador de escritura */}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'white', border: '1px solid var(--line, #E8E4DA)', padding: '14px 18px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: '6px', height: '6px',
                      background: '#C9A961',
                      borderRadius: '50%',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid var(--line, #E8E4DA)', padding: '14px 20px', background: 'white', flexShrink: 0 }}>
            {/* Contador de mensajes */}
            {mensajesEnviados > 0 && !limitAlcanzado && (
              <p style={{ fontSize: '10px', color: mensajesRestantes <= 3 ? '#F59E0B' : 'var(--text-muted, #A8A8A8)', textAlign: 'center', marginBottom: '10px' }}>
                {mensajesRestantes} {mensajesRestantes === 1 ? 'mensaje restante' : 'mensajes restantes'} en esta sesión
              </p>
            )}

            {!limitAlcanzado ? (
              <>
                <p style={{ fontSize: '10px', color: 'var(--text-muted, #A8A8A8)', textAlign: 'center', marginBottom: '10px' }}>
                  Lora es tu asesora de bienestar. No sustituye consejo médico.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', border: '1px solid var(--line, #E8E4DA)', padding: '4px 4px 4px 16px', borderRadius: '100px' }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregúntame lo que quieras..."
                    disabled={loading}
                    style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'none', padding: '8px 0', color: 'var(--text, #0E0E0E)' }}
                  />
                  <button type="submit" disabled={loading || !input.trim()}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: loading || !input.trim() ? '#E8E4DA' : 'var(--black)', color: loading || !input.trim() ? '#A8A8A8' : 'var(--gold)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px', transition: 'all 0.15s' }}>
                    →
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted, #A8A8A8)', marginBottom: '10px' }}>
                  Sesión completada ✦
                </p>
                <a href="mailto:hola@vitalora.com.mx"
                  style={{ fontSize: '13px', color: '#C9A961', textDecoration: 'none', fontWeight: 500 }}>
                  ¿Más dudas? Escríbenos →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </>
  )
}
