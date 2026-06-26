const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'api', 'admin', 'productos', 'route.ts')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) GET admin: filtrar productos archivados.
//    Buscamos el .order del GET y agregamos un .eq('archivado', false) antes.
//    El GET hace: .from('productos').select(...).order('created_at', ...)
//    Insertamos el filtro justo despues del select( gigante, antes del .order.
// ─────────────────────────────────────────────────────────────
if (!content.includes(".or('archivado.is.null,archivado.eq.false')")) {
  const anclaOrder = ".order('created_at', { ascending: false })"
  const idxGet = content.indexOf('export async function GET()')
  const idxOrderEnGet = content.indexOf(anclaOrder, idxGet)
  if (idxGet !== -1 && idxOrderEnGet !== -1) {
    // Insertar el filtro justo antes del .order (incluye productos sin archivar o archivado=false)
    const filtro = ".or('archivado.is.null,archivado.eq.false')\n    "
    content = content.slice(0, idxOrderEnGet) + filtro + content.slice(idxOrderEnGet)
    cambios++
    console.log('1) GET admin ahora oculta productos archivados.')
  } else {
    console.log('1) No se pudo ubicar el .order del GET. Revisar manualmente.')
  }
} else {
  console.log('1) GET ya filtra archivados, omitido.')
}

// ─────────────────────────────────────────────────────────────
// 2) DELETE inteligente: archivar si hay referencias, borrar si no.
//    Reemplazamos la linea final del DELETE:
//      const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
//      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
//      return NextResponse.json({ success: true })
// ─────────────────────────────────────────────────────────────
const bloqueViejo = `  const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })`

const bloqueNuevo = `  // Revisar si el producto tiene referencias (ventas o resenas) que impiden borrarlo.
    const { count: ventasCount } = await supabaseAdmin
      .from('pedido_items')
      .select('id', { count: 'exact', head: true })
      .eq('producto_id', id)
    const { count: resenasCount } = await supabaseAdmin
      .from('resenas')
      .select('id', { count: 'exact', head: true })
      .eq('producto_id', id)

    const tieneReferencias = (ventasCount || 0) > 0 || (resenasCount || 0) > 0

    if (tieneReferencias) {
      // Borrado logico: archivar (conserva el historial de pedidos/resenas)
      const { error: errArch } = await supabaseAdmin
        .from('productos')
        .update({ archivado: true })
        .eq('id', id)
      if (errArch) return NextResponse.json({ error: errArch.message }, { status: 500 })
      return NextResponse.json({ success: true, archivado: true })
    }

    // Sin referencias: borrado fisico real
    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, archivado: false })`

if (content.includes(bloqueViejo)) {
  content = content.replace(bloqueViejo, bloqueNuevo)
  cambios++
  console.log('2) DELETE ahora archiva si hay referencias, borra si no.')
} else {
  console.log('2) No se encontro el bloque exacto del DELETE. Revisar indentacion.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios aplicados en el API de productos.')
