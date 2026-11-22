// Piezas compartidas de los correos de pedido (webhook MP y transferencias).
import { etiquetaDescuento } from '@/lib/descuentos'

const mxn = (n: number) => `$${Number(n || 0).toLocaleString()} MXN`

// Renglón de descuento para el correo al cliente ('' si no hubo descuento).
// tdIzq / tdDer: estilos de las celdas para que combine con cada plantilla.
export function filaDescuentoHTML(pedido: any, tdIzq: string, tdDer: string): string {
  const descuento = Number(pedido.descuento || 0)
  if (descuento <= 0) return ''
  return `<tr><td style="${tdIzq}color:#6B8F6B;">${etiquetaDescuento(pedido)}</td><td style="${tdDer}color:#6B8F6B;">-${mxn(descuento)}</td></tr>`
}

// Bloque "Resumen" para los avisos internos: Subtotal / Descuento / Envío / Total.
export function resumenInternoHTML(pedido: any): string {
  const descuento = Number(pedido.descuento || 0)
  const envio = Number(pedido.costo_envio || 0)
  const fila = (k: string, v: string, extra = '') =>
    `<tr><td style="padding:4px 0;font-size:13px;color:#555;${extra}">${k}</td><td style="padding:4px 0;font-size:13px;color:#333;text-align:right;${extra}">${v}</td></tr>`
  return `<h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Resumen</h3>`
    + `<table style="width:100%;border-collapse:collapse;margin:0 0 20px;background:#FAFAF5;padding:8px 16px;">`
    + fila('Subtotal', mxn(pedido.subtotal))
    + (descuento > 0 ? fila(etiquetaDescuento(pedido), `-${mxn(descuento)}`, 'color:#3A5A3A;') : '')
    + fila('Envío', envio === 0 ? 'Gratis' : mxn(envio))
    + fila('Total', mxn(pedido.total), 'font-weight:700;border-top:1px solid #E8E0D5;')
    + `</table>`
}
