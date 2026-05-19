export default function SuplementosBanner() {
  return (
    <div style={{
      width: '100%',
      height: '420px',
      background: 'linear-gradient(135deg, #0E0E0E 0%, #1A2A1A 50%, #0E0E0E 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 60% 50%, rgba(168,197,160,0.15) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        bottom: '20px',
        border: '1px solid rgba(168,197,160,0.2)',
        borderRadius: '2px',
      }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: '#A8C5A0',
          marginBottom: '16px',
        }}>
          Colección Wellness
        </div>
        <h1 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: 'clamp(40px, 6vw, 80px)',
          letterSpacing: '0.02em',
          color: '#F5F2EC',
          lineHeight: 1.1,
          marginBottom: '16px',
        }}>
          Suplementos Alimenticios
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'rgba(245,242,236,0.6)',
          maxWidth: '500px',
          lineHeight: 1.7,
          margin: '0 auto',
        }}>
          Fórmulas de alta pureza para nutrir tu cuerpo desde dentro. Resultados reales, ingredientes verificados.
        </p>
      </div>
    </div>
  )
}