'use client'

import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

const secciones = [
  { titulo: '1. Información general', contenido: 'El presente documento establece los Términos y Condiciones de uso del sitio web vitalora.com.mx (en adelante "la Plataforma"), operado por VANGUARDIA IMPORTACIONES Y LOGISTICA DE MEXICO SA DE CV (en adelante "Vitalora"), con domicilio en Circuito Luna 103, Zirandaro, San Miguel de Allende, Guanajuato 37749, México.' },
  { titulo: '2. Aceptación de los términos', contenido: 'Al acceder, navegar o realizar cualquier compra en la Plataforma, el usuario acepta de manera expresa los presentes Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, deberá abstenerse de utilizar la Plataforma.' },
  { titulo: '3. Uso de la plataforma', contenido: 'La Plataforma está destinada exclusivamente para la venta de cosméticos coreanos (K-Beauty) y suplementos alimenticios dentro de la República Mexicana. El usuario se compromete a: proporcionar información veraz y completa al realizar una compra; no utilizar la Plataforma para fines ilícitos; no intentar acceder a áreas restringidas del sistema; ser mayor de 18 años o contar con autorización de un tutor legal.' },
  { titulo: '4. Productos', contenido: 'Todos los productos ofrecidos en la Plataforma son 100% auténticos e importados. Vitalora se reserva el derecho de modificar precios, descripciones y disponibilidad de productos sin previo aviso. Las imágenes de los productos son de carácter ilustrativo y pueden variar ligeramente del producto real. Los suplementos alimenticios no son medicamentos y no sustituyen una dieta equilibrada ni tratamiento médico.' },
  { titulo: '5. Registro de cuenta', contenido: 'El registro es opcional para realizar compras. Al crear una cuenta, el usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Vitalora no será responsable por el uso no autorizado de cuentas de usuario. El usuario puede solicitar la eliminación de su cuenta en cualquier momento contactando a hola@vitalora.com.mx.' },
  { titulo: '6. Proceso de compra', contenido: 'El proceso de compra se realiza a través de la Plataforma siguiendo estos pasos: selección de productos y cantidades; ingreso de datos personales y dirección de envío; confirmación del pedido y verificación de datos; pago a través de Mercado Pago. La compra se considera confirmada una vez que Mercado Pago procese exitosamente el pago. Vitalora enviará un correo electrónico de confirmación al comprador.' },
  { titulo: '7. Precios y métodos de pago', contenido: 'Todos los precios están expresados en Pesos Mexicanos (MXN) e incluyen IVA. Los métodos de pago aceptados son: tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias SPEI, pagos en OXXO, y saldo de Mercado Pago. Todos los pagos son procesados de forma segura por Mercado Pago. Vitalora no almacena datos financieros ni de tarjetas de los usuarios.' },
  { titulo: '8. Envíos', contenido: 'Los envíos se realizan exclusivamente dentro de la República Mexicana a través de Mercado Envíos. El costo de envío es de $99 MXN para compras menores a $1,000 MXN. El envío es gratuito en compras iguales o mayores a $1,000 MXN. El tiempo estimado de entrega es de 2 a 5 días hábiles. Una vez generada la guía de envío, no es posible modificar la dirección de entrega. El comprador es responsable de proporcionar datos de envío correctos y completos.' },
  { titulo: '9. Devoluciones y reembolsos', contenido: 'Se aceptan devoluciones dentro de los 30 días posteriores a la entrega del producto, siempre que: el producto esté sin abrir y en su empaque original; se encuentre en perfectas condiciones; se contacte previamente a hola@vitalora.com.mx. En caso de devolución por arrepentimiento, el costo de envío de retorno corre por cuenta del comprador. En caso de producto dañado o incorrecto, Vitalora cubrirá el costo del envío de retorno. El reembolso se procesará en un plazo de 5 a 10 días hábiles. El costo de envío original no es reembolsable cuando la paquetería no pueda entregar por datos incorrectos del comprador.' },
  { titulo: '10. Facturación', contenido: 'Vitalora emite factura electrónica (CFDI) a solicitud del comprador. Los datos fiscales pueden registrarse en la sección de Facturación de la cuenta del usuario. La solicitud de factura debe realizarse dentro de los 30 días posteriores a la compra.' },
  { titulo: '11. Propiedad intelectual', contenido: 'Todo el contenido de la Plataforma (textos, imágenes, logotipos, diseño, código) es propiedad de Vitalora o de sus respectivos titulares y está protegido por las leyes de propiedad intelectual vigentes en México. Queda prohibida la reproducción, distribución o uso no autorizado de cualquier contenido de la Plataforma.' },
  { titulo: '12. Limitación de responsabilidad', contenido: 'Vitalora no será responsable por: daños derivados del uso inadecuado de los productos; reacciones alérgicas o efectos adversos por el uso de cosméticos o suplementos; retrasos en la entrega causados por la paquetería o fuerza mayor; pérdida de paquetes una vez que la paquetería confirme la entrega; interrupciones temporales del servicio de la Plataforma.' },
  { titulo: '13. Modificaciones', contenido: 'Vitalora se reserva el derecho de modificar los presentes Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en la Plataforma. El uso continuado de la Plataforma después de cualquier modificación constituye la aceptación de los nuevos términos.' },
  { titulo: '14. Legislación aplicable', contenido: 'Los presentes Términos y Condiciones se rigen por las leyes vigentes en los Estados Unidos Mexicanos. Para cualquier controversia derivada del uso de la Plataforma, las partes se someten a la jurisdicción de los tribunales competentes de San Miguel de Allende, Guanajuato.' },
  { titulo: '15. Contacto', contenido: 'Para cualquier duda, queja o aclaración relacionada con estos Términos y Condiciones, el usuario puede contactar a Vitalora a través de: correo electrónico hola@vitalora.com.mx, horario de atención de lunes a viernes de 9:00 AM a 6:00 PM (hora del centro de México).' },
]

export default function TerminosPage() {
  const isMobile = useIsMobile()
  return (
    <main style={{ background: 'var(--bg-cream)' }}>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '32px 16px' : '60px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 4vw, 48px)', color: 'var(--black)', marginBottom: '16px' }}>Términos y Condiciones</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Última actualización: 1 de junio de 2026</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '48px', flexWrap: 'wrap' }}>
          <Link href="/envios-devoluciones" style={{ padding: '8px 20px', border: '1px solid var(--line)', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>Envíos y Devoluciones</Link>
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
