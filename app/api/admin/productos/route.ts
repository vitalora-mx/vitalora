import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('productos')
    .select('*, producto_imagenes(*), producto_videos(*), producto_variantes(*, variante_imagenes(*))')
    .or('archivado.is.null,archivado.eq.false')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
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
  try {
    const body = await req.json()
    const { id, videos, componentes, ...campos } = body

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('productos').update(campos).eq('id', id).select().single()

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
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data: imagenes } = await supabaseAdmin.from('producto_imagenes').select('url').eq('producto_id', id)
  if (imagenes) {
    for (const img of imagenes) {
      const path = img.url.split('/productos/')[1]
      if (path) await supabaseAdmin.storage.from('productos').remove([decodeURIComponent(path)])
    }
  }

  // Borrar imagenes de variantes del storage antes de borrar el producto
  const { data: variantes } = await supabaseAdmin.from('producto_variantes').select('id').eq('producto_id', id)
  if (variantes) {
    for (const v of variantes) {
      const { data: vImgs } = await supabaseAdmin.from('variante_imagenes').select('url').eq('variante_id', v.id)
      if (vImgs) {
        for (const img of vImgs) {
          const path = img.url.split('/productos/')[1]
          if (path) await supabaseAdmin.storage.from('productos').remove([decodeURIComponent(path)])
        }
      }
    }
  }

  // Revisar si el producto tiene referencias (ventas o resenas) que impiden borrarlo.
    const { count: ventasCount } = await supabaseAdmin
      .from('pedido_items')
      .select('id', { count: 'exact', head: true })
      .eq('producto_id', id)
    const { count: resenasCount } = await supabaseAdmin
      .from('resenas')
      .select('id', { count: 'exact', head: true })
      .eq('producto_id', id)

    const tieneReferencias = (ventasCount || 0) > 0 || (resenasCount || 0) > 0

    if (tieneReferencias) {
      // Borrado logico: archivar y desactivar (conserva historial; lo oculta de tienda y admin)
      const { error: errArch } = await supabaseAdmin
        .from('productos')
        .update({ archivado: true, activo: false })
        .eq('id', id)
      if (errArch) return NextResponse.json({ error: errArch.message }, { status: 500 })
      return NextResponse.json({ success: true, archivado: true })
    }

    // Sin referencias: borrado fisico real
    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, archivado: false })
}
