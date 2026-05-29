import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/tienda/ritual                -> top 20 (posicion 1-20) para la pagina Ritual
// GET /api/tienda/ritual?todos=1        -> todos los videos activos (pagina Ver mas)
// GET /api/tienda/ritual?slug=xxx       -> un video con sus productos relacionados
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const todos = searchParams.get('todos')

  // Detalle de un video por slug
  if (slug) {
    const { data: video, error } = await supabase
      .from('ritual_videos')
      .select('*, ritual_temas(nombre)')
      .eq('slug', slug)
      .eq('activo', true)
      .single()

    if (error || !video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    // Productos relacionados (con imagenes para el grid de abajo)
    const { data: relaciones } = await supabase
      .from('ritual_video_productos')
      .select('posicion, productos(*, producto_imagenes(*))')
      .eq('video_id', video.id)
      .order('posicion', { ascending: true })

    const productos = (relaciones || [])
      .map((r: { productos: unknown }) => r.productos)
      .filter(Boolean)

    return NextResponse.json({ ...video, productos })
  }

  // Lista de videos
  let query = supabase
    .from('ritual_videos')
    .select('*, ritual_temas(nombre)')
    .eq('activo', true)

  if (todos) {
    // Todos, mas recientes primero (para la pagina Ver mas estilo Netflix)
    query = query.order('created_at', { ascending: false })
  } else {
    // Solo top 20 con posicion asignada, en orden
    query = query
      .not('posicion', 'is', null)
      .order('posicion', { ascending: true })
      .limit(20)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
