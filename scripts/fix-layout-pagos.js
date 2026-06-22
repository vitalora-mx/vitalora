const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

const ICONO_PAGOS = '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>'

// Insertar Pagos después del item Influencers
const BUSCAR = "{ label: 'Influencers', href: '/admin/influencers',"

if (!content.includes(BUSCAR)) {
  console.log('❌ No se encontró el ancla (Influencers). Verifica el layout.tsx.')
  process.exit(1)
}

// Buscamos la línea completa de influencers para insertar después
const LINEA_INFLUENCERS = content.match(/\{ label: 'Influencers'[^\n]*\},/)
if (!LINEA_INFLUENCERS) {
  console.log('❌ No se pudo aislar la línea de Influencers.')
  process.exit(1)
}

const lineaCompleta = LINEA_INFLUENCERS[0]
const reemplazo = `${lineaCompleta}
      { label: 'Pagos', href: '/admin/influencer-pagos', icon: ICON('${ICONO_PAGOS}') },`

content = content.replace(lineaCompleta, reemplazo)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Sidebar actualizado: Pagos agregado después de Influencers.')
