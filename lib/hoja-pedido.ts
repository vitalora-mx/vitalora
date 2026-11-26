// ============================================================
// PDF para imprimir: etiqueta de Skydropx + hoja de pedido (SOLO SERVIDOR).
// La hoja (carta) lleva logo, número de pedido, comprador, productos,
// desglose y la nota de agradecimiento.
// ============================================================
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import sharp from 'sharp'
import { formatearNumeroPedido } from '@/lib/utils'
import { etiquetaDescuento } from '@/lib/descuentos'

const NOTA = [
  'Gracias por elegir Vitalora.',
  'Cada producto de tu pedido fue seleccionado, revisado y empacado con cuidado para que llegue a ti tal como merece: auténtico y en perfectas condiciones.',
  'Nuestro compromiso es acercarte lo mejor de la belleza coreana con la confianza de saber que cada artículo es 100% original. Esperamos que tu ritual de cuidado se convierta en un momento para ti.',
  'Si tienes cualquier duda sobre tu pedido o sobre cómo usar tus productos, escríbenos a hola@vitalora.com.mx. Será un gusto ayudarte.',
]
const FIRMA = ['Con cariño,', 'Equipo Vitalora', 'vitalora.com.mx']

const NEGRO = rgb(0.055, 0.055, 0.055)
const GRIS = rgb(0.42, 0.42, 0.42)
const DORADO = rgb(0.79, 0.66, 0.38)
const LINEA = rgb(0.91, 0.89, 0.85)

export interface PedidoHoja {
  id: number
  created_at: string
  nombre: string
  apellido: string
  subtotal: number
  descuento: number | null
  descuento_tipo?: string | null
  codigo_descuento?: string | null
  costo_envio: number
  cargo_zona_extendida?: number | null
  total: number
  pedido_items: { nombre: string; variante_nombre?: string | null; cantidad: number; precio: number }[]
}

// Las fuentes estándar del PDF solo tienen el juego WinAnsi (español sí; coreano, emojis, etc. no)
function seguro(texto: string): string {
  return String(texto ?? '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/…/g, '...').replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .trim()
}

const mxn = (n: number) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN'

function partir(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const palabras = seguro(texto).split(' ')
  const lineas: string[] = []
  let actual = ''
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p
    if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) actual = prueba
    else { if (actual) lineas.push(actual); actual = p }
  }
  if (actual) lineas.push(actual)
  return lineas
}

async function logoPng(origen: string): Promise<Buffer | null> {
  try {
    const res = await fetch(new URL('/images/logo/logo-header.webp', origen), { cache: 'force-cache' })
    if (!res.ok) return null
    return await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 600 }).png().toBuffer()
  } catch {
    return null
  }
}

