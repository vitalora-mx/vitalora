// ============================================================
// Cliente de la API de Skydropx (SOLO SERVIDOR).
// - Token OAuth (client_credentials) guardado en memoria hasta 5 min antes de vencer.
// - Solo Paquetexpress, Estafeta, DHL y FedEx.
// - NUNCA seguro ni extras opcionales: cada paquete va con package_protected: false
//   y sin declared_value, y se rechaza cualquier respuesta que venga protegida.
//   Nunca se agenda recolección (los paquetes se llevan a sucursal).
// - Respeta el límite de Skydropx (2 solicitudes por segundo, 429 con Retry-After).
// Sin imports a propósito: se puede probar con node directamente.
// ============================================================

// Clave de Skydropx -> nombre que usa la tienda (lib/estados-pedido.ts PAQUETERIAS)
export const PAQUETERIAS_SKYDROPX: Record<string, string> = {
  paquetexpress: 'Paquetexpress',
  estafeta: 'Estafeta',
  dhl: 'DHL',
  fedex: 'FedEx',
}

const URL_PRODUCCION = 'https://api-pro.skydropx.com'
const URL_SANDBOX = 'https://sb-pro.skydropx.com'
const PAUSA_CONSULTA_MS = 700

export type TipoErrorSkydropx = 'config' | 'auth' | 'timeout' | 'limite' | 'direccion' | 'protegido' | 'http' | 'red'

export class ErrorSkydropx extends Error {
  tipo: TipoErrorSkydropx
  status: number | null
  detalle: unknown
  constructor(tipo: TipoErrorSkydropx, mensaje: string, status: number | null = null, detalle: unknown = null) {
    super(mensaje)
    this.name = 'ErrorSkydropx'
    this.tipo = tipo
    this.status = status
    this.detalle = detalle
  }
}

export function entornoSkydropx(): 'produccion' | 'sandbox' {
  return (process.env.SKYDROPX_ENV || '').trim() === 'sandbox' ? 'sandbox' : 'produccion'
}

function urlBase(): string {
  return entornoSkydropx() === 'sandbox' ? URL_SANDBOX : URL_PRODUCCION
}

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Token ──
let tokenGuardado: { valor: string; venceEn: number; base: string } | null = null
let tokenEnCurso: Promise<string> | null = null

// Lee una variable sin espacios ni saltos de línea al inicio o al final (por si se pegó con ellos)
function variable(nombre: string): string {
  return (process.env[nombre] || '').trim()
}

// Sandbox usa sus propias llaves (SKYDROPX_SANDBOX_*); nunca las de producción.
function nombresLlaves(): { id: string; secreto: string } {
  return entornoSkydropx() === 'sandbox'
    ? { id: 'SKYDROPX_SANDBOX_CLIENT_ID', secreto: 'SKYDROPX_SANDBOX_CLIENT_SECRET' }
    : { id: 'SKYDROPX_CLIENT_ID', secreto: 'SKYDROPX_CLIENT_SECRET' }
}

async function pedirToken(limite: number): Promise<string> {
  const llaves = nombresLlaves()
  const id = variable(llaves.id)
  const secreto = variable(llaves.secreto)
  if (!id || !secreto) throw new ErrorSkydropx('config', 'Faltan las credenciales de Skydropx.')
  const base = urlBase()
  const res = await llamar('POST', base + '/api/v1/oauth/token', {
    grant_type: 'client_credentials', client_id: id, client_secret: secreto,
  }, null, limite)
  const token = res.json?.access_token
  if (res.status !== 200 || typeof token !== 'string') {
    // No se incluye la respuesta: podría traer datos de la credencial
    throw new ErrorSkydropx('auth', 'Skydropx rechazó las credenciales.', res.status)
  }
  const segundos = Number(res.json?.expires_in) || 7200
  tokenGuardado = { valor: token, venceEn: Date.now() + (segundos - 300) * 1000, base }
  return token
}

