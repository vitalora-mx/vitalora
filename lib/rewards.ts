// ============================================================
// Vitalora Rewards — base (Parte 1). SOLO SERVIDOR.
// Tablas: rewards_miembros, rewards_movimientos (libro que no se borra),
// vista rewards_saldos y funciones rewards_canjear / rewards_devolver_canje.
// Todo pasa por la service role: anon y authenticated no tienen permisos.
//
// "Monedero Rewards": siempre puntos enteros, 1 punto = $1 de descuento en productos.
// ============================================================
import { randomInt } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

// Interruptor del programa. En false nada de Rewards se muestra ni se cobra.
export const REWARDS_ACTIVO = false

// Reglas del programa (un solo lugar).
export const PORCENTAJE_CODIGO = 5          // descuento al usar un código Rewards (solo productos)
export const PORCENTAJE_GANANCIA = 10       // lo que gana el dueño del código
export const TOPE_PUNTOS_PARA_GANAR = 50    // si los puntos usados pasan de este % de (subtotal − 5%), no hay ganancia
export const MINIMO_PAGO = 10               // mínimo a pagar en productos (mínimo de OXXO; confirmar antes del lanzamiento)
export const DIAS_ACREDITACION = 15         // días después de entregado_at para acreditar la ganancia

export const COMO_SE_ENTERO = [
  'Instagram',
  'TikTok',
  'Facebook',
  'Recomendación de un amigo',
  'Google',
  'Otro',
] as const
export type ComoSeEntero = (typeof COMO_SE_ENTERO)[number]

export interface MiembroRewards {
  id: number
  user_id: string | null
  codigo: string
  telefono: string | null
  estado: 'activo' | 'suspendido' | 'eliminado'
  created_at: string
}

export interface SaldoRewards {
  disponibles: number
  pendientes: number
}

// ------------------------------------------------------------
// Códigos: 2 letras del nombre + 2 del apellido + 4 números (ej. GAMA4821).
// ------------------------------------------------------------

// Solo A-Z, sin acentos (Ñ → N, Ü → U) y en mayúsculas.
export function soloLetras(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
}

function dosLetras(texto: string): string {
  return (soloLetras(texto) + 'XX').slice(0, 2)
}

// Combinaciones de 4 letras que no queremos en un código.
const PALABRAS_BLOQUEADAS = new Set([
  'PUTA', 'PUTO', 'PITO', 'PICO', 'PIJA', 'PENE', 'CULO', 'CACA', 'PEDO', 'MOCO',
  'MEAR', 'MAMA', 'MAME', 'MAMO', 'CONO', 'COGE', 'COJE', 'COJO', 'JOTO',
  'GUEY', 'BUEY', 'NACO', 'NACA', 'BABA', 'BOBO', 'BOBA', 'TETA', 'MECO', 'MOJO',
  'FUCK', 'SHIT', 'DICK', 'COCK', 'CUNT', 'PORN', 'SEXO', 'SEXY', 'NAZI', 'KAKA',
  'KULO', 'PUTE', 'VERG', 'CAGA', 'CAGO', 'MIER', 'ANAL', 'ANOS', 'ANUS', 'GAYS',
])

// Prefijo de 4 letras. Si sale una palabra bloqueada se prueba apellido+nombre,
// y si también lo está, nombre + XX (XX nunca forma una palabra fea).
export function prefijoCodigo(nombre: string, apellido: string): string {
  const n = dosLetras(nombre)
  const a = dosLetras(apellido)
  for (const candidato of [n + a, a + n]) {
    if (!PALABRAS_BLOQUEADAS.has(candidato)) return candidato
  }
  return n + 'XX'
}

export function codigoConNumeros(prefijo: string): string {
  return prefijo + String(randomInt(0, 10000)).padStart(4, '0')
}

export function esCodigoRewards(codigo: string): boolean {
  return /^[A-Z]{4}[0-9]{4}$/.test(codigo)
}

