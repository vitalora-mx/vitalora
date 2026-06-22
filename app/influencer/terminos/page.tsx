'use client'

export default function TerminosInfluencerPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Italiana&display=swap');
        .term-body h2 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #0E0E0E; margin: 32px 0 12px; }
        .term-body p { font-size: 14px; color: #2C2C2C; line-height: 1.8; margin-bottom: 12px; }
        .term-body ul { margin: 0 0 16px; padding-left: 20px; }
        .term-body li { font-size: 14px; color: #2C2C2C; line-height: 1.8; margin-bottom: 6px; }
        .term-body strong { color: #0E0E0E; font-weight: 600; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          {/* Encabezado */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '12px' }}>Programa de Embajadoras</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '36px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1.1 }}>
              Términos y <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>condiciones</em>
            </h1>
          </div>

          <div className="term-body" style={{ background: 'white', padding: '40px 48px', borderRadius: '4px', border: '1px solid #E8E4DA' }}>

            <p style={{ fontSize: '13px', color: '#A8A8A8', marginBottom: '8px' }}>Última actualización: junio 2026</p>
            <p>
              El presente documento describe los términos del Programa de Embajadoras de Vitalora, operado por <strong>Vanguardia Importaciones y Logística de México S.A. de C.V.</strong> ("Vitalora"). Al registrarte en el programa, aceptas las siguientes condiciones.
            </p>

            <h2>1. Sobre el programa</h2>
            <p>
              El Programa de Embajadoras permite a creadoras de contenido y promotoras compartir un código de descuento personal con su comunidad y recibir una comisión por las ventas generadas a través de dicho código.
            </p>

            <h2>2. Registro y aprobación</h2>
            <ul>
              <li>El registro está sujeto a la aprobación de Vitalora. No todas las solicitudes son aceptadas.</li>
              <li>Para participar es <strong>obligatorio poder emitir facturas (CFDI)</strong> a nombre de <strong>Vanguardia Importaciones &amp; Logística de México S.A. de C.V.</strong> (RFC: VIA210820163) por concepto de servicios de publicidad o comisiones por ventas.</li>
              <li>Debes proporcionar datos fiscales reales y tu Constancia de Situación Fiscal con antigüedad no mayor a 3 meses.</li>
              <li>Los datos bancarios (CLABE) deben corresponder a una cuenta a tu nombre o al de tu razón social.</li>
            </ul>

            <h2>3. Tu código y el descuento</h2>
            <ul>
              <li>Al ser aprobada, recibirás un código de descuento personal único.</li>
              <li>El código otorga <strong>5% de descuento</strong> a tu comunidad en sus compras.</li>
              <li>Cada comprador puede usar tu código un <strong>máximo de 3 veces</strong>.</li>
              <li>Puedes compartir tu código libremente y con las personas que desees.</li>
              <li>El descuento de tu código no es combinable con el descuento de primera compra de Vitalora.</li>
            </ul>

            <h2>4. Comisiones</h2>
            <ul>
              <li>Ganas una comisión del <strong>5% sobre el subtotal</strong> de cada venta realizada con tu código.</li>
              <li>La comisión se calcula sobre el subtotal de los productos, <strong>sin incluir el costo de envío</strong>.</li>
              <li>Las comisiones se acumulan en tu saldo conforme los pedidos sean pagados y confirmados.</li>
              <li>Una venta cancelada, reembolsada o no pagada no genera comisión.</li>
            </ul>

            <h2>5. Solicitud y pago de comisiones</h2>
            <ul>
              <li>El pago de comisiones <strong>no es automático</strong>: tú decides cuándo solicitarlo desde tu portal.</li>
              <li>Para solicitar un pago, tu saldo acumulado debe ser de al menos <strong>$500 MXN</strong>.</li>
              <li>Cada solicitud de pago retira el <strong>saldo completo</strong> disponible en ese momento (no se permiten retiros parciales).</li>
              <li>Es <strong>obligatorio adjuntar tu factura CFDI</strong> correspondiente al monto solicitado para que el pago sea procesado.</li>
              <li>Los pagos se realizan mediante transferencia SPEI a la CLABE registrada.</li>
              <li>Vitalora procesa los pagos verificados dentro de un plazo razonable tras recibir la solicitud y la factura correspondiente.</li>
            </ul>

            <h2>6. Saldo acumulado sin solicitar</h2>
            <p>Para mantener el programa al corriente fiscalmente, aplican las siguientes reglas cuando tu saldo acumulado alcanza <strong>$5,000 MXN</strong> sin que hayas solicitado el pago:</p>
            <ul>
              <li>Recibirás un <strong>aviso</strong> en tu portal solicitando que realices tu solicitud de pago y subas tu factura.</li>
              <li>Si transcurren <strong>15 días</strong> sin acción, el aviso escala y se te notifica por correo.</li>
              <li>Si transcurren <strong>30 días</strong> sin acción, tu código podrá ser <strong>pausado temporalmente</strong> hasta que regularices tu situación (solicites el pago y entregues tu factura).</li>
            </ul>

            <h2>7. Obligaciones fiscales</h2>
            <ul>
              <li>Como embajadora, eres responsable de tus propias obligaciones fiscales derivadas de los ingresos por comisiones.</li>
              <li>Debes emitir la factura CFDI correspondiente a <strong>Vanguardia Importaciones &amp; Logística de México S.A. de C.V.</strong> por cada pago recibido.</li>
              <li>Los datos fiscales de Vitalora para tu facturación estarán disponibles en tu portal de embajadora.</li>
            </ul>

            <h2>8. Conducta y uso del código</h2>
            <ul>
              <li>No está permitido el uso de tu código en sitios de cupones, spam o prácticas engañosas.</li>
              <li>No puedes presentarte como empleada o representante oficial de Vitalora.</li>
              <li>Vitalora se reserva el derecho de suspender o cancelar tu participación ante usos indebidos.</li>
            </ul>

            <h2>9. Modificaciones y terminación</h2>
            <ul>
              <li>Vitalora puede modificar los términos del programa notificando a las participantes.</li>
              <li>Cualquiera de las partes puede dar por terminada la participación en el programa.</li>
              <li>Las comisiones legítimamente generadas antes de la terminación serán pagadas conforme a estos términos, previa entrega de la factura correspondiente.</li>
            </ul>

            <h2>10. Contacto</h2>
            <p>
              Para cualquier duda sobre el programa, escríbenos a <a href="mailto:hola@vitalora.com.mx" style={{ color: '#C9A961' }}>hola@vitalora.com.mx</a>.
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#A8A8A8', marginTop: '24px' }}>
            <a href="/influencer/registro" style={{ color: '#C9A961', textDecoration: 'none' }}>← Volver al registro</a>
          </p>
        </div>
      </div>
    </>
  )
}
