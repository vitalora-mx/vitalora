'use client'

import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

const secciones = [
  { titulo: '1. Responsable del tratamiento de datos', contenido: 'VANGUARDIA IMPORTACIONES Y LOGISTICA DE MEXICO SA DE CV, con domicilio en Circuito Luna 103, Zirandaro, San Miguel de Allende, Guanajuato 37749, México, es responsable del tratamiento de los datos personales que usted nos proporcione, conforme a lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.' },
  { titulo: '2. Datos personales que recabamos', contenido: 'Para las finalidades señaladas en este Aviso de Privacidad, podemos recabar los siguientes datos personales: nombre completo, dirección de correo electrónico, número telefónico, dirección de envío (calle, número, colonia, ciudad, estado, código postal), datos de facturación (RFC, razón social, régimen fiscal, domicilio fiscal). No recabamos datos financieros. Los pagos son procesados directamente por Mercado Pago, quien tiene su propia política de privacidad.' },
  { titulo: '3. Finalidades del tratamiento', contenido: 'Sus datos personales serán utilizados para las siguientes finalidades primarias: procesar y gestionar sus pedidos; realizar el envío de los productos adquiridos; emitir facturas electrónicas cuando sean solicitadas; comunicarnos con usted respecto al estado de sus pedidos; atender solicitudes de servicio, dudas o quejas. Finalidades secundarias: enviar información sobre promociones, descuentos y novedades; realizar análisis estadísticos internos para mejorar nuestros servicios.' },
  { titulo: '4. Transferencia de datos', contenido: 'Sus datos personales podrán ser compartidos con: Mercado Pago, para el procesamiento de pagos; servicios de paquetería (a través de Mercado Envíos), para la entrega de pedidos; Resend, para el envío de correos electrónicos transaccionales. No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines comerciales o publicitarios.' },
  { titulo: '5. Medidas de seguridad', contenido: 'Vitalora implementa medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado. La información se transmite mediante conexiones cifradas (HTTPS/SSL). Las contraseñas de las cuentas de usuario se almacenan de forma encriptada.' },
  { titulo: '6. Derechos ARCO', contenido: 'Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (derechos ARCO) al tratamiento de sus datos personales. Para ejercer cualquiera de estos derechos, envíe un correo electrónico a hola@vitalora.com.mx con el asunto "Derechos ARCO" incluyendo: su nombre completo, una descripción clara del derecho que desea ejercer, y un documento de identificación oficial. Responderemos su solicitud en un plazo máximo de 20 días hábiles.' },
  { titulo: '7. Uso de cookies y tecnologías de rastreo', contenido: 'La Plataforma utiliza cookies y tecnologías similares para mejorar la experiencia del usuario, recordar preferencias de navegación, y analizar el uso del sitio web. El usuario puede configurar su navegador para rechazar cookies, aunque esto podría afectar la funcionalidad de la Plataforma.' },
  { titulo: '8. Modificaciones al aviso de privacidad', contenido: 'Vitalora se reserva el derecho de modificar el presente Aviso de Privacidad. Cualquier cambio será publicado en la Plataforma en la sección correspondiente. El uso continuado de la Plataforma después de la publicación de cambios constituye la aceptación de los mismos.' },
  { titulo: '9. Contacto', contenido: 'Si tiene preguntas sobre este Aviso de Privacidad o sobre el tratamiento de sus datos personales, puede contactarnos en: correo electrónico hola@vitalora.com.mx, horario de atención de lunes a viernes de 9:00 AM a 6:00 PM (hora del centro de México).' },
]

export default function PrivacidadPage() {
  const isMobile = useIsMobile()
  return (
    <main style={{ background: 'var(--bg-cream)' }}>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '32px 16px' : '60px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 4vw, 48px)', color: 'var(--black)', marginBottom: '16px' }}>Aviso de Privacidad</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Última actualización: 1 de junio de 2026</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '48px', flexWrap: 'wrap' }}>
          <Link href="/terminos" style={{ padding: '8px 20px', border: '1px solid var(--line)', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>Términos y Condiciones</Link>
          <Link href="/envios-devoluciones" style={{ padding: '8px 20px', border: '1px solid var(--line)', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>Envíos y Devoluciones</Link>
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
