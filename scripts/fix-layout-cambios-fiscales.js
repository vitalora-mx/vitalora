const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

const ICONO = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>'

// Insertar despues del item Pagos
const LINEA_PAGOS = content.match(/\{ label: 'Pagos'[^\n]*\},/)
if (!LINEA_PAGOS) {
  console.log('No se encontro la linea de Pagos en el sidebar.')
  process.exit(1)
}

if (content.includes("label: 'Cambios fiscales'")) {
  console.log('El item ya existe. Nada que hacer.')
  process.exit(0)
}

const lineaCompleta = LINEA_PAGOS[0]
const reemplazo = lineaCompleta + "\n      { label: 'Cambios fiscales', href: '/admin/cambios-fiscales', icon: ICON('" + ICONO + "') },"

content = content.replace(lineaCompleta, reemplazo)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: Cambios fiscales agregado al sidebar.')
