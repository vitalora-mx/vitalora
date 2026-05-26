import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — listar marcas ordenadas A-Z
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')

  let query = supabaseAdmin
    .from('marcas')
    .select('*')
    .eq('activa', true)
    .order('nombre', { ascending: true })

  if (tipo && tipo !== 'ambos') {
    query = query.or(`tipo.eq.${tipo},tipo.eq.ambos`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — crear marca
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.nombre || !body.tipo) {
    return NextResponse.json({ error: 'Nombre y tipo requeridos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('marcas')
    .insert({ nombre: body.nombre, tipo: body.tipo })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — eliminar marca
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('marcas')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
