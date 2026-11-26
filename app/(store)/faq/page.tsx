'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'
import { useIsMobile } from '@/hooks/useIsMobile'
import { SUPLEMENTOS_ACTIVO } from '@/lib/tienda'

interface FAQ {
  pregunta: string
  respuesta: string
}

interface Seccion {
  titulo: string
  icono: string
  preguntas: FAQ[]
}

const secciones: Seccion[] = [
  {
    titulo: 'Sobre Vitalora',
    icono: '✦',
    preguntas: [
      { pregunta: '¿Qué es Vitalora?', respuesta: `Vitalora es una tienda en línea mexicana especializada en cosméticos coreanos (K-Beauty) auténticos${SUPLEMENTOS_ACTIVO ? ' y suplementos alimenticios de alta pureza' : ''}. Todos nuestros productos son importados directamente y verificados para garantizar su autenticidad.` },
      { pregunta: '¿En qué país están ubicados?', respuesta: 'Estamos ubicados en México. Operamos exclusivamente en territorio mexicano.' },
      { pregunta: '¿Hacen envíos al extranjero?', respuesta: 'No, por el momento solo realizamos envíos dentro de la República Mexicana. No ofrecemos envíos internacionales.' },
      { pregunta: '¿Sus productos son auténticos?', respuesta: SUPLEMENTOS_ACTIVO
        ? 'Sí, el 100% de nuestros productos son auténticos e importados directamente de Corea del Sur (cosméticos) y de fabricantes certificados (suplementos). Cada producto cuenta con certificados de autenticidad y verificación de lote.'
        : 'Sí, el 100% de nuestros productos son auténticos e importados directamente de Corea del Sur. Cada producto cuenta con certificados de autenticidad y verificación de lote.' },
      { pregunta: '¿Cómo puedo contactarlos?', respuesta: 'Puedes escribirnos a hola@vitalora.com.mx, por WhatsApp al 462 234 1282, desde vitalora.com.mx/contacto o desde el formulario de ayuda en tu cuenta. Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM.' },
    ]
  },
  {
    titulo: 'Productos',
    icono: '🧴',
    preguntas: [
      { pregunta: '¿Los cosméticos coreanos son seguros para todo tipo de piel?', respuesta: 'Los cosméticos coreanos son conocidos por sus fórmulas suaves y efectivas. Sin embargo, cada piel es diferente. Te recomendamos revisar la lista de ingredientes de cada producto y, si tienes piel sensible o alguna condición dermatológica, consultar con tu dermatólogo antes de usar un producto nuevo.' },
      ...(SUPLEMENTOS_ACTIVO ? [{ pregunta: '¿Los suplementos alimenticios requieren receta médica?', respuesta: 'No, nuestros suplementos alimenticios no requieren receta médica ya que son de venta libre. Sin embargo, recomendamos consultar a tu médico antes de consumir cualquier suplemento, especialmente si estás embarazada, en periodo de lactancia, tomas medicamentos o tienes alguna condición médica.' }] : []),
      { pregunta: '¿Cómo sé qué productos son adecuados para mí?', respuesta: 'Puedes chatear con Lora, nuestra asesora de bienestar con inteligencia artificial, disponible en nuestra página. Lora puede ayudarte a encontrar la rutina perfecta según tu tipo de piel y necesidades. También puedes contactarnos directamente para asesoría personalizada.' },
      { pregunta: '¿Los productos tienen fecha de caducidad?', respuesta: 'Sí, todos nuestros productos tienen fecha de caducidad visible en el empaque. Garantizamos que al momento de la entrega, cada producto tiene al menos 6 meses de vigencia restante.' },
      { pregunta: '¿Puedo ver los ingredientes de un producto antes de comprarlo?', respuesta: 'Sí, cada página de producto incluye la lista completa de ingredientes en la pestaña "Ingredientes". Si necesitas información adicional, no dudes en contactarnos.' },
      { pregunta: '¿Qué significa el sello GMP Certificado?', respuesta: 'GMP (Good Manufacturing Practices) significa Buenas Prácticas de Manufactura. Es una certificación que garantiza que el producto fue fabricado bajo estándares estrictos de calidad, higiene y seguridad.' },
    ]
  },
  {
    titulo: 'Compras y Pagos',
    icono: '💳',
    preguntas: [
      { pregunta: '¿Qué métodos de pago aceptan?', respuesta: 'Aceptamos dos formas de pago: Mercado Pago (tarjeta de crédito o débito, pago en efectivo en OXXO y saldo de Mercado Pago) y transferencia bancaria (SPEI). Si pagas por transferencia, tienes 2 horas para transferir y subir tu comprobante; si no, el pedido se cancela. Tu pedido se confirma cuando validamos tu comprobante.' },
      { pregunta: '¿Es seguro comprar en Vitalora?', respuesta: 'Sí, tu información está protegida. Los pagos son procesados por Mercado Pago, una de las plataformas de pago más seguras de Latinoamérica. Nunca vemos ni almacenamos los datos de tu tarjeta.' },
      { pregunta: '¿Puedo pagar en OXXO?', respuesta: 'Sí, al momento de pagar selecciona la opción de pago en OXXO a través de Mercado Pago. Recibirás un código de referencia para realizar tu pago en cualquier tienda OXXO. El pago puede tardar hasta 24 horas en reflejarse; tu pedido se confirma cuando Mercado Pago lo acredita y en ese momento te llega el correo de confirmación.' },
      { pregunta: '¿Puedo pagar a meses sin intereses?', respuesta: 'Las opciones de meses sin intereses dependen de tu tarjeta y banco emisor. Al momento del checkout en Mercado Pago, podrás ver las opciones disponibles para tu tarjeta.' },
      { pregunta: '¿Necesito crear una cuenta para comprar?', respuesta: 'No es obligatorio, puedes comprar como visitante. Sin embargo, al crear una cuenta obtienes: 5% de descuento en tu primera compra, historial de pedidos, direcciones guardadas para futuras compras y acceso a promociones exclusivas.' },
      { pregunta: '¿Emiten factura?', respuesta: 'Sí, emitimos factura electrónica (CFDI). Puedes solicitarla desde tu cuenta en la sección de "Facturación", donde podrás registrar tus datos fiscales (RFC, razón social, régimen fiscal); si compraste como invitado, solicítala en vitalora.com.mx/facturacion. La factura debe solicitarse dentro del mismo mes calendario de tu compra.' },
    ]
  },
  {
    titulo: 'Envíos',
    icono: '🚚',
    preguntas: [
      { pregunta: '¿Cuánto cuesta el envío?', respuesta: 'El costo de envío es de $99 MXN para compras menores a $1,000 MXN. En compras iguales o mayores a $1,000 MXN el envío es completamente gratis a cualquier parte de México (excepto zonas extendidas, que tienen un cargo adicional de $200 MXN).' },
      { pregunta: '¿Cuánto tarda en llegar mi pedido?', respuesta: 'El tiempo estimado de entrega es de 3 a 7 días hábiles a cualquier parte de la República Mexicana, dependiendo de tu ubicación (en zonas extendidas puede tardar algunos días más).' },
      { pregunta: '¿Cómo puedo rastrear mi pedido?', respuesta: 'Una vez que tu pedido sea enviado, recibirás un correo electrónico con tu número de guía de rastreo. También puedes consultar el estado de tu pedido y número de guía en la sección "Mis Pedidos" de tu cuenta.' },
      { pregunta: '¿Qué paquetería utilizan?', respuesta: 'Enviamos con paqueterías nacionales (Estafeta, DHL, FedEx o Paquetexpress), según la zona de entrega. Cuando tu pedido salga, te enviaremos por correo la paquetería y el número de guía para rastrearlo.' },
      { pregunta: '¿Realizan envíos a toda la República Mexicana?', respuesta: 'Sí, realizamos envíos a cualquier dirección dentro de la República Mexicana, incluyendo zonas rurales y extendidas (en zonas extendidas se agrega un cargo de $200 MXN y la entrega puede tardar algunos días más).' },
      { pregunta: '¿Qué es una zona extendida?', respuesta: 'Son localidades fuera de las rutas habituales de las paqueterías, como comunidades rurales, rancherías o zonas de difícil acceso; la paquetería cobra un recargo por llegar ahí. Si tu código postal está en zona extendida, se agrega un cargo adicional de $200 MXN, incluso si tu compra tiene envío gratis, y la entrega puede tardar algunos días más. Te contactaremos antes de enviar tu pedido para confirmar el cargo; si prefieres no pagarlo, cancelamos tu pedido con reembolso completo.' },
      { pregunta: '¿Puedo cambiar la dirección de envío después de realizar mi pedido?', respuesta: 'No es posible modificar la dirección una vez generada la guía. Antes de eso, escríbenos a hola@vitalora.com.mx con tu número de pedido y la dirección correcta. Si necesitas cancelar tu pedido, escríbenos antes de que sea enviado; si el producto ya fue entregado a la paquetería, los costos de envío no serán reembolsables. Si el producto no puede ser entregado, el reembolso se hará cuando la paquetería autorice la devolución.' },
      { pregunta: '¿Mi paquete aparece como entregado por la paquetería, pero yo no he recibido nada?', respuesta: 'Si tu pedido aparece como entregado, te recomendamos primero verificar si alguna otra persona lo recibió por ti, por ejemplo: un familiar, vecino, vigilante o recepción del domicilio. Si nadie lo recibió, deberás comunicarte directamente con la paquetería para levantar un reporte o reclamo y esperar la resolución correspondiente. En algunos casos, la paquetería puede ofrecer un reembolso por la pérdida del paquete. Lamentablemente, no podemos realizar reembolsos cuando la paquetería marca el pedido como entregado correctamente.' },
    ]
  },
  {
    titulo: 'Devoluciones y Reembolsos',
    icono: '↩',
    preguntas: [
      { pregunta: '¿Cuál es su política de devoluciones?', respuesta: 'Aceptamos devoluciones dentro de los 30 días naturales posteriores a la entrega. El producto debe estar sin abrir, en su empaque original y en perfectas condiciones. Contáctanos a hola@vitalora.com.mx para iniciar el proceso.' },
      { pregunta: '¿Qué pasa si mi paquete no llega o se pierde?', respuesta: 'Si tu paquete no es entregado o se pierde durante el envío, la devolución de tu dinero es completamente gratuita. Nos hacemos cargo de todo el proceso con la paquetería.' },
      { pregunta: '¿Qué pasa si me arrepiento de mi compra?', respuesta: 'Si deseas devolver un producto por arrepentimiento, el costo del envío de retorno corre por tu cuenta. El reembolso se procesará una vez que recibamos el producto en buen estado y sin abrir.' },
      { pregunta: '¿El costo de envío es reembolsable?', respuesta: 'El costo de envío no es reembolsable si la paquetería no puede entregar el paquete por datos incorrectos o incompletos proporcionados por el comprador.' },
      { pregunta: '¿Cuánto tiempo tarda el reembolso?', respuesta: 'Una vez aprobada la devolución, el reembolso se procesa en un plazo de 5 a 10 días hábiles, dependiendo de tu método de pago y banco. Si pagaste por transferencia, te lo depositamos por transferencia a la cuenta (CLABE) que nos indiques.' },
      { pregunta: '¿Qué hago si recibo un producto dañado o incorrecto?', respuesta: 'Contáctanos inmediatamente a hola@vitalora.com.mx con fotos del producto y tu número de pedido. Te enviaremos un reemplazo sin costo adicional o procesaremos tu reembolso completo.' },
    ]
  },
  {
    titulo: 'Cuenta y Privacidad',
    icono: '🔒',
    preguntas: [
      { pregunta: '¿Cómo creo una cuenta?', respuesta: 'Puedes crear tu cuenta en vitalora.com.mx/cuenta. Solo necesitas un correo electrónico y una contraseña. Al registrarte obtienes un 5% de descuento en tu primera compra.' },
      { pregunta: '¿Cómo recupero mi contraseña?', respuesta: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" e ingresa tu correo electrónico. Recibirás un enlace para restablecer tu contraseña.' },
      { pregunta: '¿Mis datos personales están seguros?', respuesta: 'Sí, protegemos tu información personal conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. No vendemos ni compartimos tus datos con terceros para fines comerciales; solo los compartimos con quien es necesario para tu compra, como la paquetería que entrega tu pedido. Puedes consultar nuestro Aviso de Privacidad completo en nuestra página.' },
      { pregunta: '¿Puedo eliminar mi cuenta?', respuesta: 'Sí, puedes solicitar la eliminación de tu cuenta y todos tus datos personales contactándonos a hola@vitalora.com.mx. Procesaremos tu solicitud en un plazo máximo de 15 días hábiles.' },
    ]
  },
  {
    titulo: 'Promociones y Descuentos',
    icono: '🎉',
    preguntas: [
      { pregunta: '¿Cómo obtengo el 5% de descuento en mi primera compra?', respuesta: 'El descuento del 5% se aplica automáticamente al crear tu cuenta y realizar tu primera compra como usuario registrado. Este descuento no es acumulable con otros códigos promocionales.' },
      { pregunta: '¿Puedo usar un código de descuento junto con el 5% de primera compra?', respuesta: 'No, los descuentos no son acumulables. Puedes usar el 5% de primera compra O un código promocional, el que te convenga más.' },
      { pregunta: '¿Dónde ingreso mi código de descuento?', respuesta: 'Los códigos de descuento se ingresan en el checkout, antes de proceder al pago. Verás un campo para ingresar tu código y el descuento se aplicará automáticamente al total de tu compra.' },
      { pregunta: '¿Tienen programa de lealtad o puntos?', respuesta: 'Actualmente no contamos con un programa de puntos, pero estamos trabajando en ello. Suscríbete a nuestro newsletter para ser el primero en enterarte de nuestras promociones y novedades.' },
    ]
  },
]

export default function FAQPage() {
  const [seccionActiva, setSeccionActiva] = useState(0)
  const isMobile = useIsMobile()
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null)

  function togglePregunta(index: number) {
    setPreguntaAbierta(preguntaAbierta === index ? null : index)
  }

  return (
    <main style={{ background: 'var(--bg-cream)' }}>
      <Header />

      {/* Banner */}
      <div style={{ background: 'var(--black)', padding: isMobile ? '32px 16px' : '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Centro de Ayuda</div>
        <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--bg-cream)', letterSpacing: '0.02em', marginBottom: '16px' }}>Preguntas Frecuentes</h1>
        <p style={{ fontSize: '15px', color: 'rgba(245,240,232,0.6)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>Encuentra respuestas a las dudas más comunes sobre nuestros productos, envíos, pagos y más.</p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '32px 16px' : '60px 40px' }}>
        {/* Navegación por secciones */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>
          {secciones.map((sec, i) => (
            <button key={i} onClick={() => { setSeccionActiva(i); setPreguntaAbierta(null) }}
              style={{
                padding: '10px 20px', border: '1px solid', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer',
                borderRadius: '100px', fontWeight: 500, letterSpacing: '0.03em',
                borderColor: seccionActiva === i ? 'var(--black)' : 'var(--line)',
                background: seccionActiva === i ? 'var(--black)' : 'white',
                color: seccionActiva === i ? 'var(--bg-cream)' : 'var(--text)',
                transition: 'all 0.2s',
              }}>
              {sec.icono} {sec.titulo}
            </button>
          ))}
        </div>

        {/* Título de sección */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '36px', color: 'var(--black)', marginBottom: '8px' }}>
            {secciones[seccionActiva].titulo}
          </h2>
          <div style={{ width: '40px', height: '2px', background: 'var(--gold)', margin: '0 auto' }} />
        </div>

        {/* Preguntas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {secciones[seccionActiva].preguntas.map((faq, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--line)', overflow: 'hidden', transition: 'box-shadow 0.2s', boxShadow: preguntaAbierta === i ? '0 4px 20px rgba(0,0,0,0.08)' : 'none' }}>
              <button onClick={() => togglePregunta(i)}
                style={{
                  width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--black)', lineHeight: 1.5, paddingRight: '16px' }}>{faq.pregunta}</span>
                <span style={{ fontSize: '20px', color: 'var(--gold)', flexShrink: 0, transform: preguntaAbierta === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }}>+</span>
              </button>
              {preguntaAbierta === i && (
                <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--line)' }}>
                  <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-muted)', marginTop: '16px' }}>{faq.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA contacto */}
        <div style={{ textAlign: 'center', marginTop: '60px', padding: isMobile ? '24px 20px' : '48px', background: 'white', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '28px', marginBottom: '16px' }}>💬</div>
          <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', color: 'var(--black)', marginBottom: '12px' }}>¿No encontraste lo que buscas?</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.7 }}>
            Nuestro equipo está listo para ayudarte. Escríbenos y te responderemos lo más pronto posible.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:hola@vitalora.com.mx" style={{ padding: '14px 28px', background: 'var(--black)', color: 'var(--bg-cream)', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, borderRadius: '2px' }}>
              Enviar correo
            </a>
            <Link href="/cuenta" style={{ padding: '14px 28px', border: '1px solid var(--line)', color: 'var(--text)', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, borderRadius: '2px' }}>
              Formulario de ayuda
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <LoraChat />
    </main>
  )
}
