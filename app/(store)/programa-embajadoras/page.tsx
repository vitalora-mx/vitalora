'use client'

export default function ProgramaEmbajadorasPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Italiana&display=swap');
        .emb-cta { transition: all 0.2s; }
        .emb-cta:hover { transform: translateY(-2px); }
        .emb-fade { animation: embFade 0.8s ease both; }
        @keyframes embFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ background: '#F5F0E8', fontFamily: 'system-ui, sans-serif', color: '#0E0E0E' }}>

        {/* HERO */}
        <section style={{ background: '#0E0E0E', padding: '80px 24px 90px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="emb-fade" style={{ maxWidth: '680px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '20px' }}>Programa de Embajadoras Vitalora</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '46px', letterSpacing: '0.02em', color: '#F5F0E8', lineHeight: 1.12, marginBottom: '24px' }}>
              Tu voz inspira.<br />Tu comunidad <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>florece</em>.
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(245,240,232,0.75)', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto 36px' }}>
              Comparte el ritual coreano de belleza y bienestar que amas. Acompaña a tu comunidad en su camino y construye, junto a nosotras, algo que perdura.
            </p>
            <a href="/influencer/registro" className="emb-cta" style={{ display: 'inline-block', background: '#C9A961', color: '#0E0E0E', textDecoration: 'none', padding: '16px 40px', borderRadius: '4px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Quiero ser embajadora
            </a>
          </div>
        </section>

        {/* BENEFICIO CENTRAL: 5% + 5% */}
        <section style={{ padding: '72px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '12px' }}>Generosidad que regresa</p>
            <h2 style={{ fontFamily: "'Italiana', serif", fontSize: '34px', color: '#0E0E0E', lineHeight: 1.2 }}>
              Das y recibes en la misma medida
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Regalas */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '40px 32px', textAlign: 'center', border: '1px solid #E8E4DA' }}>
              <div style={{ fontFamily: "'Italiana', serif", fontSize: '64px', color: '#C9A961', lineHeight: 1, marginBottom: '12px' }}>5%</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '21px', fontWeight: 600, color: '#0E0E0E', marginBottom: '10px' }}>Regalas a tu comunidad</p>
              <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7 }}>
                Con tu código personal, cada persona que confíe en tu recomendación recibe <strong>5% de descuento</strong> en su compra. Un detalle que cuida su bolsillo y refuerza su confianza en ti.
              </p>
            </div>

            {/* Ganas */}
            <div style={{ background: '#0E0E0E', borderRadius: '8px', padding: '40px 32px', textAlign: 'center', border: '1px solid #0E0E0E' }}>
              <div style={{ fontFamily: "'Italiana', serif", fontSize: '64px', color: '#C9A961', lineHeight: 1, marginBottom: '12px' }}>5%</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '21px', fontWeight: 600, color: '#F5F0E8', marginBottom: '10px' }}>Ganas por cada venta</p>
              <p style={{ fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.7 }}>
                Recibes una <strong style={{ color: '#C9A961' }}>comisión del 5%</strong> sobre cada venta hecha con tu código. Tu influencia tiene valor, y aquí se reconoce.
              </p>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ padding: '24px 24px 72px', maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '12px' }}>Sencillo y transparente</p>
            <h2 style={{ fontFamily: "'Italiana', serif", fontSize: '34px', color: '#0E0E0E', lineHeight: 1.2 }}>Cómo funciona</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { n: '01', t: 'Te registras', d: 'Completas tu solicitud con tus datos y tus redes. Revisamos tu perfil con cariño y, al aprobarte, recibes tu código personal por correo.' },
              { n: '02', t: 'Compartes tu código', d: 'Lo difundes en tus redes, historias o contenido. Cada persona que lo usa obtiene su 5% de descuento al instante.' },
              { n: '03', t: 'Acumulas comisiones', d: 'Cada venta con tu código suma un 5% a tu saldo. Sigues todo en tiempo real desde tu portal de embajadora, con reportes descargables.' },
              { n: '04', t: 'Recibes tu pago', d: 'Cuando tu saldo supera los $500 MXN, solicitas tu pago. Lo depositamos a tu cuenta vía transferencia, contra tu factura.' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', padding: '24px', background: '#fff', borderRadius: '8px', border: '1px solid #E8E4DA' }}>
                <div style={{ fontFamily: "'Italiana', serif", fontSize: '28px', color: '#C9A961', lineHeight: 1, flexShrink: 0, width: '44px' }}>{p.n}</div>
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: '#0E0E0E', marginBottom: '6px' }}>{p.t}</p>
                  <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7 }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* REQUISITOS */}
        <section style={{ background: '#fff', padding: '72px 24px', borderTop: '1px solid #E8E4DA', borderBottom: '1px solid #E8E4DA' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '12px' }}>Para unirte</p>
              <h2 style={{ fontFamily: "'Italiana', serif", fontSize: '34px', color: '#0E0E0E', lineHeight: 1.2 }}>Lo que necesitas</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {[
                { t: 'Presencia en redes', d: 'Una comunidad genuina en Instagram, TikTok, YouTube, Facebook u otra plataforma. No importa el tamaño, sino el vínculo real con tu audiencia.' },
                { t: 'Capacidad de facturar', d: 'Para recibir tus comisiones necesitas poder emitir factura (CFDI) por servicios de publicidad o comisiones por ventas.' },
                { t: 'Constancia de Situación Fiscal', d: 'Un PDF reciente (no mayor a 3 meses) que nos permite validar tus datos y procesar correctamente tus pagos.' },
                { t: 'Cuenta bancaria a tu nombre', d: 'Una CLABE interbancaria donde depositaremos tus comisiones de forma segura.' },
                { t: 'Afinidad con Vitalora', d: 'Amor por el cuidado personal, el bienestar y la filosofía del ritual coreano que compartimos con cada cliente.' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '24px', background: '#FAFAF7', borderRadius: '8px', borderLeft: '3px solid #C9A961' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#0E0E0E', marginBottom: '8px' }}>{r.t}</p>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.7 }}>{r.d}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: '#A8A8A8', lineHeight: 1.7, marginTop: '28px', textAlign: 'center' }}>
              El descuento de tu código y el de primera compra no son acumulables. Consulta todos los detalles en los <a href="/influencer/terminos" style={{ color: '#C9A961', textDecoration: 'none' }}>términos del programa</a>.
            </p>
          </div>
        </section>

        {/* CIERRE + BOTONES */}
        <section style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Italiana', serif", fontSize: '36px', color: '#0E0E0E', lineHeight: 1.2, marginBottom: '16px' }}>
            Tu lugar en Vitalora<br /><em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>te espera</em>
          </h2>
          <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.8, marginBottom: '36px' }}>
            Da el primer paso hoy. Si ya eres parte de nuestra comunidad de embajadoras, entra a tu portal para seguir tus ventas y comisiones.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/influencer/registro" className="emb-cta" style={{ display: 'inline-block', background: '#0E0E0E', color: '#C9A961', textDecoration: 'none', padding: '16px 36px', borderRadius: '4px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Registrarme
            </a>
            <a href="/influencer/portal" className="emb-cta" style={{ display: 'inline-block', background: '#fff', color: '#8B7530', textDecoration: 'none', padding: '16px 36px', borderRadius: '4px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1.5px solid #C9A961' }}>
              Ya soy embajadora
            </a>
          </div>
          <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '32px' }}>
            ¿Tienes dudas? Escríbenos a <a href="mailto:hola@vitalora.com.mx" style={{ color: '#C9A961', textDecoration: 'none' }}>hola@vitalora.com.mx</a>
          </p>
        </section>

      </div>
    </>
  )
}
