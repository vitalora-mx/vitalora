import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { formatearNumeroPedido } from '@/lib/utils'
import { generarCorreoInfluencer, generarCorreoAjusteInfluencer, type EventoAjuste } from '@/lib/correoInfluencer'

// ============================================================
// Comisiones de embajadoras (SOLO SERVIDOR)
//
// Venta: una fila tipo 'venta' por pedido, con copia de cómo se calculó
// (tipo_comision, comision_valor, unidades) para poder ajustarla después
// aunque cambie la configuración de la embajadora.
//  - Porcentaje: sobre lo realmente cobrado de productos = subtotal - descuento
//    (sin envío). Esa base se guarda en subtotal_venta.
//  - Monto fijo: por pieza.
//
// Reembolso:
//  - Comisión "libre" (pendiente y sin pago_id): se reduce o se cancela en la misma fila.
//  - Pagada o dentro de una solicitud de pago: se agrega una fila tipo 'ajuste'
//    con monto negativo y estado 'pendiente', que se descuenta sola del siguiente pago.
//  - Cada cambio real avisa por correo a la embajadora una sola vez (si el correo
//    falla, el reembolso sigue su curso).
// ============================================================

const r2 = (n: number) => Math.round(n * 100) / 100
const resend = new Resend(process.env.RESEND_API_KEY)

export interface ComisionCalculada {
  influencerId: number
  montoComision: number
  tipoComision: 'porcentaje' | 'monto_fijo'
  comisionValor: number
  subtotalVenta: number   // base de la comisión: subtotal - descuento, sin envío
  unidades: number
}

// Base de la comisión por porcentaje: lo cobrado de productos (subtotal - descuento), sin envío
export function baseComision(subtotal: unknown, descuento: unknown): number {
  return r2(Math.max(0, Number(subtotal || 0) - Number(descuento || 0)))
}

// Monto de la comisión de una venta (función pura, sin base de datos)
export function calcularComisionVenta(tipo: string, valor: number, base: number, unidades: number): number {
  return tipo === 'monto_fijo' ? r2(unidades * valor) : r2(base * (valor / 100))
}

// Registra la comisión de la venta si el pedido usó un código de embajadora.
// Devuelve los datos si la creó; null si no aplica o ya existía.
export async function registrarComisionVenta(pedido: {
  id: number; codigo_descuento?: string | null; subtotal?: number | null; descuento?: number | null; user_id?: string | null
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

  // Porcentaje sobre lo cobrado de productos (subtotal - descuento), SIN envío
  const subtotalVenta = baseComision(pedido.subtotal, pedido.descuento)
  const montoComision = calcularComisionVenta(tipoComision, comisionValor, subtotalVenta, unidades)

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

// Registra la comisión de la venta y, si se creó en esta llamada, avisa a la embajadora.
// La usan el webhook de Mercado Pago y la aprobación de transferencias.
// Una sola vez: registrarComisionVenta devuelve null si la comisión ya existía,
// así que un webhook repetido o una segunda aprobación no reenvían el correo.
// Nunca lanza error: si el registro o el correo fallan, solo se anota en el log.
export async function registrarComisionYAvisar(pedido: any): Promise<void> {
  let comision: ComisionCalculada | null = null
  try {
    comision = await registrarComisionVenta(pedido)
  } catch (e) {
    console.error('Error al procesar comisión de influencer:', e)
    return
  }
  if (!comision) return
  try {
    await avisarVentaEmbajadora(pedido, comision)
  } catch (e) {
    console.error('Error enviando correo al influencer:', e)
  }
}

async function avisarVentaEmbajadora(pedido: any, comision: ComisionCalculada) {
  const db = createServiceClient()
  const { data: inf } = await db.from('influencers').select('nombre, email').eq('id', comision.influencerId).maybeSingle()
  if (!inf?.email) return

  const { data: itemsCorreo } = await db
    .from('pedido_items')
    .select('nombre, marca, precio, cantidad, variante_nombre')
    .eq('pedido_id', pedido.id)
  const listaItems = itemsCorreo || []
  const totalPiezas = listaItems.reduce((s, it) => s + (it.cantidad || 0), 0)
  const costoEnvioPedido = pedido.costo_envio != null ? Number(pedido.costo_envio) : 0
  const totalPedido = pedido.total != null ? Number(pedido.total) : (comision.subtotalVenta + costoEnvioPedido)

  const correo = generarCorreoInfluencer({
    nombreInfluencer: inf.nombre || 'Embajadora',
    codigo: pedido.codigo_descuento,
    numeroPedido: formatearNumeroPedido(pedido.id),
    items: listaItems,
    totalPiezas,
    subtotal: Number(pedido.subtotal || 0),
    descuento: Number(pedido.descuento || 0),
    baseComision: comision.subtotalVenta,
    costoEnvio: costoEnvioPedido,
    total: totalPedido,
    ciudad: pedido.ciudad || '',
    montoComision: comision.montoComision,
    tipoComision: comision.tipoComision,
    comisionValor: comision.comisionValor,
  })
  await resend.emails.send({
    from: 'Vitalora <hola@vitalora.com.mx>',
    to: inf.email,
    subject: correo.asunto,
    html: correo.html,
  })
}

export interface PiezaDevuelta { precio: number; cantidad: number; pedido_item_id?: number }

// Reducción de la comisión por las piezas devueltas (función pura, sin base de datos).
//  - Monto fijo: piezas × valor.
//  - Porcentaje: precio de cada pieza ya con su parte del descuento × valor%.
//    factorCobrado = subtotal_venta / subtotal del pedido, o sea (subtotal - descuento) / subtotal
//    en comisiones nuevas; 1 en las registradas antes sobre el subtotal bruto.
export function calcularReduccionParcial(
  tipo: string, valor: number, piezas: PiezaDevuelta[], factorCobrado: number,
): number {
  if (tipo === 'monto_fijo') return r2(piezas.reduce((s, p) => s + p.cantidad, 0) * valor)
  const bruto = piezas.reduce((s, p) => s + p.precio * p.cantidad, 0)
  return r2(bruto * factorCobrado * (valor / 100))
}

// Ajusta la comisión del pedido por un reembolso o una cancelación.
//  - total: deja la comisión vigente en 0
//  - parcial: la reduce según las piezas devueltas (el envío nunca cuenta)
// Devuelve el monto reducido (0 si no había comisión o nada que reducir).
// Si hubo un cambio real, avisa a la embajadora: como el aviso va ligado al cambio
// (y los flujos de reembolso corren con candado), sale una sola vez por reembolso o
// cancelación. Si el correo falla, solo se registra en el log.
export async function ajustarComisionPorReembolso(
  pedidoId: number,
  opciones: { total: boolean; piezas?: PiezaDevuelta[]; reembolsoId?: number | null; motivo: string; evento: EventoAjuste },
): Promise<number> {
  const db = createServiceClient()
  const { data: venta } = await db
    .from('influencer_comisiones')
    .select('id, influencer_id, monto_comision, estado, pago_id, tipo_comision, comision_valor, subtotal_venta')
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
    let factorCobrado = 1
    if (tipo !== 'monto_fijo') {
      const { data: ped } = await db.from('pedidos').select('subtotal').eq('id', pedidoId).maybeSingle()
      const subtotal = Number(ped?.subtotal || 0)
      const baseVenta = Number(venta.subtotal_venta || 0)
      if (subtotal > 0 && baseVenta > 0) factorCobrado = Math.min(1, baseVenta / subtotal)
    }
    reduccion = Math.min(calcularReduccionParcial(tipo, valor, opciones.piezas || [], factorCobrado), vigente)
  }
  if (reduccion <= 0) return 0

  let aplicadoEnLaVenta = false

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
    aplicadoEnLaVenta = (actualizada?.length ?? 0) > 0
    // Si entró a una solicitud de pago justo ahora, se registra como ajuste
  }

  if (!aplicadoEnLaVenta) {
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
  }

  // Aviso a la embajadora (nunca rompe el reembolso)
  try {
    await avisarAjusteEmbajadora({
      pedidoId,
      influencerId: venta.influencer_id,
      evento: opciones.evento,
      antes: vigente,
      despues: r2(vigente - reduccion),
      reduccion,
      comoAjuste: !aplicadoEnLaVenta,
      piezas: opciones.total ? [] : (opciones.piezas || []),
    })
  } catch (e) {
    console.error('Error avisando a la embajadora del ajuste de comisión:', e)
  }
  return reduccion
}

