// ============================================================
// Regla de zona extendida (lógica pura, la usa el checkout).
// Se cobra CARGO_ZONA_EXTENDIDA (aunque el envío sea gratis) si la tarifa más
// barata con entrega a domicilio entre Paquetexpress, Estafeta, DHL y FedEx:
//  - trae el recargo de zona extendida de la paquetería, o
//  - cuesta más de UMBRAL_PRECIO_ZONA con IVA (solo paquetes de hasta 5 kg).
// En paquetes de más de 5 kg solo cuenta el recargo.
// Siempre con el precio normal: promociones y seguro nunca entran aquí.
// ============================================================

export const CARGO_ZONA_EXTENDIDA = 200
// Único lugar del umbral. Si Skydropx sube su tarifa normal arriba de esto, la
// alerta diaria avisa (ver ALERTA_PROPORCION_POR_PRECIO).
export const UMBRAL_PRECIO_ZONA = 150
export const PESO_MAX_REGLA_PRECIO_KG = 5
// Si en un día más de esta proporción de cotizaciones cobra solo por precio, se avisa al admin
export const ALERTA_PROPORCION_POR_PRECIO = 0.5

export interface TarifaRegla {
  total: number
  zonaExtendida: boolean
}

export interface ResultadoZona<T extends TarifaRegla> {
  cobra: boolean
  cargo: number
  motivo: 'recargo' | 'precio' | null
  masBarata: T | null
}

export function evaluarZonaExtendida<T extends TarifaRegla>(tarifas: T[], pesoKg: number): ResultadoZona<T> {
  if (tarifas.length === 0) return { cobra: false, cargo: 0, motivo: null, masBarata: null }
  // La más barata; si empatan, primero la que no trae recargo (a favor del cliente)
  const masBarata = [...tarifas].sort((a, b) => a.total - b.total || Number(a.zonaExtendida) - Number(b.zonaExtendida))[0]
  let motivo: ResultadoZona<T>['motivo'] = null
  if (masBarata.zonaExtendida) motivo = 'recargo'
  else if (pesoKg <= PESO_MAX_REGLA_PRECIO_KG && masBarata.total > UMBRAL_PRECIO_ZONA) motivo = 'precio'
  return { cobra: motivo !== null, cargo: motivo ? CARGO_ZONA_EXTENDIDA : 0, motivo, masBarata }
}
