import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  // Prueba 1: consulta simple sin variantes
  const simple = await supabase
    .from('productos')
    .select('id, nombre, precio, activo')
    .eq('activo', true)

  // Prueba 2: consulta con variantes
  const conVariantes = await supabase
    .from('productos')
    .select('id, nombre, producto_variantes (nombre, stock)')
    .eq('activo', true)
    .limit(2)

  return NextResponse.json({
    simple: {
      count: simple.data?.length ?? 0,
      error: simple.error?.message ?? null,
      primeros: simple.data?.slice(0, 3) ?? [],
    },
    conVariantes: {
      count: conVariantes.data?.length ?? 0,
      error: conVariantes.error?.message ?? null,
      muestra: conVariantes.data ?? [],
    },
  })
}
