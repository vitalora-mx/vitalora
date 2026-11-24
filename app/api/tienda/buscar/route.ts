import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { productoVisible } from '@/lib/tienda'
import { palabrasDe, textoDe, coincideTodas } from '@/lib/busqueda'
import { expandirSinonimos } from '@/lib/sinonimos'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Límites de seguridad de la búsqueda
const MAX_LARGO_BUSQUEDA = 60
// (MAX_PALABRAS = 8 en lib/busqueda.ts; MAX_TERMINOS = 15 por palabra en lib/sinonimos.ts)

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
