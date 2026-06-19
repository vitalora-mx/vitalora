const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

const ICONO_CLIENTES = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
const ICONO_REPORTES = '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'

// Buscamos el cierre de la sección Marketing + cierre del array
// Usamos los caracteres exactos que están en el archivo
const BUSCAR = `      { label: 'Cupones', href: '/admin/codigos', icon: ICON('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
    ],
  },
]`

if (!content.includes(BUSCAR)) {
  // Diagnóstico: mostrar los últimos 300 chars antes del cierre del array
  const idx = content.indexOf(']')
  const lastIdx = content.lastIndexOf('],\n  },\n]')
  console.log('❌ No se encontró el ancla exacta.')
  console.log('Buscando cierre del array SECCIONES...')
  console.log('Posición de último ],\n  },\n]:', lastIdx)
  if (lastIdx >= 0) {
    console.log('Texto alrededor:', JSON.stringify(content.slice(lastIdx - 100, lastIdx + 20)))
  }
  process.exit(1)
}

const REEMPLAZAR = `      { label: 'Cupones', href: '/admin/codigos', icon: ICON('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
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

content = content.split(BUSCAR).join(REEMPLAZAR)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Sidebar actualizado: Clientes y Reportes agregados.')
