import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { formatearNumeroPedido } from '@/lib/utils'
import { restaurarPrimeraCompraSiAplica } from '@/lib/descuentos'
import { ajustarComisionPorReembolso, type PiezaDevuelta } from '@/lib/comisiones'
import { ESTADOS_REEMBOLSABLES, puedeCancelarse } from '@/lib/estados-pedido'
import { WHATSAPP_URL } from '@/lib/correoPedido'
import { devolverStockUnaVez } from '@/lib/inventario'

// ============================================================
// Reembolsos y cancelaciones (SOLO SERVIDOR)
//
// Reglas:
//  - Los reembolsos NUNCA devuelven stock (el inventario se ajusta a mano).
//  - La CANCELACIÓN sí devuelve el stock, una sola vez, si el pedido lo había descontado.
//  - Un reembolso a la vez por pedido (candado pedidos.reembolso_en_curso_desde).
//  - Cada devolución queda en la tabla `reembolsos` (historial).
//  - Reembolso total / cancelación: comisión a 0 y se restaura la primera compra.
//  - Reembolso parcial: la comisión se reduce según las piezas devueltas.
// ============================================================

const ADMIN_EMAIL = 'gabomaciel7@gmail.com'
const CANDADO_MS = 2 * 60 * 1000
const resend = new Resend(process.env.RESEND_API_KEY)

const r2 = (n: number) => Math.round(n * 100) / 100
const mxn = (n: number) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export interface AdminQueOpera { id: string; email: string }
export interface SeleccionItem { pedido_item_id: number; cantidad: number }

export type Resultado =
  | { ok: true; mensaje: string; recordatorio?: string; monto?: number }
  | { ok: false; status: number; error: string }

const falla = (status: number, error: string): Resultado => ({ ok: false, status, error })

// ── Datos del pedido ──
const CAMPOS_PEDIDO = `
  id, estado, metodo_pago, mp_payment_id, mp_preference_id, nombre, apellido, email,
  total, subtotal, descuento, costo_envio, monto_reembolsado, user_id, descuento_tipo,
  numero_guia, skydropx_shipment_id, cancelado_at, reembolso_en_curso_desde,
  pedido_items ( id, nombre, marca, variante_nombre, precio, cantidad, cantidad_reembolsada ),
  reembolsos ( id, estado, incluye_envio, mp_refund_id )
`

export async function cargarPedidoReembolso(pedidoId: number): Promise<any | null> {
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return null
  const { data } = await createServiceClient().from('pedidos').select(CAMPOS_PEDIDO).eq('id', pedidoId).maybeSingle()
  return data
}

function envioYaDevuelto(pedido: any): boolean {
  return (pedido.reembolsos || []).some((r: any) => r.estado === 'completado' && r.incluye_envio)
}

export function saldoPorDevolver(pedido: any): number {
  return r2(Math.max(0, Number(pedido.total || 0) - Number(pedido.monto_reembolsado || 0)))
}

// ── Candado: un reembolso o cancelación a la vez por pedido ──
async function tomarCandado(pedidoId: number): Promise<boolean> {
  const limite = new Date(Date.now() - CANDADO_MS).toISOString()
  const { data } = await createServiceClient()
    .from('pedidos')
    .update({ reembolso_en_curso_desde: new Date().toISOString() })
    .eq('id', pedidoId)
    .or(`reembolso_en_curso_desde.is.null,reembolso_en_curso_desde.lt.${limite}`)
    .select('id')
  return (data?.length ?? 0) > 0
}

async function soltarCandado(pedidoId: number) {
  await createServiceClient().from('pedidos').update({ reembolso_en_curso_desde: null }).eq('id', pedidoId)
}

export function candadoActivo(pedido: { reembolso_en_curso_desde?: string | null }): boolean {
  if (!pedido.reembolso_en_curso_desde) return false
  return Date.now() - Date.parse(pedido.reembolso_en_curso_desde) < CANDADO_MS
}

// ── Mercado Pago ──
async function mp(path: string, init: { method?: string; body?: unknown; llave?: string } = {}) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.llave ? { 'X-Idempotency-Key': init.llave } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data: data as any }
}

export async function consultarPagoMP(paymentId: string) {
  const r = await mp(`/v1/payments/${encodeURIComponent(paymentId)}`)
  return r.ok ? r.data : null
}

