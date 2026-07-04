const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'LoraChat.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1) Import de useIsMobile
if (!content.includes('useIsMobile')) {
  // Buscar la primera linea de import de react (puede variar)
  const anclaReact = "import { useState, useEffect, useRef } from 'react'"
  if (content.includes(anclaReact)) {
    content = content.replace(anclaReact, anclaReact + "\nimport { useIsMobile } from '@/hooks/useIsMobile'")
    cambios++
    console.log('1) Import de useIsMobile agregado.')
  } else {
    // Plan B: agregar despues del primer import que encontremos
    const primerImport = content.indexOf("import ")
    const finLinea = content.indexOf("\n", primerImport)
    content = content.slice(0, finLinea + 1) + "import { useIsMobile } from '@/hooks/useIsMobile'\n" + content.slice(finLinea + 1)
    cambios++
    console.log('1) Import agregado (plan B, tras el primer import).')
  }
} else {
  console.log('1) El import ya existe.')
}

// 2) Declarar const isMobile dentro del componente
if (!content.includes('const isMobile = useIsMobile()')) {
  const anclaFn = "export default function LoraChat() {"
  if (content.includes(anclaFn)) {
    content = content.replace(anclaFn, anclaFn + "\n  const isMobile = useIsMobile()")
    cambios++
    console.log('2) const isMobile declarado dentro del componente.')
  } else {
    console.log('2) No se encontro la funcion LoraChat. Abortado.')
    process.exit(1)
  }
} else {
  console.log('2) const isMobile ya existe.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios.')
