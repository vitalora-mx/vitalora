const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("/admin/lora")) {
  console.log('Lora ya esta en el sidebar. Nada que hacer.')
  process.exit(0)
}

// Ancla: el item de Reportes + el cierre completo de la seccion Contabilidad.
// Estructura real:
//       { label: 'Reportes', ... },
//       ],      <- cierra items
//     },        <- cierra seccion Contabilidad
//   ]           <- cierra SECCIONES
// Insertamos la nueva seccion entre "},"(cierre Contabilidad) y "]"(cierre SECCIONES).
const ancla = `{ label: 'Reportes', href: '/admin/reportes', icon: ICON('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>') },
      ],
    },`

if (!content.includes(ancla)) {
  console.log('NO se encontro el ancla de Reportes + cierre (puede diferir el formato). Abortado.')
  const anclaAlt = `{ label: 'Reportes', href: '/admin/reportes',`
  if (content.includes(anclaAlt)) {
    console.log('Se encontro la linea de Reportes pero el cierre del array difiere. Revisar manualmente.')
  }
  process.exit(1)
}

// Nueva seccion Asistente con Lora, insertada DESPUES del cierre de Contabilidad
const iconoLora = `ICON('<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>')`

const nuevaSeccion = ancla + `
  {
    label: 'Asistente',
    items: [
      { label: 'Lora', href: '/admin/lora', icon: ${iconoLora} },
    ],
  },`

content = content.replace(ancla, nuevaSeccion)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: seccion Asistente con Lora agregada al sidebar.')
