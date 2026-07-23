import { createClient } from '@supabase/supabase-js'

const BASE = 'https://vitalora.com.mx'

export const revalidate = 3600

// Escapa caracteres especiales para XML
function esc(txt: string): string {
  return (txt || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let entradas = ''

  try {
    const { data } = await supabase
      .from('productos')
      .select('slug, nombre, tipo, producto_imagenes(url, posicion)')
      .eq('activo', true)

    if (data) {
      entradas = data
        .filter((p: any) => p.producto_imagenes && p.producto_imagenes.length > 0)
        .map((p: any) => {
          const ruta = p.tipo === 'suplemento' ? 'suplementos' : 'cosmeticos'
          const url = `${BASE}/${ruta}/producto/${p.slug}`
          const imagenes = (p.producto_imagenes || [])
            .slice()
            .sort((a: any, b: any) => a.posicion - b.posicion)
            .filter((img: any) => img.url)
            .map(
              (img: any) => `    <image:image>
      <image:loc>${esc(img.url)}</image:loc>
      <image:title>${esc(p.nombre)}</image:title>
    </image:image>`
            )
            .join('\n')

          return `  <url>
    <loc>${esc(url)}</loc>
${imagenes}
  </url>`
        })
        .join('\n')
    }
  } catch (e) {
    console.error('Error generando sitemap de imagenes:', e)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entradas}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}