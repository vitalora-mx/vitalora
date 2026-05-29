import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Extrae el ID de YouTube de cualquier formato de URL
function extraerYoutubeId(url: string): string | null {
  if (!url) return null
  const patrones = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
  ]
  for (const p of patrones) {
    const m = url.match(p)
    if (m && m[1]) return m[1]
  }
  // Si pegaron solo el ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return null
}

function generarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

// GET -> todos los videos (admin) con su tema y productos relacionados
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ritual_videos')
    .select('*, ritual_temas(nombre), ritual_video_productos(producto_id, posicion)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST -> crear o actualizar video
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    id, titulo, descripcion, youtube_url, tema_id, tipo, posicion, productos,
  } = body

  if (!titulo || !youtube_url) {
    return NextResponse.json({ error: 'Faltan titulo o URL de YouTube' }, { status: 400 })
  }

  const youtube_id = extraerYoutubeId(youtube_url)
  if (!youtube_id) {
    return NextResponse.json({ error: 'No se pudo leer el ID del video de YouTube. Revisa la URL.' }, { status: 400 })
  }

  const posicionFinal = posicion === '' || posicion === null || posicion === undefined
    ? null
    : Number(posicion)

  // Validar posicion duplicada (1-20)
  if (posicionFinal !== null) {
    if (posicionFinal < 1 || posicionFinal > 20) {
      return NextResponse.json({ error: 'La posicion debe ser del 1 al 20.' }, { status: 400 })
    }
    let checkQuery = supabaseAdmin
      .from('ritual_videos')
      .select('id, titulo')
      .eq('posicion', posicionFinal)
      .eq('activo', true)
    if (id) checkQuery = checkQuery.neq('id', id)
    const { data: ocupada } = await checkQuery.maybeSingle()
    if (ocupada) {
      return NextResponse.json(
        { error: `La posicion #${posicionFinal} ya esta ocupada por "${ocupada.titulo}". Elige otra o libera esa primero.` },
        { status: 409 }
      )
    }
  }

  const slug = generarSlug(titulo)

  const registro = {
    titulo,
    slug,
    descripcion: descripcion || '',
    youtube_url,
    youtube_id,
    tema_id: tema_id || null,
    tipo: tipo || 'ambos',
    posicion: posicionFinal,
  }

  let videoId = id

  if (id) {
    const { error } = await supabaseAdmin.from('ritual_videos').update(registro).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { data, error } = await supabaseAdmin.from('ritual_videos').insert(registro).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    videoId = data.id
  }

  // Actualizar productos relacionados: borrar y re-insertar
  await supabaseAdmin.from('ritual_video_productos').delete().eq('video_id', videoId)
  if (Array.isArray(productos) && productos.length > 0) {
    const filas = productos.map((pid: number, i: number) => ({
      video_id: videoId,
      producto_id: pid,
      posicion: i,
    }))
    await supabaseAdmin.from('ritual_video_productos').insert(filas)
  }

  return NextResponse.json({ ok: true, id: videoId })
}

// DELETE -> borrar video
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('ritual_videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