// Lo que MP cobró (productos - descuento + envío) y lo que ya devolvió
export function montosPagoMP(pago: any) {
  const pagado = r2(Number(pago?.transaction_amount ?? 0) + Number(pago?.shipping_amount ?? 0))
  const reembolsadoMP = r2(Number(pago?.transaction_amount_refunded ?? 0))
  return { pagado, reembolsadoMP, restante: r2(Math.max(0, pagado - reembolsadoMP)) }
}

// monto null = devolver todo lo que queda del pago
async function reembolsarMP(paymentId: string, monto: number | null, llave: string) {
  const r = await mp(`/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: 'POST',
    body: monto != null ? { amount: r2(monto) } : {},
    llave,
  })
  if (!r.ok) {
    console.error('Error MP reembolso:', r.status, r.data)
    return { ok: false as const, error: String(r.data?.message || r.data?.error || 'Mercado Pago rechazó el reembolso.') }
  }
  return { ok: true as const, refundId: r.data?.id != null ? String(r.data.id) : null, monto: Number(r.data?.amount ?? monto ?? 0) }
}

export async function caducarPreferenciaMP(preferenceId: string) {
  const hasta = new Date(Date.now() - 60_000).toISOString().replace('Z', '-00:00')
  const r = await mp(`/checkout/preferences/${encodeURIComponent(preferenceId)}`, {
    method: 'PUT',
    body: { expires: true, expiration_date_from: '2020-01-01T00:00:00.000-00:00', expiration_date_to: hasta },
  })
  if (!r.ok) console.error('No se pudo caducar la preferencia', preferenceId, r.status, r.data)
  return r.ok
}

async function cancelarPagoMP(paymentId: string) {
  const r = await mp(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: 'PUT', body: { status: 'cancelled' } })
  if (!r.ok) console.error('No se pudo cancelar el pago pendiente', paymentId, r.status, r.data)
  return r.ok
}

// ── Cálculo del monto de un reembolso parcial ──
// Precio de cada pieza menos la parte del descuento que le tocó (proporcional al subtotal),
// más el envío si se incluye. Nunca más de lo que falta por devolver.
export function calcularReembolso(pedido: any, seleccion: SeleccionItem[], incluirEnvio: boolean):
  { ok: true; monto: number; piezas: (PiezaDevuelta & { pedido_item_id: number })[]; incluyeEnvio: boolean } | { ok: false; error: string } {
  const items: any[] = pedido.pedido_items || []
  const porId = new Map(items.map(it => [Number(it.id), it]))
  const piezas: (PiezaDevuelta & { pedido_item_id: number })[] = []
  const vistos = new Set<number>()

  for (const sel of seleccion) {
    const id = Number(sel?.pedido_item_id)
    const cantidad = Number(sel?.cantidad)
    if (!Number.isInteger(cantidad) || cantidad === 0) continue
    const item = porId.get(id)
    if (!item || vistos.has(id) || cantidad < 0) return { ok: false, error: 'La selección de productos no es válida.' }
    const disponibles = Number(item.cantidad) - Number(item.cantidad_reembolsada || 0)
    if (cantidad > disponibles) return { ok: false, error: `"${item.nombre}": solo quedan ${disponibles} pieza(s) por devolver.` }
    vistos.add(id)
    piezas.push({ pedido_item_id: id, precio: Number(item.precio), cantidad })
  }

  const costoEnvio = Number(pedido.costo_envio || 0)
  const incluyeEnvio = incluirEnvio && costoEnvio > 0 && !envioYaDevuelto(pedido)
  const subtotalSel = piezas.reduce((s, p) => s + p.precio * p.cantidad, 0)
  const subtotal = Number(pedido.subtotal || 0)
  const descuento = Number(pedido.descuento || 0)
  const parteDescuento = subtotal > 0 && descuento > 0 ? descuento * (subtotalSel / subtotal) : 0
  const monto = r2(Math.min(saldoPorDevolver(pedido), subtotalSel - parteDescuento + (incluyeEnvio ? costoEnvio : 0)))
  return { ok: true, monto: Math.max(0, monto), piezas, incluyeEnvio }
}

// ── Efectos de un reembolso total o cancelación pagada ──
async function efectosTotal(pedido: any, reembolsoId: number | null, motivo: string, evento: 'cancelacion' | 'reembolso_total') {
  await restaurarPrimeraCompraSiAplica(pedido)
  await ajustarComisionPorReembolso(pedido.id, { total: true, reembolsoId, motivo, evento })
}

async function marcarPiezasDevueltas(pedido: any, piezas: { pedido_item_id: number; cantidad: number }[]) {
  const db = createServiceClient()
  const items = new Map<number, any>((pedido.pedido_items || []).map((it: any) => [Number(it.id), it]))
  for (const p of piezas) {
    const item = items.get(p.pedido_item_id)
    if (!item) continue
    const nueva = Math.min(Number(item.cantidad), Number(item.cantidad_reembolsada || 0) + p.cantidad)
    await db.from('pedido_items').update({ cantidad_reembolsada: nueva }).eq('id', p.pedido_item_id)
  }
}

function todasLasPiezas(pedido: any) {
  return (pedido.pedido_items || [])
    .map((it: any) => ({ pedido_item_id: Number(it.id), precio: Number(it.precio), cantidad: Number(it.cantidad) - Number(it.cantidad_reembolsada || 0) }))
    .filter((p: any) => p.cantidad > 0)
}

// ============================================================
// REEMBOLSO desde el admin (Mercado Pago o transferencia)
// body: { total?: boolean, items?: SeleccionItem[], incluirEnvio?: boolean, monto?: number, motivo?: string }
// ============================================================
export async function procesarReembolsoAdmin(pedidoId: number, admin: AdminQueOpera, body: any): Promise<Resultado> {
  const pedido = await cargarPedidoReembolso(pedidoId)
  if (!pedido) return falla(404, 'Pedido no encontrado.')
  if (!ESTADOS_REEMBOLSABLES.includes(pedido.estado)) {
    return falla(400, `No se puede reembolsar un pedido en estado "${pedido.estado}".`)
  }
  const esTransferencia = pedido.metodo_pago === 'transferencia'
  if (!esTransferencia && !pedido.mp_payment_id) return falla(400, 'Este pedido no tiene un pago de Mercado Pago asociado.')

  const saldo = saldoPorDevolver(pedido)
  if (saldo <= 0) return falla(400, 'Este pedido ya no tiene saldo por devolver.')
  const motivo = typeof body?.motivo === 'string' ? body.motivo.trim().slice(0, 500) : ''

  // 1) Qué se devuelve y cuánto (todo se recalcula aquí)
  const esTotalPedido = body?.total === true
  let piezas: (PiezaDevuelta & { pedido_item_id: number })[]
  let incluyeEnvio: boolean
  let montoCalculado: number
  if (esTotalPedido) {
    piezas = todasLasPiezas(pedido)
    incluyeEnvio = Number(pedido.costo_envio || 0) > 0 && !envioYaDevuelto(pedido)
    montoCalculado = saldo
  } else {
    const calc = calcularReembolso(pedido, Array.isArray(body?.items) ? body.items : [], body?.incluirEnvio === true)
    if (!calc.ok) return falla(400, calc.error)
    piezas = calc.piezas
    incluyeEnvio = calc.incluyeEnvio
    montoCalculado = calc.monto
  }
  let monto = montoCalculado
  let ajustadoAMano = false
  if (!esTotalPedido && body?.monto != null && body.monto !== '') {
    const manual = r2(Number(body.monto))
    if (!Number.isFinite(manual) || manual <= 0) return falla(400, 'El monto no es válido.')
    if (manual > saldo) return falla(400, `El monto no puede ser mayor a lo que falta por devolver (${mxn(saldo)}).`)
    ajustadoAMano = manual !== montoCalculado
    monto = manual
  }
  if (monto <= 0) return falla(400, 'Elige al menos un producto o el envío, o escribe un monto.')

  // 2) Candado
  if (!(await tomarCandado(pedido.id))) return falla(409, 'Ya hay un reembolso o cancelación en proceso para este pedido. Espera un momento.')
  const db = createServiceClient()
  try {
    // 3) Mercado Pago: lo registrado debe coincidir con MP antes de mover dinero
    if (!esTransferencia) {
      const pago = await consultarPagoMP(pedido.mp_payment_id)
      if (!pago) return falla(502, 'No se pudo consultar el pago en Mercado Pago. Intenta de nuevo.')
      const { reembolsadoMP, restante } = montosPagoMP(pago)
      if (reembolsadoMP > r2(Number(pedido.monto_reembolsado || 0)) + 0.01) {
        return falla(409, 'Mercado Pago tiene reembolsos que no están registrados aquí. Usa "Sincronizar con Mercado Pago" primero.')
      }
      if (monto > restante + 0.01) return falla(400, `Mercado Pago solo permite devolver ${mxn(restante)} de este pago.`)
    }

    const acumulado = r2(Number(pedido.monto_reembolsado || 0) + monto)
    const quedaTotal = acumulado >= r2(Number(pedido.total || 0)) - 0.005

    // 4) Registro en el historial (su id es la llave de idempotencia de MP)
    const { data: fila, error: errFila } = await db.from('reembolsos').insert({
      pedido_id: pedido.id,
      tipo: quedaTotal ? 'total' : 'parcial',
      origen: 'admin',
      metodo: esTransferencia ? 'transferencia' : 'mercadopago',
      monto,
      monto_calculado: montoCalculado,
      ajustado_a_mano: ajustadoAMano,
      incluye_envio: incluyeEnvio,
      items: piezas.map(p => ({ pedido_item_id: p.pedido_item_id, cantidad: p.cantidad })),
      motivo: motivo || null,
      admin_email: admin.email,
    }).select('id').single()
    if (errFila || !fila) {
      console.error('Error registrando reembolso:', errFila)
      return falla(500, 'No se pudo registrar el reembolso.')
    }

    // 5) Mover el dinero (solo Mercado Pago)
    let refundId: string | null = null
    if (!esTransferencia) {
      const r = await reembolsarMP(pedido.mp_payment_id, quedaTotal && esTotalPedido ? null : monto, `vitalora-reembolso-${fila.id}`)
      if (!r.ok) {
        await db.from('reembolsos').update({ estado: 'fallido', error: r.error }).eq('id', fila.id)
        return falla(502, `Mercado Pago: ${r.error}`)
      }
      refundId = r.refundId
    }

    // 6) Pedido, piezas e historial
    await marcarPiezasDevueltas(pedido, piezas)
    await db.from('pedidos').update({
      monto_reembolsado: acumulado,
      estado: quedaTotal ? 'reembolsado' : 'reembolso_parcial',
    }).eq('id', pedido.id)
    await db.from('reembolsos').update({ estado: 'completado', mp_refund_id: refundId, completado_at: new Date().toISOString() }).eq('id', fila.id)

    // 7) Comisión y primera compra
    const motivoComision = `Reembolso ${quedaTotal ? 'total' : 'parcial'} del pedido ${formatearNumeroPedido(pedido.id)}`
    if (quedaTotal) await efectosTotal(pedido, fila.id, motivoComision, 'reembolso_total')
    else await ajustarComisionPorReembolso(pedido.id, { total: false, piezas, reembolsoId: fila.id, motivo: motivoComision, evento: 'reembolso_parcial' })

    // 8) Correo al cliente
    await correoReembolsoCliente(pedido, { monto, parcial: !quedaTotal, metodo: esTransferencia ? 'transferencia' : 'mercadopago' })

    const recordatorio = esTransferencia ? 'Recuerda hacer la transferencia de devolución desde tu banco.' : undefined
    return {
      ok: true,
      monto,
      recordatorio,
      mensaje: `${quedaTotal ? 'Reembolso total' : 'Reembolso parcial'} de ${mxn(monto)} ${esTransferencia ? 'registrado' : 'procesado en Mercado Pago'}. El inventario no se ajusta automáticamente.`,
    }
  } finally {
    await soltarCandado(pedido.id)
  }
}

// ============================================================
// CANCELACIÓN desde el admin
// ============================================================
export async function cancelarPedido(pedidoId: number, admin: AdminQueOpera, motivoBruto: unknown): Promise<Resultado> {
  const motivo = typeof motivoBruto === 'string' ? motivoBruto.trim().slice(0, 500) : ''
  if (motivo.length < 3) return falla(400, 'Escribe el motivo de la cancelación.')

  const pedido = await cargarPedidoReembolso(pedidoId)
  if (!pedido) return falla(404, 'Pedido no encontrado.')
  if (!puedeCancelarse(pedido)) {
    return falla(400, (pedido.numero_guia || pedido.skydropx_shipment_id)
      ? 'Este pedido ya tiene guía de envío y no puede cancelarse.'
      : `No se puede cancelar un pedido en estado "${pedido.estado}".`)
  }

  if (!(await tomarCandado(pedido.id))) return falla(409, 'Ya hay un reembolso o cancelación en proceso para este pedido. Espera un momento.')
  const db = createServiceClient()
  try {
    const esTransferencia = pedido.metodo_pago === 'transferencia'
    let metodo: 'mercadopago' | 'transferencia' | 'ninguno' = 'ninguno'
    let montoDevuelto = 0
    let huboPago = false
    let refundId: string | null = null
    let recordatorio: string | undefined
    let accionMP: (() => Promise<{ ok: boolean; error?: string; refundId?: string | null; monto?: number }>) | null = null

    if (esTransferencia) {
      if (['pagado', 'preparando', 'reembolso_parcial'].includes(pedido.estado)) {
        metodo = 'transferencia'; huboPago = true
        montoDevuelto = saldoPorDevolver(pedido)
        recordatorio = `Haz la devolución de ${mxn(montoDevuelto)} desde tu banco.`
      } else if (pedido.estado === 'comprobante_en_revision') {
        metodo = 'transferencia'
        montoDevuelto = saldoPorDevolver(pedido)
        recordatorio = `El comprobante no estaba aprobado: si te llegó la transferencia, devuelve ${mxn(montoDevuelto)} desde tu banco.`
      }
      // esperando_comprobante / comprobante_rechazado: sin pago, nada que devolver
    } else {
      // Mercado Pago
      const pago = pedido.mp_payment_id ? await consultarPagoMP(pedido.mp_payment_id) : null
      if (pedido.mp_payment_id && !pago) return falla(502, 'No se pudo consultar el pago en Mercado Pago. Intenta de nuevo.')
      if (pago?.status === 'approved') {
        const { restante } = montosPagoMP(pago)
        huboPago = true
        if (restante > 0) {
          metodo = 'mercadopago'
          montoDevuelto = restante
          accionMP = async () => {
            const r = await reembolsarMP(pedido.mp_payment_id, null, `vitalora-cancelacion-${pedido.id}-${pedido.mp_payment_id}`)
            return r.ok ? { ok: true, refundId: r.refundId, monto: restante } : { ok: false, error: r.error }
          }
        }
      } else {
        // Sin pago aprobado: caducar el enlace de pago y cancelar una ficha pendiente (OXXO)
        accionMP = async () => {
          if (pedido.mp_preference_id) await caducarPreferenciaMP(pedido.mp_preference_id)
          if (pago && (pago.status === 'pending' || pago.status === 'in_process')) await cancelarPagoMP(pedido.mp_payment_id)
          return { ok: true }
        }
      }
    }

    // Historial
    const { data: fila, error: errFila } = await db.from('reembolsos').insert({
      pedido_id: pedido.id,
      tipo: 'cancelacion',
      origen: 'admin',
      metodo,
      monto: montoDevuelto,
      monto_calculado: montoDevuelto,
      incluye_envio: montoDevuelto > 0 && Number(pedido.costo_envio || 0) > 0,
      items: todasLasPiezas(pedido).map((p: any) => ({ pedido_item_id: p.pedido_item_id, cantidad: p.cantidad })),
      motivo,
      admin_email: admin.email,
    }).select('id').single()
    if (errFila || !fila) {
      console.error('Error registrando cancelación:', errFila)
      return falla(500, 'No se pudo registrar la cancelación.')
    }

    // Mercado Pago primero: si falla, el pedido no cambia
    if (accionMP) {
      const r = await accionMP()
      if (!r.ok) {
        await db.from('reembolsos').update({ estado: 'fallido', error: r.error ?? 'Error' }).eq('id', fila.id)
        return falla(502, `Mercado Pago: ${r.error}`)
      }
      refundId = r.refundId ?? null
    }

    // Pedido cancelado (solo si sigue sin guía y en un estado cancelable)
    const confirmado = huboPago
    const { data: cambiado } = await db.from('pedidos').update({
      estado: 'cancelado',
      cancelado_at: new Date().toISOString(),
      cancelado_por: admin.email,
      motivo_cancelacion: motivo,
      ...(huboPago ? { monto_reembolsado: r2(Number(pedido.monto_reembolsado || 0) + montoDevuelto) } : {}),
    }).eq('id', pedido.id).eq('estado', pedido.estado).is('numero_guia', null).is('skydropx_shipment_id', null).select('id')

    if ((cambiado?.length ?? 0) === 0) {
      await db.from('reembolsos').update({ estado: 'fallido', error: 'El pedido cambió mientras se cancelaba', mp_refund_id: refundId }).eq('id', fila.id)
      await avisoAdmin(`Revisar cancelación - Pedido ${formatearNumeroPedido(pedido.id)}`,
        `El pedido cambió de estado mientras se cancelaba${refundId ? ' y el reembolso en Mercado Pago SÍ se hizo' : ''}. Revísalo en el admin.`)
      return falla(409, 'El pedido cambió mientras se cancelaba. Recarga la página y revisa.')
    }

    if (huboPago) await marcarPiezasDevueltas(pedido, todasLasPiezas(pedido))

    // Inventario: solo si el pedido había descontado stock y no se había devuelto antes
    const piezasAlInventario = await devolverStockUnaVez(pedido.id)
    await db.from('reembolsos').update({ estado: 'completado', mp_refund_id: refundId, completado_at: new Date().toISOString() }).eq('id', fila.id)

    // Comisión y primera compra: solo si el pago llegó a aplicar sus efectos
    // (en 'revision_monto' o un pago que llegó a un pedido pendiente no se registró comisión
    //  ni se marcó la primera compra, así que no hay nada que revertir)
    const efectosAplicados = ['pagado', 'preparando', 'enviado', 'entregado', 'reembolso_parcial'].includes(pedido.estado)
    if (huboPago && efectosAplicados) await efectosTotal(pedido, fila.id, `Pedido ${formatearNumeroPedido(pedido.id)} cancelado`, 'cancelacion')

    await correoCancelacionCliente(pedido, { monto: montoDevuelto, metodo, confirmado })

    const partes = [`Pedido cancelado.`]
    if (metodo === 'mercadopago') partes.push(`Se devolvieron ${mxn(montoDevuelto)} en Mercado Pago.`)
    if (metodo === 'ninguno') partes.push(huboPago ? 'El pago ya estaba reembolsado.' : 'No había pago que devolver.')
    partes.push(piezasAlInventario > 0
      ? `Se devolvieron ${piezasAlInventario} pieza(s) al inventario.`
      : 'No había stock que devolver al inventario.')
    return { ok: true, monto: montoDevuelto, recordatorio, mensaje: partes.join(' ') }
  } finally {
    await soltarCandado(pedido.id)
  }
}

// ============================================================
// SINCRONIZAR reembolsos hechos en Mercado Pago (webhook y botón del admin)
// No toca stock. Respeta los pedidos cancelados.
// ============================================================
export interface ResumenSincronizacion {
  omitido?: string
  nuevos: number
  montoAntes: number
  montoDespues: number
  estadoAntes: string
  estadoDespues: string
  parcialExterno: boolean
}

export async function sincronizarReembolsosMP(pedidoId: number, pago: any, origen: 'webhook' | 'sincronizacion'): Promise<ResumenSincronizacion> {
  const pedido = await cargarPedidoReembolso(pedidoId)
  const vacio = (omitido: string): ResumenSincronizacion => ({
    omitido, nuevos: 0, montoAntes: Number(pedido?.monto_reembolsado || 0), montoDespues: Number(pedido?.monto_reembolsado || 0),
    estadoAntes: pedido?.estado ?? '', estadoDespues: pedido?.estado ?? '', parcialExterno: false,
  })
  if (!pedido) return vacio('Pedido no encontrado')
  // Un reembolso del admin está en curso: él lo registra
  if (candadoActivo(pedido)) return vacio('Hay un reembolso en curso')

  const db = createServiceClient()
  const { pagado, reembolsadoMP } = montosPagoMP(pago)
  const registrados = new Set((pedido.reembolsos || []).map((r: any) => r.mp_refund_id).filter(Boolean).map(String))
  const nuevosRefunds = ((pago?.refunds || []) as any[]).filter(r => r?.status === 'approved' && r?.id != null && !registrados.has(String(r.id)))

  const montoAntes = r2(Number(pedido.monto_reembolsado || 0))
  const montoDespues = r2(Math.max(montoAntes, reembolsadoMP))
  const esTotal = pago?.status === 'refunded' || (pagado > 0 && reembolsadoMP >= pagado - 0.005)
  const cancelado = pedido.estado === 'cancelado' || !!pedido.cancelado_at

  if (nuevosRefunds.length === 0 && montoDespues === montoAntes) return vacio('Sin diferencias')

  // Historial: un renglón por cada reembolso de MP que no estaba registrado
  let ultimaFila: number | null = null
  for (const ref of nuevosRefunds) {
    const { data: fila, error } = await db.from('reembolsos').insert({
      pedido_id: pedido.id,
      tipo: esTotal ? 'total' : 'parcial',
      origen,
      metodo: 'mercadopago',
      estado: 'completado',
      monto: r2(Number(ref.amount || 0)),
      mp_refund_id: String(ref.id),
      motivo: origen === 'webhook' ? 'Reembolso hecho desde el panel de Mercado Pago' : 'Registrado al sincronizar con Mercado Pago',
      completado_at: ref.date_created || new Date().toISOString(),
    }).select('id').single()
    if (error && error.code !== '23505') console.error('Error registrando reembolso de MP:', error)
    if (fila) ultimaFila = fila.id
  }

  const estadoDespues = cancelado ? pedido.estado : (esTotal ? 'reembolsado' : 'reembolso_parcial')
  await db.from('pedidos').update({ monto_reembolsado: montoDespues, estado: estadoDespues }).eq('id', pedido.id)

  const pasoATotal = esTotal && pedido.estado !== 'reembolsado' && !cancelado
  if (pasoATotal) {
    await marcarPiezasDevueltas(pedido, todasLasPiezas(pedido))
    // Solo se revierte lo que el pago llegó a aplicar (no en 'revision_monto' ni 'pendiente')
    if (['pagado', 'preparando', 'enviado', 'entregado', 'reembolso_parcial'].includes(pedido.estado)) {
      await efectosTotal(pedido, ultimaFila, `Reembolso total del pedido ${formatearNumeroPedido(pedido.id)} (Mercado Pago)`, 'reembolso_total')
    }
  }

  // Parcial hecho fuera del admin: no se sabe qué piezas fueron → la comisión no se toca y se avisa
  const parcialExterno = !esTotal && nuevosRefunds.length > 0 && !cancelado
  if (parcialExterno && origen === 'webhook') {
    await avisoAdmin(`Reembolso parcial desde Mercado Pago - Pedido ${formatearNumeroPedido(pedido.id)}`,
      `Se registró un reembolso parcial hecho directamente en el panel de Mercado Pago (${mxn(r2(montoDespues - montoAntes))}). ` +
      `Total devuelto: ${mxn(montoDespues)} de ${mxn(Number(pedido.total || 0))}. ` +
      `La comisión de la embajadora (si hay) NO se ajustó: revisa qué productos se devolvieron. El inventario no se ajusta automáticamente.`)
  }

  return { nuevos: nuevosRefunds.length, montoAntes, montoDespues, estadoAntes: pedido.estado, estadoDespues, parcialExterno }
}

// ============================================================
// Pago aprobado que llega a un pedido que el admin canceló: se reembolsa solo
// ============================================================
export async function reembolsarPagoEnCancelado(pedidoId: number, pago: any): Promise<void> {
  const pedido = await cargarPedidoReembolso(pedidoId)
  if (!pedido || !pago?.id) return
  const { restante } = montosPagoMP(pago)
  if (restante <= 0) return

  const paymentId = String(pago.id)
  const db = createServiceClient()
  const r = await reembolsarMP(paymentId, null, `vitalora-pago-en-cancelado-${pedido.id}-${paymentId}`)
  if (!r.ok) {
    await avisoAdmin(`URGENTE: pago en pedido cancelado sin reembolsar - Pedido ${formatearNumeroPedido(pedido.id)}`,
      `Llegó un pago aprobado de ${mxn(restante)} (pago MP ${esc(paymentId)}) a un pedido que cancelaste, y el reembolso automático falló: ${esc(r.error)}. Reembólsalo desde el panel de Mercado Pago.`)
    return
  }
  const { error } = await db.from('reembolsos').insert({
    pedido_id: pedido.id, tipo: 'cancelacion', origen: 'webhook', metodo: 'mercadopago', estado: 'completado',
    monto: restante, monto_calculado: restante, incluye_envio: Number(pedido.costo_envio || 0) > 0,
    mp_refund_id: r.refundId, motivo: 'Pago recibido después de cancelar el pedido: reembolsado automáticamente',
    completado_at: new Date().toISOString(),
  })
  if (error && error.code !== '23505') console.error('Error registrando reembolso automático:', error)
  await db.from('pedidos').update({ monto_reembolsado: r2(Number(pedido.monto_reembolsado || 0) + restante) }).eq('id', pedido.id)

  await avisoAdmin(`Pago en pedido cancelado: reembolsado - Pedido ${formatearNumeroPedido(pedido.id)}`,
    `Llegó un pago aprobado de ${mxn(restante)} (pago MP ${esc(paymentId)}) a un pedido que cancelaste. Se reembolsó automáticamente. No se descontó stock ni se registró comisión.`)
  await correoCancelacionCliente(pedido, { monto: restante, metodo: 'mercadopago', confirmado: true })
}

// ============================================================
// Correos
// ============================================================
function plantilla(titulo: string, saludo: string, cuerpo: string, montoEtiqueta?: string, monto?: number) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>
  <div style="padding:40px 32px;text-align:center;border-bottom:1px solid #E8E0D5;">
    <h1 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">${titulo}</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">${saludo}</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">${cuerpo}</p>
    ${montoEtiqueta && monto != null ? `<div style="background:#FAF7F0;border:1px solid #E8E0D5;border-radius:8px;padding:20px;text-align:center;">
      <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">${montoEtiqueta}</div>
      <div style="font-size:28px;font-weight:700;color:#0E0E0E;">${mxn(monto)}</div>
    </div>` : ''}
    <p style="font-size:13px;color:#888;line-height:1.6;margin:24px 0 0;text-align:center;">
      ¿Dudas? Escríbenos a <a href="mailto:hola@vitalora.com.mx" style="color:#C9A961;">hola@vitalora.com.mx</a> o por <a href="${WHATSAPP_URL}" style="color:#C9A961;">WhatsApp</a>.
    </p>
  </div>
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`
}

async function enviar(to: string, subject: string, html: string) {
  if (!to) return
  try {
    await resend.emails.send({ from: 'Vitalora <hola@vitalora.com.mx>', to, subject, html })
  } catch (e) {
    console.error('Error enviando correo:', subject, e)
  }
}

export async function correoReembolsoCliente(pedido: any, d: { monto: number; parcial: boolean; metodo: 'mercadopago' | 'transferencia' }) {
  const numero = formatearNumeroPedido(pedido.id)
  const tipo = d.parcial ? 'un reembolso parcial' : 'el reembolso'
  const cuerpo = d.metodo === 'transferencia'
    ? `Registramos ${tipo} de tu pedido <strong>${numero}</strong> por <strong>${mxn(d.monto)}</strong>. Te lo depositaremos por transferencia bancaria a la cuenta que nos indiques; si aún no nos la has enviado, respóndenos este correo con tu CLABE.`
    : `Procesamos ${tipo} de tu pedido <strong>${numero}</strong> por <strong>${mxn(d.monto)}</strong> a través de Mercado Pago. Se verá reflejado en tu método de pago original en un plazo de 5 a 10 días hábiles, según tu banco.`
  await enviar(pedido.email, `Reembolso procesado — Pedido ${numero}`,
    plantilla('Reembolso procesado', `Hola ${esc(pedido.nombre)},`, cuerpo, 'Monto reembolsado', d.monto))
}

export async function correoCancelacionCliente(pedido: any, d: { monto: number; metodo: 'mercadopago' | 'transferencia' | 'ninguno'; confirmado: boolean }) {
  const numero = formatearNumeroPedido(pedido.id)
  let cuerpo = `Tu pedido <strong>${numero}</strong> fue cancelado.`
  let etiqueta: string | undefined
  if (d.monto > 0 && d.metodo === 'mercadopago') {
    cuerpo += ` Te devolvimos <strong>${mxn(d.monto)}</strong> a través de Mercado Pago; se verá reflejado en tu método de pago original en un plazo de 5 a 10 días hábiles, según tu banco.`
    etiqueta = 'Monto que se te devuelve'
  } else if (d.monto > 0 && d.metodo === 'transferencia') {
    cuerpo += d.confirmado
      ? ` Te devolveremos <strong>${mxn(d.monto)}</strong> por transferencia bancaria. Si aún no nos has enviado tu CLABE, respóndenos este correo con ella.`
      : ` Si ya realizaste la transferencia, te devolveremos <strong>${mxn(d.monto)}</strong>. Respóndenos este correo con tu CLABE para hacerte el depósito.`
    etiqueta = 'Monto que se te devuelve'
  } else if (d.confirmado) {
    cuerpo += ' El pago de este pedido ya había sido reembolsado.'
  } else {
    cuerpo += ' No se realizó ningún cobro, así que no hay nada que devolver.'
  }
  await enviar(pedido.email, `Tu pedido fue cancelado — Pedido ${numero}`,
    plantilla('Tu pedido fue cancelado', `Hola ${esc(pedido.nombre)},`, cuerpo, etiqueta, etiqueta ? d.monto : undefined))
}

export async function avisoAdmin(asunto: string, texto: string) {
  await enviar(ADMIN_EMAIL, asunto,
    `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;padding:32px;">
<h2 style="font-size:18px;color:#B45309;margin:0 0 12px;">${esc(asunto)}</h2>
<p style="font-size:14px;color:#333;line-height:1.6;margin:0;">${texto}</p>
</div></body></html>`)
}
