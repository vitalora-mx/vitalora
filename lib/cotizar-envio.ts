// ============================================================
// Revisión de zona extendida para el checkout (SOLO SERVIDOR).
// Calcula el paquete, cotiza en Skydropx desde el origen predeterminado
// (caché de 24 h en cotizaciones_envio) y aplica lib/zona-extendida.ts.
// Lo usan /api/envio/cotizar (para mostrarlo) y lib/envio.ts (para cobrarlo),
// así el total que ve el cliente y el que cobra el servidor salen de la misma cotización.
// ============================================================
import { after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cotizar, entornoSkydropx, ErrorSkydropx, type Tarifa } from '@/lib/skydropx'
import { calcularPaquete, type ArticuloPaquete, type Paquete } from '@/lib/paquete'
import { evaluarZonaExtendida, ALERTA_PROPORCION_POR_PRECIO, UMBRAL_PRECIO_ZONA } from '@/lib/zona-extendida'
import { obtenerOrigen, origenParaCotizar } from '@/lib/envio-origenes'

const ADMIN_EMAIL = 'gabomaciel7@gmail.com'
const ALERTA_MINIMO_COTIZACIONES = 10

export type EstadoZona = 'ok' | 'sin_cobertura' | 'cp_invalido' | 'sin_verificar'

export interface DestinoEnvio { cp: string; colonia: string; ciudad: string; estado: string }

// Lo que se guarda en pedidos.envio_cotizacion
export interface CopiaCotizacion {
  cotizacionId: number | null
  skydropxId: string | null
  fecha: string
  origenId: number
  paquete: Paquete
  masBarata: { paqueteria: string; servicio: string; total: number; zonaExtendida: boolean } | null
  motivo: 'recargo' | 'precio' | null
  paqueteriasSinRecargo: string[]
}

export interface ResultadoZonaEnvio {
  estado: EstadoZona
  cargo: number
  zonaExtendida: boolean
  verificada: boolean
  origenId: number | null
  copia: CopiaCotizacion | null
}

const SIN_VERIFICAR: ResultadoZonaEnvio = { estado: 'sin_verificar', cargo: 0, zonaExtendida: false, verificada: false, origenId: null, copia: null }

