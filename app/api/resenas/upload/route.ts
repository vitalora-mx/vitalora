import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCliente } from '@/lib/cliente-auth'
import { optimizarImagen, SUFIJO_MINIATURA } from '@/lib/optimizar-imagen'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel corta las peticiones de más de ~4.5 MB; el formulario reduce antes las fotos grandes
const MAX_BYTES = 4.5 * 1024 * 1024

// POST /api/resenas/upload
// Sube una foto de reseña al bucket "resenas" y devuelve su URL pública.
// Se guarda optimizada en WebP (máx. 1600 px) junto con su miniatura {ts}-600.webp
// (ver miniaturaResena en lib/imagenes.ts).
// Requiere sesión de cliente (cookie httpOnly, lib/cliente-auth.ts).
export async function POST(req: NextRequest) {
  try {
    const auth = await requireCliente(req)
    if (!auth.ok) return auth.response
    const userId = auth.cliente.id

    const formData = await req.formData()
    const file = formData.get('file') as File
    const productoId = formData.get('producto_id') as string

    if (!file || !productoId) {
      return NextResponse.json({ error: 'Archivo y producto_id requeridos.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'La imagen es demasiado pesada. Intenta con otra foto.' }, { status: 400 })
    }

    const productoNum = parseInt(productoId)
    if (!Number.isInteger(productoNum) || productoNum <= 0) {
      return NextResponse.json({ error: 'Producto no válido.' }, { status: 400 })
    }

    // Valida que sea una imagen real (JPG, PNG o WebP) y la optimiza
    const opt = await optimizarImagen(await file.arrayBuffer())
    if (!opt.ok) return NextResponse.json({ error: opt.error }, { status: 400 })

    // Ruta: producto/usuario/timestamp.webp (+ miniatura timestamp-600.webp)
    const nombre = `${productoNum}/${userId}/${Date.now()}`
    const rutaPrincipal = `${nombre}.webp`
    const rutaMiniatura = `${nombre}${SUFIJO_MINIATURA}.webp`
    const bucket = supabaseAdmin.storage.from('resenas')

    const subida = await bucket.upload(rutaPrincipal, opt.principal, { contentType: 'image/webp', upsert: false })
    if (subida.error) {
      console.error('Error subiendo foto de reseña:', subida.error)
      return NextResponse.json({ error: 'No se pudo subir la imagen.' }, { status: 500 })
    }
    const subidaMini = await bucket.upload(rutaMiniatura, opt.miniatura, { contentType: 'image/webp', upsert: false })
    if (subidaMini.error) {
      console.error('Error subiendo miniatura de reseña:', subidaMini.error)
      await bucket.remove([rutaPrincipal])
      return NextResponse.json({ error: 'No se pudo subir la imagen.' }, { status: 500 })
    }

    const { data: { publicUrl } } = bucket.getPublicUrl(rutaPrincipal)
    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error subiendo foto de reseña:', error)
    return NextResponse.json({ error: 'Error subiendo la imagen.' }, { status: 500 })
  }
}
