// ============================================================
// Validación de códigos de descuento y descuento de primera compra (SOLO SERVIDOR).
// La usan /api/validar-codigo (para mostrar el descuento en el checkout)
// y lib/checkout.ts (para recalcular el pedido al pagar).
// ============================================================
import { createServiceClient } from '@/lib/supabase/service'
import type { ReglaEnvioCodigo } from '@/lib/envio'
import { REWARDS_VISIBLE, PORCENTAJE_CODIGO, esCodigoRewards, miembroPorCodigo, descuentoCodigo } from '@/lib/rewards'

export const PORCENTAJE_PRIMERA_COMPRA = 5

export interface CodigoValido extends ReglaEnvioCodigo {
  codigo: string
  tipo: string
  valor: number
  montoDescuento: number
  esInfluencer: boolean
  descripcion: string
  // Código Vitalora Rewards: id del miembro dueño (null en códigos de codigos_descuento)
  rewardsMiembroId: number | null
}

export type ResultadoCodigo = { ok: true; datos: CodigoValido } | { ok: false; error: string }

export async function validarCodigo(params: {
  codigo: string
  subtotal: number
  email?: string | null
}): Promise<ResultadoCodigo> {
  const supabaseAdmin = createServiceClient()
  const codigoLimpio = String(params.codigo || '').toUpperCase().trim()
  if (!codigoLimpio) return { ok: false, error: 'Código requerido' }
  const emailLimpio = params.email ? String(params.email).toLowerCase().trim() : null
  const subtotal = Number(params.subtotal) || 0

  const { data, error } = await supabaseAdmin
    .from('codigos_descuento')
    .select('*')
    .eq('codigo', codigoLimpio)
    .eq('activo', true)
    .maybeSingle()
  if (error) {
    console.error('Error validando código:', error)
    return { ok: false, error: 'Código no válido' }
  }
  // No es un código normal: ¿es un código Vitalora Rewards? (los dos tipos nunca
  // comparten código: trigger rewards_codigo_libre en ambas tablas)
  if (!data) return validarCodigoRewards(codigoLimpio, subtotal)

  // Usos totales (solo si tiene límite)
  if (data.max_usos && data.usos_actuales >= data.max_usos) {
    return { ok: false, error: 'Este código ya alcanzó el límite de usos' }
  }

  // Usos por email
  if (emailLimpio) {
    const { data: usos } = await supabaseAdmin
      .from('codigos_usados')
      .select('id')
      .eq('codigo', codigoLimpio)
      .eq('email', emailLimpio)
    const vecesUsado = usos?.length ?? 0
    if (data.es_influencer) {
      const limitePorEmail = data.max_usos_por_email ?? 3
      if (vecesUsado >= limitePorEmail) {
        return { ok: false, error: `Ya usaste este código el máximo de ${limitePorEmail} veces permitidas` }
      }
    } else if (vecesUsado >= 1) {
      return { ok: false, error: 'Ya utilizaste este código anteriormente' }
    }
  }

  // Fechas
  const ahora = new Date()
  if (data.fecha_inicio && new Date(data.fecha_inicio) > ahora) {
    return { ok: false, error: 'Este código aún no está activo' }
  }
  if (data.fecha_fin && new Date(data.fecha_fin) < ahora) {
    return { ok: false, error: 'Este código ha expirado' }
  }

  // Mínimo de compra
  if (data.minimo_compra && subtotal < data.minimo_compra) {
    return { ok: false, error: `Compra mínima de $${data.minimo_compra.toLocaleString()} MXN para este código` }
  }

  // Descuento de producto
  const montoDescuento = data.tipo === 'porcentaje'
    ? Math.round(subtotal * (data.valor / 100))
    : Math.min(data.valor, subtotal)

  return {
    ok: true,
    datos: {
      codigo: data.codigo,
      tipo: data.tipo,
      valor: data.valor,
      montoDescuento,
      esInfluencer: data.es_influencer ?? false,
      rewardsMiembroId: null,
      descripcion: data.tipo === 'porcentaje' ? `${data.valor}% de descuento` : `$${data.valor} de descuento`,
      descuentoEnvio: data.descuento_envio || 'ninguno',
      envioPrecioFijo: data.envio_precio_fijo || 0,
      ciudadRestringida: data.ciudad_restringida || null,
    },
  }
}

// Código Vitalora Rewards: 5% en productos, cualquiera lo puede usar (también su dueño),
// sin límite de usos, sin mínimo, sin fechas y sin regla de envío. Solo miembros activos.
// Con Rewards apagado (lib/rewards-config.ts) estos códigos no existen para el checkout.
async function validarCodigoRewards(codigo: string, subtotal: number): Promise<ResultadoCodigo> {
  if (!REWARDS_VISIBLE || !esCodigoRewards(codigo)) return { ok: false, error: 'Código no válido' }
  let miembro
  try {
    miembro = await miembroPorCodigo(codigo)
  } catch (e) {
    console.error('Error validando código Rewards:', e)
    return { ok: false, error: 'Código no válido' }
  }
  if (!miembro) return { ok: false, error: 'Código no válido' }
  return {
    ok: true,
    datos: {
      codigo: miembro.codigo,
      tipo: 'porcentaje',
      valor: PORCENTAJE_CODIGO,
      montoDescuento: descuentoCodigo(subtotal),
      esInfluencer: false,
      descripcion: `${PORCENTAJE_CODIGO}% de descuento en productos (Vitalora Rewards)`,
      rewardsMiembroId: miembro.id,
      descuentoEnvio: 'ninguno',
      envioPrecioFijo: 0,
      ciudadRestringida: null,
    },
  }
}

// Nombre del descuento de un pedido, para correos y para el renglón de Mercado Pago.
export function etiquetaDescuento(p: { codigo_descuento?: string | null; descuento_tipo?: string | null; rewards_miembro_id?: number | null }): string {
  if (p.codigo_descuento && p.rewards_miembro_id) return `Código Rewards ${p.codigo_descuento}`
  if (p.codigo_descuento) return `Código ${p.codigo_descuento}`
  if (p.descuento_tipo === 'primera_compra') return `Descuento ${PORCENTAJE_PRIMERA_COMPRA}% primera compra`
  return 'Descuento'
}

export function montoPrimeraCompra(subtotal: number): number {
  return Math.round(subtotal * (PORCENTAJE_PRIMERA_COMPRA / 100))
}

// Reembolso TOTAL de un pedido que usó el descuento de primera compra:
// la cuenta recupera el descuento. No se usa en reembolsos parciales.
export async function restaurarPrimeraCompraSiAplica(pedido: { user_id?: string | null; descuento_tipo?: string | null }): Promise<void> {
  if (!pedido.user_id || pedido.descuento_tipo !== 'primera_compra') return
  const { error } = await createServiceClient()
    .from('perfiles')
    .update({ primera_compra_usada: false })
    .eq('id', pedido.user_id)
  if (error) console.error('Error restaurando primera_compra_usada:', error)
}

// ¿El usuario (ya verificado) puede usar el descuento de primera compra?
export async function puedeUsarPrimeraCompra(userId: string): Promise<boolean> {
  const supabaseAdmin = createServiceClient()
  const { data } = await supabaseAdmin
    .from('perfiles')
    .select('primera_compra_usada')
    .eq('id', userId)
    .maybeSingle()
  return !!data && !data.primera_compra_usada
}
