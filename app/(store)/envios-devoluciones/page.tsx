'use client'

import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import Link from 'next/link'

const secciones = [
  { titulo: '1. Cobertura de envíos', contenido: 'Realizamos envíos a cualquier dirección dentro de la República Mexicana. No realizamos envíos internacionales. Los envíos se procesan a través de Mercado Envíos, que trabaja con las principales paqueterías del país.' },
  { titulo: '2. Costos de envío', contenido: 'Compras menores a $1,000 MXN: costo de envío de $99 MXN. Compras iguales o mayores a $1,000 MXN: envío gratuito a cualquier parte de México.' },
  { titulo: '3. Tiempos de entrega', contenido: 'El tiempo estimado de entrega es de 2 a 5 días hábiles a partir de la confirmación del pago. Los tiempos pueden variar en zonas rurales o extendidas. Los días hábiles no incluyen sábados, domingos ni días festivos.' },
  { titulo: '4. Seguimiento del pedido', contenido: 'Una vez enviado el pedido, el comprador recibirá un correo electrónico con el número de guía de rastreo. El estado del pedido y número de guía también estarán disponibles en la sección "Mis Pedidos" de la cuenta del usuario.' },
  { titulo: '5. Cambio de dirección', contenido: 'Una vez realizado el pago, NO es posible modificar la dirección de envío debido a que la guía de Mercado Envíos se genera automáticamente con los datos ingresados al momento de la compra. Si necesitas cancelar tu pedido antes de que sea enviado, contáctanos a hola@vitalora.com.mx. Si el pedido ya fue entregado a la paquetería, los costos de envío no serán reembolsables.' },
  { titulo: '6. Paquete no entregado', contenido: 'Si la paquetería no puede entregar el paquete por datos incorrectos o incompletos: el costo de envío no será reembolsable. Se realizará el reembolso del producto una vez que la paquetería autorice la devolución.' },
  { titulo: '7. Paquete marcado como entregado pero no recibido', contenido: 'Si tu pedido aparece como entregado pero no lo has recibido: verifica si alguna otra persona lo recibió por ti (familiar, vecino, vigilante, recepción). Si nadie lo recibió, comunícate directamente con la paquetería para levantar un reporte. Lamentablemente, no podemos realizar reembolsos cuando la paquetería marca el pedido como entregado correctamente.' },
  { titulo: '8. Política de devoluciones', contenido: 'Aceptamos devoluciones dentro de los 30 días naturales posteriores a la fecha de entrega, bajo las siguientes condiciones: el producto debe estar sin abrir y sin usar; debe estar en su empaque original y en perfectas condiciones; se debe contactar previamente a hola@vitalora.com.mx indicando el número de pedido y motivo de la devolución.' },
  { titulo: '9. Proceso de devolución', contenido: 'Contactar a hola@vitalora.com.mx con tu número de pedido, fotos del producto (si aplica) y motivo de la devolución. Nuestro equipo evaluará la solicitud y te proporcionará instrucciones para el envío de retorno. Una vez recibido y verificado el producto, se procesará el reembolso.' },
  { titulo: '10. Reembolsos', contenido: 'Los reembolsos se procesan en un plazo de 5 a 10 días hábiles después de aprobada la devolución. El reembolso se realiza al mismo método de pago utilizado en la compra. Producto dañado o incorrecto: reembolso completo incluyendo envío, o envío de producto de reemplazo sin costo. Devolución por arrepentimiento: reembolso del producto, el costo de envío de retorno corre por cuenta del comprador. Paquete perdido en tránsito: reembolso completo incluyendo envío.' },
  { titulo: '11. Productos no elegibles para devolución', contenido: 'No se aceptan devoluciones de: productos que hayan sido abiertos o usados; productos sin empaque original; productos dañados por mal uso del comprador; solicitudes realizadas después de 30 días de la entrega.' },
]

export default function EnviosDevolucionesPage() {
  return (
    <main style={{ background: 'var(--bg-cream)' }}>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 4vw, 48px)', color: 'var(--black)', marginBottom: '16px' }}>Política de Envíos y Devoluciones</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Última actualización: 1 de junio de 2026</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '48px', flexWrap: 'wrap' }}>
          <Link href="/terminos" style={{ padding: '8px 20px', border: '1px solid var(--line)', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>Términos y Condiciones</Link>
          <Link href="/privacidad" style={{ padding: '8px 20px', border: '1px solid var(--line)', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>Aviso de Privacidad</Link>
        </div>
        {secciones.map((s, i) => (
          <div key={i} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 600, color: 'var(--black)', marginBottom: '12px' }}>{s.titulo}</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.9, color: 'var(--text-muted)' }}>{s.contenido}</p>
          </div>
        ))}
      </div>
      <Footer />
    </main>
  )
}
