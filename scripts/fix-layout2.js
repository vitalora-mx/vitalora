const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')

// Leer como buffer para manejar cualquier codificación
const buffer = fs.readFileSync(filePath)
let content = buffer.toString('utf8')

// Mostrar qué hay alrededor de "Operaci" para diagnóstico
const idx = content.indexOf('Operaci')
if (idx >= 0) {
  const slice = content.slice(idx, idx + 20)
  const codes = Array.from(slice).map(c => c.charCodeAt(0))
  console.log('Texto encontrado:', JSON.stringify(slice))
  console.log('Códigos:', codes)
} else {
  console.log('No se encontró "Operaci" en el archivo')
}

// Reemplazos usando los bytes corruptos literales (latin1 mal interpretado como utf8)
// Ã³ = ó, Ã¡ = á, Ã± = ñ, Ã" = Ó
const reemplazos = [
  ['\u00C3\u00B3', 'ó'],   // Ã³ → ó
  ['\u00C3\u00A1', 'á'],   // Ã¡ → á
  ['\u00C3\u00B1', 'ñ'],   // Ã± → ñ
  ['\u00C3\u0093', 'Ó'],   // Ã" → Ó  (ADMINISTRACIÓN)
  ['\u00C3\u00A9', 'é'],   // Ã© → é
  ['\u00C3\u00AD', 'í'],   // Ã­ → í
  ['\u00C3\u00BA', 'ú'],   // Ãº → ú
]

let cambios = 0
for (const [corrupto, correcto] of reemplazos) {
  const antes = content
  content = content.split(corrupto).join(correcto)
  if (content !== antes) {
    cambios++
    console.log(`✅ Reemplazado: ${JSON.stringify(corrupto)} → ${correcto}`)
  }
}

if (cambios === 0) {
  console.log('⚠️  No se encontraron patrones corruptos con este método.')
  console.log('El archivo puede estar en UTF-16 u otra codificación.')
} else {
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`\n✅ Archivo guardado con ${cambios} tipos de corrección.`)
}
