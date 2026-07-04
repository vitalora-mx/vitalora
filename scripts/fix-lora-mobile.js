const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'LoraChat.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Importar useIsMobile (despues del import de react)
// ─────────────────────────────────────────────────────────────
if (!content.includes('useIsMobile')) {
  const anclaImport = "import { useState, useEffect, useRef } from 'react'"
  if (content.includes(anclaImport)) {
    content = content.replace(anclaImport, anclaImport + "\nimport { useIsMobile } from '@/hooks/useIsMobile'")
    cambios++
    console.log('1) Import de useIsMobile agregado.')
  } else {
    console.log('1) No se encontro el import de react. Abortado.')
    process.exit(1)
  }
}

// ─────────────────────────────────────────────────────────────
// 2) Declarar const isMobile dentro del componente
//    Lo agregamos justo despues del primer useState (const [open...])
// ─────────────────────────────────────────────────────────────
if (!content.includes('const isMobile = useIsMobile()')) {
  const anclaOpen = "const [open, setOpen] = useState(false)"
  if (content.includes(anclaOpen)) {
    content = content.replace(anclaOpen, "const isMobile = useIsMobile()\n  const [open, setOpen] = useState(false)")
    cambios++
    console.log('2) const isMobile declarado.')
  } else {
    console.log('2) No se encontro const [open...]. Abortado.')
    process.exit(1)
  }
}

// ─────────────────────────────────────────────────────────────
// 3) Hacer responsive el contenedor del chat
//    Reemplazar el bloque de posicion/tamano fijo
// ─────────────────────────────────────────────────────────────
const contenedorViejo = `            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '420px',
            height: '640px',
            maxHeight: 'calc(100vh - 64px)',`

const contenedorNuevo = `            position: 'fixed',
            bottom: isMobile ? '12px' : '32px',
            right: isMobile ? '12px' : '32px',
            left: isMobile ? '12px' : 'auto',
            width: isMobile ? 'auto' : '420px',
            height: isMobile ? 'auto' : '640px',
            top: isMobile ? '76px' : 'auto',
            maxHeight: isMobile ? 'none' : 'calc(100vh - 64px)',`

if (content.includes(contenedorViejo)) {
  content = content.replace(contenedorViejo, contenedorNuevo)
  cambios++
  console.log('3) Contenedor del chat ahora es responsive.')
} else {
  console.log('3) No se encontro el bloque exacto del contenedor. Abortado.')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios en LoraChat.')
