import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCliente } from '@/lib/cliente-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/resenas?producto_id=123
// Devuelve las reseñas APROBADAS de un producto + resumen (promedio y total)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productoId = searchParams.get('producto_id')

  if (!productoId) {
    return NextResponse.json({ error: 'Falta producto_id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('resenas')
    .select('id, autor_nombre, estrellas, titulo, comentario, fotos, created_at')
    .eq('producto_id', parseInt(productoId))
    .eq('estado', 'aprobada')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resenas = data || []
  const total = resenas.length
  const promedio = total > 0
    ? Math.round((resenas.reduce((s, r) => s + r.estrellas, 0) / total) * 10) / 10
    : 0

  return NextResponse.json({ resenas, total, promedio })
}

// POST /api/resenas
// Crea una reseña. Verifica que el usuario haya comprado el producto.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireCliente(req)
    if (!auth.ok) return auth.response
    const userId = auth.cliente.id

    const body = await req.json().catch(() => ({}))
    const { producto_id, estrellas } = body
    const titulo = typeof body.titulo === 'string' ? body.titulo.trim().slice(0, 120) : ''
    const comentario = typeof body.comentario === 'string' ? body.comentario.trim().slice(0, 2000) : ''
    const fotos: unknown = body.fotos

    // Validaciones básicas
    if (!producto_id || !estrellas) {
      return NextResponse.json({ error: 'Faltan datos obligatorios (producto y estrellas).' }, { status: 400 })
    }
    if (estrellas < 1 || estrellas > 5) {
      return NextResponse.json({ error: 'Las estrellas deben ser de 1 a 5.' }, { status: 400 })
    }
    if (Array.isArray(fotos) && fotos.length > 3) {
      return NextResponse.json({ error: 'Máximo 3 fotos por reseña.' }, { status: 400 })
    }
    // Solo se aceptan fotos subidas por este mismo usuario para este producto
    const prefijoFotos = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resenas/${parseInt(String(producto_id))}/${userId}/`
    const fotosValidas = Array.isArray(fotos)
      ? fotos.filter((f): f is string => typeof f === 'string' && f.startsWith(prefijoFotos) && !f.includes('..'))
      : []
    if (Array.isArray(fotos) && fotosValidas.length !== fotos.length) {
      return NextResponse.json({ error: 'Alguna foto no es válida. Súbela de nuevo.' }, { status: 400 })
    }

    // 1. Verificar que el usuario compró este producto (pedido pagado con este producto)
    const { data: pedidos } = await supabaseAdmin
      .from('pedidos')
      .select('id, estado, pedido_items(producto_id)')
      .eq('user_id', userId)
      .eq('estado', 'pagado')

    let pedidoCompra: number | null = null
    if (pedidos) {
      for (const p of pedidos) {
        const items = (p as any).pedido_items || []
        if (items.some((it: any) => it.producto_id === parseInt(String(producto_id)))) {
          pedidoCompra = p.id
          break
        }
      }
    }

    if (!pedidoCompra) {
      return NextResponse.json({ error: 'Solo puedes reseñar productos que hayas comprado.' }, { status: 403 })
    }

    // 2. Verificar que no haya reseñado ya este producto
    const { data: existente } = await supabaseAdmin
      .from('resenas')
      .select('id')
      .eq('producto_id', parseInt(String(producto_id)))
      .eq('user_id', userId)
      .maybeSingle()

    if (existente) {
      return NextResponse.json({ error: 'Ya dejaste una reseña para este producto.' }, { status: 409 })
    }

    // 3. Obtener el nombre del usuario para mostrarlo
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('nombre')
      .eq('id', userId)
      .single()

    const autorNombre = (perfil as any)?.nombre || 'Cliente Vitalora'

    // 4. Guardar la reseña como "pendiente" (para moderación)
    const { error: insertError } = await supabaseAdmin
      .from('resenas')
      .insert({
        producto_id: parseInt(String(producto_id)),
        user_id: userId,
        pedido_id: pedidoCompra,
        autor_nombre: autorNombre,
        estrellas: parseInt(String(estrellas)),
        titulo: titulo || null,
        comentario: comentario || null,
        fotos: fotosValidas,
        estado: 'pendiente',
      })

    if (insertError) {
      console.error('Error guardando reseña:', insertError)
      return NextResponse.json({ error: 'No se pudo guardar la reseña.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, mensaje: 'Tu reseña fue enviada y será revisada antes de publicarse.' })
  } catch (error) {
    console.error('Error en reseñas:', error)
    return NextResponse.json({ error: 'Error procesando la reseña.' }, { status: 500 })
  }
}
