import { createClient } from '@supabase/supabase-js'

const BASE = 'https://vitalora.com.mx'

// Escapa caracteres especiales para XML
function escapeXml(texto: string): string {
  if (!texto) return ''
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Limpia HTML y recorta la descripción para el feed
function limpiarDescripcion(texto: string): string {
  if (!texto) return ''
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  // Google permite hasta 5000 caracteres; recortamos por seguridad
  return limpio.length > 4900 ? limpio.slice(0, 4900) + '…' : limpio
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: productos } = await supabase
      .from('productos')
      .select('*, producto_imagenes(url, posicion)')
      .eq('activo', true)
      .order('created_at', { ascending: false })

    // Traer los IDs de productos que son kits (aparecen como kit_id en kit_componentes)
    const { data: kitsData } = await supabase
      .from('kit_componentes')
      .select('kit_id')
    const idsKits = new Set((kitsData ?? []).map((k: any) => k.kit_id))

    const items = (productos ?? []).map((p) => {
      // Ruta segun tipo
      const ruta = p.tipo === 'suplemento' ? 'suplementos' : 'cosmeticos'
      const link = `${BASE}/${ruta}/producto/${p.slug}`

      // Imagenes ordenadas por posicion; la principal es la de menor posicion
      const imgs = (p.producto_imagenes ?? [])
        .slice()
        .sort((a: any, b: any) => (a.posicion ?? 999) - (b.posicion ?? 999))
      const imagenPrincipal = imgs[0]?.url || ''
      const imagenesAdicionales = imgs.slice(1, 11) // hasta 10 adicionales

      // Disponibilidad segun stock
      const disponibilidad = (p.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock'

      // Precio: si hay precio_original mayor al precio, usamos sale_price
      const precio = Number(p.precio) || 0
      const precioOriginal = Number(p.precio_original) || 0
      const hayOferta = precioOriginal > precio && precio > 0

      // Descripcion: usa descripcion, o seo_description como respaldo
      const descripcion = limpiarDescripcion(p.descripcion || p.seo_description || p.nombre || '')

      // Construir el item XML
      let item = `    <item>\n`
      item += `      <g:id>${escapeXml(p.sku || String(p.id))}</g:id>\n`
      item += `      <g:title>${escapeXml(p.nombre || '')}</g:title>\n`
      item += `      <g:description>${escapeXml(descripcion)}</g:description>\n`
      item += `      <g:link>${escapeXml(link)}</g:link>\n`
      if (imagenPrincipal) {
        item += `      <g:image_link>${escapeXml(imagenPrincipal)}</g:image_link>\n`
      }
      for (const img of imagenesAdicionales) {
        if (img.url) item += `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>\n`
      }
      item += `      <g:availability>${disponibilidad}</g:availability>\n`

      // Precio (Google requiere el formato "123.45 MXN")
      if (hayOferta) {
        item += `      <g:price>${precioOriginal.toFixed(2)} MXN</g:price>\n`
        item += `      <g:sale_price>${precio.toFixed(2)} MXN</g:sale_price>\n`
      } else {
        item += `      <g:price>${precio.toFixed(2)} MXN</g:price>\n`
      }

      // Marca
      if (p.marca) item += `      <g:brand>${escapeXml(p.marca)}</g:brand>\n`

      // Codigo de barras (GTIN)
      if (p.codigo_barras) {
        item += `      <g:gtin>${escapeXml(p.codigo_barras)}</g:gtin>\n`
      } else {
        // Sin GTIN: marcamos identifier_exists como no
        item += `      <g:identifier_exists>no</g:identifier_exists>\n`
      }

      // MPN (usamos el SKU)
      if (p.sku) item += `      <g:mpn>${escapeXml(p.sku)}</g:mpn>\n`

      // Condicion: producto nuevo
      item += `      <g:condition>new</g:condition>\n`

      // Si es kit (bundle), marcarlo
      if (idsKits.has(p.id)) {
        item += `      <g:is_bundle>yes</g:is_bundle>\n`
      }

      // Categoria de producto (texto libre que ayuda a Google)
      if (p.categoria) item += `      <g:product_type>${escapeXml(p.categoria)}</g:product_type>\n`

      // Peso de envio (si lo tienes)
      if (p.peso_g && Number(p.peso_g) > 0) {
        const kg = (Number(p.peso_g) / 1000).toFixed(3)
        item += `      <g:shipping_weight>${kg} kg</g:shipping_weight>\n`
      }

      item += `    </item>`
      return item
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Vitalora</title>
    <link>${BASE}</link>
    <description>Catálogo de productos Vitalora — K-Beauty y suplementos</description>
${items.join('\n')}
  </channel>
</rss>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (e) {
    console.error('Error generando feed de Google:', e)
    return new Response('Error generando el feed', { status: 500 })
  }
}
