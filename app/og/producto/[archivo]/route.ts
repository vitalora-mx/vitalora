// GET /og/producto/{slug}.jpg
// Imagen para compartir de un producto en JPG 1200x630: su primera foto
// (WebP del bucket) centrada sobre fondo blanco. La URL lleva ?v= con el
// nombre del archivo de la foto (lib/compartir.ts), así que se puede guardar
// en caché mucho tiempo.
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { productoVisible } from '@/lib/tienda'
import { OG_ANCHO, OG_ALTO } from '@/lib/compartir'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Solo se descargan fotos del storage público de nuestro propio Supabase
const PREFIJO_STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
const MARGEN = 30

function noEncontrado() {
  return new Response('No encontrado', {
    status: 404,
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ archivo: string }> }
) {
  const { archivo } = await params
  const m = /^([a-z0-9-]{1,200})\.jpg$/i.exec(archivo)
  if (!m) return noEncontrado()
  const slug = m[1]

  const { data: p } = await supabase
    .from('productos')
    .select('tipo, producto_imagenes(url, posicion)')
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle()
  if (!p || !productoVisible(p)) return noEncontrado()

  const foto = (p.producto_imagenes || [])
    .slice()
    .sort((a: any, b: any) => a.posicion - b.posicion)
    .map((i: any) => i.url as string)
    .find(Boolean)
  if (!foto || !foto.startsWith(PREFIJO_STORAGE)) return noEncontrado()

  const resp = await fetch(foto)
  if (!resp.ok) return noEncontrado()
  const original = Buffer.from(await resp.arrayBuffer())

  try {
    // Se recorta el margen blanco de la foto para que el producto se vea grande
    const plana = await sharp(original).flatten({ background: '#ffffff' }).toBuffer()
    let recortada = plana
    try {
      recortada = await sharp(plana).trim({ threshold: 12 }).toBuffer()
    } catch {
      // Foto sin bordes que recortar: se usa completa
    }

    const { data, info } = await sharp(recortada)
      .resize({
        width: OG_ANCHO - MARGEN * 2,
        height: OG_ALTO - MARGEN * 2,
        fit: 'inside',
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // El fondo de las fotos es casi blanco (254): se lleva a blanco puro con
    // una transición suave para que no se note un recuadro sobre el lienzo.
    for (let i = 0; i < data.length; i += info.channels) {
      const min = Math.min(data[i], data[i + 1], data[i + 2])
      if (min >= 246) {
        data[i] = data[i + 1] = data[i + 2] = 255
      } else if (min >= 236) {
        const t = (min - 236) / 10
        for (let k = 0; k < 3; k++) data[i + k] = Math.round(data[i + k] + (255 - data[i + k]) * t)
      }
    }
    const producto = await sharp(data, { raw: info }).png().toBuffer()

    const jpg = await sharp({
      create: { width: OG_ANCHO, height: OG_ALTO, channels: 3, background: '#ffffff' },
    })
      .composite([{ input: producto, gravity: 'center' }])
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()

    return new Response(new Uint8Array(jpg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(jpg.length),
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
      },
    })
  } catch (e) {
    console.error('og producto:', slug, e)
    return noEncontrado()
  }
}
