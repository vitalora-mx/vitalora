const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'recuperar', 'nueva', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1) Agregar lectura del parametro "destino" despues de leer el token
const anclaToken = "const token = searchParams.get('token') ?? ''"
if (content.includes(anclaToken) && !content.includes("searchParams.get('destino')")) {
  const nuevo = anclaToken + "\n  const destino = searchParams.get('destino') ?? ''"
  content = content.replace(anclaToken, nuevo)
  cambios++
  console.log('1) Lectura del parametro destino agregada.')
} else if (content.includes("searchParams.get('destino')")) {
  console.log('1) Ya existia la lectura de destino, omitido.')
} else {
  console.log('1) NO se encontro el ancla del token. Revisar manualmente.')
}

// 2) Cambiar el boton/enlace final segun destino.
//    Buscamos el bloque del enlace a /cuenta (con ancla parcial sin acentos).
const anclaBoton = '<a href="/cuenta"'
if (content.includes(anclaBoton)) {
  content = content.replace(
    anclaBoton,
    '<a href={destino === \'admin\' ? "/admin" : "/cuenta"}'
  )
  cambios++
  console.log('2) Enlace final ahora redirige a /admin para invitaciones de admin.')
} else {
  console.log('2) NO se encontro el enlace a /cuenta. Revisar manualmente.')
}

// 3) Cambiar el texto del boton "Iniciar sesion" para que sea dinamico.
//    El texto puede tener acento corrupto, asi que usamos ancla sin la palabra completa.
const anclaTextoBoton = '>Iniciar sesi'
const idxTexto = content.indexOf(anclaTextoBoton)
if (idxTexto !== -1) {
  // Encontrar el cierre del texto "</a>" despues de ese punto
  const idxCierre = content.indexOf('</a>', idxTexto)
  if (idxCierre !== -1) {
    // Reemplazar todo el texto entre ">" y "</a>"
    const inicioTexto = idxTexto + 1 // despues del ">"
    const textoActual = content.slice(inicioTexto, idxCierre)
    const nuevoTexto = "{destino === 'admin' ? 'Entrar al admin' : 'Iniciar sesion'}"
    content = content.slice(0, inicioTexto) + nuevoTexto + content.slice(idxCierre)
    cambios++
    console.log('3) Texto del boton ahora es dinamico (Entrar al admin / Iniciar sesion).')
  }
} else {
  console.log('3) NO se encontro el texto del boton. Omitido (no critico).')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios aplicados.')
