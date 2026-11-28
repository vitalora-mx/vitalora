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
import { formatearNumeroPedido } from '@/lib/utils'

// Interruptor del programa (vive en lib/rewards-config.ts para que el navegador lo pueda leer).
export { REWARDS_ACTIVO, REWARDS_VISIBLE } from '@/lib/rewards-config'

// Reglas del programa (un solo lugar).
export const PORCENTAJE_CODIGO = 5          // descuento al usar un código Rewards (solo productos)
export const PORCENTAJE_GANANCIA = 10       // lo que gana el dueño del código
export const TOPE_PUNTOS_PARA_GANAR = 50    // si los puntos usados pasan de este % de (subtotal − 5%), no hay ganancia
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

// Teléfono a 10 dígitos: quita espacios, guiones y la lada +52 si viene. null si no queda en 10.
export function normalizarTelefono(valor: unknown): string | null {
  let d = String(valor ?? '').replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('52')) d = d.slice(2)
  return /^[0-9]{10}$/.test(d) ? d : null
}

// Crea el miembro con un código nuevo. Las validaciones de la inscripción
// (18+, términos, nombre/apellido en perfiles) las hace quien llama
// (app/api/rewards/inscripcion); aquí se registra la hora en que se aceptaron.
export async function crearMiembro(params: {
  userId: string
  nombre: string
  apellido: string
  telefono: string
  comoSeEntero: ComoSeEntero
}): Promise<ResultadoNuevoMiembro> {
  const telefono = normalizarTelefono(params.telefono)
  if (!params.userId || !telefono || !COMO_SE_ENTERO.includes(params.comoSeEntero)) {
    return { ok: false, error: 'DATOS_INVALIDOS' }
  }

  const db = createServiceClient()
  const prefijo = prefijoCodigo(params.nombre, params.apellido)
  const ahora = new Date().toISOString()

  for (let i = 0; i < INTENTOS_CODIGO; i++) {
    const codigo = codigoConNumeros(prefijo)
    if (!(await codigoDisponible(codigo))) continue

    const { data, error } = await db
      .from('rewards_miembros')
      .insert({
        user_id: params.userId,
        codigo,
        telefono,
        mayor_edad_at: ahora,
        terminos_aceptados_at: ahora,
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

// Máximo de puntos que se pueden usar: hasta el total de los productos (subtotal − 5% del código).
// El envío y el cargo de zona extendida NUNCA se pagan con puntos (van con Mercado Pago o
// transferencia). Si el pedido completo queda en $0, se confirma con puntos (Parte 5);
// así no genera puntos (pasa del 50%) y no es facturable. Con saldo ≤ 0 no se canjea.
export function maxPuntosCanjeables(params: { subtotal: number; descuento: number; saldo: number }): number {
  const base = params.subtotal - params.descuento
  return Math.max(0, Math.min(Math.floor(params.saldo), Math.floor(base)))
}

// Ganancia del dueño del código: piso(10% de (subtotal − 5% − puntos usados)), sin envío.
// Se pierde si los puntos usados pasan del 50% de (subtotal − 5%).
export function gananciaPorPedido(params: { subtotal: number; descuento: number; puntosUsados: number }): number {
  const base = params.subtotal - params.descuento
  if (base <= 0) return 0
  if (params.puntosUsados > base * (TOPE_PUNTOS_PARA_GANAR / 100)) return 0
  return Math.max(0, Math.floor((base - params.puntosUsados) * (PORCENTAJE_GANANCIA / 100)))
}

// ------------------------------------------------------------
// Historial para Mi cuenta. El concepto se arma aquí (servidor) para no
// mandar al navegador el número de pedido ni datos de otras personas:
// una ganancia por la compra de alguien más solo dice "Compra con tu código".
// ------------------------------------------------------------

export interface MovimientoVisible {
  id: number
  fecha: string
  concepto: string
  detalle: string | null
  puntos: number
  estado: 'pendiente' | 'acreditado' | 'cancelado'
}

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' }).replace('.', '')

export async function historialDe(
  miembroId: number,
  userId: string,
  opciones: { antesDe?: number | null; limite?: number } = {}
): Promise<{ movimientos: MovimientoVisible[]; hayMas: boolean }> {
  const db = createServiceClient()
  const limite = Math.min(Math.max(opciones.limite ?? 20, 1), 50)

  let consulta = db
    .from('rewards_movimientos')
    .select('id, tipo, estado, puntos, pedido_id, disponible_desde, motivo, created_at')
    .eq('miembro_id', miembroId)
    .neq('tipo', 'cierre')
    .order('id', { ascending: false })
    .limit(limite + 1)
  if (opciones.antesDe) consulta = consulta.lt('id', opciones.antesDe)

  const { data, error } = await consulta
  if (error) throw error
  const filas = data ?? []
  const pagina = filas.slice(0, limite)

  // ¿Qué pedidos son del propio miembro? (solo esos muestran su número)
  const idsPedidos = [...new Set(pagina.map(m => m.pedido_id).filter((id): id is number => !!id))]
  const propios = new Set<number>()
  if (idsPedidos.length) {
    const { data: pedidos, error: errPedidos } = await db.from('pedidos').select('id, user_id').in('id', idsPedidos)
    if (errPedidos) throw errPedidos
    for (const p of pedidos ?? []) if (p.user_id === userId) propios.add(p.id)
  }

  const movimientos = pagina.map((m): MovimientoVisible => {
    const propio = !!m.pedido_id && propios.has(m.pedido_id)
    const numero = propio ? formatearNumeroPedido(m.pedido_id) : null
    let concepto: string
    let detalle: string | null = null
    switch (m.tipo) {
      case 'ganancia':
        concepto = propio ? `Tu compra ${numero}` : 'Compra con tu código'
        if (m.estado === 'pendiente') {
          detalle = m.disponible_desde
            ? `Disponible a partir del ${fechaCorta(m.disponible_desde)}`
            : `Se acredita ${DIAS_ACREDITACION} días después de la entrega`
        } else if (m.estado === 'cancelado') {
          detalle = 'Cancelado: el pedido se canceló o se reembolsó'
        }
        break
      case 'canje':
        concepto = numero ? `Usaste puntos en tu pedido ${numero}` : 'Usaste puntos en un pedido'
        break
      case 'devolucion_canje':
        concepto = numero ? `Te regresamos puntos del pedido ${numero}` : 'Te regresamos puntos'
        break
      case 'ajuste':
        concepto = 'Ajuste por cancelación o reembolso'
        break
      default: // ajuste_manual
        concepto = 'Ajuste'
        detalle = m.motivo ?? null
    }
    return { id: m.id, fecha: fechaCorta(m.created_at), concepto, detalle, puntos: m.puntos, estado: m.estado }
  })

  return { movimientos, hayMas: filas.length > limite }
}
