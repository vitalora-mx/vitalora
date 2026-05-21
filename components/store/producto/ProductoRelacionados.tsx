import Link from 'next/link'

const todosLosProductos: Record<number, any> = {
  1: { nombre: 'Hydra Glow Essence', marca: 'COSRX', precio: 649, color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)', slug: 'hydra-glow-essence' },
  2: { nombre: 'Royal Snail Cream', marca: 'COSRX', precio: 890, color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)', slug: 'royal-snail-cream' },
  3: { nombre: 'Heartleaf Toner', marca: 'Anua', precio: 520, color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)', slug: 'heartleaf-toner' },
  4: { nombre: 'Bio Watery Sun Cream', marca: 'Tocobo', precio: 490, color: 'linear-gradient(135deg, #F5F0E8, #EDE6D8)', slug: 'bio-watery-sun-cream' },
  5: { nombre: 'Red Erasing Serum', marca: 'Medicube', precio: 720, color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)', slug: 'red-erasing-serum' },
}

interface Props {
  productoIds: number[]
  tipo: 'cosmeticos' | 'suplementos'
}

export default function ProductoRelacionados({ productoIds, tipo }: Props) {
  const productos = productoIds.map(id => todosLosProductos[id]).filter(Boolean)

  if (productos.length === 0) return null

  return (
    <section style={{
      padding: '80px 40px',
      background: 'var(--bg-cream-deep)',
      borderTop: '1px solid var(--line)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>
            También te puede gustar
          </div>
          <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', letterSpacing: '0.02em', color: 'var(--black)' }}>
            Productos relacionados
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {productos.map((producto) => (
            <Link
              key={producto.slug}
              href={`/${tipo}/producto/${producto.slug}`}
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              <div
                style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--line)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ aspectRatio: '1', background: producto.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '40px', color: 'rgba(0,0,0,0.1)' }}>V</div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px' }}>{producto.marca}</div>
                  <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 500, color: 'var(--black)', marginBottom: '8px' }}>{producto.nombre}</h3>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 600, color: 'var(--black)' }}>${producto.precio.toLocaleString()} MXN</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}