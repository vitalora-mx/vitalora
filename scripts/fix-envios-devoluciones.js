const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'envios-devoluciones', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Insertar nueva seccion de zonas extendidas despues de "2. Costos de envio"
//    Anclamos en el inicio de la seccion 3 ("3. Tiempos de entrega") e insertamos antes.
// ─────────────────────────────────────────────────────────────
if (!content.includes('zonas extendidas pueden tener')) {
  // Buscar el objeto de la seccion 3 (su apertura). Usamos ancla sin acentos.
  const ancla3 = "{ titulo: '3. Tiempos de entrega'"
  const idx3 = content.indexOf(ancla3)
  if (idx3 !== -1) {
    const nuevaSeccion = `{ titulo: 'Env\u00edos a zonas extendidas', contenido: 'Algunas localidades de dif\u00edcil acceso o zonas extendidas pueden tener un costo de env\u00edo adicional que no se refleja en el total de tu compra. Si tu domicilio se encuentra en una de estas zonas, nos pondremos en contacto contigo antes de procesar tu pedido para informarte.' },\n  `
    content = content.slice(0, idx3) + nuevaSeccion + content.slice(idx3)
    cambios++
    console.log('1) Seccion de zonas extendidas agregada.')
  } else {
    console.log('1) No se encontro la seccion 3. Revisar.')
  }
} else {
  console.log('1) La seccion de zonas extendidas ya existe, omitido.')
}

// ─────────────────────────────────────────────────────────────
// 2) Corregir la seccion 5: quitar mencion a "Mercado Envios".
//    Buscamos el contenido de la seccion 5 y reemplazamos la frase problematica.
//    El texto corrupto contiene "gu??a de Mercado Env??os se genera autom??ticamente"
//    Usamos anclas por posicion alrededor de "Mercado Env" dentro de la seccion 5.
// ─────────────────────────────────────────────────────────────
// Buscar "la guia ... de Mercado Envios se genera automaticamente con los datos"
// y reemplazar por "la guia se genera con los datos".
// Como hay acentos corruptos, anclamos en "de Mercado Env" + buscamos hasta "con los datos".
const idxME = content.indexOf('de Mercado Env')
if (idxME !== -1) {
  // Buscar hacia atras "gu" (de "guia") y hacia adelante "con los datos"
  const idxConDatos = content.indexOf('con los datos', idxME)
  if (idxConDatos !== -1) {
    // Buscar el inicio: la palabra antes de "de Mercado" suele ser "gu??a " o similar.
    // Reemplazamos desde "de Mercado Env...se genera autom??ticamente " hasta justo antes de "con los datos".
    // Para ser seguros, reemplazamos el segmento [idxME, idxConDatos) por "se genera "
    const antes = content.slice(0, idxME)
    const despues = content.slice(idxConDatos)
    // Quitamos un posible "gu??a " que quede antes de idxME para evitar "la guia se genera... guia"
    content = antes + 'se genera ' + despues
    cambios++
    console.log('2) Mencion a Mercado Envios corregida en seccion 5.')
  } else {
    console.log('2) No se encontro "con los datos". Revisar manualmente.')
  }
} else {
  console.log('2) No se encontro "de Mercado Env". Quiza ya fue corregido.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios aplicados.')