async function dibujarHoja(doc: PDFDocument, p: PedidoHoja, origen: string) {
  const pagina: PDFPage = doc.addPage([612, 792])
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold)
  const cursiva = await doc.embedFont(StandardFonts.HelveticaOblique)
  const M = 60
  const ancho = 612 - M * 2
  let y = 792 - 56

  // Logo
  const png = await logoPng(origen)
  if (png) {
    const img = await doc.embedPng(png)
    const w = 150
    const h = (img.height / img.width) * w
    pagina.drawImage(img, { x: (612 - w) / 2, y: y - h, width: w, height: h })
    y -= h + 28
  } else {
    const t = 'VITALORA'
    pagina.drawText(t, { x: (612 - negrita.widthOfTextAtSize(t, 26)) / 2, y: y - 26, size: 26, font: negrita, color: NEGRO })
    y -= 54
  }

  // Encabezado
  const fecha = new Date(p.created_at).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'long', year: 'numeric' })
  pagina.drawText(seguro('Pedido ' + formatearNumeroPedido(p.id)), { x: M, y, size: 16, font: negrita, color: NEGRO })
  const tf = seguro(fecha)
  pagina.drawText(tf, { x: 612 - M - normal.widthOfTextAtSize(tf, 10), y: y + 3, size: 10, font: normal, color: GRIS })
  y -= 20
  pagina.drawText(seguro(`Para: ${p.nombre} ${p.apellido}`), { x: M, y, size: 11, font: normal, color: NEGRO })
  y -= 22
  pagina.drawLine({ start: { x: M, y }, end: { x: 612 - M, y }, thickness: 1, color: DORADO })
  y -= 22

  // Productos
  const colCant = 612 - M - 150
  const colImporte = 612 - M
  pagina.drawText('PRODUCTO', { x: M, y, size: 8, font: negrita, color: GRIS })
  pagina.drawText('CANT.', { x: colCant, y, size: 8, font: negrita, color: GRIS })
  const ti = 'IMPORTE'
  pagina.drawText(ti, { x: colImporte - negrita.widthOfTextAtSize(ti, 8), y, size: 8, font: negrita, color: GRIS })
  y -= 16
  for (const it of p.pedido_items || []) {
    const nombre = it.variante_nombre ? `${it.nombre} (${it.variante_nombre})` : it.nombre
    const lineas = partir(nombre, normal, 10, colCant - M - 16)
    lineas.forEach((l, i) => pagina.drawText(l, { x: M, y: y - i * 13, size: 10, font: normal, color: NEGRO }))
    pagina.drawText(String(it.cantidad), { x: colCant + 8, y, size: 10, font: normal, color: NEGRO })
    const imp = mxn(Number(it.precio) * Number(it.cantidad))
    pagina.drawText(imp, { x: colImporte - normal.widthOfTextAtSize(imp, 10), y, size: 10, font: normal, color: NEGRO })
    y -= lineas.length * 13 + 8
    if (y < 330) break // nunca invadir la nota
  }
  pagina.drawLine({ start: { x: M, y: y + 2 }, end: { x: 612 - M, y: y + 2 }, thickness: 0.5, color: LINEA })
  y -= 16

  // Desglose
  const cargo = Math.max(0, Number(p.cargo_zona_extendida || 0))
  const envio = Math.max(0, Number(p.costo_envio || 0) - cargo)
  const descuento = Number(p.descuento || 0)
  const filas: [string, string, boolean][] = [['Subtotal', mxn(p.subtotal), false]]
  if (descuento > 0) filas.push([seguro(etiquetaDescuento(p)), '-' + mxn(descuento), false])
  filas.push(['Envío', envio === 0 ? 'Gratis' : mxn(envio), false])
  if (cargo > 0) filas.push(['Cargo por zona extendida', mxn(cargo), false])
  filas.push(['Total', mxn(p.total), true])
  const colEtiqueta = 612 - M - 230
  for (const [k, v, fuerte] of filas) {
    const f = fuerte ? negrita : normal
    const tam = fuerte ? 12 : 10
    if (fuerte) { pagina.drawLine({ start: { x: colEtiqueta, y: y + 12 }, end: { x: 612 - M, y: y + 12 }, thickness: 0.5, color: LINEA }); y -= 4 }
    pagina.drawText(seguro(k), { x: colEtiqueta, y, size: tam, font: f, color: NEGRO })
    pagina.drawText(v, { x: 612 - M - f.widthOfTextAtSize(v, tam), y, size: tam, font: f, color: NEGRO })
    y -= tam + 7
  }

  // Nota
  y = Math.min(y - 24, 300)
  pagina.drawLine({ start: { x: M, y: y + 14 }, end: { x: 612 - M, y: y + 14 }, thickness: 1, color: DORADO })
  y -= 8
  NOTA.forEach((parrafo, i) => {
    const f = i === 0 ? negrita : normal
    for (const l of partir(parrafo, f, 10.5, ancho)) {
      pagina.drawText(l, { x: M, y, size: 10.5, font: f, color: NEGRO })
      y -= 15
    }
    y -= 7
  })
  y -= 4
  FIRMA.forEach((l, i) => {
    pagina.drawText(seguro(l), { x: M, y, size: 10.5, font: i === 2 ? cursiva : normal, color: i === 2 ? GRIS : NEGRO })
    y -= 15
  })
}

// PDF de impresión: todas las páginas de la etiqueta y al final la hoja de pedido.
// Sin etiqueta (null), solo la hoja.
export async function pdfGuiaYHoja(etiqueta: Buffer | null, pedido: PedidoHoja, origen: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(seguro('Pedido ' + formatearNumeroPedido(pedido.id)))
  doc.setAuthor('Vitalora')
  if (etiqueta) {
    const src = await PDFDocument.load(etiqueta)
    const paginas = await doc.copyPages(src, src.getPageIndices())
    paginas.forEach(pg => doc.addPage(pg))
  }
  await dibujarHoja(doc, pedido, origen)
  return doc.save()
}
