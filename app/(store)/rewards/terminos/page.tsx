'use client'

import Link from 'next/link'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import { useIsMobile } from '@/hooks/useIsMobile'

// Borrador para el lanzamiento: la revisión legal final y las reglas de conducta
// (no hacerse pasar por Vitalora, no usar la marca en publicidad pagada sin
// permiso, no hacer spam) se agregan en la Parte 6.
const secciones = [
  { titulo: '1. Qué es Vitalora Rewards', contenido: 'Vitalora Rewards es un programa de recompensas de vitalora.com.mx, operado por VANGUARDIA IMPORTACIONES Y LOGISTICA DE MEXICO SA DE CV (en adelante "Vitalora"). Cada participante recibe un código personal y un Monedero Rewards donde acumula puntos. Los puntos no son dinero: no tienen valor en efectivo, no se cambian por dinero, no se transfieren a otra persona y no son reembolsables.' },
  { titulo: '2. Quién puede participar', contenido: 'Pueden participar personas mayores de 18 años con una cuenta en vitalora.com.mx. Se permite un registro por persona y por número de teléfono (10 dígitos). Al inscribirse, el participante confirma que es mayor de edad y que sus datos son verdaderos. Vitalora puede rechazar o suspender una inscripción con datos falsos o duplicados.' },
  { titulo: '3. Código personal', contenido: 'El código se asigna automáticamente al inscribirse y no se puede cambiar. Cualquier persona puede usarlo, sin límite de usos y sin compra mínima, y obtiene 5% de descuento sobre el precio de los productos; el descuento no aplica al envío ni a cargos adicionales. El código no se combina con el descuento de primera compra ni con otros códigos o cupones. Usar un código Rewards no consume el descuento de primera compra.' },
  { titulo: '4. Cómo se ganan puntos', contenido: 'Por cada pedido pagado con su código, el participante recibe en puntos el 10% de lo pagado en productos, después del 5% de descuento y de los puntos que se hayan usado en ese pedido, sin contar el envío ni cargos adicionales. El resultado se redondea hacia abajo al punto entero. El participante también gana puntos cuando usa su propio código en sus compras. Un pedido no genera puntos si más del 50% del monto de productos, después del descuento, se paga con puntos.' },
  { titulo: '5. Puntos pendientes y acreditación', contenido: 'Los puntos de un pedido aparecen como pendientes en cuanto el pedido se paga y pasan a disponibles 15 días naturales después de que la paquetería reporta la entrega. Si el pedido se cancela o se reembolsa total o parcialmente antes de la acreditación, los puntos pendientes se cancelan o se reducen en proporción. Si ocurre después de la acreditación, se registra un ajuste que descuenta los puntos correspondientes, y el saldo puede quedar en negativo; con saldo en cero o negativo no se pueden usar puntos, y los puntos que se ganen después cubren primero ese saldo.' },
  { titulo: '6. Uso de los puntos', contenido: 'Cada punto equivale a $1 MXN de descuento sobre el precio de los productos, y con puntos se puede pagar hasta el total de los productos. Los puntos se pueden usar junto con el descuento de primera compra o con un cupón. Los puntos no aplican al envío ni a cargos adicionales, como el de zona extendida; estos se pagan aparte con los métodos de pago disponibles. Si el total del pedido queda en $0 MXN, el pedido se confirma sin pago adicional; un pedido pagado en su totalidad con puntos no genera puntos y no es facturable. Si un pedido en el que se usaron puntos se cancela, no se paga o se reembolsa, los puntos regresan al Monedero Rewards; en un reembolso parcial regresan en proporción a las piezas reembolsadas.' },
  { titulo: '7. Vigencia de los puntos', contenido: 'Los puntos no vencen. Permanecen en el Monedero Rewards mientras la cuenta del participante exista.' },
  { titulo: '8. Suspensión y eliminación de la cuenta', contenido: 'Vitalora puede suspender la participación o cancelar puntos obtenidos de forma indebida, por ejemplo mediante datos falsos, cuentas duplicadas, compras simuladas o cualquier forma de fraude. Si el participante elimina su cuenta, su Monedero Rewards se cierra y sus puntos se pierden; su código queda fuera de uso y no se asigna a otra persona.' },
  { titulo: '9. Datos personales', contenido: 'Para administrar el programa, Vitalora guarda el teléfono del participante, su confirmación de mayoría de edad, cómo se enteró del programa y el historial de su Monedero Rewards. Estos datos se tratan conforme al Aviso de Privacidad de Vitalora.' },
  { titulo: '10. Cambios a estos términos', contenido: 'Vitalora puede modificar estos términos. Los cambios se publicarán en esta página con su fecha de actualización y aplican a partir de su publicación.' },
  { titulo: '11. Contacto', contenido: 'Para cualquier duda sobre Vitalora Rewards, escribe a hola@vitalora.com.mx, de lunes a viernes de 9:00 AM a 6:00 PM (hora del centro de México).' },
]

export default function TerminosRewardsPage() {
  const isMobile = useIsMobile()
  return (
    <main style={{ background: 'var(--bg-cream)' }}>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '32px 16px' : '60px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Vitalora Rewards</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 4vw, 48px)', color: 'var(--black)', marginBottom: '16px' }}>Términos del programa</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Última actualización: 28 de noviembre de 2026</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '48px', flexWrap: 'wrap' }}>
          <Link href="/rewards" style={{ padding: '8px 20px', border: '1px solid var(--line)', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>Vitalora Rewards</Link>
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