async function obtenerToken(limite: number): Promise<string> {
  if (tokenGuardado && tokenGuardado.venceEn > Date.now() && tokenGuardado.base === urlBase()) return tokenGuardado.valor
  if (!tokenEnCurso) tokenEnCurso = pedirToken(limite).finally(() => { tokenEnCurso = null })
  return tokenEnCurso
}

// ── HTTP de bajo nivel ──
async function llamar(metodo: 'GET' | 'POST', url: string, body: unknown, token: string | null, limite: number): Promise<{ status: number; json: any; headers: Headers }> {
  const restante = limite - Date.now()
  if (restante <= 0) throw new ErrorSkydropx('timeout', 'Skydropx tardó demasiado en responder.')
  const control = new AbortController()
  const reloj = setTimeout(() => control.abort(), restante)
  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: control.signal,
      cache: 'no-store',
    })
    const texto = await res.text()
    let json: any = null
    try { json = texto ? JSON.parse(texto) : null } catch { json = { _texto: texto.slice(0, 500) } }
    return { status: res.status, json, headers: res.headers }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new ErrorSkydropx('timeout', 'Skydropx tardó demasiado en responder.')
    throw new ErrorSkydropx('red', 'No se pudo conectar con Skydropx.', null, String(e?.message || e))
  } finally {
    clearTimeout(reloj)
  }
}

// Llamada autenticada: renueva el token una vez si da 401 y espera una vez si da 429.
async function api(metodo: 'GET' | 'POST', ruta: string, body: unknown, limite: number): Promise<{ status: number; json: any }> {
  let renovado = false
  let esperado = false
  for (;;) {
    const token = await obtenerToken(limite)
    const res = await llamar(metodo, urlBase() + ruta, body, token, limite)
    if (res.status === 401 && !renovado) {
      renovado = true
      tokenGuardado = null
      continue
    }
    if (res.status === 429) {
      const segundos = Number(res.headers.get('Retry-After')) || 1
      if (!esperado && Date.now() + segundos * 1000 < limite) {
        esperado = true
        await esperar(segundos * 1000)
        continue
      }
      throw new ErrorSkydropx('limite', 'Skydropx está recibiendo demasiadas solicitudes.', 429)
    }
    return res
  }
}

// ── Tipos públicos ──
export interface DireccionCotizacion {
  cp: string
  estado: string     // area_level1
  municipio: string  // area_level2 (en el checkout: "ciudad")
  colonia: string    // area_level3
}

export interface PaqueteCotizacion {
  largoCm: number
  anchoCm: number
  altoCm: number
  pesoKg: number
}

export interface Tarifa {
  rateId: string
  clave: string           // paquetexpress | estafeta | dhl | fedex
  paqueteria: string      // nombre para mostrar (PAQUETERIAS)
  servicio: string
  servicioCodigo: string
  total: number           // precio normal con IVA, sin protección
  dias: number | null
  zonaExtendida: boolean  // trae un extra_fees extended_area_fee*
  recargoZona: number
  extras: { codigo: string; monto: number }[]
  pesoCobradoKg: number | null
  soloSucursal: boolean   // el cliente tendría que recoger en sucursal (office_delivery_only)
  cupon: unknown          // campo "coupon" de la tarifa (no documentado; hasta hoy siempre null)
}

export interface Cotizacion {
  id: string | null
  completa: boolean
  tarifas: Tarifa[]            // todas las válidas de las 4 paqueterías, de la más barata a la más cara
  tarifasEntregaDomicilio: Tarifa[] // sin las de "solo sucursal": las que cuentan para la regla del checkout
  sinCobertura: boolean        // terminó y ninguna paquetería dio precio
  ms: number
}

