export default function Trust() {
  const items = [
    { icon: '✦', title: 'Pago Seguro', desc: 'Procesado por Mercado Pago' },
    { icon: '✦', title: 'Envío Nacional', desc: 'A todo México en 2-5 días' },
    { icon: '✦', title: '100% Auténtico', desc: 'Garantía de originalidad' },
    { icon: '✦', title: 'Atención Personal', desc: 'Asesoría por WhatsApp' },
  ]

  return (
    <section style={{
      padding: '80px 40px',
      background: 'var(--bg-cream)',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '40px',
      }}>
        {items.map((item) => (
          <div key={item.title} style={{ textAlign: 'center', padding: '0 20px' }}>
            <div style={{ fontSize: '28px', color: 'var(--gold)', marginBottom: '16px' }}>
              {item.icon}
            </div>
            <h4 style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '18px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'var(--black)',
            }}>{item.title}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}