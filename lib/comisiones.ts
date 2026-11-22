import { createServiceClient } from '@/lib/supabase/service'

// ============================================================
// Comisiones de embajadoras (SOLO SERVIDOR)
//
// Venta: una fila tipo 'venta' por pedido, con copia de cómo se calculó
// (tipo_comision, comision_valor, unidades) para poder ajustarla después
// aunque cambie la configuración de la embajadora.
//
// Reembolso:
//  - Comisión "libre" (pendiente y sin pago_id): se reduce o se cancela en la misma fila.
//  - Pagada o dentro de una solicitud de pago: se agrega una fila tipo 'ajuste'
//    con monto negativo y estado 'pendiente', que se descuenta sola del siguiente pago.
// ============================================================

const r2 = (n: number) => Math.round(n * 100) / 100

export interface ComisionCalculada {
  influencerId: number
  montoComision: number
  tipoComision: 'porcentaje' | 'monto_fijo'
  comisionValor: number
  subtotalVenta: number
  unidades: number
}

// Registra la comisión de la venta si el pedido usó un código de embajadora.
// Devuelve los datos si la creó; null si no aplica o ya existía.
export async function registrarComisionVenta(pedido: {
  id: number; codigo_descuento?: string | null; subtotal?: number | null; user_id?: string | null
}): Promise<ComisionCalculada | null> {
  if (!pedido.codigo_descuento) return null
  const db = createServiceClient()

  const { data: codigo } = await db
    .from('codigos_descuento')
    .select('es_influencer, influencer_id')
    .eq('codigo', pedido.codigo_descuento)
    .maybeSingle()
  if (!codigo || !codigo.es_influencer || !codigo.influencer_id) return null

  // Candado de exclusión mutua: con código de embajadora se pierde la primera compra
  if (pedido.user_id) {
    await db.from('perfiles').update({ primera_compra_usada: true }).eq('id', pedido.user_id)
  }

  const { data: existente } = await db
    .from('influencer_comisiones')
    .select('id')
    .eq('pedido_id', pedido.id)
    .eq('tipo', 'venta')
    .maybeSingle()
  if (existente) return null

  const { data: inf } = await db
    .from('influencers')
    .select('tipo_comision, comision_valor')
    .eq('id', codigo.influencer_id)
    .maybeSingle()
  const tipoComision: 'porcentaje' | 'monto_fijo' = inf?.tipo_comision === 'monto_fijo' ? 'monto_fijo' : 'porcentaje'
  const comisionValor = inf?.comision_valor != null ? Number(inf.comision_valor) : 5

  const { data: items } = await db.from('pedido_items').select('cantidad').eq('pedido_id', pedido.id)
  const unidades = (items || []).reduce((s, it) => s + (it.cantidad || 0), 0)

  // La comisión se calcula sobre el subtotal SIN envío
  const subtotalVenta = Number(pedido.subtotal || 0)
  const montoComision = tipoComision === 'monto_fijo'
    ? r2(unidades * comisionValor)
    : r2(subtotalVenta * (comisionValor / 100))

  const { error } = await db.from('influencer_comisiones').insert({
    influencer_id: codigo.influencer_id,
    pedido_id: pedido.id,
    subtotal_venta: subtotalVenta,
    monto_comision: montoComision,
    estado: 'pendiente',
    tipo: 'venta',
    tipo_comision: tipoComision,
    comision_valor: comisionValor,
    unidades,
  })
  // 23505 = ya existía (índice único de una venta por pedido): no se duplica
  if (error) {
    if (error.code !== '23505') console.error('Error registrando comisión:', error)
    return null
  }
  return { influencerId: codigo.influencer_id, montoComision, tipoComision, comisionValor, subtotalVenta, unidades }
}

export interface PiezaDevuelta { precio: number; cantidad: number }

// Ajusta la comisión del pedido por un reembolso.
//  - total: deja la comisión vigente en 0
//  - parcial: la reduce según las piezas devueltas (el envío nunca cuenta)
// Devuelve el monto reducido (0 si no había comisión o nada que reducir).
export async function ajustarComisionPorReembolso(
  pedidoId: number,
  opciones: { total: boolean; piezas?: PiezaDevuelta[]; reembolsoId?: number | null; motivo: string },
): Promise<number> {
  const db = createServiceClient()
  const { data: venta } = await db
    .from('influencer_comisiones')
    .select('id, influencer_id, monto_comision, estado, pago_id, tipo_comision, comision_valor')
    .eq('pedido_id', pedidoId)
    .eq('tipo', 'venta')
    .maybeSingle()
  if (!venta) return 0

  // Comisión vigente = venta (0 si ya se canceló) + ajustes negativos previos
  const { data: ajustes } = await db
    .from('influencer_comisiones')
    .select('monto_comision')
    .eq('comision_origen_id', venta.id)
    .eq('tipo', 'ajuste')
  const base = venta.estado === 'cancelada' ? 0 : Number(venta.monto_comision || 0)
  const vigente = r2(base + (ajustes || []).reduce((s, a) => s + Number(a.monto_comision || 0), 0))
  if (vigente <= 0) return 0

  let reduccion: number
  if (opciones.total) {
    reduccion = vigente
  } else {
    // Copia de la venta; si es una comisión vieja sin copia, la configuración actual de la embajadora
    let tipo = venta.tipo_comision as string | null
    let valor = venta.comision_valor != null ? Number(venta.comision_valor) : null
    if (!tipo || valor == null) {
      const { data: inf } = await db.from('influencers').select('tipo_comision, comision_valor').eq('id', venta.influencer_id).maybeSingle()
      tipo = inf?.tipo_comision === 'monto_fijo' ? 'monto_fijo' : 'porcentaje'
      valor = inf?.comision_valor != null ? Number(inf.comision_valor) : 5
    }
    const piezas = opciones.piezas || []
    reduccion = tipo === 'monto_fijo'
      ? r2(piezas.reduce((s, p) => s + p.cantidad, 0) * valor)
      : r2(piezas.reduce((s, p) => s + p.precio * p.cantidad, 0) * (valor / 100))
    reduccion = Math.min(reduccion, vigente)
  }
  if (reduccion <= 0) return 0

  // Comisión libre: se modifica la misma fila (solo si sigue libre en este instante)
  if (venta.estado === 'pendiente' && venta.pago_id == null && (ajustes || []).length === 0) {
    const nuevoMonto = r2(Number(venta.monto_comision) - reduccion)
    const cambios = nuevoMonto <= 0
      ? { estado: 'cancelada', motivo: opciones.motivo }
      : { monto_comision: nuevoMonto, motivo: opciones.motivo }
    const { data: actualizada } = await db
      .from('influencer_comisiones')
      .update(cambios)
      .eq('id', venta.id)
      .eq('estado', 'pendiente')
      .is('pago_id', null)
      .select('id')
    if ((actualizada?.length ?? 0) > 0) return reduccion
    // Si entró a una solicitud de pago justo ahora, se registra como ajuste
  }

  const { error } = await db.from('influencer_comisiones').insert({
    influencer_id: venta.influencer_id,
    pedido_id: pedidoId,
    subtotal_venta: 0,
    monto_comision: -reduccion,
    estado: 'pendiente',
    tipo: 'ajuste',
    comision_origen_id: venta.id,
    reembolso_id: opciones.reembolsoId ?? null,
    motivo: opciones.motivo,
  })
  if (error) {
    console.error('Error registrando ajuste de comisión:', error)
    return 0
  }
  return reduccion
}
