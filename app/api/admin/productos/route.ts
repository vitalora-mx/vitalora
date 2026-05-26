import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('productos')
    .select('*, producto_imagenes(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { data: producto, error } = await supabaseAdmin
      .from('productos')
      .insert({
        slug: body.slug,
        nombre: body.nombre,
        marca: body.marca,
        categoria: body.categoria,
        tipo: body.tipo,
        precio: body.precio,
        precio_original: body.precio_original || null,
        descripcion: body.descripcion || '',
        ingredientes: body.ingredientes || '',
        como_usar: body.como_usar || '',
        tag: body.tag || '',
        certificaciones: body.certificaciones || [],
        beneficios: body.beneficios || [],
        para_quien: body.para_quien || '',
        advertencias: body.advertencias || '',
        como_tomar: body.como_tomar || '',
        video_url: body.video_url || '',
        peso_g: body.peso_g || null,
        alto_cm: body.alto_cm || null,
        ancho_cm: body.ancho_cm || null,
        largo_cm: body.largo_cm || null,
        stock: body.stock || 0,
        sku: body.sku || null,
        codigo_barras: body.codigo_barras || null,
        activo: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (body.tipo === 'kit' && body.componentes && body.componentes.length > 0) {
      const componentes = body.componentes.map((c: any) => ({
        kit_id: producto.id,
        producto_id: c.producto_id,
        cantidad: c.cantidad || 1,
      }))
      await supabaseAdmin.from('kit_componentes').insert(componentes)
    }

    return NextResponse.json(producto)
  } catch (error) {
    return NextResponse.json({ error: 'Error creando producto' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, componentes, ...campos } = body

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('productos')
      .update(campos)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (campos.tipo === 'kit' && componentes) {
      await supabaseAdmin.from('kit_componentes').delete().eq('kit_id', id)
      if (componentes.length > 0) {
        const nuevos = componentes.map((c: any) => ({ kit_id: id, producto_id: c.producto_id, cantidad: c.cantidad || 1 }))
        await supabaseAdmin.from('kit_componentes').insert(nuevos)
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

  const { data: imagenes } = await supabaseAdmin
    .from('producto_imagenes')
    .select('url')
    .eq('producto_id', id)

  if (imagenes) {
    for (const img of imagenes) {
      const path = img.url.split('/productos/')[1]
      if (path) await supabaseAdmin.storage.from('productos').remove([path])
    }
  }

  const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
