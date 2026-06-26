const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'productos', 'editar', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('moverPreview')) {
  console.log('Las funciones de reordenar previews ya existen. Nada que hacer.')
  process.exit(0)
}

// Insertar las funciones moverPreview y hacerPrincipalPreview justo despues de quitarImagenNueva.
// quitarImagenNueva termina con:
//   setPreviewsNuevas(prev => prev.filter((_, idx) => idx !== i))
//   }
const ancla = `  function quitarImagenNueva(i: number) {
    setImagenesNuevas(prev => prev.filter((_, idx) => idx !== i))
    setPreviewsNuevas(prev => prev.filter((_, idx) => idx !== i))
  }`

if (!content.includes(ancla)) {
  console.log('NO se encontro la funcion quitarImagenNueva exacta. Revisar indentacion.')
  process.exit(1)
}

const nuevasFunciones = ancla + `

  // Reordena una foto NUEVA (preview, antes de guardar). Mueve ambos arrays a la vez.
  function moverPreview(index: number, direccion: number) {
    const nuevoIndex = index + direccion
    if (nuevoIndex < 0 || nuevoIndex >= previewsNuevas.length) return
    setPreviewsNuevas(prev => {
      const arr = [...prev]
      const tmp = arr[index]; arr[index] = arr[nuevoIndex]; arr[nuevoIndex] = tmp
      return arr
    })
    setImagenesNuevas(prev => {
      const arr = [...prev]
      const tmp = arr[index]; arr[index] = arr[nuevoIndex]; arr[nuevoIndex] = tmp
      return arr
    })
  }

  // Hace que una foto NUEVA sea la principal (la mueve al inicio).
  function hacerPrincipalPreview(index: number) {
    if (index === 0) return
    setPreviewsNuevas(prev => {
      const arr = [...prev]
      const [item] = arr.splice(index, 1)
      arr.unshift(item)
      return arr
    })
    setImagenesNuevas(prev => {
      const arr = [...prev]
      const [item] = arr.splice(index, 1)
      arr.unshift(item)
      return arr
    })
  }`

content = content.replace(ancla, nuevasFunciones)
fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: funciones moverPreview y hacerPrincipalPreview agregadas.')
