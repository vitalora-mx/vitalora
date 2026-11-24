'use client'

// ============================================================
// Paginación de listas de productos (Cosméticos, Suplementos, buscador).
// - variante "completa": números con … (abajo de la lista)
// - variante "compacta": arriba de la lista, junto a "N productos encontrados".
//   En celular solo muestra ‹ 2 / 7 › para que quepa en una línea.
// ============================================================

interface Props {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  compacta?: boolean
  isMobile?: boolean
  colorActivo?: string
}

// Alto de un elemento solo si de verdad queda fijo arriba (sticky/fixed y pegado en su `top`)
function altoSiFijo(el: Element | null): number {
  if (!el) return 0
  const estilo = getComputedStyle(el)
  if (estilo.position !== 'sticky' && estilo.position !== 'fixed') return 0
  const r = el.getBoundingClientRect()
  const top = parseFloat(estilo.top) || 0
  return Math.abs(r.top - top) < 2 ? r.height : 0
}

// Desplaza la ventana hasta el elemento (la línea de "N productos encontrados"), dejando
// libre lo que esté fijo arriba: el <header> de la tienda y los `fijos` que se pasen
// (por ejemplo, la barra de filtros).
export function desplazarA(el: HTMLElement | null, ...fijos: (HTMLElement | null)[]) {
  if (!el || typeof window === 'undefined') return
  const ocupado = [document.querySelector('header'), ...fijos].reduce((s, f) => s + altoSiFijo(f), 0)
  const top = el.getBoundingClientRect().top + window.scrollY - ocupado - 12
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

export default function Paginacion({ pagina, totalPaginas, onCambiar, compacta = false, isMobile = false, colorActivo = 'var(--gold)' }: Props) {
  if (totalPaginas <= 1) return null

  const lado = compacta ? 34 : 40
  const boton = (activo: boolean, deshabilitado = false): React.CSSProperties => ({
    minWidth: `${lado}px`, height: `${lado}px`, padding: '0 6px', border: '1px solid',
    borderColor: activo ? colorActivo : '#E8E0D5', borderRadius: '6px',
    background: activo ? colorActivo : 'white',
    color: activo ? 'white' : deshabilitado ? '#CCC' : '#2C2C2C',
    cursor: deshabilitado ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    fontSize: compacta ? '13px' : '14px', fontWeight: activo ? 600 : 400,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })

  const anterior = (
    <button type="button" aria-label="Página anterior" disabled={pagina <= 1}
      onClick={() => { if (pagina > 1) onCambiar(pagina - 1) }}
      style={{ ...boton(false, pagina <= 1), fontSize: '15px' }}>‹</button>
  )
  const siguiente = (
    <button type="button" aria-label="Página siguiente" disabled={pagina >= totalPaginas}
      onClick={() => { if (pagina < totalPaginas) onCambiar(pagina + 1) }}
      style={{ ...boton(false, pagina >= totalPaginas), fontSize: '15px' }}>›</button>
  )

  // Arriba en celular: ‹ 2 / 7 ›
  if (compacta && isMobile) {
    return (
      <nav aria-label="Paginación" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
        {anterior}
        <span style={{ fontSize: '13px', color: '#2C2C2C', whiteSpace: 'nowrap' }}>{pagina} / {totalPaginas}</span>
        {siguiente}
      </nav>
    )
  }

  const numeros = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)

  return (
    <nav aria-label="Paginación" style={{ display: 'flex', alignItems: 'center', justifyContent: compacta ? 'flex-end' : 'center', gap: compacta ? '6px' : '8px', flexWrap: 'wrap', marginLeft: compacta ? 'auto' : undefined }}>
      {anterior}
      {numeros.map((n, idx) => {
        const hayGap = idx > 0 && n - numeros[idx - 1] > 1
        return (
          <span key={n} style={{ display: 'flex', alignItems: 'center', gap: compacta ? '6px' : '8px' }}>
            {hayGap && <span style={{ color: '#AAA', fontSize: '14px' }}>…</span>}
            <button type="button" aria-current={n === pagina ? 'page' : undefined}
              onClick={() => onCambiar(n)} style={boton(n === pagina)}>{n}</button>
          </span>
        )
      })}
      {siguiente}
    </nav>
  )
}
