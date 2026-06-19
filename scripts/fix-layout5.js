const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

const ICONO_FACTURAS = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'

// Agregar Facturas en la sección Operación, después de Pedidos
const BUSCAR = `{ label: 'Pedidos', href: '/admin/pedidos', badgeKey: 'pedidos', icon: ICON('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>') },`

if (!content.includes(BUSCAR)) {
  console.log('❌ No se encontró el ancla (Pedidos). Verifica el layout.tsx.')
  process.exit(1)
}

const REEMPLAZAR = `{ label: 'Pedidos', href: '/admin/pedidos', badgeKey: 'pedidos', icon: ICON('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>') },
      { label: 'Facturas', href: '/admin/facturas', badgeKey: 'facturas', icon: ICON('${ICONO_FACTURAS}') },`

content = content.split(BUSCAR).join(REEMPLAZAR)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Sidebar actualizado: Facturas agregado en Operación.')
