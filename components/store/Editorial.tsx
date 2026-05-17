export default function Editorial() {
  return (
    <section style={{
      padding: '120px 40px',
      background: 'var(--black)',
      color: 'var(--bg-cream)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 70% 30%, rgba(201,169,97,0.1) 0%, transparent 60%)',
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Visual */}
        <div style={{
          height: '600px',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #0E0E0E 100%)',
          border: '1px solid rgba(201,169,97,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            inset: '20px',
            border: '1px solid rgba(201,169,97,0.15)',
          }} />
          <span style={{ fontSize: '160px', opacity: 0.3 }}>🌿</span>
        </div>

        {/* Texto */}
        <div>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ width: '24px', height: '1px', background: 'var(--gold)', display: 'block' }} />
            Nuestra Filosofía
          </div>

          <h2 style={{
            fontFamily: 'var(--font-italiana), serif',
            fontSize: '56px',
            lineHeight: 1.1,
            marginBottom: '32px',
            letterSpacing: '0.02em',
          }}>
            Vitalidad<br />
            <em style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontStyle: 'italic',
              color: 'var(--gold)',
              fontWeight: 300,
            }}>auténtica</em>,<br />
            sin atajos.
          </h2>

          <p style={{
            fontSize: '16px',
            lineHeight: 1.8,
            color: 'rgba(245,240,232,0.7)',
            marginBottom: '24px',
          }}>
            En Vitalora creemos que el verdadero bienestar nace de la unión entre la tradición coreana y la ciencia moderna. Cada producto es seleccionado y verificado por nuestro equipo para garantizar autenticidad, pureza y resultados.
          </p>

          {/* Valores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginTop: '40px',
          }}>
            {[
              { num: '01', title: 'Origen verificado', desc: 'Importación directa con certificados de autenticidad.' },
              { num: '02', title: 'Curaduría experta', desc: 'Solo el 5% de productos evaluados llegan a tu puerta.' },
              { num: '03', title: 'Cruelty free', desc: 'Comprometidos con prácticas éticas y sostenibles.' },
              { num: '04', title: 'Resultados reales', desc: 'Más de 5,000 clientas mexicanas nos respaldan.' },
            ].map((v) => (
              <div key={v.num} style={{
                paddingTop: '24px',
                borderTop: '1px solid rgba(201,169,97,0.3)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-italiana), serif',
                  fontSize: '14px',
                  color: 'var(--gold)',
                  letterSpacing: '0.2em',
                  marginBottom: '12px',
                }}>{v.num}</div>
                <h4 style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  fontSize: '20px',
                  marginBottom: '8px',
                  color: 'var(--bg-cream)',
                }}>{v.title}</h4>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(245,240,232,0.6)',
                  lineHeight: 1.6,
                }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}