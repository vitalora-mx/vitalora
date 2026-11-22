import { createHash, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import type { PedidoCalculado } from '@/lib/checkout'
import { caducarPreferenciaMP } from '@/lib/reembolsos'

// ============================================================
// Pedidos abandonados (SOLO SERVIDOR)
//
// Un pedido de Mercado Pago en 'pendiente' sin ningún pago pasa a 'abandonado' cuando:
//  - el cliente vuelve a pagar con otro carrito (o con otros datos o dirección),
//  - el cliente cambia a transferencia,
//  - o el cron diario lo encuentra con más de 2 horas.
// 'abandonado': sin correo, sin tocar inventario, fuera de ventas y contadores.
// Si después llega un pago aprobado, el webhook lo procesa normal.
// ============================================================

const HORAS_ABANDONO = 2

// Resumen del pedido: si coincide, es "el mismo pedido" y se reutiliza.
// Incluye carrito, precios, código, envío, total, datos del comprador y dirección.
export function huellaPedido(p: PedidoCalculado): string {
  const norm = (s: unknown) => String(s ?? '').trim().toLowerCase()
  const datos = {
    lineas: p.lineas
      .map(l => [l.productoId, l.varianteId ?? null, l.cantidad, Number(l.precio)])
      .sort((a, b) => String(a).localeCompare(String(b))),
    codigo: norm(p.codigo),
    descuento: Number(p.descuento || 0),
    envio: Number(p.costoEnvio || 0),
    total: Number(p.total || 0),
    usuario: p.userId ?? null,
    comprador: [norm(p.comprador.nombre), norm(p.comprador.apellido), norm(p.comprador.email), norm(p.comprador.telefono)],
    direccion: [p.direccion.calle, p.direccion.numero, p.direccion.interior, p.direccion.colonia, p.direccion.ciudad,
      p.direccion.estado, p.direccion.cp, p.direccion.referencia].map(norm),
  }
  return createHash('sha256').update(JSON.stringify(datos)).digest('hex')
}

function mismoToken(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// Pasa un pedido pendiente sin pago a 'abandonado' y caduca su preferencia de MP.
// Devuelve true si lo abandonó.
export async function abandonarPedido(pedidoId: number): Promise<boolean> {
  const { data } = await createServiceClient()
    .from('pedidos')
    .update({ estado: 'abandonado', abandonado_at: new Date().toISOString() })
    .eq('id', pedidoId)
    .eq('estado', 'pendiente')
    .is('mp_payment_id', null)
    .select('id, mp_preference_id')
  const pedido = data?.[0]
  if (!pedido) return false
  if (pedido.mp_preference_id) await caducarPreferenciaMP(pedido.mp_preference_id)
  return true
}

// El checkout manda { id, token } del pedido de MP que creó antes en este navegador.
//  - 'mercadopago': si la huella coincide, se reutiliza; si no, el anterior se abandona.
//  - 'transferencia': el anterior siempre se abandona.
// Si el anterior ya tiene un pago (p. ej. ficha OXXO), no se toca.
export async function revisarPedidoPrevio(
  previo: unknown,
  huella: string,
  destino: 'mercadopago' | 'transferencia',
): Promise<{ reutilizar: { id: number; initPoint: string; token: string } } | null> {
  const id = Number((previo as { id?: unknown })?.id)
  const token = (previo as { token?: unknown })?.token
  if (!Number.isInteger(id) || id <= 0 || typeof token !== 'string' || !token) return null

  const { data: pedido } = await createServiceClient()
    .from('pedidos')
    .select('id, estado, metodo_pago, acceso_token, huella, mp_init_point, mp_payment_id')
    .eq('id', id)
    .maybeSingle()
  if (!pedido || !pedido.acceso_token || !mismoToken(pedido.acceso_token, token)) return null
  if (pedido.estado !== 'pendiente' || pedido.metodo_pago === 'transferencia' || pedido.mp_payment_id) return null

  if (destino === 'mercadopago' && pedido.huella === huella && pedido.mp_init_point) {
    return { reutilizar: { id: pedido.id, initPoint: pedido.mp_init_point, token } }
  }
  await abandonarPedido(pedido.id)
  return null
}

// Cron diario: pendientes de MP sin pago con más de 2 horas.
// Antes de abandonar cada uno, se pregunta a MP si tiene algún pago; si lo tiene, no se toca.
export async function limpiarPendientesViejos(): Promise<{ abandonados: number[]; conPago: number[] }> {
  const limite = new Date(Date.now() - HORAS_ABANDONO * 60 * 60 * 1000).toISOString()
  const { data: viejos } = await createServiceClient()
    .from('pedidos')
    .select('id, metodo_pago')
    .eq('estado', 'pendiente')
    .is('mp_payment_id', null)
    .lt('created_at', limite)
    .limit(200)

  const abandonados: number[] = []
  const conPago: number[] = []
  for (const p of viejos || []) {
    if (p.metodo_pago === 'transferencia') continue
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${p.id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      })
      if (!res.ok) continue // si MP no responde, se intenta mañana
      const datos = await res.json()
      const pagos = (datos.results || []) as { status: string }[]
      if (pagos.some(x => ['approved', 'pending', 'in_process', 'authorized'].includes(x.status))) {
        conPago.push(p.id)
        continue
      }
      if (await abandonarPedido(p.id)) abandonados.push(p.id)
    } catch (e) {
      console.error('Error revisando pedido pendiente', p.id, e)
    }
  }
  return { abandonados, conPago }
}
