// ============================================================
// Rastreo de guías de Skydropx (SOLO SERVIDOR).
// Lo usan el webhook de Skydropx, el cron diario y el botón "Actualizar rastreo".
//
//  created                                   → solo se registra
//  picked_up, in_transit, last_mile          → pagado/preparando pasan a "enviado" (+ enviado_at)
//  delivered, delivered_to_branch            → pasa a "entregado" (+ entregado_at) y correo al cliente (una vez)
//  delivery_attempt, exception, in_return,
//  canceled, error                           → alerta al admin (una vez por estado y guía); el estado no cambia
// El estado del pedido nunca retrocede. Cada evento se guarda una sola vez (envio_eventos.huella).
// ============================================================
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { consultarRastreo, consultarEnvio, entornoSkydropx, type EventoRastreo } from '@/lib/skydropx'
import { enviarCorreoEntrega, enviarAlertaRastreo } from '@/lib/correo-entrega'

const A_ENVIADO = ['picked_up', 'in_transit', 'last_mile']
const ENTREGADO = ['delivered', 'delivered_to_branch']
const ALERTA = ['delivery_attempt', 'exception', 'in_return', 'canceled', 'error']
// Orden para no retroceder el último estado de rastreo guardado
const RANGO: Record<string, number> = {
  created: 0, picked_up: 1, in_transit: 2, last_mile: 3, delivery_attempt: 3, exception: 3,
  in_return: 4, canceled: 4, error: 4, delivered: 5, delivered_to_branch: 5,
}
const rango = (e: string | null | undefined) => (e && e in RANGO ? RANGO[e] : -1)

export const NOMBRE_ESTADO_RASTREO: Record<string, string> = {
  created: 'Guía creada', picked_up: 'Recolectado', in_transit: 'En tránsito', last_mile: 'En reparto',
  delivery_attempt: 'Intento de entrega', exception: 'Excepción', in_return: 'En devolución',
  canceled: 'Cancelado', error: 'Error', delivered: 'Entregado', delivered_to_branch: 'En sucursal',
}

const CAMPOS = 'id, estado, nombre, apellido, email, telefono, user_id, numero_guia, paqueteria, guia_url_rastreo, skydropx_shipment_id, guia_entorno, envio_estado'

export interface EventoEntrada extends EventoRastreo {
  fuente: 'webhook' | 'consulta' | 'manual'
  payload?: unknown
}

export async function registrarEvento(pedidoId: number, ev: EventoEntrada): Promise<{ nuevo: boolean }> {
  const db = createServiceClient()
  const { data: p } = await db.from('pedidos').select(CAMPOS).eq('id', pedidoId).maybeSingle()
  if (!p) return { nuevo: false }
  const estado = (ev.estado || '').toLowerCase()
  if (!estado) return { nuevo: false }

  // 1. Historial (una fila por guía + estado + fecha)
  const huella = createHash('sha256').update(`${p.numero_guia || p.skydropx_shipment_id}|${estado}|${ev.fecha || ''}`).digest('hex')
  const { data: insertado } = await db.from('envio_eventos').upsert({
    pedido_id: p.id, numero_guia: p.numero_guia, estado,
    descripcion: ev.descripcion, ubicacion: ev.ubicacion, ocurrido_at: ev.fecha || new Date().toISOString(),
    fuente: ev.fuente, huella, payload: ev.payload ?? null,
  }, { onConflict: 'huella', ignoreDuplicates: true }).select('id')
  const nuevo = (insertado?.length ?? 0) > 0

  const ahora = new Date().toISOString()
  const cuando = ev.fecha || ahora

  // 2. Último estado de rastreo (sin retroceder)
  if (rango(estado) >= rango(p.envio_estado)) {
    await db.from('pedidos').update({ envio_estado: estado, envio_estado_at: cuando }).eq('id', p.id)
  }

  // 3. Estado del pedido (las condiciones evitan retrocesos y no tocan cancelados/reembolsados)
  if (A_ENVIADO.includes(estado) || ENTREGADO.includes(estado)) {
    await db.from('pedidos').update({ enviado_at: cuando }).eq('id', p.id).is('enviado_at', null)
    await db.from('pedidos').update({ estado: 'enviado' }).eq('id', p.id).in('estado', ['pagado', 'preparando'])
  }
  if (ENTREGADO.includes(estado)) {
    await db.from('pedidos').update({ estado: 'entregado' }).eq('id', p.id).in('estado', ['pagado', 'preparando', 'enviado'])
    await db.from('pedidos').update({ entregado_at: cuando }).eq('id', p.id).is('entregado_at', null).in('estado', ['entregado', 'reembolso_parcial'])
    // Correo al cliente: una sola vez (el candado es correo_entrega_at)
    const { data: tomado } = await db.from('pedidos').update({ correo_entrega_at: ahora })
      .eq('id', p.id).is('correo_entrega_at', null).in('estado', ['entregado', 'reembolso_parcial']).select('id')
    if (tomado?.length) {
      const ok = await enviarCorreoEntrega(p, estado === 'delivered_to_branch', p.paqueteria)
      if (!ok) await db.from('pedidos').update({ correo_entrega_at: null }).eq('id', p.id)
    }
  }

  // 4. Alerta al admin: una vez por guía y estado
  if (ALERTA.includes(estado)) {
    const { error } = await db.from('alertas_enviadas').insert({ clave: `rastreo:${p.numero_guia || p.skydropx_shipment_id}:${estado}` })
    if (!error) {
      const ok = await enviarAlertaRastreo(p, estado, ev.descripcion)
      if (!ok) await db.from('alertas_enviadas').delete().eq('clave', `rastreo:${p.numero_guia || p.skydropx_shipment_id}:${estado}`)
    }
  }
  return { nuevo }
}

