// ============================================================
// Validación de códigos de descuento y descuento de primera compra (SOLO SERVIDOR).
// La usan /api/validar-codigo (para mostrar el descuento en el checkout)
// y lib/checkout.ts (para recalcular el pedido al pagar).
// ============================================================
import { createServiceClient } from '@/lib/supabase/service'
import type { ReglaEnvioCodigo } from '@/lib/envio'

export const PORCENTAJE_PRIMERA_COMPRA = 5

export interface CodigoValido extends ReglaEnvioCodigo {
  codigo: string
  tipo: string
  valor: number
  montoDescuento: number
  esInfluencer: boolean
  descripcion: string
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
    .single()
  if (error || !data) return { ok: false, error: 'Código no válido' }

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
      descripcion: data.tipo === 'porcentaje' ? `${data.valor}% de descuento` : `$${data.valor} de descuento`,
      descuentoEnvio: data.descuento_envio || 'ninguno',
      envioPrecioFijo: data.envio_precio_fijo || 0,
      ciudadRestringida: data.ciudad_restringida || null,
    },
  }
}

export function montoPrimeraCompra(subtotal: number): number {
  return Math.round(subtotal * (PORCENTAJE_PRIMERA_COMPRA / 100))
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
