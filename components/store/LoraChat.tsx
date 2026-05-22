'use client'

import { useState, useEffect, useRef } from 'react'

type Message = {
  role: 'lora' | 'user'
  content: string
}

const suggestions = [
  { text: 'Tengo piel grasa con acné, ¿qué me recomiendas?', prompt: 'piel-grasa' },
  { text: 'Quiero una rutina anti-edad completa', prompt: 'antiedad' },
  { text: 'Busco más energía y mejor piel', prompt: 'energia' },
  { text: '¿Puedo combinar Vitamina C con retinol?', prompt: 'combinar' },
]

const responses: Record<string, string> = {
  'piel-grasa': 'Para piel grasa con acné te recomiendo una rutina de 3 pasos: limpieza con espuma doble, sérum de ácido hialurónico ligero y protector solar sin aceite. El zinc también ayuda mucho desde dentro. ¿Quieres que te muestre los productos específicos?',
  'antiedad': 'Para anti-edad lo mejor es combinar Vitamina C en la mañana (antioxidante) con un sérum regenerador en la noche. El colágeno marino oral potencia los resultados desde dentro. ¿Te armo una rutina completa?',
  'energia': 'Para energía y mejor piel te recomiendo nuestro Vital Defense Pro con complejo B y adaptógenos coreanos, combinado con el Hydra Glow Essence para el exterior. Resultados visibles en 3-4 semanas.',
  'combinar': 'Sí se puede pero con cuidado. Vitamina C en la mañana y retinol en la noche — nunca juntos. Siempre con protector solar de día. Empieza el retinol 2-3 veces por semana e incrementa gradualmente.',
}

export default function LoraChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          role: 'lora',
          content: '¡Hola! Soy Lora, tu asesora personal de Vitalora ✦ Estoy aquí para ayudarte a encontrar la rutina perfecta. ¿En qué te puedo ayudar hoy?',
        }])
      }, 300)
    }
  }, [open, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSuggestion(prompt: string, text: string) {
    sendMessage(text, prompt)
  }

  function sendMessage(text: string, prompt?: string) {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setTimeout(() => {
      const key = prompt || 'default'
      const reply = responses[key] || 'Esa es una excelente pregunta. En este momento estoy en versión de prueba — pronto tendré acceso completo al catálogo de Vitalora para darte la mejor recomendación personalizada.'
      setMessages(prev => [...prev, { role: 'lora', content: reply }])
      setLoading(false)
    }, 1200)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

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
        }}
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
          <div style={{ background: 'var(--black)', color: 'var(--bg-cream)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--gold)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-italiana), serif', fontSize: '20px', color: 'var(--black)', flexShrink: 0 }}>L</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '18px', letterSpacing: '0.1em' }}>LORA</div>
              <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>● Asesora · En línea</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--bg-cream)', cursor: 'pointer', opacity: 0.6, fontSize: '20px' }}>✕</button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-cream)' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.role === 'lora' ? 'Lora' : 'Tú'}</div>
                <div style={{ padding: '14px 18px', fontSize: '14px', lineHeight: 1.6, borderRadius: '4px', background: msg.role === 'user' ? 'var(--black)' : 'white', color: msg.role === 'user' ? 'var(--bg-cream)' : 'var(--text)', border: msg.role === 'lora' ? '1px solid var(--line)' : 'none' }}>{msg.content}</div>
              </div>
            ))}
            {messages.length === 1 && !loading && messages[0].role === 'lora' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {suggestions.map((s) => (
                  <button key={s.prompt} onClick={() => handleSuggestion(s.prompt, s.text)} style={{ background: 'white', border: '1px solid var(--line)', padding: '12px 16px', fontFamily: 'inherit', fontSize: '13px', color: 'var(--text)', textAlign: 'left', cursor: 'pointer', borderRadius: '2px' }}>{s.text}</button>
                ))}
              </div>
            )}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'white', border: '1px solid var(--line)', padding: '14px 18px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map((i) => (<div key={i} style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%' }} />))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid var(--line)', padding: '16px 20px', background: 'white' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px' }}>Lora es tu asesora de bienestar. No sustituye consejo médico.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', border: '1px solid var(--line)', padding: '4px 4px 4px 16px', borderRadius: '100px' }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pregúntame lo que quieras..." style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'none', padding: '8px 0', color: 'var(--text)' }} />
              <button type="submit" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--black)', color: 'var(--gold)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>→</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}