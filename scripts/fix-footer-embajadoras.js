const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'Footer.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("/programa-embajadoras")) {
  console.log('El enlace ya existe. Nada que hacer.')
  process.exit(0)
}

// Insertar despues de Suplementos en la primera columna
const ANCLA = "{ label: 'Suplementos', href: '/suplementos' },"
if (!content.includes(ANCLA)) {
  console.log('No se encontro el ancla de Suplementos. Revisa manualmente.')
  process.exit(1)
}

const NUEVO = ANCLA + "\n                { label: 'Programa de embajadoras', href: '/programa-embajadoras' },"
content = content.replace(ANCLA, NUEVO)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: enlace Programa de embajadoras agregado al footer.')
