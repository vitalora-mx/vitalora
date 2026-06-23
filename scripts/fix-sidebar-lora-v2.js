const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("/admin/lora")) {
  console.log('Lora ya esta en el sidebar. Nada que hacer.')
  process.exit(0)
}

// 1) Localizar la linea de Reportes (unica)
const idxReportes = content.indexOf("label: 'Reportes', href: '/admin/reportes'")
if (idxReportes === -1) {
  console.log('NO se encontro la linea de Reportes. Abortado.')
  process.exit(1)
}

// 2) Desde ahi, encontrar el fin de esa linea (el "},")
//    La linea de Reportes termina con "') }," seguido de salto de linea.
const finLineaReportes = content.indexOf('},', idxReportes)
if (finLineaReportes === -1) {
  console.log('NO se encontro el cierre de la linea de Reportes. Abortado.')
  process.exit(1)
}

// 3) Despues de la linea de Reportes viene:
//    \n    ],   (cierra items de Contabilidad)
//    \n  },     (cierra seccion Contabilidad)
//    Necesitamos insertar la nueva seccion despues de ese "  },".
//    Buscamos el primer "]," despues de Reportes (cierre de items):
const idxCierreItems = content.indexOf('],', finLineaReportes)
// Luego el primer "}," despues de ese cierre de items (cierre de la seccion):
const idxCierreSeccion = content.indexOf('},', idxCierreItems)
if (idxCierreSeccion === -1) {
  console.log('NO se encontro el cierre de la seccion Contabilidad. Abortado.')
  process.exit(1)
}

// Punto de insercion: justo despues de "}," del cierre de la seccion Contabilidad
const puntoInsercion = idxCierreSeccion + 2 // +2 para incluir "},"

const iconoLora = `ICON('<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>')`

const nuevaSeccion = `
  {
    label: 'Asistente',
    items: [
      { label: 'Lora', href: '/admin/lora', icon: ${iconoLora} },
    ],
  },`

content = content.slice(0, puntoInsercion) + nuevaSeccion + content.slice(puntoInsercion)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: seccion Asistente con Lora agregada al sidebar (insercion por posicion).')
