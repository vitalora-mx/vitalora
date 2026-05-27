import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')
  const slug = searchParams.get('slug')

  if (slug) {
    const { data, error } = await supabase
      .from('productos')
      .select('*, producto_imagenes(*), producto_videos(*)')
      .eq('slug', slug)
      .eq('activo', true)
      .single()

    if (error) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    return NextResponse.json(data)
  }

  let query = supabase
    .from('productos')
    .select('*, producto_imagenes(*), producto_videos(*)')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
