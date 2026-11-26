// ============================================================
// Guías de Skydropx desde el admin (SOLO SERVIDOR).
//  cotizarGuia  → tarifas de las 4 paqueterías + saldo, desde el origen elegido
//  crearGuia    → crea la guía con la tarifa elegida (candado para no crear dos),
//                 guarda la etiqueta en el bucket privado "guias", pasa a "preparando"
//                 y manda el correo con el rastreo
//  actualizarGuia → termina una guía que Skydropx dejó en proceso
//  cancelarGuia → cancela en Skydropx y libera el pedido (dueño/gerente)
// Nunca seguro, valor declarado, recolección ni opciones de sucursal.
// ============================================================
import { createServiceClient } from '@/lib/supabase/service'
import {
  cotizar, obtenerSaldo, crearEnvio, esperarEnvio, consultarEnvio, cancelarEnvio, descargarEtiqueta,
  entornoSkydropx, ErrorSkydropx, type Tarifa, type EnvioSkydropx,
} from '@/lib/skydropx'
import { calcularPaquete, CLAVE_SAT_PRODUCTO, type Paquete, type TipoEmpaque } from '@/lib/paquete'
import { evaluarZonaExtendida } from '@/lib/zona-extendida'
import { obtenerOrigen, origenParaCotizar, type OrigenEnvio } from '@/lib/envio-origenes'
import { articulosDeCarrito } from '@/lib/cotizar-envio'
import { ESTADOS_CON_GUIA } from '@/lib/estados-pedido'
import { candadoActivo } from '@/lib/reembolsos'
import { enviarCorreoGuia } from '@/lib/correo-guia'

export const BUCKET_GUIAS = 'guias'
const CANDADO_GUIA_MS = 3 * 60 * 1000
const ESPERA_GUIA_MS = 30000
// Estados de rastreo en los que la paquetería todavía no tiene el paquete
const RASTREO_SIN_RECOLECTAR = [null, '', 'created']

type Resultado<T> = ({ ok: true } & T) | { ok: false; status: number; error: string }
const falla = (status: number, error: string) => ({ ok: false as const, status, error })

const CAMPOS = `id, estado, nombre, apellido, email, telefono, calle, numero, interior, colonia, ciudad, estado_dir, cp, referencia,
  numero_guia, paqueteria, skydropx_shipment_id, guia_en_curso_desde, reembolso_en_curso_desde, zona_verificada, cargo_zona_extendida,
  envio_estado, guias_anteriores, guia_label_path, costo_guia, cobro_real_guia, guia_entorno, guia_creada_at,
  saldo_antes_guia, origen_envio_id, pedido_items ( producto_id, cantidad )`

async function cargarPedido(id: number) {
  const { data } = await createServiceClient().from('pedidos').select(CAMPOS).eq('id', id).maybeSingle()
  return data as any
}

function mensaje(e: unknown): string {
  if (e instanceof ErrorSkydropx) return e.message
  return e instanceof Error ? e.message : 'Error desconocido'
}

// ── Cotizar ──
export interface CotizacionAdmin {
  cotizacionId: number
  entorno: 'produccion' | 'sandbox'
  origen: { id: number; alias: string; cp: string }
  paquete: Paquete
  saldo: number | null
  tarifas: Tarifa[]
  zona: { extendida: boolean; motivo: 'recargo' | 'precio' | null; masBarata: number | null }
  avisoZonaSinVerificar: boolean
}

