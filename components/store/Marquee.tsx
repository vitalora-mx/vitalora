export default function Marquee() {
  const items = [
    'Auténtico',
    'Importado de Corea',
    'Cruelty Free',
    'Ingredientes Puros',
    'Envío Nacional',
  ]

  const doubled = [...items, ...items]

  return (
    <div style={{
      background: 'var(--bg-cream-deep)',
      padding: '24px 0',
      overflow: 'hidden',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        display: 'flex',
        gap: '80px',
        animation: 'scroll 30s linear infinite',
        whiteSpace: 'nowrap',
        width: 'max-content',
      }}>
        {doubled.map((item, i) => (
          <span key={i} style={{
            fontFamily: 'var(--font-italiana), serif',
            fontSize: '22px',
            letterSpacing: '0.2em',
            color: 'var(--text)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '80px',
          }}>
            {item}
            <span style={{ color: 'var(--gold)', fontSize: '14px' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}