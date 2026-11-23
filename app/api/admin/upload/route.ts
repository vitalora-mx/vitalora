import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { optimizarImagen, SUFIJO_MINIATURA } from '@/lib/optimizar-imagen'
import { estadoProducto, MENSAJE_ARCHIVADO } from '@/lib/productos-admin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: sube una foto de producto. Se guarda optimizada en WebP (máx. 1600 px)
// junto con su miniatura de 600 px (lib/optimizar-imagen.ts).
export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const productoId = formData.get('producto_id') as string
    const posicion = formData.get('posicion') as string

    const productoNum = parseInt(productoId)
    if (!file || !Number.isInteger(productoNum) || productoNum <= 0) {
      return NextResponse.json({ error: 'Archivo y producto_id requeridos' }, { status: 400 })
    }
    const estado = await estadoProducto(productoNum)
    if (!estado) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    if (estado.archivado) return NextResponse.json({ error: MENSAJE_ARCHIVADO }, { status: 409 })

    const opt = await optimizarImagen(await file.arrayBuffer())
    if (!opt.ok) return NextResponse.json({ error: opt.error }, { status: 400 })

    const nombre = `${productoNum}/${Date.now()}`
    const rutaPrincipal = `${nombre}.webp`
    const rutaMiniatura = `${nombre}${SUFIJO_MINIATURA}.webp`
    const bucket = supabaseAdmin.storage.from('productos')

    const subida = await bucket.upload(rutaPrincipal, opt.principal, { contentType: 'image/webp', upsert: false })
    if (subida.error) return NextResponse.json({ error: subida.error.message }, { status: 500 })
    const subidaMini = await bucket.upload(rutaMiniatura, opt.miniatura, { contentType: 'image/webp', upsert: false })
    if (subidaMini.error) {
      await bucket.remove([rutaPrincipal])
      return NextResponse.json({ error: subidaMini.error.message }, { status: 500 })
    }

    const publicUrl = bucket.getPublicUrl(rutaPrincipal).data.publicUrl
    const urlMiniatura = bucket.getPublicUrl(rutaMiniatura).data.publicUrl

    const { error: dbError } = await supabaseAdmin
      .from('producto_imagenes')
      .insert({
        producto_id: productoNum,
        url: publicUrl,
        url_miniatura: urlMiniatura,
        posicion: parseInt(posicion || '0') || 0,
      })

    if (dbError) {
      // No dejar archivos huérfanos si no se pudo guardar en la base
      await bucket.remove([rutaPrincipal, rutaMiniatura])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl, url_miniatura: urlMiniatura })
  } catch (error) {
    console.error('Error subiendo imagen de producto:', error)
    return NextResponse.json({ error: 'Error subiendo imagen' }, { status: 500 })
  }
}
