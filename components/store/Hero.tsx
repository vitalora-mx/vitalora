import Link from 'next/link'

export default function Hero() {
  return (
    <section style={{
      minHeight: '90vh',
      background: 'var(--black)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(201,169,97,0.15) 0%, transparent 50%)',
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 40px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '80px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ color: 'var(--bg-cream)' }}>
          <div style={{
            fontSize: '12px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <span style={{ width: '40px', height: '1px', background: 'var(--gold)', display: 'block' }} />
            K-Beauty & Bienestar
          </div>

          <h1 style={{
            fontFamily: 'var(--font-italiana), serif',
            fontSize: 'clamp(48px, 7vw, 96px)',
            lineHeight: 1,
            letterSpacing: '0.02em',
            marginBottom: '32px',
          }}>
            Belleza<br />
            que{' '}
            <em style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'var(--gold)',
            }}>florece</em>
            <br />desde dentro
          </h1>

          <p style={{
            fontSize: '16px',
            lineHeight: 1.7,
            color: 'rgba(245,240,232,0.75)',
            maxWidth: '480px',
            marginBottom: '48px',
          }}>
            Descubre lo mejor de la cosmética coreana auténtica y suplementos
            de alta pureza. Importados directamente. Entregados con cuidado.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/cosmeticos" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '18px 36px',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 500,
              textDecoration: 'none',
              background: 'var(--gold)',
              color: 'var(--black)',
              border: '1px solid var(--gold)',
            }}>
              Cosméticos Coreanos <span>→</span>
            </Link>
            <Link href="/suplementos" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '18px 36px',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 500,
              textDecoration: 'none',
              background: 'none',
              color: 'var(--bg-cream)',
              border: '1px solid rgba(245,240,232,0.3)',
            }}>
              Suplementos <span>→</span>
            </Link>
          </div>
        </div>

        <div style={{ position: 'relative', height: '500px' }}>
          <div style={{
            position: 'absolute',
            width: '280px',
            height: '380px',
            top: 0,
            right: '60px',
            background: 'linear-gradient(135deg, #F5E8E0 0%, #E8C9C0 100%)',
            transform: 'rotate(-3deg)',
            borderRadius: '2px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--black)', opacity: 0.6, marginBottom: '16px' }}>K-Beauty</div>
            <div style={{ width: '80px', height: '180px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px 4px 40px 40px', border: '1px solid rgba(255,255,255,0.5)', marginBottom: '20px' }} />
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 500, color: 'var(--black)' }}>Glow Serum</div>
          </div>

          <div style={{
            position: 'absolute',
            width: '240px',
            height: '320px',
            bottom: '20px',
            left: 0,
            background: 'linear-gradient(135deg, #D8DDD0 0%, #A8B5A0 100%)',
            transform: 'rotate(4deg)',
            borderRadius: '2px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--black)', opacity: 0.6, marginBottom: '16px' }}>Wellness</div>
            <div style={{ width: '80px', height: '180px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px 4px 40px 40px', border: '1px solid rgba(255,255,255,0.5)', marginBottom: '20px' }} />
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 500, color: 'var(--black)' }}>Vital Complex</div>
          </div>
        </div>

      </div>
    </section>
  )
}