export async function cotizarGuia(params: {
  pedidoId: number
  origenId?: number | null
  empaque?: TipoEmpaque
  pesoKg?: number
}): Promise<Resultado<{ cotizacion: CotizacionAdmin }>> {
  const p = await cargarPedido(params.pedidoId)
  if (!p) return falla(404, 'Pedido no encontrado.')
  if (!ESTADOS_CON_GUIA.includes(p.estado)) return falla(400, `No se puede generar guía en un pedido "${p.estado}".`)
  if (p.skydropx_shipment_id || p.numero_guia) return falla(400, 'Este pedido ya tiene guía.')

  let origen: OrigenEnvio
  try { origen = await obtenerOrigen(params.origenId ?? null) } catch (e) { return falla(400, mensaje(e)) }

  const items = (p.pedido_items || []).filter((i: any) => i.producto_id).map((i: any) => ({ productoId: Number(i.producto_id), cantidad: Number(i.cantidad) }))
  const articulos = await articulosDeCarrito(items)
  const paquete = calcularPaquete(articulos, {
    ...(params.empaque ? { empaque: params.empaque } : {}),
    ...(params.pesoKg !== undefined ? { pesoKg: params.pesoKg } : {}),
  })

  const destino = { cp: p.cp, estado: p.estado_dir || '', municipio: p.ciudad || '', colonia: p.colonia || '' }
  let cot
  try {
    cot = await cotizar({ origen: origenParaCotizar(origen), destino, paquete: { largoCm: paquete.largoCm, anchoCm: paquete.anchoCm, altoCm: paquete.altoCm, pesoKg: paquete.pesoKg }, timeoutMs: 20000 })
  } catch (e) {
    return falla(502, 'No se pudo cotizar: ' + mensaje(e))
  }
  if (!cot.completa) return falla(504, 'Skydropx no terminó la cotización a tiempo. Intenta de nuevo.')

  let saldo: number | null = null
  try { saldo = (await obtenerSaldo()).saldo } catch { /* se muestra "sin dato" */ }

  const r = evaluarZonaExtendida(cot.tarifasEntregaDomicilio, paquete.pesoKg)
  const { data: fila, error } = await createServiceClient()
    .from('cotizaciones_envio')
    .insert({
      clave: `admin|${p.id}|${Date.now()}`,
      uso: 'admin',
      pedido_id: p.id,
      origen_id: origen.id,
      cp: p.cp, colonia: p.colonia || null, municipio: p.ciudad || null, estado: p.estado_dir || null,
      paquete,
      skydropx_id: cot.id,
      tarifas: cot.tarifas,
      mas_barata_total: r.masBarata?.total ?? null,
      zona_extendida: r.cobra,
      motivo: r.motivo,
      sin_cobertura: cot.tarifasEntregaDomicilio.length === 0,
      ms: cot.ms,
    })
    .select('id')
    .single()
  if (error || !fila) return falla(500, 'No se pudo guardar la cotización.')

  return {
    ok: true,
    cotizacion: {
      cotizacionId: fila.id,
      entorno: entornoSkydropx(),
      origen: { id: origen.id, alias: origen.alias, cp: origen.cp },
      paquete,
      saldo,
      tarifas: cot.tarifas,
      zona: { extendida: r.cobra, motivo: r.motivo, masBarata: r.masBarata?.total ?? null },
      // Zona extendida sin el cargo pagado (zona sin verificar en el checkout o dirección cambiada después)
      avisoZonaSinVerificar: r.cobra && Number(p.cargo_zona_extendida || 0) === 0,
    },
  }
}

// ── Datos de la guía ──
function remitente(o: OrigenEnvio) {
  return {
    nombre: o.nombre, empresa: o.empresa, calleNumero: `${o.calle} ${o.numero}`,
    telefono: o.telefono, email: o.email, referencia: o.referencia || 'Sin referencia',
  }
}

function destinatario(p: any) {
  const nombre = `${p.nombre || ''} ${p.apellido || ''}`.trim()
  const ref = String(p.referencia || '').replace(/\s+/g, ' ').trim()
  return {
    nombre, empresa: nombre,
    calleNumero: `${p.calle || ''} ${p.numero || ''}${p.interior ? ' Int. ' + p.interior : ''}`.trim(),
    telefono: p.telefono || '', email: p.email || '',
    referencia: ref.slice(0, 40),
    infoAdicional: ref.length > 40 ? ref.slice(40, 110) : undefined,
  }
}

async function soltarCandado(pedidoId: number) {
  await createServiceClient().from('pedidos').update({ guia_en_curso_desde: null }).eq('id', pedidoId)
}

