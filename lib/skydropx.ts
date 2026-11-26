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
  return process.env.SKYDROPX_ENV === 'sandbox' ? 'sandbox' : 'produccion'
}

function urlBase(): string {
  return entornoSkydropx() === 'sandbox' ? URL_SANDBOX : URL_PRODUCCION
}

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Token ──
let tokenGuardado: { valor: string; venceEn: number; base: string } | null = null
let tokenEnCurso: Promise<string> | null = null

async function pedirToken(limite: number): Promise<string> {
  const id = process.env.SKYDROPX_CLIENT_ID
  const secreto = process.env.SKYDROPX_CLIENT_SECRET
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
