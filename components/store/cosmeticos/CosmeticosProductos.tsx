'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

const todasLasMarcas = [
  'Abib', 'Anua', 'Celimax', 'COSRX', "D'ALBA", 'Dr Althea',
  'Elizavecca', 'Eqqual Berry', 'Mary & May', 'Medicube',
  'Mixsoon', 'Nineless', 'Numbuzin', 'Purito', 'Rootree',
  'Round Lab', 'Skin1004', 'Tocobo', 'Unleashia',
]

const productos = [
  { id: 1, slug: 'advanced-snail-96-mucin-power-essence', marca: 'COSRX', rutina: 'Sérum', nombre: 'Advanced Snail 96 Mucin Power Essence', precio: '$649 MXN', tag: 'Best Seller', color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)' },
  { id: 2, slug: 'madagascar-centella-ampoule', marca: 'Skin1004', rutina: 'Sérum', nombre: 'Madagascar Centella Ampoule', precio: '$580 MXN', tag: 'Nuevo', color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)' },
  { id: 3, slug: 'heartleaf-77-soothing-toner', marca: 'Anua', rutina: 'Tónico & Mist', nombre: 'Heartleaf 77% Soothing Toner', precio: '$520 MXN', tag: 'Best Seller', color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)' },
  { id: 4, slug: 'bio-watery-sun-cream', marca: 'Tocobo', rutina: 'Protector Solar', nombre: 'Bio Watery Sun Cream SPF 50+', precio: '$490 MXN', tag: '', color: 'linear-gradient(135deg, #F5F0E8, #EDE6D8)' },
  { id: 5, slug: 'red-erasing-serum', marca: 'Medicube', rutina: 'Sérum', nombre: 'Red Erasing Serum', precio: '$720 MXN', tag: 'Popular', color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)' },
  { id: 6, slug: 'birch-juice-moisturizing-cleanser', marca: 'Round Lab', rutina: 'Limpiador & Exfoliante', nombre: 'Birch Juice Moisturizing Cleanser', precio: '$420 MXN', tag: '', color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)' },
  { id: 7, slug: 'centella-green-level-sun', marca: 'Purito', rutina: 'Protector Solar', nombre: 'Centella Green Level Unscented Sun SPF50+', precio: '$510 MXN', tag: 'Vegano', color: 'linear-gradient(135deg, #D8DDD0, #A8B5A0)' },
  { id: 8, slug: 'no3-poreless-concentrated-essence', marca: 'Numbuzin', rutina: 'Sérum', nombre: 'No.3 Poreless Concentrated Essence', precio: '$680 MXN', tag: 'Nuevo', color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)' },
  { id: 9, slug: 'mild-acidic-ph-sheet-mask', marca: 'Abib', rutina: 'Tónico & Mist', nombre: 'Mild Acidic pH Sheet Mask', precio: '$380 MXN', tag: '', color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)' },
  { id: 10, slug: 'noni-energy-moisture-cream', marca: 'Celimax', rutina: 'Crema & Balm', nombre: 'Noni Energy Moisture Cream', precio: '$550 MXN', tag: 'Best Seller', color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)' },
  { id: 11, slug: 'retinol-intense-repair-serum', marca: 'Dr Althea', rutina: 'Sérum', nombre: 'Retinol Intense Repair Serum', precio: '$610 MXN', tag: '', color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)' },
  { id: 12, slug: 'milky-piggy-carbonated-bubble-clay-mask', marca: 'Elizavecca', rutina: 'Mascarillas & Parche', nombre: 'Milky Piggy Carbonated Bubble Clay Mask', precio: '$460 MXN', tag: 'Popular', color: 'linear-gradient(135deg, #F5F0E8, #EDE6D8)' },
  { id: 13, slug: 'collagen-peptide-vital-mask-pack', marca: 'Mary & May', rutina: 'Crema & Balm', nombre: 'Collagen Peptide Vital Mask Pack', precio: '$530 MXN', tag: '', color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)' },
  { id: 14, slug: 'bean-essence', marca: 'Mixsoon', rutina: 'Sérum', nombre: 'Bean Essence', precio: '$590 MXN', tag: 'Nuevo', color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)' },
  { id: 15, slug: 'peptide-eye-cream', marca: 'Nineless', rutina: 'Cuidado de Ojos', nombre: 'Peptide Eye Cream', precio: '$640 MXN', tag: '', color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)' },
  { id: 16, slug: 'mobitherapy-cleansing-foam', marca: 'Rootree', rutina: 'Limpiador & Exfoliante', nombre: 'Mobitherapy Cleansing Foam', precio: '$410 MXN', tag: '', color: 'linear-gradient(135deg, #D8DDD0, #A8B5A0)' },
  { id: 17, slug: 'waterfull-tone-up-sun-cream', marca: "D'ALBA", rutina: 'Protector Solar', nombre: 'Waterfull Tone-up Sun Cream SPF50+', precio: '$560 MXN', tag: 'Best Seller', color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)' },
  { id: 18, slug: 'sheer-bloggers-cushion', marca: 'Unleashia', rutina: 'Make Up', nombre: 'Sheer Bloggers Cushion', precio: '$670 MXN', tag: 'Nuevo', color: 'linear-gradient(135deg, #F5F0E8, #EDE6D8)' },
  { id: 19, slug: 'barrier-repair-moisture-cream', marca: 'Eqqual Berry', rutina: 'Crema & Balm', nombre: 'Barrier Repair Moisture Cream', precio: '$480 MXN', tag: '', color: 'linear-gradient(135deg, #E8EBE2, #A8B5A0)' },
  { id: 20, slug: 'acne-pimple-master-patch', marca: 'COSRX', rutina: 'Parches para Acné', nombre: 'Acne Pimple Master Patch', precio: '$280 MXN', tag: 'Best Seller', color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)' },
]