function normalizar(txt: string): string {
  return (txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

// Productos del carrito -> artículos con peso y medidas (de la base, nunca del navegador)
export async function articulosDeCarrito(items: { productoId: number; cantidad: number }[]): Promise<ArticuloPaquete[]> {
  const ids = [...new Set(items.map(i => i.productoId))]
  if (ids.length === 0) return []
  const { data, error } = await createServiceClient()
    .from('productos')
    .select('id, nombre, categoria, peso_g, alto_cm, ancho_cm, largo_cm')
    .in('id', ids)
  if (error) throw new Error('No se pudieron leer los productos: ' + error.message)
  const porId = new Map((data || []).map((p: any) => [Number(p.id), p]))
  return items.map(i => articuloDeProducto(porId.get(i.productoId), i.cantidad))
}

export function articuloDeProducto(p: any, cantidad: number): ArticuloPaquete {
  return {
    nombre: p?.nombre || 'Producto',
    cantidad,
    pesoG: p?.peso_g != null ? Number(p.peso_g) : null,
    altoCm: p?.alto_cm != null ? Number(p.alto_cm) : null,
    anchoCm: p?.ancho_cm != null ? Number(p.ancho_cm) : null,
    largoCm: p?.largo_cm != null ? Number(p.largo_cm) : null,
    siempreCaja: p?.categoria === 'Kits',
  }
}

function resultadoDeFila(fila: any, origenId: number, paquete: Paquete): ResultadoZonaEnvio {
  if (fila.sin_cobertura) return { estado: 'sin_cobertura', cargo: 0, zonaExtendida: false, verificada: true, origenId, copia: null }
  const tarifas: Tarifa[] = Array.isArray(fila.tarifas) ? fila.tarifas : []
  const domicilio = tarifas.filter(t => !t.soloSucursal)
  const r = evaluarZonaExtendida(domicilio, paquete.pesoKg)
  const copia: CopiaCotizacion = {
    cotizacionId: fila.id ?? null,
    skydropxId: fila.skydropx_id ?? null,
    fecha: fila.created_at ?? new Date().toISOString(),
    origenId,
    paquete,
    masBarata: r.masBarata ? { paqueteria: r.masBarata.paqueteria, servicio: r.masBarata.servicio, total: r.masBarata.total, zonaExtendida: r.masBarata.zonaExtendida } : null,
    motivo: r.motivo,
    paqueteriasSinRecargo: [...new Set(domicilio.filter(t => !t.zonaExtendida).map(t => t.paqueteria))],
  }
  return { estado: 'ok', cargo: r.cargo, zonaExtendida: r.cobra, verificada: true, origenId, copia }
}

export async function revisarZonaEnvio(params: {
  destino: DestinoEnvio
  articulos: ArticuloPaquete[]
  timeoutMs: number
}): Promise<ResultadoZonaEnvio> {
  const { destino, articulos, timeoutMs } = params
  const db = createServiceClient()
  let origen
  try {
    origen = await obtenerOrigen()
  } catch (e) {
    console.error('Envío: sin origen predeterminado', e)
    return SIN_VERIFICAR
  }
  const paquete = calcularPaquete(articulos)
  // Las cotizaciones de sandbox llevan otra clave: nunca se mezclan con las de producción
  const clave = [
    ...(entornoSkydropx() === 'sandbox' ? ['sandbox'] : []),
    origen.id, destino.cp, normalizar(destino.colonia), normalizar(destino.ciudad), normalizar(destino.estado),
    paquete.empaque, `${paquete.largoCm}x${paquete.anchoCm}x${paquete.altoCm}`, paquete.pesoKg,
  ].join('|')

  // ── Caché ──
  const { data: guardada } = await db
    .from('cotizaciones_envio')
    .select('id, skydropx_id, tarifas, sin_cobertura, created_at')
    .eq('clave', clave)
    .eq('uso', 'checkout')
    .gt('vence_at', new Date().toISOString())
    .order('vence_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (guardada) return resultadoDeFila(guardada, origen.id, paquete)

  // ── Cotizar ──
  let cot
  try {
    cot = await cotizar({
      origen: origenParaCotizar(origen),
      destino: { cp: destino.cp, estado: destino.estado, municipio: destino.ciudad, colonia: destino.colonia },
      paquete: { largoCm: paquete.largoCm, anchoCm: paquete.anchoCm, altoCm: paquete.altoCm, pesoKg: paquete.pesoKg },
      timeoutMs,
    })
  } catch (e) {
    if (e instanceof ErrorSkydropx && e.tipo === 'direccion') {
      return { ...SIN_VERIFICAR, estado: 'cp_invalido', verificada: true, origenId: origen.id }
    }
    console.error('Envío: Skydropx no respondió', e instanceof ErrorSkydropx ? `${e.tipo} ${e.status ?? ''} ${e.message}` : e)
    return { ...SIN_VERIFICAR, origenId: origen.id }
  }
  // Incompleta: no se sabe cuál es la más barata
  if (!cot.completa) {
    console.error(`Envío: cotización incompleta tras ${cot.ms} ms`)
    return { ...SIN_VERIFICAR, origenId: origen.id }
  }

  // Sin tarifas con entrega a domicilio = sin cobertura
  const sinCobertura = cot.tarifasEntregaDomicilio.length === 0
  const r = evaluarZonaExtendida(cot.tarifasEntregaDomicilio, paquete.pesoKg)
  const { data: fila, error } = await db
    .from('cotizaciones_envio')
    .insert({
      clave,
      origen_id: origen.id,
      cp: destino.cp,
      colonia: destino.colonia || null,
      municipio: destino.ciudad || null,
      estado: destino.estado || null,
      paquete,
      skydropx_id: cot.id,
      tarifas: cot.tarifas,
      mas_barata_total: r.masBarata?.total ?? null,
      zona_extendida: r.cobra,
      motivo: r.motivo,
      sin_cobertura: sinCobertura,
      ms: cot.ms,
    })
    .select('id, skydropx_id, tarifas, sin_cobertura, created_at')
    .single()
  if (error) console.error('Envío: no se guardó la cotización', error)

  // Después de responder, para no hacer esperar al cliente. Fuera de una petición
  // (scripts, pruebas) after() no existe: entonces se revisa en ese momento.
  const alerta = () => revisarAlertaUmbral().catch(e => console.error('Envío: alerta de umbral falló', e))
  try { after(alerta) } catch { await alerta() }

  return resultadoDeFila(fila ?? {
    id: null, skydropx_id: cot.id, tarifas: cot.tarifas, sin_cobertura: sinCobertura, created_at: new Date().toISOString(),
  }, origen.id, paquete)
}

// ── Alerta diaria: más de la mitad de las cotizaciones del día cobran solo por precio ──
function inicioDelDiaMexico(): { iso: string; fecha: string } {
  const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date())
  // México centro no tiene horario de verano desde 2022: UTC-6
  return { iso: new Date(fecha + 'T00:00:00-06:00').toISOString(), fecha }
}

async function revisarAlertaUmbral() {
  const db = createServiceClient()
  const { iso, fecha } = inicioDelDiaMexico()
  const base = () => db.from('cotizaciones_envio').select('id', { count: 'exact', head: true }).gte('created_at', iso).eq('sin_cobertura', false).eq('uso', 'checkout')
  const [{ count: total }, { count: porPrecio }] = await Promise.all([base(), base().eq('motivo', 'precio')])
  if (!total || total < ALERTA_MINIMO_COTIZACIONES || (porPrecio || 0) / total <= ALERTA_PROPORCION_POR_PRECIO) return

  // Una sola vez por día
  const { error } = await db.from('alertas_enviadas').insert({ clave: 'umbral-zona-' + fecha })
  if (error) return // ya se mandó hoy (o la tabla falló: mejor no insistir)

  const { Resend } = await import('resend')
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'Vitalora <hola@vitalora.com.mx>',
    to: ADMIN_EMAIL,
    subject: `⚠️ Zona extendida: ${porPrecio} de ${total} cotizaciones de hoy pasan de $${UMBRAL_PRECIO_ZONA}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;max-width:560px;">
      <h2 style="font-size:18px;">Revisa el umbral de zona extendida</h2>
      <p>Hoy (${fecha}) <strong>${porPrecio} de ${total}</strong> cotizaciones cobraron el cargo de zona extendida solo porque la tarifa más barata pasó de <strong>$${UMBRAL_PRECIO_ZONA} con IVA</strong>, sin recargo de la paquetería.</p>
      <p>Puede ser que Skydropx subió sus precios normales. Si es así, hay que ajustar <code>UMBRAL_PRECIO_ZONA</code> en <code>lib/zona-extendida.ts</code>.</p>
      <p style="color:#888;font-size:12px;">Este aviso se manda una vez al día como máximo.</p>
    </div>`,
  })
}
