// ============================================================
// Pedido de Mercado Pago pendiente de ESTE navegador (lado del cliente).
// Se guarda { id, token } al crear el pedido para que, si el cliente vuelve a
// pagar, el servidor reutilice el mismo pedido (o lo marque como abandonado).
// El token es secreto del pedido: sin él el servidor ignora el dato.
// ============================================================

const CLAVE = 'vitalora-pedido-pendiente'

export interface PedidoPendiente { id: number; token: string }

export function leerPedidoPendiente(): PedidoPendiente | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return null
    const d = JSON.parse(raw)
    return Number.isInteger(d?.id) && typeof d?.token === 'string' ? { id: d.id, token: d.token } : null
  } catch {
    return null
  }
}

export function guardarPedidoPendiente(id: unknown, token: unknown) {
  try {
    if (Number.isInteger(id) && typeof token === 'string' && token) {
      localStorage.setItem(CLAVE, JSON.stringify({ id, token }))
    }
  } catch { /* sin almacenamiento: no se reutiliza, no pasa nada */ }
}

export function borrarPedidoPendiente() {
  try { localStorage.removeItem(CLAVE) } catch { /* nada */ }
}
