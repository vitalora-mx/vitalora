'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchCliente } from '@/store/authStore'
import TarjetaCodigo from '@/components/store/rewards/TarjetaCodigo'

interface Movimiento {
  id: number; fecha: string; concepto: string; detalle: string | null
  puntos: number; estado: 'pendiente' | 'acreditado' | 'cancelado'
}
interface DatosMonedero {
  miembro: { codigo: string; estado: 'activo' | 'suspendido' | 'eliminado' } | null
  saldo?: { disponibles: number; pendientes: number }
  movimientos?: Movimiento[]
  hayMas?: boolean
}

const puntosTexto = (n: number) => `${n.toLocaleString('es-MX')} ${Math.abs(n) === 1 ? 'punto' : 'puntos'}`

// Pestaña "Rewards" de Mi cuenta.
export default function MonederoRewards({ isMobile }: { isMobile: boolean }) {
  const [datos, setDatos] = useState<DatosMonedero | null>(null)
  const [error, setError] = useState('')
  const [cargandoMas, setCargandoMas] = useState(false)

  async function cargar() {
    setError('')
    const res = await fetchCliente('/api/rewards/mi-cuenta')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error || 'No pudimos cargar tu Monedero. Intenta de nuevo.'); return }
    setDatos(data)
  }
  useEffect(() => { cargar() }, [])

  async function verMas() {
    const lista = datos?.movimientos ?? []
    if (!lista.length) return
    setCargandoMas(true)
    const res = await fetchCliente(`/api/rewards/mi-cuenta?antesDe=${lista[lista.length - 1].id}`)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setDatos(d => d && ({ ...d, movimientos: [...(d.movimientos ?? []), ...(data.movimientos ?? [])], hayMas: !!data.hayMas }))
    setCargandoMas(false)
  }

  const tarjeta: React.CSSProperties = { background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #E5E5E5' }

  if (error) {
    return (
      <div style={tarjeta}>
        <p style={{ fontSize: '14px', color: '#A33', marginBottom: '16px' }}>{error}</p>
        <button onClick={cargar} style={{ padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Reintentar</button>
      </div>
    )
  }
  if (!datos) return <div style={{ ...tarjeta, color: '#888', fontSize: '14px' }}>Cargando tu Monedero…</div>

  // No es miembro: invitación
  if (!datos.miembro) {
    return (
      <div style={{ ...tarjeta, textAlign: 'center', padding: isMobile ? '32px 20px' : '48px 32px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>Vitalora Rewards</p>
        <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '30px', color: 'var(--black)', marginBottom: '12px', fontWeight: 400 }}>Comparte lo que amas y gana puntos</h2>
        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, maxWidth: '460px', margin: '0 auto 24px' }}>
          Con tu código personal, quien compre obtiene 5% de descuento en productos y tú recibes 10% en puntos. Cada punto vale $1 de descuento en tus próximas compras.
        </p>
        <Link href="/rewards" style={{ display: 'inline-block', padding: '14px 32px', background: 'var(--black)', color: 'var(--gold)', borderRadius: '4px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
          Conocer Rewards
        </Link>
      </div>
    )
  }

  const { miembro, saldo = { disponibles: 0, pendientes: 0 }, movimientos = [], hayMas = false } = datos

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {miembro.estado === 'suspendido' && (
        <div style={{ padding: '14px 16px', background: '#FFF7E6', border: '1px solid #F0D9A0', borderRadius: '8px', fontSize: '14px', color: '#7A5A10', lineHeight: 1.6 }}>
          Tu Monedero está en pausa. Escríbenos a <a href="mailto:hola@vitalora.com.mx" style={{ color: '#7A5A10', fontWeight: 600 }}>hola@vitalora.com.mx</a> y te ayudamos.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1.2fr) minmax(0,1fr)', gap: '16px' }}>
        <TarjetaCodigo codigo={miembro.codigo} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '16px' }}>
          <div style={{ ...tarjeta, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', margin: '0 0 8px' }}>Disponibles</p>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: saldo.disponibles < 0 ? '#A33' : 'var(--black)', lineHeight: 1 }}>{saldo.disponibles.toLocaleString('es-MX')}</div>
            <p style={{ fontSize: '12px', color: '#888', margin: '8px 0 0', lineHeight: 1.5 }}>puntos = ${Math.max(0, saldo.disponibles).toLocaleString('es-MX')} de descuento</p>
          </div>
          <div style={{ ...tarjeta, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', margin: '0 0 8px' }}>Pendientes</p>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'var(--gold)', lineHeight: 1 }}>{saldo.pendientes.toLocaleString('es-MX')}</div>
            <p style={{ fontSize: '12px', color: '#888', margin: '8px 0 0', lineHeight: 1.5 }}>se acreditan 15 días después de la entrega</p>
          </div>
        </div>
      </div>

      {/* Cómo usar los puntos (el canje en el checkout llega en la Parte 5) */}
      <div style={tarjeta}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px' }}>¿Cómo uso mis puntos?</h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'Elige tus productos y agrégalos al carrito con tu sesión iniciada.',
            'En el checkout, junto al código de descuento, verás “Usar puntos de mi Monedero Rewards”.',
            'Elige cuántos puntos usar (o todos) y el descuento se aplica al instante.',
          ].map((paso, i) => (
            <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span aria-hidden style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#F6EEDC', color: '#8A6D2B', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <span style={{ fontSize: '14px', color: '#333', lineHeight: 1.6, paddingTop: '3px', minWidth: 0 }}>{paso}</span>
            </li>
          ))}
        </ol>
        <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.7, margin: 0, padding: '12px 14px', background: '#FAF6EC', borderRadius: '8px' }}>
          <strong style={{ color: '#111' }}>1 punto = $1</strong> de descuento en productos. El envío, cuando aplica, se paga aparte. Puedes combinarlos con tu descuento de primera compra o con un cupón.
        </p>
      </div>

      <div style={tarjeta}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>Historial</h2>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>1 punto = $1 de descuento en productos. Tus puntos no vencen.</p>

        {movimientos.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#888', padding: '24px 0', textAlign: 'center', lineHeight: 1.7 }}>
            Aún no tienes movimientos. Comparte tu código y aquí verás cada punto que ganes.
          </p>
        ) : (
          <div>
            {movimientos.map(m => {
              const cancelado = m.estado === 'cancelado'
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '14px 0', borderTop: '1px solid #F0F0F0' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: cancelado ? '#999' : '#111', fontWeight: 500, textDecoration: cancelado ? 'line-through' : 'none' }}>{m.concepto}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                      {m.fecha}
                      {m.estado === 'pendiente' && <span style={{ marginLeft: '8px', padding: '1px 8px', borderRadius: '100px', background: '#F8F1E0', color: '#8A6D2B', fontSize: '11px' }}>Pendiente</span>}
                    </div>
                    {m.detalle && <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', overflowWrap: 'anywhere' }}>{m.detalle}</div>}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', color: cancelado ? '#BBB' : m.puntos > 0 ? '#2E7D32' : '#111', textDecoration: cancelado ? 'line-through' : 'none' }}>
                    {m.puntos > 0 ? '+' : '−'}{puntosTexto(Math.abs(m.puntos))}
                  </div>
                </div>
              )
            })}
            {hayMas && (
              <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #F0F0F0' }}>
                <button onClick={verMas} disabled={cargandoMas} style={{ padding: '10px 24px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', fontSize: '13px', color: '#555', cursor: cargandoMas ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {cargandoMas ? 'Cargando…' : 'Ver más'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', lineHeight: 1.7 }}>
        <Link href="/rewards" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Cómo funciona Rewards</Link>
        {' · '}
        <Link href="/rewards/terminos" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Términos</Link>
      </p>
    </div>
  )
}
