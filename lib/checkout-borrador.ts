// ============================================================
// Avance del checkout (lado del cliente).
// Se guarda en localStorage para que sobreviva cuando el celular abre la app de
// Mercado Pago y, al regresar, el navegador recarga la tienda o la abre en otra
// pestaña. Caduca a las 2 horas desde la última edición: al leerlo, si ya pasó
// ese tiempo, se borra y se ignora (para no dejar datos en equipos compartidos).
// Se borra también al completar la compra (/gracias o pedido por transferencia).
// Nunca guarda datos de pago: solo contacto, dirección, paso, método elegido y código.
// ============================================================

const CLAVE = 'vitalora-checkout-borrador'
const CADUCIDAD_MS = 2 * 60 * 60 * 1000 // 2 horas

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
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return null
    const d = JSON.parse(raw)
    // Caducado, sin fecha o con fecha en el futuro: se borra y se ignora
    const guardadoEn = Number(d?.guardadoEn)
    const edad = Date.now() - guardadoEn
    if (!Number.isFinite(guardadoEn) || edad < 0 || edad > CADUCIDAD_MS) {
      borrarBorradorCheckout()
      return null
    }
    if (!d || typeof d !== 'object' || typeof d.form !== 'object' || !d.form) return null
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

// Cada guardado renueva la caducidad (2 horas desde la última edición).
// Se guardan solo los campos conocidos, aunque quien llame mande más.
export function guardarBorradorCheckout(b: BorradorCheckout) {
  try {
    const form: Record<string, string> = {}
    for (const c of CAMPOS_FORM) if (typeof b.form?.[c] === 'string') form[c] = b.form[c]
    localStorage.setItem(CLAVE, JSON.stringify({
      form,
      paso: b.paso,
      metodoPago: b.metodoPago,
      direccionSeleccionada: b.direccionSeleccionada,
      usarNuevaDireccion: b.usarNuevaDireccion,
      compraComoInvitado: b.compraComoInvitado,
      codigo: b.codigo,
      guardadoEn: Date.now(),
    }))
  } catch { /* sin almacenamiento: no pasa nada */ }
}

export function borrarBorradorCheckout() {
  try { localStorage.removeItem(CLAVE) } catch { /* nada */ }
  // Limpia también la versión anterior, que vivía en sessionStorage
  try { sessionStorage.removeItem(CLAVE) } catch { /* nada */ }
}
