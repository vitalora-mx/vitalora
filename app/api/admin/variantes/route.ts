import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET ?producto_id=123  -> lista las variantes de un producto con sus imagenes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productoId = searchParams.get('producto_id')
  if (!productoId) return NextResponse.json({ error: 'producto_id requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('producto_variantes')
    .select('*, variante_imagenes(*)')
    .eq('producto_id', productoId)
    .order('posicion', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST -> crea una variante. Body: { producto_id, nombre, tipo, sku, codigo_barras, stock, precio, posicion }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('producto_variantes')
      .insert({
        producto_id: body.producto_id,
        nombre: body.nombre,
        tipo: body.tipo || null,
        sku: body.sku || null,
        codigo_barras: body.codigo_barras || null,
        stock: body.stock || 0,
        precio: body.precio ?? null,  // null = hereda precio del producto
        posicion: body.posicion || 0,
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error creando variante' }, { status: 500 })
  }
}

// PUT -> actualiza una variante. Body: { id, ...campos }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...campos } = body
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('producto_variantes')
      .update({
        nombre: campos.nombre,
        tipo: campos.tipo || null,
        sku: campos.sku || null,
        codigo_barras: campos.codigo_barras || null,
        stock: campos.stock || 0,
        precio: campos.precio ?? null,
        posicion: campos.posicion || 0,
      })
      .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error editando variante' }, { status: 500 })
  }
}

// DELETE ?id=123 -> borra una variante y sus imagenes del storage
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  // Borrar imagenes del storage
  const { data: imagenes } = await supabaseAdmin.from('variante_imagenes').select('url').eq('variante_id', id)
  if (imagenes) {
    for (const img of imagenes) {
      const path = img.url.split('/productos/')[1]
      if (path) await supabaseAdmin.storage.from('productos').remove([decodeURIComponent(path)])
    }
  }

  // Borrar la variante (las filas de variante_imagenes se borran solas por el ON DELETE CASCADE)
  const { error } = await supabaseAdmin.from('producto_variantes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
