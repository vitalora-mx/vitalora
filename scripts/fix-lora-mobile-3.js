const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'LoraChat.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("left: isMobile")) {
  console.log('El contenedor ya es responsive. Nada que hacer.')
  process.exit(0)
}

// Reemplazar linea por linea de forma robusta (cada una es unica en su contexto del contenedor).
// Usamos las 6 lineas juntas con la indentacion exacta (12 espacios).
const viejo = "            position: 'fixed',\n            bottom: '32px',\n            right: '32px',\n            width: '420px',\n            height: '640px',\n            maxHeight: 'calc(100vh - 64px)',"

const nuevo = "            position: 'fixed',\n            bottom: isMobile ? '12px' : '32px',\n            right: isMobile ? '12px' : '32px',\n            left: isMobile ? '12px' : 'auto',\n            top: isMobile ? '76px' : 'auto',\n            width: isMobile ? 'auto' : '420px',\n            height: isMobile ? 'auto' : '640px',\n            maxHeight: isMobile ? 'none' : 'calc(100vh - 64px)',"

if (content.includes(viejo)) {
  content = content.replace(viejo, nuevo)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('Listo: contenedor del chat ahora es responsive.')
} else {
  console.log('No coincidio el bloque de 6 lineas. Intentando reemplazos individuales...')
  let ok = 0
  const reemplazos = [
    ["            bottom: '32px',", "            bottom: isMobile ? '12px' : '32px',"],
    ["            right: '32px',", "            right: isMobile ? '12px' : '32px',\n            left: isMobile ? '12px' : 'auto',\n            top: isMobile ? '76px' : 'auto',"],
    ["            width: '420px',", "            width: isMobile ? 'auto' : '420px',"],
    ["            height: '640px',", "            height: isMobile ? 'auto' : '640px',"],
    ["            maxHeight: 'calc(100vh - 64px)',", "            maxHeight: isMobile ? 'none' : 'calc(100vh - 64px)',"],
  ]
  for (const [v, n] of reemplazos) {
    if (content.includes(v)) { content = content.replace(v, n); ok++ }
    else console.log('  No se encontro: ' + v.trim())
  }
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('Reemplazos individuales aplicados: ' + ok + '/5')
}
