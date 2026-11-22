// ============================================================
// Cálculo del costo de envío (SOLO SERVIDOR).
// Único lugar con la regla de envío: cuando entre Skydropx, se reemplaza
// el cuerpo de calcularEnvio() y quienes la llaman no cambian.
// La función ya es async para que la cotización externa no cambie su firma.
// ============================================================

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

export async function calcularEnvio(params: {
  subtotal: number
  ciudad: string
  codigo: ReglaEnvioCodigo | null
}): Promise<ResultadoEnvio> {
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
