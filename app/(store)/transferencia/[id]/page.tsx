'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const DATOS_BANCARIOS = {
  clabe: '722969020946634146',
  beneficiario: 'VANGUARDIA IMPORTACIONES & LOGISTICA DE MEXICO',
  institucion: 'Mercado Pago W',
}

interface PedidoTransferencia {
  id: number
  estado: string
  total: number
  nombre: string
  limite: string
  tieneComprobante: boolean
}

export default function TransferenciaPage() {
  const params = useParams()
  const id = params?.id as string

  const [pedido, setPedido] = useState<PedidoTransferencia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [exito, setExito] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState('')
  const [copiado, setCopiado] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transferencia/comprobante?id=${id}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setPedido(data.pedido)
        // Mostrar éxito solo si está en revisión (ya subió y no fue rechazado).
        // Si fue rechazado, dejamos que vuelva a subir.
        if (data.pedido.estado === 'comprobante_en_revision') {
          setExito(true)
        }
      }
    } catch {
      setError('No se pudo cargar el pedido.')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  // Contador de tiempo restante
  useEffect(() => {
    if (!pedido?.limite || exito) return
    const interval = setInterval(() => {
      const ahora = Date.now()
      const limite = new Date(pedido.limite).getTime()
      const diff = limite - ahora
      if (diff <= 0) {
        setTiempoRestante('Tiempo agotado')
        clearInterval(interval)
      } else {
        const min = Math.floor(diff / 60000)
        const seg = Math.floor((diff % 60000) / 1000)
        setTiempoRestante(`${min}:${seg.toString().padStart(2, '0')}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [pedido, exito])

  function copiar(texto: string, campo: string) {
    navigator.clipboard.writeText(texto)
    setCopiado(campo)
    setTimeout(() => setCopiado(''), 2000)
  }

  async function subirComprobante() {
    if (!archivo) {
      setError('Selecciona tu comprobante primero.')
      return
    }
    setSubiendo(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', archivo)
      fd.append('pedidoId', id)
      const res = await fetch('/api/transferencia/comprobante', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setExito(true)
    } catch {
      setError('Error al subir el comprobante. Intenta de nuevo.')
    }
    setSubiendo(false)
  }

  if (loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Cargando…</div>
  }

  if (error && !pedido) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', color: '#333', marginBottom: '16px' }}>{error}</p>
        <Link href="/" style={{ color: '#C9A961', textDecoration: 'none' }}>Volver al inicio</Link>
      </div>
    )
  }

  // Pantalla de éxito (comprobante ya subido)
  if (exito) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E8F0E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>✓</div>
        <h1 style={{ fontSize: '26px', color: '#0E0E0E', marginBottom: '12px' }}>Comprobante recibido</h1>
        <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, marginBottom: '24px' }}>
          Gracias. Hemos recibido tu comprobante de pago para el pedido <strong>#{pedido?.id}</strong>.
        </p>
        <div style={{ background: '#FAF7F0', border: '1px solid #E8E0D5', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, margin: '0 0 12px' }}>
            Estamos verificando tu transferencia. La confirmación de tu pedido puede tardar hasta <strong>24 horas hábiles</strong> (los sábados, domingos y días festivos no se consideran días hábiles). Te enviaremos un correo cuando tu pago sea confirmado.
          </p>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, margin: 0 }}>
            Si hay algún problema con tu pago, nos pondremos en contacto contigo por teléfono o WhatsApp.
          </p>
        </div>
        <Link href="/" style={{ display: 'inline-block', padding: '14px 28px', background: '#0E0E0E', color: '#C9A961', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>Volver a la tienda</Link>
      </div>
    )
  }

  const tiempoAgotado = (tiempoRestante === 'Tiempo agotado' || pedido?.estado === 'cancelado_sin_pago') && pedido?.estado !== 'comprobante_rechazado'

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#C9A961', marginBottom: '8px' }}>PAGO POR TRANSFERENCIA</div>
        <h1 style={{ fontSize: '26px', color: '#0E0E0E', marginBottom: '8px' }}>Completa tu pago</h1>
        <p style={{ fontSize: '14px', color: '#888' }}>Pedido #{pedido?.id}</p>
      </div>

      {tiempoAgotado ? (
        <div style={{ background: '#FDEEEE', border: '1px solid #F0C0C0', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', color: '#B91C1C', lineHeight: 1.7, margin: 0 }}>
            El tiempo para realizar esta transferencia ha vencido y el pedido fue cancelado. Si ya realizaste el pago, contáctanos en hola@vitalora.com.mx
          </p>
        </div>
      ) : (
        <>
          {/* Contador */}
          <div style={{ background: '#0E0E0E', borderRadius: '8px', padding: '16px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(245,240,232,0.6)', marginBottom: '4px' }}>Tienes hasta 2 horas para completar tu pago</div>
            <div style={{ fontSize: '28px', color: '#C9A961', fontWeight: 600, fontFamily: 'monospace' }}>{tiempoRestante || '…'}</div>
          </div>

          {/* Monto */}
          <div style={{ background: '#FAF7F0', border: '1px solid #E8E0D5', borderRadius: '8px', padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>Monto exacto a transferir</div>
            <div style={{ fontSize: '36px', color: '#0E0E0E', fontWeight: 700 }}>${pedido?.total?.toLocaleString('es-MX')} <span style={{ fontSize: '18px', color: '#888' }}>MXN</span></div>
          </div>

          {/* Datos bancarios */}
          <div style={{ background: 'white', border: '1px solid #E8E0D5', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '16px', fontWeight: 600 }}>Datos para tu transferencia</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>CLABE interbancaria</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '18px', color: '#0E0E0E', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.02em' }}>{DATOS_BANCARIOS.clabe}</span>
                <button onClick={() => copiar(DATOS_BANCARIOS.clabe, 'clabe')} style={{ padding: '6px 12px', background: copiado === 'clabe' ? '#E8F0E5' : '#F5F0E8', border: 'none', borderRadius: '4px', fontSize: '12px', color: copiado === 'clabe' ? '#3F6B33' : '#8B7530', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {copiado === 'clabe' ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #F0EDE5' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Beneficiario</div>
              <div style={{ fontSize: '14px', color: '#0E0E0E', fontWeight: 500 }}>{DATOS_BANCARIOS.beneficiario}</div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid #F0EDE5' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Institución / Banco</div>
              <div style={{ fontSize: '14px', color: '#0E0E0E', fontWeight: 500 }}>{DATOS_BANCARIOS.institucion}</div>
            </div>
          </div>

          {/* Instrucciones */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', color: '#0E0E0E', fontWeight: 600, marginBottom: '12px' }}>¿Cómo completar tu pago?</div>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '14px', lineHeight: 1.8 }}>
              <li>Desde tu app bancaria, transfiere el <strong>monto exacto</strong> a la CLABE de arriba.</li>
              <li>Guarda o toma captura de tu <strong>comprobante de pago</strong>.</li>
              <li>Súbelo aquí abajo para que confirmemos tu pedido.</li>
            </ol>
          </div>

          {/* Aviso si el comprobante fue rechazado */}
          {pedido?.estado === 'comprobante_rechazado' && (
            <div style={{ background: '#FDEEEE', border: '1px solid #F0C0C0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#B91C1C', lineHeight: 1.6, margin: 0 }}>
                Hubo un problema con tu comprobante anterior. Por favor revisa que sea el archivo correcto y súbelo de nuevo. Si tienes dudas, te contactaremos por teléfono o WhatsApp.
              </p>
            </div>
          )}

          {/* Subida de comprobante */}
          <div style={{ background: '#FAF7F0', border: '2px dashed #D9C9A8', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#0E0E0E', fontWeight: 600, marginBottom: '16px' }}>Sube tu comprobante de pago</div>

            <label htmlFor="archivo-comprobante" style={{ display: 'inline-block', cursor: 'pointer', padding: '14px 28px', background: 'white', border: '2px solid #C9A961', borderRadius: '6px', color: '#8B7530', fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>
              📎 Seleccionar archivo
            </label>
            <input
              id="archivo-comprobante"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={e => setArchivo(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />

            {archivo ? (
              <div style={{ fontSize: '13px', color: '#3F6B33', marginBottom: '16px', fontWeight: 500 }}>✓ {archivo.name}</div>
            ) : (
              <div style={{ fontSize: '12px', color: '#A8A8A8', marginBottom: '16px' }}>Ningún archivo seleccionado</div>
            )}

            <p style={{ fontSize: '12px', color: '#A8A8A8', marginBottom: '16px' }}>Imágenes (JPG, PNG) o PDF · máximo 5MB</p>
            <button
              onClick={subirComprobante}
              disabled={subiendo || !archivo}
              style={{ width: '100%', padding: '14px', background: (subiendo || !archivo) ? '#C9C4BA' : '#0E0E0E', color: (subiendo || !archivo) ? '#fff' : '#C9A961', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: (subiendo || !archivo) ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {subiendo ? 'Subiendo…' : 'Enviar comprobante'}
            </button>
          </div>

          {error && <p style={{ fontSize: '13px', color: '#B91C1C', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

          <div style={{ background: '#FAF7F0', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
              Una vez que subas tu comprobante, la confirmación de tu pedido puede tardar hasta <strong>24 horas hábiles</strong> (sin contar sábados, domingos y días festivos).
            </p>
          </div>
        </>
      )}
    </div>
  )
}
