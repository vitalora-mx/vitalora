'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Regimen { codigo: string; descripcion: string }

// Usos de CFDI mas comunes (catalogo SAT)
const USOS_CFDI = [
  { codigo: 'G01', descripcion: 'Adquisición de mercancías' },
  { codigo: 'G03', descripcion: 'Gastos en general' },
  { codigo: 'I01', descripcion: 'Construcciones' },
  { codigo: 'I02', descripcion: 'Mobiliario y equipo de oficina' },
  { codigo: 'I04', descripcion: 'Equipo de cómputo y accesorios' },
  { codigo: 'D01', descripcion: 'Honorarios médicos, dentales y hospitalarios' },
  { codigo: 'D10', descripcion: 'Pagos por servicios educativos' },
  { codigo: 'S01', descripcion: 'Sin efectos fiscales' },
  { codigo: 'CP01', descripcion: 'Pagos' },
]

export default function FacturacionPage() {
  const isMobile = useIsMobile()
  const [paso, setPaso] = useState(1)
  const [regimenes, setRegimenes] = useState<Regimen[]>([])

  // Paso 1
  const [pedidoId, setPedidoId] = useState('')
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')

  // Datos del pedido encontrado
  const [pedidoInfo, setPedidoInfo] = useState<{ id: number; total: number; forma_pago: string; fuera_de_mes: boolean } | null>(null)

  // Paso 2 (datos fiscales)
  const [fiscal, setFiscal] = useState({ rfc: '', razonSocial: '', cpFiscal: '', regimenFiscal: '', usoCfdi: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    fetch('/api/cuenta/regimenes')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRegimenes(d) })
      .catch(() => {})
  }, [])

  async function buscarPedido() {
    setError('')
    if (!pedidoId.trim() || !email.trim()) {
      setError('Escribe tu número de pedido y el correo con el que compraste.')
      return
    }
    setBuscando(true)
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'buscar', pedidoId, email }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setPedidoInfo(data.pedido)
        setPaso(2)
      } else {
        setError(data.error || 'No pudimos verificar tu pedido.')
      }
    } catch {
      setError('Hubo un problema. Intenta de nuevo.')
    }
    setBuscando(false)
  }

  async function enviarSolicitud() {
    setError('')
    if (!fiscal.rfc.trim() || !fiscal.razonSocial.trim() || !fiscal.cpFiscal.trim() || !fiscal.regimenFiscal || !fiscal.usoCfdi) {
      setError('Por favor llena todos los datos fiscales.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'enviar',
          pedidoId: pedidoInfo?.id,
          email,
          total: pedidoInfo?.total,
          formaPago: pedidoInfo?.forma_pago,
          rfc: fiscal.rfc,
          razonSocial: fiscal.razonSocial,
          cpFiscal: fiscal.cpFiscal,
          regimenFiscal: fiscal.regimenFiscal,
          usoCfdi: fiscal.usoCfdi,
        }),
      })
      if (res.ok) {
        setEnviado(true)
      } else {
        const data = await res.json()
        setError(data.error || 'No se pudo enviar la solicitud.')
      }
    } catch {
      setError('Hubo un problema. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '14px 16px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)', background: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <main style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: isMobile ? '40px 16px 60px' : '72px 40px 100px' }}>

        <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '44px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>Facturación electrónica</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: isMobile ? '36px' : '48px', color: 'var(--black)', lineHeight: 1.1, marginBottom: '16px' }}>Solicita tu factura</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto' }}>
            Si compraste como invitado, aquí puedes solicitar tu factura (CFDI). Recuerda que las facturas solo pueden emitirse dentro del mismo mes de la compra.
          </p>
        </div>

        {enviado ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'var(--gold)', marginBottom: '16px' }}>✦</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', color: 'var(--black)', marginBottom: '12px' }}>¡Solicitud enviada!</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Recibimos tus datos fiscales. Tu factura será emitida y enviada al correo <strong>{email}</strong> en los próximos días hábiles.
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', padding: isMobile ? '24px 20px' : '40px', borderRadius: '12px', border: '1px solid var(--line)' }}>

            {/* PASO 1: buscar pedido */}
            {paso === 1 && (
              <>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', color: 'var(--black)', marginBottom: '20px' }}>Paso 1: Identifica tu compra</h3>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Número de pedido *</label>
                  <input value={pedidoId} onChange={e => setPedidoId(e.target.value)} placeholder="Ej: 1234 (lo encuentras en tu correo de confirmación)" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Correo de la compra *</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="El correo con el que compraste" style={inputStyle} />
                </div>

                {error && <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#FFF5F5', border: '1px solid #F0C0C0', borderRadius: '8px', fontSize: '13px', color: '#C0392B' }}>{error}</div>}

                <button onClick={buscarPedido} disabled={buscando} style={{ width: '100%', padding: '16px', background: 'var(--black)', color: 'var(--bg-cream)', border: 'none', borderRadius: '100px', fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, cursor: buscando ? 'default' : 'pointer', opacity: buscando ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {buscando ? 'Verificando...' : 'Continuar'}
                </button>
              </>
            )}

            {/* PASO 2: datos fiscales */}
            {paso === 2 && pedidoInfo && (
              <>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', color: 'var(--black)', marginBottom: '8px' }}>Paso 2: Tus datos fiscales</h3>
                <div style={{ marginBottom: '24px', padding: '14px 16px', background: '#F9F9F5', borderRadius: '8px', border: '1px solid #E5E5D5', fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                  <strong>Pedido #{pedidoInfo.id}</strong> · Total ${Number(pedidoInfo.total).toLocaleString()} MXN<br />
                  Forma de pago: <strong>{pedidoInfo.forma_pago}</strong>
                </div>

                {pedidoInfo.fuera_de_mes && (
                  <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#FFF8EC', border: '1px solid #E8D5A0', borderRadius: '8px', fontSize: '13px', color: '#8A6D2F' }}>
                    Atención: este pedido es de un mes anterior. Las facturas normalmente solo pueden emitirse dentro del mismo mes de compra. Puedes enviar la solicitud, pero es posible que ya no sea facturable.
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>RFC *</label>
                  <input value={fiscal.rfc} onChange={e => setFiscal({ ...fiscal, rfc: e.target.value.toUpperCase() })} placeholder="Tu RFC" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Razón social *</label>
                  <input value={fiscal.razonSocial} onChange={e => setFiscal({ ...fiscal, razonSocial: e.target.value })} placeholder="Nombre o razón social" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>Código postal fiscal *</label>
                    <input value={fiscal.cpFiscal} onChange={e => setFiscal({ ...fiscal, cpFiscal: e.target.value })} placeholder="5 dígitos" maxLength={5} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Régimen fiscal *</label>
                    <select value={fiscal.regimenFiscal} onChange={e => setFiscal({ ...fiscal, regimenFiscal: e.target.value })} style={inputStyle}>
                      <option value="">Selecciona...</option>
                      {regimenes.map(r => <option key={r.codigo} value={`${r.codigo} — ${r.descripcion}`}>{r.codigo} — {r.descripcion}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Uso de CFDI *</label>
                  <select value={fiscal.usoCfdi} onChange={e => setFiscal({ ...fiscal, usoCfdi: e.target.value })} style={inputStyle}>
                    <option value="">Selecciona...</option>
                    {USOS_CFDI.map(u => <option key={u.codigo} value={`${u.codigo} — ${u.descripcion}`}>{u.codigo} — {u.descripcion}</option>)}
                  </select>
                </div>

                {error && <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#FFF5F5', border: '1px solid #F0C0C0', borderRadius: '8px', fontSize: '13px', color: '#C0392B' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <button onClick={() => { setPaso(1); setError('') }} style={{ flex: 1, padding: '16px', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--line)', borderRadius: '100px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Atrás
                  </button>
                  <button onClick={enviarSolicitud} disabled={enviando} style={{ flex: 2, padding: '16px', background: 'var(--black)', color: 'var(--bg-cream)', border: 'none', borderRadius: '100px', fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.6 : 1, fontFamily: 'inherit' }}>
                    {enviando ? 'Enviando...' : 'Solicitar factura'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
      <LoraChat />
    </main>
  )
}
