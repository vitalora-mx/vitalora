// Datos bancarios para pagos por transferencia (los usan la página /transferencia y los correos).
export const DATOS_BANCARIOS = {
  clabe: '722969020946634146',
  beneficiario: 'VANGUARDIA IMPORTACIONES & LOGISTICA DE MEXICO',
  institucion: 'Mercado Pago W',
}

export const BASE_URL_TIENDA = 'https://vitalora.com.mx'

// Plazos: 2 horas para pagar al crear el pedido; 24 horas para subir otro comprobante tras un rechazo
export const HORAS_PARA_PAGAR = 2
export const HORAS_TRAS_RECHAZO = 24

// Enlace a la página del pedido (con su token de acceso)
export function enlacePedidoTransferencia(pedidoId: number, accesoToken: string): string {
  return `${BASE_URL_TIENDA}/transferencia/${pedidoId}?t=${encodeURIComponent(accesoToken)}`
}

// Fecha y hora en México, p. ej. "23 de noviembre de 2026, 14:30"
export function fechaHoraMexico(iso: string | Date): string {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