// ── Crear ──
export async function crearGuia(params: { pedidoId: number; cotizacionId: number; rateId: string }): Promise<Resultado<{ pendiente: boolean; numeroGuia: string | null; correo: boolean }>> {
  const db = createServiceClient()
  const p = await cargarPedido(params.pedidoId)
  if (!p) return falla(404, 'Pedido no encontrado.')
  if (!ESTADOS_CON_GUIA.includes(p.estado)) return falla(400, `No se puede generar guía en un pedido "${p.estado}".`)
  if (p.skydropx_shipment_id || p.numero_guia) return falla(400, 'Este pedido ya tiene guía.')
  if (candadoActivo(p)) return falla(409, 'Hay un reembolso o cancelación en proceso para este pedido.')

  // La tarifa debe venir de una cotización del admin para ESTE pedido y su dirección actual
  const { data: cot } = await db
    .from('cotizaciones_envio')
    .select('id, pedido_id, origen_id, cp, colonia, municipio, estado, paquete, tarifas, vence_at')
    .eq('id', params.cotizacionId).eq('uso', 'admin').eq('pedido_id', p.id)
    .maybeSingle()
  if (!cot) return falla(400, 'Cotización no encontrada. Vuelve a cotizar.')
  if (Date.parse(cot.vence_at) < Date.now()) return falla(400, 'La cotización venció. Vuelve a cotizar.')
  if (cot.cp !== p.cp || (cot.colonia || '') !== (p.colonia || '') || (cot.municipio || '') !== (p.ciudad || '') || (cot.estado || '') !== (p.estado_dir || '')) {
    return falla(400, 'La dirección del pedido cambió después de cotizar. Vuelve a cotizar.')
  }
  const tarifa = (cot.tarifas as Tarifa[]).find(t => t.rateId === params.rateId)
  if (!tarifa) return falla(400, 'La tarifa no pertenece a esta cotización.')
  if (tarifa.soloSucursal) return falla(400, 'Esa tarifa obliga al cliente a recoger en sucursal. Elige otra.')

  let origen: OrigenEnvio
  try { origen = await obtenerOrigen(cot.origen_id) } catch (e) { return falla(400, mensaje(e)) }

  // Candado: solo una guía a la vez por pedido
  const ahora = new Date()
  const { data: tomado } = await db
    .from('pedidos')
    .update({ guia_en_curso_desde: ahora.toISOString() })
    .eq('id', p.id)
    .is('skydropx_shipment_id', null)
    .is('numero_guia', null)
    .or(`guia_en_curso_desde.is.null,guia_en_curso_desde.lt.${new Date(ahora.getTime() - CANDADO_GUIA_MS).toISOString()}`)
    .select('id')
  if (!tomado?.length) return falla(409, 'Ya se está generando una guía para este pedido. Espera un momento.')

  let saldoAntes: number
  try {
    saldoAntes = (await obtenerSaldo()).saldo
  } catch (e) {
    await soltarCandado(p.id)
    return falla(502, 'No se pudo consultar el saldo: ' + mensaje(e))
  }
  if (saldoAntes < tarifa.total) {
    await soltarCandado(p.id)
    return falla(400, `Saldo insuficiente en Skydropx: tienes $${saldoAntes.toFixed(2)} y la guía cuesta $${tarifa.total.toFixed(2)}.`)
  }

  let envio: EnvioSkydropx
  try {
    envio = await crearEnvio({
      rateId: tarifa.rateId,
      remitente: remitente(origen),
      destinatario: destinatario(p),
      claveSat: CLAVE_SAT_PRODUCTO,
      claveEmpaque: (cot.paquete as Paquete).claveEmpaqueSat,
    })
  } catch (e) {
    await soltarCandado(p.id)
    return falla(502, mensaje(e))
  }

  // Desde aquí la guía existe en Skydropx: se guarda su id de inmediato
  await db.from('pedidos').update({
    skydropx_shipment_id: envio.id,
    skydropx_rate_id: tarifa.rateId,
    guia_entorno: entornoSkydropx(),
    origen_envio_id: origen.id,
    paquete: cot.paquete,
    saldo_antes_guia: saldoAntes,
  }).eq('id', p.id)

  try {
    envio = await esperarEnvio(envio.id, ESPERA_GUIA_MS)
  } catch { /* se queda en proceso; el admin puede actualizar */ }
  return terminarGuia(p.id, envio)
}

