'use client'

import { useState } from 'react'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function ContactoPage() {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', numeroPedido: '', mensaje: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim() || !form.telefono.trim() || !form.mensaje.trim()) {
      setError('Por favor llena nombre, teléfono y mensaje.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/cuenta/ayuda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setEnviado(true)
      } else {
        setError('Hubo un problema al enviar. Intenta de nuevo.')
      }
    } catch {
      setError('Hubo un problema al enviar. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '8px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text)',
    background: 'white',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <main style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: isMobile ? '40px 16px 60px' : '72px 40px 100px' }}>

        <div style={{ textAlign: 'center', marginBottom: isMobile ? '36px' : '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>Estamos para ayudarte</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: isMobile ? '36px' : '48px', color: 'var(--black)', lineHeight: 1.1, marginBottom: '16px' }}>Contacto</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
            ¿Tienes una duda sobre un producto o tu pedido? Escríbenos y te responderemos lo antes posible.
          </p>
        </div>

        {enviado ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'var(--gold)', marginBottom: '16px' }}>✦</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', color: 'var(--black)', marginBottom: '12px' }}>¡Mensaje enviado!</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Gracias por escribirnos. Te responderemos muy pronto al medio de contacto que nos proporcionaste.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: isMobile ? '24px 20px' : '40px', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono / WhatsApp *</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="10 dígitos" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>No. de Pedido (opcional)</label>
                <input name="numeroPedido" value={form.numeroPedido} onChange={handleChange} placeholder="Ej: 1234" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Mensaje *</label>
              <textarea name="mensaje" value={form.mensaje} onChange={handleChange} placeholder="¿En qué podemos ayudarte?" rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#FFF5F5', border: '1px solid #F0C0C0', borderRadius: '8px', fontSize: '13px', color: '#C0392B' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={enviando} style={{
              width: '100%',
              padding: '16px',
              background: 'var(--black)',
              color: 'var(--bg-cream)',
              border: 'none',
              borderRadius: '100px',
              fontSize: '12px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: enviando ? 'default' : 'pointer',
              opacity: enviando ? 0.6 : 1,
              fontFamily: 'inherit',
            }}>
              {enviando ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
      <Footer />
      <LoraChat />
    </main>
  )
}
