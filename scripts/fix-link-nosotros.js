const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'Footer.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("href: '/nosotros'")) {
  console.log('El link Nosotros ya existe. Nada que hacer.')
  process.exit(0)
}

const ancla = "{ label: 'Programa de embajadoras', href: '/programa-embajadoras' },"

if (content.includes(ancla)) {
  content = content.replace(ancla, ancla + "\n                { label: 'Nosotros', href: '/nosotros' },")
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('Listo: link Nosotros agregado a la seccion Tienda del footer.')
} else {
  console.log('No se encontro el ancla. Revisar.')
  process.exit(1)
}
