import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { rutasDeImagen } from '@/lib/optimizar-imagen'
import { estadoProducto, MENSAJE_ARCHIVADO } from '@/lib/productos-admin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req, ['/admin/productos', '/admin/ritual'])
  if (!adminAuth.ok) return adminAuth.response

  // ?id=123 -> un solo producto, INCLUIDO si está archivado (para la página de edición)
  const idParam = new URL(req.url).searchParams.get('id')
  if (idParam !== null) {
    const id = parseInt(idParam)
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    const { data: uno, error: errUno } = await supabaseAdmin
      .from('productos')
      .select('*, producto_imagenes(*), producto_videos(*), producto_variantes(*, variante_imagenes(*))')
      .eq('id', id)
      .maybeSingle()
    if (errUno) return NextResponse.json({ error: errUno.message }, { status: 500 })
    if (!uno) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    return NextResponse.json(uno)
  }

  // Lista: sin archivados
  const { data, error } = await supabaseAdmin
    .from('productos')
    .select('*, producto_imagenes(*), producto_videos(*), producto_variantes(*, variante_imagenes(*))')
    .or('archivado.is.null,archivado.eq.false')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  try {
    const body = await req.json()
    const { videos, componentes, ...campos } = body

    const { data: producto, error } = await supabaseAdmin
      .from('productos')
      .insert({
        slug: campos.slug, nombre: campos.nombre, marca: campos.marca,
        categoria: campos.categoria, tipo: campos.tipo, precio: campos.precio,
        precio_original: campos.precio_original || null,
        descripcion: campos.descripcion || '', ingredientes: campos.ingredientes || '',
        como_usar: campos.como_usar || '', tag: campos.tag || '',
        certificaciones: campos.certificaciones || [], beneficios: campos.beneficios || [],
        para_quien: campos.para_quien || '', advertencias: campos.advertencias || '',
        como_tomar: campos.como_tomar || '', video_url: campos.video_url || '',
        peso_g: campos.peso_g || null, alto_cm: campos.alto_cm || null,
        ancho_cm: campos.ancho_cm || null, largo_cm: campos.largo_cm || null,
        stock: campos.stock || 0, sku: campos.sku || null,
        codigo_barras: campos.codigo_barras || null, activo: true,
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (videos && videos.length > 0) {
      const videosData = videos.filter((v: any) => v.youtube_url && v.titulo).map((v: any, i: number) => ({
        producto_id: producto.id, youtube_url: v.youtube_url, titulo: v.titulo, posicion: i,
      }))
      if (videosData.length > 0) await supabaseAdmin.from('producto_videos').insert(videosData)
    }

    if (campos.categoria === 'Kits' && componentes && componentes.length > 0) {
      const comps = componentes.map((c: any) => ({ kit_id: producto.id, producto_id: c.producto_id, cantidad: c.cantidad || 1 }))
      await supabaseAdmin.from('kit_componentes').insert(comps)
    }

    return NextResponse.json(producto)
  } catch (error) {
    return NextResponse.json({ error: 'Error creando producto' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  try {
    const body = await req.json()
    const { id, videos, componentes, ...campos } = body

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    // Nunca se sobrescribe un producto archivado (ni uno que no existe)
    const estado = await estadoProducto(Number(id))
    if (!estado) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    if (estado.archivado) return NextResponse.json({ error: MENSAJE_ARCHIVADO }, { status: 409 })
    // El archivado solo se cambia con PATCH (restaurar) o DELETE
    delete (campos as Record<string, unknown>).archivado

    const { data, error } = await supabaseAdmin
      .from('productos').update(campos).eq('id', id).or('archivado.is.null,archivado.eq.false').select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (videos !== undefined) {
      await supabaseAdmin.from('producto_videos').delete().eq('producto_id', id)
      if (videos.length > 0) {
        const videosData = videos.filter((v: any) => v.youtube_url && v.titulo).map((v: any, i: number) => ({
          producto_id: id, youtube_url: v.youtube_url, titulo: v.titulo, posicion: i,
        }))
        if (videosData.length > 0) await supabaseAdmin.from('producto_videos').insert(videosData)
      }
    }

    if (campos.categoria === 'Kits' && componentes) {
      await supabaseAdmin.from('kit_componentes').delete().eq('kit_id', id)
      if (componentes.length > 0) {
        const comps = componentes.map((c: any) => ({ kit_id: id, producto_id: c.producto_id, cantidad: c.cantidad || 1 }))
        await supabaseAdmin.from('kit_componentes').insert(comps)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error editando producto' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '')
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  // ¿Tiene ventas o reseñas? Entonces se ARCHIVA y se conserva todo (fotos, miniaturas y filas: es historial)
  const { count: ventasCount } = await supabaseAdmin
    .from('pedido_items')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id)
  const { count: resenasCount } = await supabaseAdmin
    .from('resenas')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id)

  if ((ventasCount || 0) > 0 || (resenasCount || 0) > 0) {
    // Borrado lógico: archivar y desactivar (lo oculta de tienda y admin; las fotos se quedan)
    const { error: errArch } = await supabaseAdmin
      .from('productos')
      .update({ archivado: true, activo: false })
      .eq('id', id)
    if (errArch) return NextResponse.json({ error: errArch.message }, { status: 500 })
    return NextResponse.json({ success: true, archivado: true })
  }

  // Sin ventas ni reseñas: borrado real. Primero se juntan las rutas de fotos y miniaturas
  const { data: imagenes } = await supabaseAdmin.from('producto_imagenes').select('url, url_miniatura').eq('producto_id', id)
  const { data: variantes } = await supabaseAdmin.from('producto_variantes').select('id').eq('producto_id', id)
  const idsVariantes = (variantes || []).map(v => v.id)
  const { data: vImgs } = idsVariantes.length
    ? await supabaseAdmin.from('variante_imagenes').select('url, url_miniatura').in('variante_id', idsVariantes)
    : { data: [] as { url: string; url_miniatura: string | null }[] }
  const rutas = [...(imagenes || []), ...(vImgs || [])].flatMap(img => rutasDeImagen(img, 'productos'))

  // Se borra el producto; si falla, no se toca ningún archivo
  const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filas que pudieran quedar (si alguna tabla no borra en cascada) y luego los archivos
  await supabaseAdmin.from('producto_imagenes').delete().eq('producto_id', id)
  if (idsVariantes.length) {
    await supabaseAdmin.from('variante_imagenes').delete().in('variante_id', idsVariantes)
    await supabaseAdmin.from('producto_variantes').delete().eq('producto_id', id)
  }
  if (rutas.length) {
    const { error: errStorage } = await supabaseAdmin.storage.from('productos').remove(rutas)
    if (errStorage) console.error('Producto borrado, pero falló borrar sus archivos:', errStorage)
  }
  return NextResponse.json({ success: true, archivado: false })
}

// PATCH { id, accion: 'restaurar' } -> saca un producto del archivo.
// Queda INACTIVO (no visible en la tienda) para revisarlo antes de activarlo.
export async function PATCH(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  const body = await req.json().catch(() => ({}))
  const id = Number(body?.id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  if (body?.accion !== 'restaurar') return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('productos')
    .update({ archivado: false, activo: false })
    .eq('id', id)
    .eq('archivado', true)
    .select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if ((data?.length ?? 0) === 0) return NextResponse.json({ error: 'El producto no existe o no está archivado' }, { status: 409 })
  return NextResponse.json({ success: true })
}
