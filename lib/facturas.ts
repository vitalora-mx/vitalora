// ============================================================
// Facturas CFDI de pedidos (SOLO SERVIDOR salvo esCorreoValido).
// Archivos en el bucket PRIVADO "facturas": facturas/{pedidoId}/VIT-1000X.pdf|.xml
// ============================================================

export const BUCKET_FACTURAS = 'facturas'
export const MAX_BYTES_FACTURA = 5 * 1024 * 1024

export function esCorreoValido(email: string): boolean {
  return email.length > 0 && email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function rutaArchivoFactura(pedidoId: number, numero: string, tipo: 'pdf' | 'xml'): string {
  return `${pedidoId}/${numero}.${tipo}`
}

// El PDF debe empezar con "%PDF-"
export function esPdfValido(bytes: Uint8Array): boolean {
  return bytes.length > 5 && new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
}

// Lee el XML de un CFDI 3.3/4.0. Devuelve null si no es un CFDI.
export function leerCfdi(bytes: Uint8Array): { rfcReceptor: string | null; total: number | null; uuid: string | null } | null {
  let texto: string
  try {
    texto = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return null
  }
  if (!/<\s*cfdi:Comprobante[\s>]/i.test(texto)) return null

  const attr = (tag: string, nombre: string): string | null => {
    const m = texto.match(new RegExp(`<\\s*${tag}\\b[^>]*\\s${nombre}\\s*=\\s*"([^"]*)"`, 'i'))
    return m ? m[1].trim() : null
  }
  const total = attr('cfdi:Comprobante', 'Total')
  return {
    rfcReceptor: attr('cfdi:Receptor', 'Rfc')?.toUpperCase() ?? null,
    total: total != null && !isNaN(Number(total)) ? Number(total) : null,
    uuid: attr('tfd:TimbreFiscalDigital', 'UUID'),
  }
}
