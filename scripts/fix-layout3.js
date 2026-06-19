const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// 1. Agregar "Personas" (Clientes) después de la sección Catálogo
const ICONO_CLIENTES = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'

const NUEVA_SECCION_PERSONAS = `
  {
    label: 'Personas',
    items: [
      { label: 'Clientes', href: '/admin/clientes', icon: ICON('${ICONO_CLIENTES}') },
    ],
  },`

// 2. Agregar "Contabilidad" (Reportes) al final antes del cierre del array
const ICONO_REPORTES = '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'

const NUEVA_SECCION_CONTABILIDAD = `
  {
    label: 'Contabilidad',
    items: [
      { label: 'Reportes', href: '/admin/reportes', icon: ICON('${ICONO_REPORTES}') },
    ],
  },`

// Insertar Personas después de la sección Marketing
const BUSCAR_MARKETING_FIN = `    },
  {
    label: 'Marketing',`

if (!content.includes(BUSCAR_MARKETING_FIN)) {
  console.log('❌ No se encontró el ancla para insertar "Personas". Verifica el layout.tsx.')
  process.exit(1)
}

// Insertar Contabilidad antes del cierre del array SECCIONES (antes del ']')
// Buscamos el último item de Marketing (Cupones) y agregamos después
const BUSCAR_CUPONES_FIN = `      { label: 'Cupones', href: '/admin/codigos', icon: ICON('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
    ],
  },
]`

if (!content.includes(BUSCAR_CUPONES_FIN)) {
  console.log('❌ No se encontró el ancla para insertar "Contabilidad". Verifica el layout.tsx.')
  process.exit(1)
}

// Reemplazar el cierre del array para agregar ambas secciones
const REEMPLAZAR_CIERRE = `      { label: 'Cupones', href: '/admin/codigos', icon: ICON('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
    ],
  },
  {
    label: 'Personas',
    items: [
      { label: 'Clientes', href: '/admin/clientes', icon: ICON('${ICONO_CLIENTES}') },
    ],
  },
  {
    label: 'Contabilidad',
    items: [
      { label: 'Reportes', href: '/admin/reportes', icon: ICON('${ICONO_REPORTES}') },
    ],
  },
]`

content = content.split(BUSCAR_CUPONES_FIN).join(REEMPLAZAR_CIERRE)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Sidebar actualizado: Clientes (Personas) y Reportes (Contabilidad) agregados.')
