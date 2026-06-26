const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'api', 'admin', 'productos', 'route.ts')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('tieneReferencias')) {
  console.log('El DELETE inteligente ya existe. Nada que hacer.')
  process.exit(0)
}

// Buscar la linea del delete fisico con regex flexible (cualquier indentacion)
const regexDelete = /const \{ error \} = await supabaseAdmin\.from\('productos'\)\.delete\(\)\.eq\('id', id\)/

if (!regexDelete.test(content)) {
  console.log('NO se encontro la linea del delete. Abortado.')
  process.exit(1)
}

// Encontrar la posicion de esa linea
const match = content.match(regexDelete)
const idxDelete = content.indexOf(match[0])

// Encontrar el final del bloque (la linea return success que le sigue)
const anclaReturn = "return NextResponse.json({ success: true })"
const idxReturn = content.indexOf(anclaReturn, idxDelete)
if (idxReturn === -1) {
  console.log('NO se encontro el return success. Abortado.')
  process.exit(1)
}
const finBloque = idxReturn + anclaReturn.length

// El bloque viejo va desde el inicio del delete hasta el final del return
const bloqueNuevo = `// Revisar si el producto tiene referencias (ventas o resenas) que impiden borrarlo.
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
      // Borrado logico: archivar y desactivar (conserva historial; lo oculta de tienda y admin)
      const { error: errArch } = await supabaseAdmin
        .from('productos')
        .update({ archivado: true, activo: false })
        .eq('id', id)
      if (errArch) return NextResponse.json({ error: errArch.message }, { status: 500 })
      return NextResponse.json({ success: true, archivado: true })
    }

    // Sin referencias: borrado fisico real
    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, archivado: false })`

content = content.slice(0, idxDelete) + bloqueNuevo + content.slice(finBloque)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: DELETE inteligente aplicado (archiva si hay referencias, borra si no).')
