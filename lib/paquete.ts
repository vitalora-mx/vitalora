// ============================================================
// Cálculo del paquete de un pedido: empaque, medidas y peso.
// Lógica pura (sin base de datos ni red): la usan el checkout y el admin.
//
// Regla:
//  - Peso = suma de (peso del producto × cantidad) + empaque vacío + relleno.
//  - Bolsa si los productos caben; si no, caja; si no caben en la caja,
//    se usa la caja y se avisa al admin.
//  - Productos con empaque "caja" (categoría Kits) van siempre en caja.
//  - El admin puede forzar bolsa/caja y el peso antes de cotizar.
// Medidas en cm enteros (redondeo hacia arriba) y peso en kg (2 decimales, hacia arriba).
// ============================================================

export const BOLSA = { largo: 25, ancho: 20, pesoG: 20, altoMax: 8, sat: '5H4' } as const
export const CAJA = { largo: 28, ancho: 16, alto: 15, pesoG: 50, sat: '4G' } as const
export const RELLENO_G = 20
// Los productos no se acomodan perfecto: se reserva 20% extra de volumen
export const HOLGURA_VOLUMEN = 1.2
// Si un producto no tiene peso o medidas, se usa esto y se avisa
export const PESO_DEFECTO_G = 250
export const MEDIDAS_DEFECTO_CM: [number, number, number] = [15, 8, 5]
// Código SAT de Carta Porte para todo (aprobado: 53131619 "Cosméticos")
export const CLAVE_SAT_PRODUCTO = '53131619'

export type TipoEmpaque = 'bolsa' | 'caja'

export interface ArticuloPaquete {
  nombre: string
  cantidad: number
  pesoG: number | null
  altoCm: number | null
  anchoCm: number | null
  largoCm: number | null
  siempreCaja?: boolean // kits
}

export type AvisoPaquete =
  | { tipo: 'no_cabe_en_caja' }
  | { tipo: 'faltan_datos'; productos: string[] }
  | { tipo: 'bolsa_forzada_no_cabe' }

export interface Paquete {
  empaque: TipoEmpaque
  largoCm: number
  anchoCm: number
  altoCm: number
  pesoKg: number
  pesoProductosG: number
  pesoVolumetricoKg: number // (L×A×H)/5000, como lo calculan las paqueterías
  claveEmpaqueSat: string
  ajustadoAMano: boolean
  avisos: AvisoPaquete[]
}

const positivo = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0
const ordenDesc = (a: number[]) => [...a].sort((x, y) => y - x)
const kg = (g: number) => Math.ceil(g / 10) / 100

function medidas(a: ArticuloPaquete): [number, number, number] | null {
  if (!positivo(a.altoCm) || !positivo(a.anchoCm) || !positivo(a.largoCm)) return null
  return ordenDesc([a.altoCm, a.anchoCm, a.largoCm]) as [number, number, number]
}

export function calcularPaquete(
  articulos: ArticuloPaquete[],
  ajuste?: { empaque?: TipoEmpaque; pesoKg?: number },
): Paquete {
  const faltantes: string[] = []
  let pesoProductosG = 0
  let volumen = 0
  let ladoMayor = 0, ladoMedio = 0, ladoMenor = 0
  let siempreCaja = false

  for (const a of articulos) {
    const cantidad = Math.max(0, Math.floor(a.cantidad || 0))
    if (cantidad === 0) continue
    let m = medidas(a)
    let peso = a.pesoG
    if (!m || !positivo(peso)) faltantes.push(a.nombre)
    if (!m) m = ordenDesc(MEDIDAS_DEFECTO_CM) as [number, number, number]
    if (!positivo(peso)) peso = PESO_DEFECTO_G
    pesoProductosG += peso * cantidad
    volumen += m[0] * m[1] * m[2] * cantidad
    ladoMayor = Math.max(ladoMayor, m[0])
    ladoMedio = Math.max(ladoMedio, m[1])
    ladoMenor = Math.max(ladoMenor, m[2])
    if (a.siempreCaja) siempreCaja = true
  }

  const volumenNecesario = volumen * HOLGURA_VOLUMEN
  const avisos: AvisoPaquete[] = []
  if (faltantes.length) avisos.push({ tipo: 'faltan_datos', productos: faltantes })

  // ¿Cabe en la bolsa? Cada producto acostado debe caber en 25×20 y el grosor no pasa del máximo.
  const altoBolsa = Math.max(1, Math.ceil(Math.max(ladoMenor, volumenNecesario / (BOLSA.largo * BOLSA.ancho))))
  const cabeEnBolsa = ladoMayor <= BOLSA.largo && ladoMedio <= BOLSA.ancho && altoBolsa <= BOLSA.altoMax

  // ¿Cabe en la caja? Cada producto en alguna orientación y el volumen total.
  const lados = ordenDesc([CAJA.largo, CAJA.ancho, CAJA.alto])
  const cabeEnCaja = ladoMayor <= lados[0] && ladoMedio <= lados[1] && ladoMenor <= lados[2]
    && volumenNecesario <= CAJA.largo * CAJA.ancho * CAJA.alto

  let empaque: TipoEmpaque = !siempreCaja && cabeEnBolsa ? 'bolsa' : 'caja'
  if (ajuste?.empaque) empaque = ajuste.empaque
  if (empaque === 'caja' && !cabeEnCaja) avisos.push({ tipo: 'no_cabe_en_caja' })
  if (empaque === 'bolsa' && !cabeEnBolsa) avisos.push({ tipo: 'bolsa_forzada_no_cabe' })

  const largoCm = empaque === 'bolsa' ? BOLSA.largo : CAJA.largo
  const anchoCm = empaque === 'bolsa' ? BOLSA.ancho : CAJA.ancho
  // En bolsa forzada que no cabe, el alto no se limita: se manda el real para no subdeclarar
  const altoCm = empaque === 'bolsa' ? altoBolsa : CAJA.alto
  const pesoEmpaqueG = (empaque === 'bolsa' ? BOLSA.pesoG : CAJA.pesoG) + RELLENO_G

  const pesoCalculado = kg(pesoProductosG + pesoEmpaqueG)
  const pesoManual = ajuste?.pesoKg !== undefined && positivo(ajuste.pesoKg) ? Math.ceil(ajuste.pesoKg * 100) / 100 : null

  return {
    empaque,
    largoCm, anchoCm, altoCm,
    pesoKg: pesoManual ?? pesoCalculado,
    pesoProductosG: Math.round(pesoProductosG),
    pesoVolumetricoKg: Math.round((largoCm * anchoCm * altoCm) / 5000 * 100) / 100,
    claveEmpaqueSat: empaque === 'bolsa' ? BOLSA.sat : CAJA.sat,
    ajustadoAMano: Boolean(ajuste?.empaque || pesoManual !== null),
    avisos,
  }
}
