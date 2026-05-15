export default function FeaturedProducts() {
  const products = [
    {
      id: 1,
      meta: 'K-Beauty · Sérum',
      name: 'Hydra Glow Essence',
      sub: 'Ácido hialurónico + ginseng coreano',
      price: '$649 MXN',
      tag: 'Best Seller',
      tagType: 'gold',
      color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)',
    },
    {
      id: 2,
      meta: 'K-Beauty · Crema',
      name: 'Royal Snail Cream',
      sub: 'Regeneración nocturna intensiva',
      price: '$890 MXN',
      tag: 'Nuevo',
      tagType: 'black',
      color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)',
    },
    {
      id: 3,
      meta: 'Wellness · Cápsulas',
      name: 'Colágeno Marino',
      sub: 'Tipo I & III · 60 cápsulas',
      price: '$520 MXN',
      tag: 'Vegano',
      tagType: 'sage',
      color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)',
    },
    {
      id: 4,
      meta: 'Wellness · Cápsulas',
      name: 'Vital Defense Pro',
      sub: 'Multivitamínico premium · 90 días',
      price: '$745 MXN',
      tag: 'Best Seller',
      tagType: 'gold',
      color: 'linear-gradient(135deg, #1A1A1A, #0E0E0E)',
    },
  ]

  const tagStyles: Record<string, React.CSSProperties> = {
    gold:  { background: 'var(--gold)',     color: 'var(--black)' },
    black: { background: 'var(--black)',    color: 'var(--bg-cream)' },
    sage:  { background: 'var(--sage-deep)', color: 'var(--bg-cream)' },
  }

  return (
    <section style={{ padding: '120px 40px', background: 'var(--bg-cream-deep)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '24px', height: '1px', background: 'var(--gold)', display: 'block' }} />
              Más Vendidos
            </div>
            <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: 'clamp(32px, 4vw, 56px)', letterSpacing: '0.02em' }}>
              Favoritos{' '}
              <em style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', color: 'var(--gold)', fontWeight: 300 }}>de la casa</em>
            </h2>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-cream)', padding: '6px', borderRadius: '100px', border: '1px solid var(--line)' }}>
            {['Todos', 'Cosméticos', 'Suplementos'].map((tab, i) => (
              <button key={tab} style={{
                padding: '10px 24px',
                fontSize: '12px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: '100px',
                fontWeight: 500,
                cursor: 'pointer',
                background: i === 0 ? 'var(--black)' : 'none',
                color: i === 0 ? 'var(--bg-cream)' : 'var(--text)',
                fontFamily: 'inherit',
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
          {products.map((product) => (
            <div key={product.id} style={{ cursor: 'pointer' }}>

              {/* Imagen */}
              <div style={{
                aspectRatio: '4/5',
                background: 'var(--bg-cream)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '20px',
              }}>
                {/* Tag */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  padding: '6px 12px',
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  zIndex: 2,
                  ...tagStyles[product.tagType],
                }}>
                  {product.tag}
                </div>

                {/* Visual del producto */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: product.color,
                }}>
                  <div style={{
                    width: '80px',
                    height: '160px',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '4px 4px 40px 40px',
                    border: '1px solid rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-italiana), serif',
                    fontSize: '20px',
                    color: 'rgba(255,255,255,0.6)',
                  }}>
                    V
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                {product.meta}
              </div>
              <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 500, marginBottom: '4px', color: 'var(--black)' }}>
                {product.name}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                {product.sub}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 500 }}>
                  {product.price}
                </span>
                <span style={{ color: 'var(--gold)', fontSize: '12px' }}>★★★★★</span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}