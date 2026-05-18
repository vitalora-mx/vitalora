export default function CosmeticosBanner() {
  return (
    <div style={{
      width: '100%',
      height: '420px',
      background: 'linear-gradient(135deg, #F5E8E0 0%, #E8C9C0 50%, #F9F5F0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 70% 50%, rgba(201,169,97,0.15) 0%, transparent 60%)',
      }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
          Colección K-Beauty
        </div>
        <h1 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: 'clamp(40px, 6vw, 80px)',
          letterSpacing: '0.02em',
          color: '#0E0E0E',
          lineHeight: 1.1,
          marginBottom: '16px',
        }}>
          Cosméticos Coreanos
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#6B6B6B',
          maxWidth: '500px',
          lineHeight: 1.7,
        }}>
          19 marcas auténticas importadas directamente de Corea. Encuentra tu rutina perfecta.
        </p>
      </div>
    </div>
  )
}