export default function AnnouncementBar() {
  return (
    <div style={{
      background: 'var(--black)',
      color: 'var(--bg-cream)',
      textAlign: 'center',
      padding: '10px 20px',
      fontSize: '12px',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      fontWeight: 400,
    }}>
      ✦ ENVÍO GRATIS EN COMPRAS MAYORES A{' '}
      <span style={{ color: 'var(--gold)' }}>$1,000 MXN</span>
      ✦ PRODUCTOS 100% AUTÉNTICOS ✦
    </div>
  )
}