// ¿El código no lo usa ningún miembro (ni eliminado: su código queda reservado)
// ni ningún codigos_descuento? La garantía final la dan los triggers al insertar.
export async function codigoDisponible(codigo: string): Promise<boolean> {
  const db = createServiceClient()
  const v = String(codigo || '').toUpperCase().trim()
  if (!esCodigoRewards(v)) return false // también evita comodines (% _) en el ilike
  const [miembro, descuento] = await Promise.all([
    db.from('rewards_miembros').select('id').eq('codigo', v).limit(1),
    db.from('codigos_descuento').select('id').ilike('codigo', v).limit(1),
  ])
  if (miembro.error || descuento.error) throw miembro.error || descuento.error
  return (miembro.data?.length ?? 0) === 0 && (descuento.data?.length ?? 0) === 0
}

// ------------------------------------------------------------
// Miembros
// ------------------------------------------------------------

export type ResultadoNuevoMiembro =
  | { ok: true; miembro: MiembroRewards }
  | { ok: false; error: 'DATOS_INVALIDOS' | 'YA_ES_MIEMBRO' | 'TELEFONO_USADO' | 'SIN_CODIGO' | 'ERROR' }

const INTENTOS_CODIGO = 10

// Crea el miembro con un código nuevo. Las validaciones de la inscripción
// (18+, nombre/apellido en perfiles, etc.) las hace quien llama (Parte 2).
export async function crearMiembro(params: {
  userId: string
  nombre: string
  apellido: string
  telefono: string
  comoSeEntero: ComoSeEntero
}): Promise<ResultadoNuevoMiembro> {
  const telefono = String(params.telefono || '').replace(/\D/g, '')
  if (!params.userId || !/^[0-9]{10}$/.test(telefono) || !COMO_SE_ENTERO.includes(params.comoSeEntero)) {
    return { ok: false, error: 'DATOS_INVALIDOS' }
  }

  const db = createServiceClient()
  const prefijo = prefijoCodigo(params.nombre, params.apellido)

  for (let i = 0; i < INTENTOS_CODIGO; i++) {
    const codigo = codigoConNumeros(prefijo)
    if (!(await codigoDisponible(codigo))) continue

    const { data, error } = await db
      .from('rewards_miembros')
      .insert({
        user_id: params.userId,
        codigo,
        telefono,
        mayor_edad_at: new Date().toISOString(),
        como_se_entero: params.comoSeEntero,
      })
      .select('id, user_id, codigo, telefono, estado, created_at')
      .single()

    if (!error) return { ok: true, miembro: data as MiembroRewards }

    if (error.code === '23505') {
      const texto = `${error.message} ${error.details ?? ''}`
      if (texto.includes('user_id')) return { ok: false, error: 'YA_ES_MIEMBRO' }
      if (texto.includes('telefono')) return { ok: false, error: 'TELEFONO_USADO' }
      continue // código tomado entre la revisión y el insert (CODIGO_OCUPADO o índice único)
    }
    console.error('Error creando miembro Rewards:', error)
    return { ok: false, error: 'ERROR' }
  }
  return { ok: false, error: 'SIN_CODIGO' }
}