interface Props {
  rutinaActiva: string
  marcaActiva: string
  setMarcaActiva: (m: string) => void
}

export default function CosmeticosProductos({ rutinaActiva }: Props) {
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [orden, setOrden] = useState('relevancia')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleMarca(marca: string) {
    setMarcasSeleccionadas(prev =>
      prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca]
    )
  }

  function limpiarMarcas() {
    setMarcasSeleccionadas([])
  }

  const productosFiltrados = productos.filter(p => {
    const porRutina = rutinaActiva === 'Todas' || p.rutina === rutinaActiva
    const porMarca = marcasSeleccionadas.length === 0 || marcasSeleccionadas.includes(p.marca)
    return porRutina && porMarca
  })

  return (
    <div style={{ background: '#F9F5F0', minHeight: '600px' }}>

      {/* Barra de filtros */}
      <div style={{ background: 'white', borderBottom: '1px solid #E8E0D5', position: 'sticky', top: '73px', zIndex: 90, padding: '14px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>

          {/* Dropdown Marcas */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                border: '1px solid', borderColor: marcasSeleccionadas.length > 0 ? 'var(--gold)' : '#E8E0D5',
                borderRadius: '100px', background: marcasSeleccionadas.length > 0 ? 'var(--gold)' : 'white',
                color: marcasSeleccionadas.length > 0 ? 'white' : '#2C2C2C',
                fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
              }}
            >
              Marcas {marcasSeleccionadas.length > 0 ? `(${marcasSeleccionadas.length})` : ''} <span style={{ fontSize: '10px' }}>{dropdownOpen ? '▲' : '▼'}</span>
            </button>

            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white', border: '1px solid #E8E0D5', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', padding: '16px', minWidth: '280px', zIndex: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E8E0D5' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B6B6B' }}>Selecciona marcas</span>
                  {marcasSeleccionadas.length > 0 && (
                    <button onClick={limpiarMarcas} style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>Limpiar</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                  {todasLasMarcas.map((marca) => {
                    const seleccionada = marcasSeleccionadas.includes(marca)
                    return (
                      <button key={marca} onClick={() => toggleMarca(marca)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: seleccionada ? 'rgba(201,169,97,0.08)' : 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#2C2C2C', textAlign: 'left', transition: 'background 0.2s' }}>
                        <div style={{ width: '18px', height: '18px', border: '1.5px solid', borderColor: seleccionada ? 'var(--gold)' : '#D9D2C4', borderRadius: '3px', background: seleccionada ? 'var(--gold)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                          {seleccionada && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                        </div>
                        {marca}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botón Suplementos + Ordenar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/suplementos" style={{ padding: '8px 20px', border: '1px solid var(--gold)', borderRadius: '100px', color: 'var(--gold)', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
              Suplementos →
            </Link>
            <span style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B' }}>Ordenar:</span>
            <select value={orden} onChange={(e) => setOrden(e.target.value)} style={{ padding: '8px 16px', border: '1px solid #E8E0D5', borderRadius: '100px', background: 'white', fontSize: '12px', color: '#2C2C2C', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: Menor a Mayor</option>
              <option value="precio-desc">Precio: Mayor a Menor</option>
              <option value="nuevo">Más Nuevos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '32px' }}>
          {productosFiltrados.length} productos encontrados
          {rutinaActiva !== 'Todas' && <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>· {rutinaActiva}</span>}
          {marcasSeleccionadas.length > 0 && <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>· {marcasSeleccionadas.join(', ')}</span>}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {productosFiltrados.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', color: '#6B6B6B' }}>
              <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', marginBottom: '16px', color: 'var(--gold)' }}>✦</div>
              <p>No hay productos en esta categoría todavía.</p>
            </div>
          ) : (
            productosFiltrados.map((producto) => (
              <Link
                key={producto.id}
                href={`/cosmeticos/producto/${producto.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{ cursor: 'pointer', background: 'white', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E8E0D5', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ aspectRatio: '1', background: producto.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {producto.tag && <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 10px', background: 'var(--gold)', color: 'white', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '2px' }}>{producto.tag}</div>}
                    <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', color: 'rgba(0,0,0,0.2)' }}>V</div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px' }}>{producto.marca}</div>
                    <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 500, color: '#0E0E0E', marginBottom: '8px', lineHeight: 1.4 }}>{producto.nombre}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 600, color: '#0E0E0E' }}>{producto.precio}</span>
                      <span style={{ padding: '8px 16px', background: '#0E0E0E', color: 'white', fontSize: '11px', letterSpacing: '0.1em', borderRadius: '2px' }}>+ Agregar</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}