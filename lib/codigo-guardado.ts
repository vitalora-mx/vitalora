// ============================================================
// Código de descuento que llega por enlace: vitalora.com.mx/?codigo=XXXX
// Sirve para cualquier código (Vitalora Rewards y cupones normales).
// - Se guarda en este navegador 30 días desde la última vez que se abrió un enlace.
// - Un enlace nuevo reemplaza al anterior. No se borra al comprar.
// - El checkout lo aplica solo si el cliente no escribió otro código (el escrito gana).
// - Si al aplicarlo ya no es válido, el checkout lo borra sin mostrar error.
// localStorage puede no existir o estar bloqueado: todo va en try/catch.
// ============================================================

const CLAVE = 'vitalora-codigo-enlace'
export const DIAS_CODIGO_ENLACE = 30
const VIGENCIA_MS = DIAS_CODIGO_ENLACE * 24 * 60 * 60 * 1000

// Mismo alfabeto que los códigos del admin y de Rewards; nada de espacios ni símbolos raros
export function limpiarCodigoEnlace(valor: unknown): string | null {
  const v = String(valor ?? '').trim().toUpperCase()
  return /^[A-Z0-9_-]{3,30}$/.test(v) ? v : null
}

export function guardarCodigoEnlace(codigo: string): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ codigo, guardadoAt: Date.now() }))
  } catch { /* almacenamiento bloqueado: el enlace simplemente no se recuerda */ }
}

export function leerCodigoEnlace(): string | null {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const { codigo, guardadoAt } = JSON.parse(crudo)
    const limpio = limpiarCodigoEnlace(codigo)
    if (!limpio || typeof guardadoAt !== 'number' || Date.now() - guardadoAt > VIGENCIA_MS) {
      localStorage.removeItem(CLAVE)
      return null
    }
    return limpio
  } catch {
    return null
  }
}

export function borrarCodigoEnlace(): void {
  try { localStorage.removeItem(CLAVE) } catch { /* nada que hacer */ }
}