// Correo a la embajadora por cancelación o reembolso (del cliente solo se muestra la ciudad)
async function avisarAjusteEmbajadora(d: {
  pedidoId: number; influencerId: number; evento: EventoAjuste
  antes: number; despues: number; reduccion: number; comoAjuste: boolean; piezas: PiezaDevuelta[]
}) {
  const db = createServiceClient()
  const { data: inf } = await db.from('influencers').select('nombre, email').eq('id', d.influencerId).maybeSingle()
  if (!inf?.email) return
  const { data: pedido } = await db.from('pedidos').select('ciudad, codigo_descuento').eq('id', d.pedidoId).maybeSingle()

  // Piezas devueltas (solo en parcial), con su nombre
  let piezasCorreo: { nombre: string; marca: string | null; variante_nombre: string | null; cantidad: number }[] = []
  const ids = d.piezas.map(p => p.pedido_item_id).filter((x): x is number => Number.isInteger(x))
  if (ids.length > 0) {
    const { data: items } = await db.from('pedido_items').select('id, nombre, marca, variante_nombre').in('id', ids)
    const porId = new Map((items || []).map((it: any) => [Number(it.id), it]))
    piezasCorreo = d.piezas.map(p => {
      const it: any = p.pedido_item_id != null ? porId.get(p.pedido_item_id) : null
      return { nombre: it?.nombre || 'Producto', marca: it?.marca ?? null, variante_nombre: it?.variante_nombre ?? null, cantidad: p.cantidad }
    })
  }

  const correo = generarCorreoAjusteInfluencer({
    nombreInfluencer: inf.nombre || 'Embajadora',
    codigo: pedido?.codigo_descuento || '',
    numeroPedido: formatearNumeroPedido(d.pedidoId),
    ciudad: pedido?.ciudad || '',
    evento: d.evento,
    antes: d.antes,
    despues: d.despues,
    reduccion: d.reduccion,
    comoAjuste: d.comoAjuste,
    piezas: piezasCorreo,
  })
  await resend.emails.send({
    from: 'Vitalora <hola@vitalora.com.mx>',
    to: inf.email,
    subject: correo.asunto,
    html: correo.html,
  })
}
