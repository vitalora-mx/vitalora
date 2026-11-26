// ============================================================
// Utilidades de guías que sirven en el navegador y en el servidor (sin secretos).
//  - linkRastreo: página de rastreo de cada paquetería
//  - imprimirGuiaPedido: abre el PDF (guía + hoja de pedido, o solo guía) para imprimir
//    y lo descarga con un nombre claro. Al servirlo, el servidor registra la impresión.
// ============================================================
import { formatearNumeroPedido } from '@/lib/utils'

// Enlace de rastreo de cada paquetería (cuando Skydropx no da uno)
export function linkRastreo(paqueteria: string, guia: string): string {
  const g = encodeURIComponent(guia.trim())
  switch ((paqueteria || '').toLowerCase()) {
    case 'estafeta': return `https://www.estafeta.com/herramientas/rastreo?guias=${g}`
    case 'dhl': return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${g}`
    case 'fedex': return `https://www.fedex.com/fedextrack/?trknbr=${g}`
    case 'paquetexpress': return `https://www.paquetexpress.com.mx/rastreo/${g}`
    default: return `https://www.google.com/search?q=rastrear+${encodeURIComponent(paqueteria)}+${g}`
  }
}

const slug = (s: string | null | undefined) => (s || 'paqueteria').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Abre el PDF en una pestaña (para imprimir) y además lo guarda en Descargas.
// La pestaña se abre antes de pedir el PDF para que el navegador no la bloquee.
async function abrirYDescargar(url: string, nombreArchivo: string): Promise<string | null> {
  const pestana = window.open('', '_blank')
  try {
    const res = await fetch(url)
    if (!res.ok) {
      pestana?.close()
      const data = await res.json().catch(() => ({}))
      return data.error || 'No se pudo generar el PDF.'
    }
    const blobUrl = URL.createObjectURL(await res.blob())
    if (pestana) pestana.location.href = blobUrl
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
    return null
  } catch {
    pestana?.close()
    return 'Error de conexión al generar el PDF.'
  }
}

// Devuelve null si salió bien, o el mensaje de error
export function imprimirGuiaPedido(pedido: { id: number | string; paqueteria?: string | null }, soloGuia: boolean): Promise<string | null> {
  const numero = formatearNumeroPedido(pedido.id)
  return abrirYDescargar(
    `/api/admin/envios/imprimir?pedidoId=${pedido.id}${soloGuia ? '&solo=guia' : ''}`,
    soloGuia ? `${numero}-solo-guia.pdf` : `${numero}-guia-${slug(pedido.paqueteria)}.pdf`,
  )
}
