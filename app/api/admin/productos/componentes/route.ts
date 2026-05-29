import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const kitId = searchParams.get('kit_id')

  if (!kitId) return NextResponse.json({ error: 'kit_id requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('kit_componentes')
    .select('producto_id, cantidad')
    .eq('kit_id', parseInt(kitId))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
