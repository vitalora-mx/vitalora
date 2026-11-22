// ============================================================
// Avance del checkout (lado del cliente).
// Se guarda en sessionStorage: sobrevive a ir al carrito y regresar, pero
// se borra al cerrar la pestaña (para no dejar datos en computadoras compartidas).
// Se borra también al completar la compra (/gracias o pedido por transferencia).
// ============================================================

const CLAVE = 'vitalora-checkout-borrador'

export interface BorradorCheckout {
  form: Record<string, string>
  paso: number
  metodoPago: string
  direccionSeleccionada: number | null
  usarNuevaDireccion: boolean
  compraComoInvitado: boolean
  codigo: string
}

const CAMPOS_FORM = ['nombre', 'apellido', 'email', 'telefono', 'calle', 'numero', 'interior', 'colonia', 'ciudad', 'estado', 'cp', 'referencia']

export function leerBorradorCheckout(): BorradorCheckout | null {
  try {
    const raw = sessionStorage.getItem(CLAVE)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || typeof d !== 'object' || typeof d.form !== 'object') return null
    // Solo campos conocidos y de texto, con largo razonable
    const form: Record<string, string> = {}
    for (const c of CAMPOS_FORM) if (typeof d.form[c] === 'string') form[c] = d.form[c].slice(0, 300)
    return {
      form,
      paso: [1, 2, 3].includes(d.paso) ? d.paso : 1,
      metodoPago: d.metodoPago === 'transferencia' ? 'transferencia' : 'mercadopago',
      direccionSeleccionada: Number.isInteger(d.direccionSeleccionada) ? d.direccionSeleccionada : null,
      usarNuevaDireccion: d.usarNuevaDireccion === true,
      compraComoInvitado: d.compraComoInvitado === true,
      codigo: typeof d.codigo === 'string' ? d.codigo.slice(0, 50) : '',
    }
  } catch {
    return null
  }
}

export function guardarBorradorCheckout(b: BorradorCheckout) {
  try { sessionStorage.setItem(CLAVE, JSON.stringify(b)) } catch { /* sin almacenamiento: no pasa nada */ }
}

export function borrarBorradorCheckout() {
  try { sessionStorage.removeItem(CLAVE) } catch { /* nada */ }
}
