import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { optimizarImagen, rutasDeImagen, SUFIJO_MINIATURA } from '@/lib/optimizar-imagen'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: sube una foto de variante, optimizada en WebP (máx. 1600 px) + miniatura de 600 px
export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const varianteId = formData.get('variante_id') as string
    const posicion = formData.get('posicion') as string

    const varianteNum = parseInt(varianteId)
    if (!file || !Number.isInteger(varianteNum) || varianteNum <= 0) {
      return NextResponse.json({ error: 'Archivo y variante_id requeridos' }, { status: 400 })
    }

    const opt = await optimizarImagen(await file.arrayBuffer())
    if (!opt.ok) return NextResponse.json({ error: opt.error }, { status: 400 })

    const nombre = `variantes/${varianteNum}/${Date.now()}`
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
      .from('variante_imagenes')
      .insert({
        variante_id: varianteNum,
        url: publicUrl,
        url_miniatura: urlMiniatura,
        posicion: parseInt(posicion || '0') || 0,
      })

    if (dbError) {
      await bucket.remove([rutaPrincipal, rutaMiniatura])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl, url_miniatura: urlMiniatura })
  } catch (error) {
    console.error('Error subiendo imagen de variante:', error)
    return NextResponse.json({ error: 'Error subiendo imagen de variante' }, { status: 500 })
  }
}

// DELETE ?id=123 -> borra una imagen de variante (del storage, con su miniatura, y de la BD)
export async function DELETE(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data: img } = await supabaseAdmin.from('variante_imagenes').select('url, url_miniatura').eq('id', id).single()
  if (img) {
    const rutas = rutasDeImagen(img, 'productos')
    if (rutas.length) await supabaseAdmin.storage.from('productos').remove(rutas)
  }

  const { error } = await supabaseAdmin.from('variante_imagenes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
