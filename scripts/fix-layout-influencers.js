const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

const ICONO_INFLUENCERS = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'

// Agregar Influencers en la sección Marketing, después de Cupones
const BUSCAR = `      { label: 'Cupones', href: '/admin/codigos', icon: ICON('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },`

if (!content.includes(BUSCAR)) {
  console.log('❌ No se encontró el ancla (Cupones). Verifica el layout.tsx.')
  process.exit(1)
}

const REEMPLAZAR = `      { label: 'Cupones', href: '/admin/codigos', icon: ICON('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
      { label: 'Influencers', href: '/admin/influencers', icon: ICON('${ICONO_INFLUENCERS}') },`

content = content.split(BUSCAR).join(REEMPLAZAR)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Sidebar actualizado: Influencers agregado en Marketing.')
