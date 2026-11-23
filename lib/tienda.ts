// Interruptores de la tienda.
//
// SUPLEMENTOS_ACTIVO: en false se esconde todo lo de suplementos en la tienda
// pública sin borrar nada:
//  - /suplementos y /suplementos/* redirigen temporalmente (307) a /cosmeticos (proxy.ts)
//  - se quitan del menú, footer, home, buscador, Lora, sitemaps y feed de Google
//  - no se pueden agregar al carrito y el checkout del servidor los rechaza
// El admin no se ve afectado: se pueden seguir creando y editando suplementos.
// Para reactivarlos basta con cambiarlo a true.
export const SUPLEMENTOS_ACTIVO = false

export const MENSAJE_SUPLEMENTOS_PAUSADOS = 'Los suplementos no están disponibles por ahora.'

// true si el producto se puede mostrar/vender en la tienda pública.
// Se filtra en JS (no con .neq en la consulta) para no perder productos con tipo null.
export function productoVisible(p: { tipo?: string | null } | null | undefined): boolean {
  if (!p) return false
  return SUPLEMENTOS_ACTIVO || p.tipo !== 'suplemento'
}

// Videos de Ritual: con los suplementos pausados se ocultan los de tipo 'suplemento'
// (los de 'cosmetico' y 'ambos' se siguen mostrando).
export const videoVisible = productoVisible

// Filtro para consultas de Supabase con .limit() (donde filtrar en JS dejaría menos resultados).
// Uso: if (!SUPLEMENTOS_ACTIVO) query = query.or(FILTRO_SIN_SUPLEMENTOS)
export const FILTRO_SIN_SUPLEMENTOS = 'tipo.is.null,tipo.neq.suplemento'
