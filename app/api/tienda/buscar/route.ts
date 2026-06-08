import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// DICCIONARIO DE SINONIMOS
// Cada grupo son palabras que significan lo mismo. Si el cliente
// busca una, tambien se busca por las demas del grupo.
// Para agregar mas: solo agrega un nuevo array al final de la lista.
// ============================================================
const GRUPOS_SINONIMOS: string[][] = [
  ['protector solar', 'bloqueador', 'sunscreen', 'spf', 'fotoprotector'],
  ['crema', 'humectante', 'moisturizer', 'hidratante'],
  ['serum', 'suero', 'esencia', 'ampolla', 'ampoule', 'essence'],
  ['limpiador', 'limpiadora', 'cleanser', 'jabon facial', 'gel limpiador'],
  ['tonico', 'toner', 'mist', 'bruma'],
  ['mascarilla', 'mascara facial', 'mask', 'parche'],
  ['contorno de ojos', 'crema de ojos', 'eye cream'],
  ['labial', 'labios', 'lip', 'balsamo labial', 'lip balm'],
  ['exfoliante', 'peeling', 'scrub'],
  ['acne', 'granos', 'espinillas', 'barros'],
  ['arrugas', 'antiedad', 'antiarrugas', 'antiaging', 'lineas de expresion'],
  ['manchas', 'despigmentante', 'aclarante', 'iluminador'],
  ['colageno', 'collagen'],
  ['vitamina c', 'vitamin c', 'acido ascorbico'],
  ['cabello', 'pelo', 'capilar', 'shampoo', 'champu', 'acondicionador'],
  ['proteina', 'protein', 'whey'],
]

// Dado un termino, devuelve la lista de terminos a buscar (el original + sinonimos)
function expandirSinonimos(termino: string): string[] {
  const t = termino.toLowerCase().trim()
  const terminos = new Set<string>([t])
  for (const grupo of GRUPOS_SINONIMOS) {
    // Si el termino coincide con alguna palabra del grupo (o la contiene), agrega todo el grupo
    const coincide = grupo.some(palabra => t.includes(palabra) || palabra.includes(t))
    if (coincide) {
      grupo.forEach(palabra => terminos.add(palabra))
    }
  }
  return Array.from(terminos)
}

// GET /api/tienda/buscar?q=texto
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const terminos = expandirSinonimos(q)

  // Buscar cada termino con la funcion sin acentos y juntar resultados sin duplicar
  const porId = new Map<number, any>()
  for (const termino of terminos) {
    const { data, error } = await supabase.rpc('buscar_productos', { termino })
    if (!error && Array.isArray(data)) {
      for (const p of data) {
        if (!porId.has(p.id)) porId.set(p.id, p)
      }
    }
  }

  const ids = Array.from(porId.keys())
  if (ids.length === 0) return NextResponse.json([])

  // Traer los productos completos (con imagenes y variantes) de los ids encontrados
  const { data: completos, error: err2 } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*), producto_variantes(*, variante_imagenes(*))')
    .in('id', ids)
    .eq('activo', true)

  if (err2) return NextResponse.json({ error: err2.message }, { status: 500 })

  return NextResponse.json(completos || [])
}
