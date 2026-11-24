import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { productoVisible } from '@/lib/tienda'
import { normalizar, palabrasDe, textoDe, coincideTodas } from '@/lib/busqueda'

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

// Límites de seguridad de la búsqueda
const MAX_LARGO_BUSQUEDA = 60
const MAX_TERMINOS = 15 // por palabra, contando la palabra y sus sinónimos
// (MAX_PALABRAS = 8 palabras por búsqueda, en lib/busqueda.ts)

const GRUPOS_NORMALIZADOS = GRUPOS_SINONIMOS.map(g => g.map(normalizar))

// Dada una palabra (ya normalizada), devuelve sus alternativas: ella misma + sinónimos
function expandirSinonimos(t: string): string[] {
  const terminos = new Set<string>([t])
  // Con menos de 3 letras no se expanden sinónimos ("ca" coincidía con casi todos los grupos)
  if (t.length < 3) return [t]
  for (const grupo of GRUPOS_NORMALIZADOS) {
    if (terminos.size >= MAX_TERMINOS) break
    const coincide = grupo.some(palabra => t.includes(palabra) || palabra.includes(t))
    if (coincide) {
      grupo.forEach(palabra => terminos.add(palabra))
    }
  }
  return Array.from(terminos).slice(0, MAX_TERMINOS)
}

// GET /api/tienda/buscar?q=texto
// Un producto aparece si CADA palabra (o un sinónimo suyo) está en sus campos, en cualquier orden.
// Orden: 1) las palabras tal cual en el nombre, 2) tal cual en nombre/marca/SKU/categoría,
// 3) con sinónimos en esos campos, 4) usando también descripción e ingredientes.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().slice(0, MAX_LARGO_BUSQUEDA)

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const palabras = palabrasDe(q)
  if (palabras.length === 0) return NextResponse.json([])
  const alternativas = palabras.map(expandirSinonimos)

  // Una sola consulta ligera con los campos de búsqueda de los productos activos
  const { data: candidatos, error: err1 } = await supabase
    .from('productos')
    .select('id, nombre, marca, sku, categoria, tipo, descripcion, ingredientes')
    .eq('activo', true)
    .or('archivado.is.null,archivado.eq.false')

  if (err1) {
    console.error('Error en búsqueda:', err1)
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }

  // Las palabras tal cual se escribieron van antes que las coincidencias por sinónimo
  const exactas = palabras.map(p => [p])
  const rango = new Map<number, number>()
  for (const p of (candidatos || []).filter(productoVisible)) {
    const nombre = textoDe(p.nombre)
    const principal = textoDe(p.nombre, p.marca, p.sku, p.categoria)
    if (coincideTodas(exactas, nombre)) rango.set(p.id, 0)
    else if (coincideTodas(exactas, principal)) rango.set(p.id, 1)
    else if (coincideTodas(alternativas, principal)) rango.set(p.id, 2)
    else if (coincideTodas(alternativas, textoDe(principal, p.descripcion, p.ingredientes))) rango.set(p.id, 3)
  }

  const ids = Array.from(rango.keys())
  if (ids.length === 0) return NextResponse.json([])

  // Traer los productos completos (con imagenes y variantes) de los ids encontrados
  const { data: completos, error: err2 } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*), producto_variantes(*, variante_imagenes(*))')
    .in('id', ids)
    .eq('activo', true)

  if (err2) {
    console.error('Error en búsqueda:', err2)
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }

  const ordenados = (completos || [])
    .filter(productoVisible)
    .sort((a, b) => (rango.get(a.id)! - rango.get(b.id)!) || String(a.nombre).localeCompare(String(b.nombre), 'es'))
  return NextResponse.json(ordenados)
}
