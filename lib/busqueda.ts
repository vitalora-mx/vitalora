// ============================================================
// Búsqueda de productos por palabras (cliente y servidor).
// - Sin distinguir mayúsculas ni acentos ("acido" encuentra "Ácido").
// - La búsqueda se separa en palabras y un producto coincide si CADA
//   palabra aparece en alguno de sus campos, en cualquier orden
//   ("skin1004 toner" encuentra "SKIN1004 Madagascar Centella Toning Toner").
// - Cada palabra puede tener alternativas (sinónimos): basta con que
//   aparezca una de ellas.
// ============================================================

export const MAX_PALABRAS = 8

// Minúsculas y sin acentos ni diéresis (la ñ queda como n, igual en ambos lados)
export function normalizar(texto: unknown): string {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Palabras de una búsqueda, normalizadas, sin repetir y con un máximo.
// Se descartan las que no tienen letras ni números (por ejemplo "&").
export function palabrasDe(busqueda: string): string[] {
  const palabras = normalizar(busqueda)
    .split(/[\s,;:()"'¿?¡!/]+/)
    .filter(p => /[a-z0-9]/.test(p))
  return Array.from(new Set(palabras)).slice(0, MAX_PALABRAS)
}

// Texto de búsqueda de un producto a partir de sus campos
export function textoDe(...campos: unknown[]): string {
  return campos.map(normalizar).join(' \u0001 ')
}

// true si cada grupo de alternativas tiene al menos una presente en el texto
export function coincideTodas(alternativasPorPalabra: string[][], texto: string): boolean {
  return alternativasPorPalabra.every(alts => alts.some(a => texto.includes(a)))
}

// Filtro simple (sin sinónimos) para listas del admin.
// Devuelve null si la búsqueda está vacía (no filtrar).
export function filtroPorPalabras(busqueda: string): ((...campos: unknown[]) => boolean) | null {
  const palabras = palabrasDe(busqueda)
  if (palabras.length === 0) return null
  const grupos = palabras.map(p => [p])
  return (...campos: unknown[]) => coincideTodas(grupos, textoDe(...campos))
}
