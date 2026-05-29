import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET -> todos los temas
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ritual_temas')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST -> crear tema nuevo
export async function POST(req: NextRequest) {
  const { nombre } = await req.json()
  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: 'El nombre del tema no puede estar vacio' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('ritual_temas')
    .insert({ nombre: nombre.trim() })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ese tema ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// DELETE -> borrar tema
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('ritual_temas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