// Guarda número, etiqueta y costo; pasa a "preparando" y manda el correo.
async function terminarGuia(pedidoId: number, envio: EnvioSkydropx): Promise<Resultado<{ pendiente: boolean; numeroGuia: string | null; correo: boolean }>> {
  const db = createServiceClient()
  if (envio.estado === 'in_progress' || envio.estado === 'pending') {
    await soltarCandado(pedidoId)
    return { ok: true, pendiente: true, numeroGuia: null, correo: false }
  }
  if (envio.estado !== 'success' || !envio.numeroGuia) {
    // Falló en Skydropx: se libera el pedido para intentar otra vez
    await db.from('pedidos').update({
      skydropx_shipment_id: null, skydropx_rate_id: null, guia_entorno: null, saldo_antes_guia: null, guia_en_curso_desde: null,
    }).eq('id', pedidoId)
    return falla(502, 'Skydropx no pudo generar la guía' + (envio.error ? ': ' + envio.error : '.'))
  }

  const p = await cargarPedido(pedidoId)
  let rutaEtiqueta: string | null = null
  if (envio.etiquetaUrl) {
    try {
      const pdf = await descargarEtiqueta(envio.etiquetaUrl)
      rutaEtiqueta = `${pedidoId}/${envio.id}.pdf`
      const { error } = await db.storage.from(BUCKET_GUIAS).upload(rutaEtiqueta, pdf, { contentType: 'application/pdf', upsert: true })
      if (error) { console.error('Guía: no se guardó la etiqueta', error); rutaEtiqueta = null }
    } catch (e) {
      console.error('Guía: no se descargó la etiqueta', e)
    }
  }

  let saldoDespues: number | null = null
  try { saldoDespues = (await obtenerSaldo()).saldo } catch { /* sin dato */ }
  const antes = p?.saldo_antes_guia != null ? Number(p.saldo_antes_guia) : null
  const cobroReal = antes != null && saldoDespues != null ? Math.round((antes - saldoDespues) * 100) / 100 : null

  const ahora = new Date().toISOString()
  const { error } = await db.from('pedidos').update({
    numero_guia: envio.numeroGuia,
    paqueteria: envio.paqueteria,
    guia_url_rastreo: envio.rastreoUrl,
    costo_guia: envio.total,
    saldo_despues_guia: saldoDespues,
    cobro_real_guia: cobroReal,
    guia_label_path: rutaEtiqueta,
    guia_creada_at: ahora,
    guia_cancelada_at: null,
    envio_estado: envio.estadoRastreo || 'created',
    envio_estado_at: ahora,
    guia_en_curso_desde: null,
  }).eq('id', pedidoId)
  if (error) {
    console.error('Guía: no se guardaron los datos', error)
    return falla(500, `La guía ${envio.numeroGuia} se creó en Skydropx pero no se guardó en el pedido. Avísale al equipo técnico.`)
  }
  // Pagado -> Preparando (si ya estaba más adelante, se deja igual)
  await db.from('pedidos').update({ estado: 'preparando' }).eq('id', pedidoId).eq('estado', 'pagado')

  const correo = await enviarCorreoGuia(pedidoId)
  return { ok: true, pendiente: false, numeroGuia: envio.numeroGuia, correo: correo.ok }
}