// ── Normalización ──
function numero(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function normalizarTarifa(x: any): Tarifa | null {
  const clave = String(x?.provider_name || '').toLowerCase()
  if (!PAQUETERIAS_SKYDROPX[clave]) return null
  if (x?.success === false) return null
  const total = numero(x?.total)
  if (!Number.isFinite(total) || total <= 0) return null
  if (x?.shipment_creation_type && x.shipment_creation_type !== 'single') return null

  const extras = (Array.isArray(x?.extra_fees) ? x.extra_fees : [])
    .map((f: any) => ({ codigo: String(f?.code || ''), monto: numero(f?.value) }))
    .filter((f: { codigo: string; monto: number }) => f.codigo)
  const recargos = extras.filter((f: { codigo: string }) => f.codigo.startsWith('extended_area_fee'))

  const dias = numero(x?.days)
  const peso = numero(x?.weight)
  return {
    rateId: String(x.id),
    clave,
    paqueteria: PAQUETERIAS_SKYDROPX[clave],
    servicio: String(x?.provider_service_name || ''),
    servicioCodigo: String(x?.provider_service_code || ''),
    total: Math.round(total * 100) / 100,
    dias: Number.isFinite(dias) ? dias : null,
    zonaExtendida: recargos.length > 0,
    recargoZona: Math.round(recargos.reduce((s: number, f: { monto: number }) => s + (Number.isFinite(f.monto) ? f.monto : 0), 0) * 100) / 100,
    extras,
    pesoCobradoKg: Number.isFinite(peso) ? peso : null,
    soloSucursal: x?.office_delivery_only === true,
    cupon: x?.coupon ?? null,
  }
}

// Ningún paquete puede volver con protección (seguro). Si Skydropx la aplicó, se rechaza.
function revisarSinProteccion(json: any) {
  const paquetes = Array.isArray(json?.packages) ? json.packages : []
  if (paquetes.some((p: any) => p?.package_protected === true)) {
    throw new ErrorSkydropx('protegido', 'Skydropx devolvió el paquete con protección (seguro) aunque se pidió sin ella.', null, paquetes)
  }
}

function errorDireccion(json: any): string | null {
  const errores = json?.errors
  if (!errores || typeof errores !== 'object') return null
  const destino = errores.address_to
  if (destino && typeof destino === 'object') {
    const campos = Object.keys(destino)
    return campos.length ? campos.join(', ') : 'address_to'
  }
  return null
}

// ── Cotizar ──
// Gratis: no crea guía. Espera hasta timeoutMs a que la cotización termine.
export async function cotizar(params: {
  origen: DireccionCotizacion
  destino: DireccionCotizacion
  paquete: PaqueteCotizacion
  timeoutMs?: number
}): Promise<Cotizacion> {
  const inicio = Date.now()
  const limite = inicio + (params.timeoutMs ?? 8000)
  const dir = (d: DireccionCotizacion) => ({
    country_code: 'mx', postal_code: d.cp, area_level1: d.estado, area_level2: d.municipio, area_level3: d.colonia,
  })
  const p = params.paquete
  const body = {
    quotation: {
      address_from: dir(params.origen),
      address_to: dir(params.destino),
      parcels: [{
        length: Math.ceil(p.largoCm), width: Math.ceil(p.anchoCm), height: Math.ceil(p.altoCm),
        weight: Math.ceil(p.pesoKg * 100) / 100,
        package_protected: false,
      }],
      requested_carriers: Object.keys(PAQUETERIAS_SKYDROPX),
    },
  }

  const creada = await api('POST', '/api/v1/quotations', body, limite)
  if (creada.status === 422 || creada.status === 400) {
    const campo = errorDireccion(creada.json)
    if (campo) throw new ErrorSkydropx('direccion', 'La dirección de destino no es válida (' + campo + ').', creada.status, creada.json?.errors)
    throw new ErrorSkydropx('http', 'Skydropx rechazó la cotización.', creada.status, creada.json)
  }
  if (creada.status >= 300 || !creada.json?.id) {
    throw new ErrorSkydropx('http', 'Skydropx no aceptó la cotización.', creada.status, creada.json)
  }

  let json = creada.json
  while (!json?.is_completed) {
    if (Date.now() + PAUSA_CONSULTA_MS >= limite) break
    await esperar(PAUSA_CONSULTA_MS)
    const r = await api('GET', '/api/v1/quotations/' + encodeURIComponent(String(creada.json.id)), null, limite)
    if (r.status >= 300) throw new ErrorSkydropx('http', 'No se pudo consultar la cotización.', r.status, r.json)
    json = r.json
  }

  revisarSinProteccion(json)
  const tarifas = (Array.isArray(json?.rates) ? json.rates : [])
    .map(normalizarTarifa)
    .filter((t: Tarifa | null): t is Tarifa => t !== null)
    .sort((a: Tarifa, b: Tarifa) => a.total - b.total)
  const completa = json?.is_completed === true
  return {
    id: json?.id ? String(json.id) : null,
    completa,
    tarifas,
    tarifasEntregaDomicilio: tarifas.filter((t: Tarifa) => !t.soloSucursal),
    sinCobertura: completa && tarifas.length === 0,
    ms: Date.now() - inicio,
  }
}

// ── Saldo ──
export async function obtenerSaldo(timeoutMs = 8000): Promise<{ saldo: number; moneda: string }> {
  const r = await api('GET', '/api/v1/finance/credits', null, Date.now() + timeoutMs)
  const saldo = numero(r.json?.data?.balance)
  if (r.status !== 200 || !Number.isFinite(saldo)) throw new ErrorSkydropx('http', 'No se pudo consultar el saldo de Skydropx.', r.status)
  return { saldo, moneda: String(r.json?.data?.currency || 'MXN') }
}

// ── Diagnóstico (ruta de admin) ──
// Pide un token nuevo y el saldo. Nunca devuelve las llaves ni el token:
// solo si existen, cuánto miden y si Skydropx las aceptó.
export interface DiagnosticoSkydropx {
  entorno: 'produccion' | 'sandbox'
  host: string
  credenciales: {
    clientId: { presente: boolean; largo: number; teniaEspacios: boolean }
    clientSecret: { presente: boolean; largo: number; teniaEspacios: boolean }
  }
  token: { ok: boolean; ms: number; error?: { tipo: TipoErrorSkydropx | 'desconocido'; status: number | null; mensaje: string } }
  saldo: { ok: boolean; saldo?: number; moneda?: string; error?: string }
}

function revisarVariable(nombre: string) {
  const cruda = process.env[nombre] || ''
  const limpia = cruda.trim()
  return { presente: limpia.length > 0, largo: limpia.length, teniaEspacios: cruda !== limpia }
}

export async function diagnosticarSkydropx(): Promise<DiagnosticoSkydropx> {
  const resultado: DiagnosticoSkydropx = {
    entorno: entornoSkydropx(),
    host: new URL(urlBase()).host,
    credenciales: { clientId: revisarVariable(nombresLlaves().id), clientSecret: revisarVariable(nombresLlaves().secreto) },
    token: { ok: false, ms: 0 },
    saldo: { ok: false },
  }
  const inicio = Date.now()
  try {
    tokenGuardado = null // fuerza un token nuevo: así se prueban las llaves de verdad
    await obtenerToken(Date.now() + 8000)
    resultado.token = { ok: true, ms: Date.now() - inicio }
  } catch (e) {
    const err = e instanceof ErrorSkydropx ? e : null
    resultado.token = {
      ok: false, ms: Date.now() - inicio,
      error: { tipo: err?.tipo ?? 'desconocido', status: err?.status ?? null, mensaje: err?.message ?? 'Error desconocido' },
    }
    return resultado
  }
  try {
    const s = await obtenerSaldo()
    resultado.saldo = { ok: true, saldo: s.saldo, moneda: s.moneda }
  } catch (e) {
    resultado.saldo = { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
  return resultado
}

// ── Envíos (guías) ──
// Datos de una dirección para la guía. El C.P., la colonia, el municipio y el estado
// no van aquí: Skydropx los toma de la cotización de la tarifa elegida.
export interface DireccionGuia {
  nombre: string      // máx. 30
  empresa: string     // máx. 60
  calleNumero: string // street1
  telefono: string
  email: string
  referencia: string  // remitente: máx. 30 (obligatoria) · destinatario: máx. 40
  infoAdicional?: string // máx. 70
}

export interface EnvioSkydropx {
  id: string
  estado: string                // workflow_status: in_progress | success | failed ...
  paqueteria: string | null     // nombre para mostrar (PAQUETERIAS)
  servicio: string | null
  numeroGuia: string | null
  total: number | null          // lo que Skydropx dice que cuesta la guía
  etiquetaUrl: string | null
  rastreoUrl: string | null
  estadoRastreo: string | null  // tracking_status del paquete
  error: string | null
}

const corta = (s: string, max: number) => (s || '').replace(/\s+/g, ' ').trim().slice(0, max)
const soloDigitos = (s: string) => (s || '').replace(/\D/g, '').slice(-10)

function normalizarEnvio(json: any): EnvioSkydropx {
  const d = json?.data || {}
  const a = d.attributes || {}
  const paquete = (Array.isArray(json?.included) ? json.included : []).find((x: any) => x?.type === 'package')?.attributes || {}
  const clave = String(a.carrier_name || '').toLowerCase()
  const total = numero(a.total)
  const err = a.error_detail
  return {
    id: String(d.id || a.id || ''),
    estado: String(a.workflow_status || ''),
    paqueteria: PAQUETERIAS_SKYDROPX[clave] ?? (a.carrier_name ? String(a.carrier_name) : null),
    servicio: a.service_name ? String(a.service_name) : null,
    numeroGuia: String(a.master_tracking_number || paquete.tracking_number || '') || null,
    total: Number.isFinite(total) ? total : null,
    etiquetaUrl: paquete.label_url ? String(paquete.label_url) : null,
    rastreoUrl: paquete.tracking_url_provider ? String(paquete.tracking_url_provider) : null,
    estadoRastreo: paquete.tracking_status ? String(paquete.tracking_status) : null,
    error: err ? String(err.error_message || err.error_code || JSON.stringify(err)).slice(0, 300) : null,
  }
}

// Crea la guía. SIEMPRE sin protección (seguro), sin valor declarado, sin recolección
// y sin opciones de sucursal. Devuelve en cuanto Skydropx la acepta (suele quedar "in_progress").
export async function crearEnvio(params: {
  rateId: string
  remitente: DireccionGuia
  destinatario: DireccionGuia
  claveSat: string
  claveEmpaque: string
  timeoutMs?: number
}): Promise<EnvioSkydropx> {
  const limite = Date.now() + (params.timeoutMs ?? 20000)
  const dir = (x: DireccionGuia, maxRef: number) => ({
    street1: corta(x.calleNumero, 100),
    name: corta(x.nombre, 30),
    company: corta(x.empresa, 60),
    phone: soloDigitos(x.telefono),
    email: corta(x.email, 100),
    reference: corta(x.referencia, maxRef) || 'Sin referencia',
    ...(x.infoAdicional ? { further_information: corta(x.infoAdicional, 70) } : {}),
  })
  const body = {
    shipment: {
      rate_id: params.rateId,
      unique_shipment: true,      // reintento con la misma tarifa = misma guía, nunca dos
      printing_format: 'standard', // hoja carta
      address_from: dir(params.remitente, 30),
      address_to: dir(params.destinatario, 40),
      packages: [{
        package_number: '1',
        package_protected: false,
        consignment_note: params.claveSat,
        package_type: params.claveEmpaque,
      }],
    },
  }
  const r = await api('POST', '/api/v1/shipments/', body, limite)
  if (r.status === 422) {
    const msg = JSON.stringify(r.json || {})
    if (/fondos|insufficient|DEBT_LIMIT/i.test(msg)) throw new ErrorSkydropx('http', 'Saldo insuficiente en Skydropx.', 422, r.json)
    throw new ErrorSkydropx('http', 'Skydropx rechazó la guía: ' + msg.slice(0, 300), 422, r.json)
  }
  if (r.status === 409) throw new ErrorSkydropx('http', 'Skydropx todavía está procesando una guía con esta tarifa. Espera y actualiza.', 409, r.json)
  if (r.status >= 300 || !r.json?.data?.id) throw new ErrorSkydropx('http', 'Skydropx no aceptó la guía.', r.status, r.json)
  const envio = normalizarEnvio(r.json)
  revisarEnvioSinProteccion(r.json)
  return envio
}

// Los paquetes de la guía nunca deben venir protegidos
function revisarEnvioSinProteccion(json: any) {
  const paquetes = (Array.isArray(json?.included) ? json.included : []).filter((x: any) => x?.type === 'package')
  if (paquetes.some((p: any) => p?.attributes?.package_protected === true)) {
    throw new ErrorSkydropx('protegido', 'Skydropx creó la guía con protección (seguro).', null, paquetes)
  }
}

export async function consultarEnvio(id: string, timeoutMs = 8000): Promise<EnvioSkydropx> {
  const r = await api('GET', '/api/v1/shipments/' + encodeURIComponent(id), null, Date.now() + timeoutMs)
  if (r.status >= 300) throw new ErrorSkydropx('http', 'No se pudo consultar la guía.', r.status, r.json)
  return normalizarEnvio(r.json)
}

// Consulta hasta que la guía deje de estar en proceso o se acabe el tiempo
export async function esperarEnvio(id: string, esperaMs: number): Promise<EnvioSkydropx> {
  const limite = Date.now() + esperaMs
  let envio = await consultarEnvio(id)
  while ((envio.estado === 'in_progress' || envio.estado === 'pending') && Date.now() + 2000 < limite) {
    await esperar(1500)
    envio = await consultarEnvio(id)
  }
  return envio
}

export async function cancelarEnvio(id: string, motivo: string): Promise<{ aprobada: boolean; estado: string }> {
  const r = await api('POST', `/api/v1/shipments/${encodeURIComponent(id)}/cancellations`, { reason: corta(motivo, 200) || 'Cancelada desde el admin', shipment_id: id }, Date.now() + 15000)
  if (r.status === 422) throw new ErrorSkydropx('http', 'Skydropx dice que esta guía ya no se puede cancelar.', 422, r.json)
  if (r.status >= 300) throw new ErrorSkydropx('http', 'No se pudo cancelar la guía.', r.status, r.json)
  return { aprobada: r.json?.success === true || r.json?.status === 'approved', estado: String(r.json?.status || '') }
}

// Descarga el PDF de la etiqueta (el enlace de Skydropx no requiere token)
export async function descargarEtiqueta(url: string, timeoutMs = 15000): Promise<Buffer> {
  const u = new URL(url)
  // El enlace viene de la respuesta de Skydropx (nunca del navegador); solo se exige https
  if (u.protocol !== 'https:') throw new ErrorSkydropx('http', 'Enlace de etiqueta no reconocido.')
  const control = new AbortController()
  const reloj = setTimeout(() => control.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: control.signal, cache: 'no-store' })
    const buf = Buffer.from(await res.arrayBuffer())
    if (res.status !== 200 || buf.subarray(0, 5).toString() !== '%PDF-') throw new ErrorSkydropx('http', 'La etiqueta no es un PDF válido.', res.status)
    return buf
  } finally {
    clearTimeout(reloj)
  }
}