export async function miembroPorUsuario(userId: string): Promise<MiembroRewards | null> {
  const { data, error } = await createServiceClient()
    .from('rewards_miembros')
    .select('id, user_id, codigo, telefono, estado, created_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as MiembroRewards) ?? null
}

// Miembro activo dueño de un código (para aplicar el 5% en el checkout).
export async function miembroPorCodigo(codigo: string): Promise<MiembroRewards | null> {
  const v = String(codigo || '').toUpperCase().trim()
  if (!esCodigoRewards(v)) return null
  const { data, error } = await createServiceClient()
    .from('rewards_miembros')
    .select('id, user_id, codigo, telefono, estado, created_at')
    .eq('codigo', v)
    .eq('estado', 'activo')
    .maybeSingle()
  if (error) throw error
  return (data as MiembroRewards) ?? null
}

export async function saldoDe(miembroId: number): Promise<SaldoRewards> {
  const { data, error } = await createServiceClient()
    .from('rewards_saldos')
    .select('disponibles, pendientes')
    .eq('miembro_id', miembroId)
    .maybeSingle()
  if (error) throw error
  return { disponibles: data?.disponibles ?? 0, pendientes: data?.pendientes ?? 0 }
}

// ------------------------------------------------------------
// Canje y devolución (funciones de la base, con candado por miembro)
// ------------------------------------------------------------

export type ErrorCanje =
  | 'REWARDS_PUNTOS_INVALIDOS'
  | 'REWARDS_MIEMBRO_INVALIDO'
  | 'REWARDS_CANJE_ACTIVO'
  | 'REWARDS_SALDO_INSUFICIENTE'
  | 'ERROR'

export type ErrorDevolucion =
  | 'REWARDS_PUNTOS_INVALIDOS'
  | 'REWARDS_CANJE_NO_EXISTE'
  | 'REWARDS_DEVOLUCION_EXCEDE'
  | 'ERROR'

function errorConocido<T extends string>(mensaje: string | undefined, conocidos: readonly T[]): T | null {
  return conocidos.find(c => mensaje?.includes(c)) ?? null
}

export async function canjearPuntos(
  miembroId: number,
  pedidoId: number,
  puntos: number
): Promise<{ ok: true; canjeId: number } | { ok: false; error: ErrorCanje }> {
  if (!Number.isInteger(puntos) || puntos <= 0) return { ok: false, error: 'REWARDS_PUNTOS_INVALIDOS' }
  const { data, error } = await createServiceClient().rpc('rewards_canjear', {
    p_miembro_id: miembroId,
    p_pedido_id: pedidoId,
    p_puntos: puntos,
  })
  if (error) {
    const conocido = errorConocido(error.message, [
      'REWARDS_PUNTOS_INVALIDOS', 'REWARDS_MIEMBRO_INVALIDO', 'REWARDS_CANJE_ACTIVO', 'REWARDS_SALDO_INSUFICIENTE',
    ] as const)
    if (!conocido) console.error('Error canjeando puntos Rewards:', error)
    return { ok: false, error: conocido ?? 'ERROR' }
  }
  return { ok: true, canjeId: Number(data) }
}

export async function devolverCanje(params: {
  canjeId: number
  puntos: number
  reembolsoId?: number | null
  motivo: string
}): Promise<{ ok: true; movimientoId: number } | { ok: false; error: ErrorDevolucion }> {
  if (!Number.isInteger(params.puntos) || params.puntos <= 0) return { ok: false, error: 'REWARDS_PUNTOS_INVALIDOS' }
  const { data, error } = await createServiceClient().rpc('rewards_devolver_canje', {
    p_canje_id: params.canjeId,
    p_puntos: params.puntos,
    p_reembolso_id: params.reembolsoId ?? null,
    p_motivo: String(params.motivo || '').slice(0, 500),
  })
  if (error) {
    const conocido = errorConocido(error.message, [
      'REWARDS_PUNTOS_INVALIDOS', 'REWARDS_CANJE_NO_EXISTE', 'REWARDS_DEVOLUCION_EXCEDE',
    ] as const)
    if (!conocido) console.error('Error devolviendo canje Rewards:', error)
    return { ok: false, error: conocido ?? 'ERROR' }
  }
  return { ok: true, movimientoId: Number(data) }
}

// ------------------------------------------------------------
// Cálculos (puros). Montos en pesos; los puntos siempre enteros.
// ------------------------------------------------------------

// 5% de descuento por código, solo sobre productos.
export function descuentoCodigo(subtotal: number): number {
  return Math.round(Math.max(0, subtotal) * (PORCENTAJE_CODIGO / 100))
}

// Máximo de puntos que se pueden usar: deben quedar al menos MINIMO_PAGO por pagar en productos.
// Con saldo ≤ 0 no se canjea.
export function maxPuntosCanjeables(params: { subtotal: number; descuento: number; saldo: number }): number {
  const base = params.subtotal - params.descuento
  return Math.max(0, Math.min(Math.floor(params.saldo), Math.floor(base - MINIMO_PAGO)))
}

// Ganancia del dueño del código: piso(10% de (subtotal − 5% − puntos usados)), sin envío.
// Se pierde si los puntos usados pasan del 50% de (subtotal − 5%).
export function gananciaPorPedido(params: { subtotal: number; descuento: number; puntosUsados: number }): number {
  const base = params.subtotal - params.descuento
  if (base <= 0) return 0
  if (params.puntosUsados > base * (TOPE_PUNTOS_PARA_GANAR / 100)) return 0
  return Math.max(0, Math.floor((base - params.puntosUsados) * (PORCENTAJE_GANANCIA / 100)))
}