// ── Actualizar una guía que quedó en proceso ──
export async function actualizarGuia(pedidoId: number): Promise<Resultado<{ pendiente: boolean; numeroGuia: string | null; correo: boolean }>> {
  const p = await cargarPedido(pedidoId)
  if (!p) return falla(404, 'Pedido no encontrado.')
  if (!p.skydropx_shipment_id) return falla(400, 'Este pedido no tiene una guía de Skydropx.')
  if (p.numero_guia) return { ok: true, pendiente: false, numeroGuia: p.numero_guia, correo: false }
  if (p.guia_entorno && p.guia_entorno !== entornoSkydropx()) return falla(400, `Esta guía es de ${p.guia_entorno}; este servidor está en ${entornoSkydropx()}.`)
  try {
    return terminarGuia(pedidoId, await consultarEnvio(p.skydropx_shipment_id))
  } catch (e) {
    return falla(502, mensaje(e))
  }
}

// ── Cancelar ──
export async function cancelarGuia(pedidoId: number, motivoBruto: unknown, adminEmail: string): Promise<Resultado<object>> {
  const db = createServiceClient()
  const motivo = typeof motivoBruto === 'string' ? motivoBruto.trim().slice(0, 300) : ''
  if (motivo.length < 3) return falla(400, 'Escribe el motivo de la cancelación de la guía.')
  const p = await cargarPedido(pedidoId)
  if (!p) return falla(404, 'Pedido no encontrado.')
  if (!p.skydropx_shipment_id) return falla(400, 'Este pedido no tiene una guía de Skydropx.')
  if (['enviado', 'entregado'].includes(p.estado) || !RASTREO_SIN_RECOLECTAR.includes(p.envio_estado ?? null)) {
    return falla(400, 'La paquetería ya recibió el paquete; la guía no se puede cancelar.')
  }
  if (p.guia_entorno && p.guia_entorno !== entornoSkydropx()) return falla(400, `Esta guía es de ${p.guia_entorno}; este servidor está en ${entornoSkydropx()}.`)

  let r
  try {
    r = await cancelarEnvio(p.skydropx_shipment_id, motivo)
  } catch (e) {
    return falla(502, mensaje(e))
  }
  if (!r.aprobada) return falla(502, `Skydropx recibió la cancelación pero quedó "${r.estado || 'sin estado'}". Revísala en el panel de Skydropx.`)

  const ahora = new Date().toISOString()
  const anterior = {
    shipmentId: p.skydropx_shipment_id, numeroGuia: p.numero_guia, paqueteria: p.paqueteria,
    costo: p.costo_guia, cobroReal: p.cobro_real_guia, entorno: p.guia_entorno, etiqueta: p.guia_label_path,
    creada: p.guia_creada_at, cancelada: ahora, por: adminEmail, motivo,
  }
  const { error } = await db.from('pedidos').update({
    guias_anteriores: [...(Array.isArray(p.guias_anteriores) ? p.guias_anteriores : []), anterior],
    skydropx_shipment_id: null, skydropx_rate_id: null, numero_guia: null, paqueteria: null,
    guia_url_rastreo: null, costo_guia: null, cobro_real_guia: null, saldo_antes_guia: null, saldo_despues_guia: null,
    guia_label_path: null, guia_creada_at: null, guia_entorno: null, guia_en_curso_desde: null,
    envio_estado: null, envio_estado_at: null, guia_cancelada_at: ahora,
    guia_impresa_at: null, guia_impresa_por: null,
  }).eq('id', p.id)
  if (error) return falla(500, 'La guía se canceló en Skydropx pero no se actualizó el pedido. Avísale al equipo técnico.')
  await db.from('pedidos').update({ estado: 'pagado' }).eq('id', p.id).eq('estado', 'preparando')
  await db.from('envio_eventos').insert({
    pedido_id: p.id, numero_guia: anterior.numeroGuia, estado: 'guia_cancelada', descripcion: motivo,
    ocurrido_at: ahora, fuente: 'manual', huella: 'cancelada:' + anterior.shipmentId,
  })
  return { ok: true }
}

// ── Etiqueta guardada ──
export async function leerEtiqueta(ruta: string): Promise<Buffer | null> {
  const { data, error } = await createServiceClient().storage.from(BUCKET_GUIAS).download(ruta)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}
