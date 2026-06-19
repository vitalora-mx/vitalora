import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/admin/resenas?estado=pendiente  (o aprobada / rechazada / todas)
// Lista reseñas con el nombre del producto, para moderar.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado') || 'pendiente'

  let query = supabaseAdmin
    .from('resenas')
    .select('*, productos(nombre, slug, tipo)')
    .order('created_at', { ascending: false })

  if (estado !== 'todas') {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT /api/admin/resenas  { id, estado }
// Cambia el estado de una reseña (aprobada / rechazada / pendiente).
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, estado } = body
  if (!id || !estado) return NextResponse.json({ error: 'ID y estado requeridos' }, { status: 400 })
  if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin
    .from('resenas').update({ estado }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/resenas?id=X  (borrar una reseña definitivamente)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const { error } = await supabaseAdmin.from('resenas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