// Consulta el rastreo de un pedido en Skydropx y registra lo nuevo.
export async function sincronizarRastreo(pedidoId: number): Promise<{ ok: true; eventos: number; estado: string | null } | { ok: false; error: string }> {
  const db = createServiceClient()
  const { data: p } = await db.from('pedidos').select(CAMPOS).eq('id', pedidoId).maybeSingle()
  if (!p) return { ok: false, error: 'Pedido no encontrado.' }
  if (!p.skydropx_shipment_id || !p.numero_guia) return { ok: false, error: 'El pedido no tiene guía de Skydropx.' }
  if (p.guia_entorno && p.guia_entorno !== entornoSkydropx()) return { ok: false, error: `La guía es de ${p.guia_entorno}; este servidor está en ${entornoSkydropx()}.` }

  let eventos: EventoRastreo[] = []
  try {
    eventos = await consultarRastreo(p.numero_guia, p.paqueteria || '')
  } catch (e) {
    console.error('Rastreo: consulta de eventos falló, se usa el estado del envío', e)
  }
  // Sin eventos de la paquetería: se usa el estado que Skydropx tiene en el paquete
  if (eventos.length === 0) {
    try {
      const envio = await consultarEnvio(p.skydropx_shipment_id)
      if (envio.estadoRastreo) eventos = [{ estado: envio.estadoRastreo, descripcion: null, ubicacion: null, fecha: null }]
    } catch (e) {
      await db.from('pedidos').update({ rastreo_consultado_at: new Date().toISOString() }).eq('id', p.id)
      return { ok: false, error: e instanceof Error ? e.message : 'No se pudo consultar Skydropx.' }
    }
  }

  let nuevos = 0
  // Del más viejo al más nuevo
  eventos.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  for (const ev of eventos) {
    const r = await registrarEvento(p.id, { ...ev, fuente: 'consulta' })
    if (r.nuevo) nuevos++
  }
  await db.from('pedidos').update({ rastreo_consultado_at: new Date().toISOString() }).eq('id', p.id)
  const { data: despues } = await db.from('pedidos').select('envio_estado').eq('id', p.id).maybeSingle()
  return { ok: true, eventos: nuevos, estado: despues?.envio_estado ?? null }
}

// Cron diario: pedidos con guía en preparando/enviado de los últimos 30 días, los menos consultados primero.
export async function sincronizarPendientes(limite = 40): Promise<{ revisados: number; conCambios: number; errores: number }> {
  const db = createServiceClient()
  const desde = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const { data } = await db.from('pedidos')
    .select('id, envio_estado')
    .not('skydropx_shipment_id', 'is', null)
    .not('numero_guia', 'is', null)
    .in('estado', ['preparando', 'enviado'])
    .eq('guia_entorno', entornoSkydropx())
    .gte('guia_creada_at', desde)
    .order('rastreo_consultado_at', { ascending: true, nullsFirst: true })
    .limit(limite)
  let conCambios = 0, errores = 0
  for (const p of data || []) {
    const r = await sincronizarRastreo(p.id)
    if (!r.ok) errores++
    else if (r.eventos > 0 || r.estado !== p.envio_estado) conCambios++
  }
  return { revisados: data?.length ?? 0, conCambios, errores }
}
