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
// Para agregar mas: solo agrega un nuevo array a la lista.
// ============================================================
const GRUPOS_SINONIMOS: string[][] = [
  // --- COSMETICOS (por categoria) ---
  ['serum', 'suero', 'esencia', 'ampolla', 'ampoule', 'essence', 'concentrado'],
  ['crema', 'humectante', 'hidratante', 'moisturizer', 'balsamo', 'balm', 'manteca', 'gel hidratante', 'crema facial', 'crema hidratante'],
  ['limpiador', 'limpiadora', 'cleanser', 'jabon facial', 'gel limpiador', 'desmaquillante', 'exfoliante', 'peeling', 'scrub', 'agua micelar', 'espuma limpiadora', 'doble limpieza'],
  ['tonico', 'toner', 'mist', 'bruma', 'esencia facial', 'agua facial', 'locion'],
  ['protector solar', 'bloqueador', 'sunscreen', 'spf', 'fotoprotector', 'filtro solar', 'proteccion solar', 'bloqueador solar'],
  ['contorno de ojos', 'crema de ojos', 'eye cream', 'parches de ojos', 'contorno', 'ojeras', 'bolsas'],
  ['mascarilla', 'mascara facial', 'mask', 'parche', 'sheet mask', 'mascarilla coreana', 'mascarilla hidratante', 'mascarilla de tela'],
  ['parches para acne', 'parches', 'pimple patch', 'parche granos', 'parche espinillas', 'acne', 'granos', 'espinillas', 'barros'],
  ['labial', 'labios', 'lip', 'balsamo labial', 'lip balm', 'brillo labial', 'gloss', 'tinta labial', 'lip tint', 'mascarilla labial'],
  ['maquillaje', 'makeup', 'make up', 'base', 'corrector', 'rubor', 'sombras', 'cushion', 'bb cream', 'cc cream'],
  ['cabello', 'pelo', 'capilar', 'shampoo', 'champu', 'acondicionador', 'tratamiento capilar', 'mascarilla capilar', 'aceite capilar', 'anticaspa'],
  ['dispositivo', 'device', 'masajeador', 'gua sha', 'rodillo', 'roller', 'herramienta facial', 'aparato'],
  ['corporal', 'cuerpo', 'body', 'crema corporal', 'locion corporal', 'exfoliante corporal', 'body lotion'],

  // --- SUPLEMENTOS (por categoria) ---
  ['vitaminas', 'vitamina', 'multivitaminico', 'vitamina c', 'vitamina d', 'vitamina b', 'complejo b', 'vitamin'],
  ['minerales', 'mineral', 'magnesio', 'zinc', 'hierro', 'calcio', 'potasio'],
  ['proteina', 'protein', 'whey', 'proteina en polvo', 'suero de leche', 'proteina vegana', 'isolate'],
  ['colageno', 'collagen', 'peptidos de colageno', 'colageno hidrolizado'],
  ['probioticos', 'probiotico', 'probiotic', 'flora intestinal', 'bacterias buenas', 'lactobacilos'],
  ['omega 3', 'omega', 'aceite de pescado', 'fish oil', 'dha', 'epa', 'acidos grasos'],
  ['antioxidantes', 'antioxidante', 'antioxidant', 'resveratrol', 'coenzima q10', 'glutation'],
  ['energia', 'energetico', 'energy', 'pre entreno', 'cafeina', 'vitalidad', 'fatiga', 'cansancio'],
  ['biotina', 'biotin', 'unas', 'belleza desde adentro'],
  ['digestion', 'digestivo', 'fibra', 'enzimas digestivas', 'inflamacion', 'colon', 'estomago'],

  // --- POR BENEFICIO (cruzan categorias) ---
  ['arrugas', 'antiedad', 'antiarrugas', 'antiaging', 'lineas de expresion', 'firmeza'],
  ['manchas', 'despigmentante', 'aclarante', 'iluminador', 'tono disparejo', 'hiperpigmentacion'],
  ['acne', 'granos', 'espinillas', 'barros', 'puntos negros', 'poros'],
  ['hidratacion', 'piel seca', 'resequedad'],
  ['piel grasa', 'control de grasa', 'sebo', 'brillo'],
  ['piel sensible', 'rojeces', 'irritacion'],
  ['ojeras', 'bolsas', 'ojos cansados'],
  ['caida del cabello', 'caspa', 'pelo danado'],
  ['sueno', 'dormir', 'insomnio', 'descanso', 'relajacion'],
  ['defensas', 'inmune', 'sistema inmunologico'],
  ['vitamina c', 'vitamin c', 'acido ascorbico'],
]

// Dado un termino, devuelve la lista de terminos a buscar (el original + sinonimos)
function expandirSinonimos(termino: string): string[] {
  const t = termino.toLowerCase().trim()
  const terminos = new Set<string>([t])
  for (const grupo of GRUPOS_SINONIMOS) {
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
