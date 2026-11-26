// ============================================================
// Cálculo del costo de envío (SOLO SERVIDOR).
// Único lugar con la regla de envío:
//  - $99, o gratis desde $1,000 (o lo que diga el código de descuento), más
//  - el cargo de zona extendida (lib/zona-extendida.ts, cotizado en Skydropx por
//    lib/cotizar-envio.ts), que se suma aunque el envío sea gratis.
// Si Skydropx no responde, se vende sin cargo y el pedido queda "Zona sin verificar".
// ============================================================
import { revisarZonaEnvio, type DestinoEnvio, type ResultadoZonaEnvio } from '@/lib/cotizar-envio'
import type { ArticuloPaquete } from '@/lib/paquete'

// Al pagar, si la cotización no está en caché, se espera como máximo esto
const TIMEOUT_COTIZACION_PAGO_MS = 5000

export const COSTO_ENVIO_NORMAL = 99
export const ENVIO_GRATIS_DESDE = 1000

// Datos de envío que puede traer un código de descuento
export interface ReglaEnvioCodigo {
  descuentoEnvio: 'ninguno' | 'gratis' | 'fijo' | string
  envioPrecioFijo: number
  ciudadRestringida: string | null
}

export interface ResultadoEnvio {
  costo: number
  motivo: 'gratis_monto' | 'codigo_gratis' | 'codigo_fijo' | 'normal'
  // El código trae envío especial pero la ciudad del cliente no coincide
  bloqueadoPorCiudad: boolean
}

// Normaliza texto de ciudad: minúsculas, sin acentos, sin espacios extra
export function normalizarCiudad(txt: string): string {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function ciudadCoincide(ciudadCliente: string, ciudadRestringida: string | null): boolean {
  if (!ciudadRestringida) return true
  return normalizarCiudad(ciudadCliente) === normalizarCiudad(ciudadRestringida)
}

export interface EnvioConZona {
  costo: number         // lo que se cobra: base + cargo de zona extendida
  costoBase: number     // $99 / gratis / precio del código
  cargoZona: number
  base: ResultadoEnvio
  zona: ResultadoZonaEnvio
}

export async function calcularEnvio(params: {
  subtotal: number
  codigo: ReglaEnvioCodigo | null
  destino: DestinoEnvio
  articulos: ArticuloPaquete[]
}): Promise<EnvioConZona> {
  const base = calcularEnvioBase({ subtotal: params.subtotal, ciudad: params.destino.ciudad, codigo: params.codigo })
  const zona = await revisarZonaEnvio({ destino: params.destino, articulos: params.articulos, timeoutMs: TIMEOUT_COTIZACION_PAGO_MS })
  const cargoZona = zona.estado === 'ok' ? zona.cargo : 0
  return { costo: base.costo + cargoZona, costoBase: base.costo, cargoZona, base, zona }
}

// $99 / gratis / código (sin zona extendida)
export function calcularEnvioBase(params: {
  subtotal: number
  ciudad: string
  codigo: ReglaEnvioCodigo | null
}): ResultadoEnvio {
  const { subtotal, ciudad, codigo } = params

  // Regla sagrada: compra >= $1,000 => envío gratis siempre
  if (subtotal >= ENVIO_GRATIS_DESDE) {
    return { costo: 0, motivo: 'gratis_monto', bloqueadoPorCiudad: false }
  }

  // Envío especial por código (solo si la ciudad coincide)
  if (codigo && codigo.descuentoEnvio && codigo.descuentoEnvio !== 'ninguno') {
    if (ciudadCoincide(ciudad, codigo.ciudadRestringida)) {
      if (codigo.descuentoEnvio === 'gratis') {
        return { costo: 0, motivo: 'codigo_gratis', bloqueadoPorCiudad: false }
      }
      if (codigo.descuentoEnvio === 'fijo') {
        return { costo: Number(codigo.envioPrecioFijo) || 0, motivo: 'codigo_fijo', bloqueadoPorCiudad: false }
      }
    } else if ((ciudad || '').trim() !== '') {
      return { costo: COSTO_ENVIO_NORMAL, motivo: 'normal', bloqueadoPorCiudad: true }
    }
  }

  return { costo: COSTO_ENVIO_NORMAL, motivo: 'normal', bloqueadoPorCiudad: false }
}
