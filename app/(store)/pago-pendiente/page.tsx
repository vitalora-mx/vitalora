// /pago-pendiente — regreso desde Mercado Pago cuando el pago quedó pendiente
// (back_urls.pending en app/api/crear-preferencia/route.ts): ficha OXXO generada
// o pago con tarjeta en revisión. Los datos de la URL (external_reference,
// payment_type) los pone Mercado Pago y aquí solo se usan para mostrar texto.
import Link from 'next/link'
import { metadatosPagina } from '@/lib/compartir'
import { formatearNumeroPedido } from '@/lib/utils'
import { WHATSAPP_URL } from '@/lib/correoPedido'
import LimpiarCompra from './LimpiarCompra'

export const metadata = metadatosPagina({ titulo: 'Pago pendiente', ruta: '/pago-pendiente' })

const unico = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

export default async function PagoPendientePage(
  { searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const sp = await searchParams
  const ref = unico(sp.external_reference)
  const numero = /^\d{1,9}$/.test(ref) ? formatearNumeroPedido(Number(ref)) : null
  // 'ticket' = efectivo (OXXO y tiendas); 'atm' = cajero / depósito
  const tipo = unico(sp.payment_type)
  const esEfectivo = tipo === 'ticket' || tipo === 'atm'
  const delPedido = numero ? <> de tu pedido <strong style={{ color: 'var(--black)' }}>{numero}</strong></> : null

  return (
    <main style={{ minHeight: '100svh', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <LimpiarCompra />
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>

        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FBF5E6', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '32px' }}>
          ⏳
        </div>

        <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '0.02em', color: 'var(--black)', marginBottom: '16px' }}>
          {esEfectivo ? 'Tu pedido está registrado: falta tu pago' : 'Tu pago está en revisión'}
        </h1>

        {esEfectivo ? (
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '32px' }}>
            Paga tu ficha en cualquier tienda OXXO antes de su vencimiento (la encuentras también en el correo de Mercado Pago).
            Cuando Mercado Pago acredite el pago, puede tardar hasta 24 horas, te enviaremos el correo de confirmación{delPedido}.
          </p>
        ) : (
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '32px' }}>
            Mercado Pago está revisando tu pago{delPedido}. Te avisaremos por correo cuando se confirme.
          </p>
        )}

        <div style={{ height: '1px', background: 'var(--line)', margin: '32px 0' }} />

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '16px 32px', background: 'var(--black)', color: 'var(--bg-cream)', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, borderRadius: '2px' }}>
            Volver a la tienda
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ padding: '16px 32px', background: 'none', color: 'var(--black)', border: '1px solid var(--line)', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, borderRadius: '2px' }}>
            Escríbenos por WhatsApp
          </a>
        </div>

        <p style={{ marginTop: '48px', fontSize: '12px', color: 'var(--text-muted)' }}>
          ¿Tienes dudas? Escríbenos a{' '}
          <a href="mailto:hola@vitalora.com.mx" style={{ color: 'var(--gold)', textDecoration: 'none' }}>hola@vitalora.com.mx</a>
        </p>

      </div>
    </main>
  )
}
