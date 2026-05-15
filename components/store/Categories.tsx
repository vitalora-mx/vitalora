import Link from 'next/link'

export default function Categories() {
  return (
    <section style={{
      padding: '120px 40px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        justifyContent: 'center',
      }}>
        <span style={{ width: '30px', height: '1px', background: 'var(--gold)', display: 'block' }} />
        Nuestras Colecciones
        <span style={{ width: '30px', height: '1px', background: 'var(--gold)', display: 'block' }} />
      </div>

      <h2 style={{
        fontFamily: 'var(--font-italiana), serif',
        fontSize: 'clamp(36px, 5vw, 64px)',
        textAlign: 'center',
        marginBottom: '80px',
        letterSpacing: '0.02em',
      }}>
        Dos mundos,{' '}
        <em style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic',
          color: 'var(--gold)',
          fontWeight: 300,
        }}>una</em>{' '}
        filosofía
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* Cosméticos */}
        <Link href="/cosmeticos" style={{ textDecoration: 'none' }}>
          <div style={{
            position: 'relative',
            height: '560px',
            overflow: 'hidden',
            borderRadius: '2px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #F5E8E0 0%, #E8C9C0 50%, #D9BE7B 100%)',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 50%, rgba(14,14,14,0.4) 100%)',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{
                fontFamily: 'var(--font-italiana), serif',
                fontSize: '14px',
                letterSpacing: '0.3em',
                color: 'var(--black)',
                opacity: 0.6,
              }}>— 01</div>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '12px', color: 'var(--bg-cream)', opacity: 0.9 }}>Colección K-Beauty</div>
                <h3 style={{
                  fontFamily: 'var(--font-italiana), serif',
                  fontSize: '48px',
                  letterSpacing: '0.02em',
                  color: 'var(--bg-cream)',
                  lineHeight: 1,
                  marginBottom: '16px',
                }}>Cosméticos<br />Coreanos</h3>
                <p style={{ fontSize: '14px', color: 'rgba(245,240,232,0.85)', marginBottom: '24px', maxWidth: '380px' }}>
                  Rituales de cuidado facial inspirados en siglos de tradición coreana, formulados con la ciencia más avanzada.
                </p>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--bg-cream)',
                  borderBottom: '1px solid var(--bg-cream)',
                  paddingBottom: '6px',
                }}>
                  Explorar Colección →
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Suplementos */}
        <Link href="/suplementos" style={{ textDecoration: 'none' }}>
          <div style={{
            position: 'relative',
            height: '560px',
            overflow: 'hidden',
            borderRadius: '2px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #E8EBE2 0%, #A8B5A0 50%, #8A9882 100%)',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 50%, rgba(14,14,14,0.4) 100%)',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{
                fontFamily: 'var(--font-italiana), serif',
                fontSize: '14px',
                letterSpacing: '0.3em',
                color: 'var(--black)',
                opacity: 0.6,
              }}>— 02</div>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '12px', color: 'var(--bg-cream)', opacity: 0.9 }}>Colección Wellness</div>
                <h3 style={{
                  fontFamily: 'var(--font-italiana), serif',
                  fontSize: '48px',
                  letterSpacing: '0.02em',
                  color: 'var(--bg-cream)',
                  lineHeight: 1,
                  marginBottom: '16px',
                }}>Suplementos<br />Alimenticios</h3>
                <p style={{ fontSize: '14px', color: 'rgba(245,240,232,0.85)', marginBottom: '24px', maxWidth: '380px' }}>
                  Fórmulas de alta pureza diseñadas para nutrir tu cuerpo desde dentro y elevar tu vitalidad diaria.
                </p>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--bg-cream)',
                  borderBottom: '1px solid var(--bg-cream)',
                  paddingBottom: '6px',
                }}>
                  Explorar Colección →
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}