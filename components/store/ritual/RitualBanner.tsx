export default function RitualBanner() {
  return (
    <div style={{
      width: '100%',
      height: '420px',
      // ── FONDO ──────────────────────────────────────────────
      // Por ahora es un degradado. Cuando tengas tu imagen:
      //  1. Pon la imagen en: public/images/ritual/banner.jpg
      //  2. Borra la linea "background:" de abajo y descomenta estas dos:
      // backgroundImage: 'url(/images/ritual/banner.jpg)',
      // backgroundSize: 'cover', backgroundPosition: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #20281f 50%, #0E0E0E 100%)',
      // ───────────────────────────────────────────────────────
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Brillo verde sage decorativo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 70% 50%, rgba(168,181,160,0.18) 0%, transparent 60%)',
      }} />
      {/* Capa oscura para que el texto se lea sobre la futura imagen */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
      }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#A8B5A0', marginBottom: '16px' }}>
          Vitalora Ritual
        </div>
        <h1 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontSize: 'clamp(40px, 6vw, 80px)',
          letterSpacing: '0.02em',
          color: '#E8E4DA',
          lineHeight: 1.1,
          marginBottom: '16px',
        }}>
          Ritual
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'rgba(232,228,218,0.75)',
          maxWidth: '520px',
          lineHeight: 1.7,
          margin: '0 auto',
        }}>
          Aprende a usar tus productos, combina skincare con suplementos y descubre rutinas que sí funcionan.
        </p>
      </div>
    </div>
  )
}
