// ============================================================
// Pedido de Mercado Pago pendiente de ESTE navegador (lado del cliente).
// Se guarda { id, token } al crear el pedido para que, si el cliente vuelve a
// pagar (por ejemplo, al regresar de la app de Mercado Pago), el servidor
// reutilice el mismo pedido (o lo marque como abandonado).
// El token es secreto del pedido: sin él el servidor ignora el dato.
// Vive en localStorage y caduca a las 2 horas de guardarse: al leerlo, si ya
// pasó ese tiempo (o no tiene fecha), se borra y se ignora.
// ============================================================

const CLAVE = 'vitalora-pedido-pendiente'
const CADUCIDAD_MS = 2 * 60 * 60 * 1000 // 2 horas

export interface PedidoPendiente { id: number; token: string }

export function leerPedidoPendiente(): PedidoPendiente | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return null
    const d = JSON.parse(raw)
    const guardadoEn = Number(d?.guardadoEn)
    const edad = Date.now() - guardadoEn
    if (!Number.isFinite(guardadoEn) || edad < 0 || edad > CADUCIDAD_MS) {
      borrarPedidoPendiente()
      return null
    }
    return Number.isInteger(d?.id) && typeof d?.token === 'string' ? { id: d.id, token: d.token } : null
  } catch {
    return null
  }
}

export function guardarPedidoPendiente(id: unknown, token: unknown) {
  try {
    if (Number.isInteger(id) && typeof token === 'string' && token) {
      localStorage.setItem(CLAVE, JSON.stringify({ id, token, guardadoEn: Date.now() }))
    }
  } catch { /* sin almacenamiento: no se reutiliza, no pasa nada */ }
}

export function borrarPedidoPendiente() {
  try { localStorage.removeItem(CLAVE) } catch { /* nada */ }
}
