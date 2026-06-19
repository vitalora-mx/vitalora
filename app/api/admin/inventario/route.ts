import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Obtener productos con sus variantes
    const { data: productos, error } = await supabase
      .from('productos')
      .select(`
        id,
        nombre,
        slug,
        sku,
        categoria,
        precio,
        stock,
        activo,
        producto_variantes (
          id,
          nombre,
          stock
        )
      `)
      .order('nombre', { ascending: true })

    if (error) throw error

    // Calcular stats
    const stockBajo = productos?.filter(p => {
      const tieneVariantes = p.producto_variantes && p.producto_variantes.length > 0
      if (tieneVariantes) {
        return p.producto_variantes.some((v: { stock: number }) => v.stock <= 5)
      }
      return (p.stock ?? 0) <= 5
    }).length ?? 0

    const sinStock = productos?.filter(p => {
      const tieneVariantes = p.producto_variantes && p.producto_variantes.length > 0
      if (tieneVariantes) {
        return p.producto_variantes.every((v: { stock: number }) => v.stock === 0)
      }
      return (p.stock ?? 0) === 0
    }).length ?? 0

    const saludable = (productos?.length ?? 0) - stockBajo - sinStock

    const valorTotal = productos?.reduce((acc, p) => {
      const tieneVariantes = p.producto_variantes && p.producto_variantes.length > 0
      if (tieneVariantes) {
        const stockVariantes = p.producto_variantes.reduce((s: number, v: { stock: number }) => s + (v.stock ?? 0), 0)
        return acc + (stockVariantes * (p.precio ?? 0))
      }
      return acc + ((p.stock ?? 0) * (p.precio ?? 0))
    }, 0) ?? 0

    return NextResponse.json({
      productos: productos ?? [],
      stats: {
        stockBajo,
        sinStock,
        saludable,
        valorTotal,
        total: productos?.length ?? 0
      }
    })
  } catch (err) {
    console.error('Error inventario GET:', err)
    return NextResponse.json({ error: 'Error al cargar inventario' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { tipo, id, stock } = body

    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json({ error: 'Stock invalido' }, { status: 400 })
    }

    if (tipo === 'variante') {
      const { error } = await supabase
        .from('producto_variantes')
        .update({ stock })
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('productos')
        .update({ stock })
        .eq('id', id)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error inventario PATCH:', err)
    return NextResponse.json({ error: 'Error al actualizar stock' }, { status: 500 })
  }
}
