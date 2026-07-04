const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'LoraChat.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("left: isMobile")) {
  console.log('El contenedor ya es responsive. Nada que hacer.')
  process.exit(0)
}

// Indentacion real: 10 espacios.
// El bloque del chat es unico por contener width: '420px' y height: '640px'.
// Reemplazamos el bloque de 6 lineas con 10 espacios de indentacion.
const IND = '          ' // 10 espacios

const viejo =
  IND + "position: 'fixed',\n" +
  IND + "bottom: '32px',\n" +
  IND + "right: '32px',\n" +
  IND + "width: '420px',\n" +
  IND + "height: '640px',\n" +
  IND + "maxHeight: 'calc(100vh - 64px)',"

const nuevo =
  IND + "position: 'fixed',\n" +
  IND + "bottom: isMobile ? '12px' : '32px',\n" +
  IND + "right: isMobile ? '12px' : '32px',\n" +
  IND + "left: isMobile ? '12px' : 'auto',\n" +
  IND + "top: isMobile ? '76px' : 'auto',\n" +
  IND + "width: isMobile ? 'auto' : '420px',\n" +
  IND + "height: isMobile ? 'auto' : '640px',\n" +
  IND + "maxHeight: isMobile ? 'none' : 'calc(100vh - 64px)',"

if (content.includes(viejo)) {
  content = content.replace(viejo, nuevo)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('Listo: contenedor del chat ahora es responsive (indentacion 10 espacios).')
} else {
  // Plan B: reemplazar solo desde width: '420px' hacia arriba/abajo usando anclas unicas
  console.log('El bloque de 6 lineas no coincidio. Intentando por anclas unicas del chat...')

  // width y height son unicos (solo el chat los tiene)
  let ok = 0
  if (content.includes(IND + "width: '420px',")) {
    content = content.replace(IND + "width: '420px',", IND + "width: isMobile ? 'auto' : '420px',")
    ok++
  }
  if (content.includes(IND + "height: '640px',")) {
    content = content.replace(IND + "height: '640px',", IND + "height: isMobile ? 'auto' : '640px',")
    ok++
  }
  if (content.includes(IND + "maxHeight: 'calc(100vh - 64px)',")) {
    content = content.replace(IND + "maxHeight: 'calc(100vh - 64px)',", IND + "maxHeight: isMobile ? 'none' : 'calc(100vh - 64px)',\n" + IND + "left: isMobile ? '12px' : 'auto',\n" + IND + "top: isMobile ? '76px' : 'auto',")
    ok++
  }
  // Para bottom/right del chat: como aparecen 2 veces, reemplazamos la 2a ocurrencia
  // (la del chat viene despues de width: 420px). Usamos split en la parte del chat.
  const idxChat = content.indexOf("width: isMobile ? 'auto' : '420px'")
  if (idxChat !== -1) {
    // buscar hacia atras el bottom y right mas cercanos ANTES de width
    const antes = content.slice(0, idxChat)
    const despues = content.slice(idxChat)
    let antesMod = antes
    // reemplazar la ULTIMA ocurrencia de bottom/right en 'antes'
    const lastBottom = antesMod.lastIndexOf(IND + "bottom: '32px',")
    if (lastBottom !== -1) {
      antesMod = antesMod.slice(0, lastBottom) + IND + "bottom: isMobile ? '12px' : '32px'," + antesMod.slice(lastBottom + (IND + "bottom: '32px',").length)
      ok++
    }
    const lastRight = antesMod.lastIndexOf(IND + "right: '32px',")
    if (lastRight !== -1) {
      antesMod = antesMod.slice(0, lastRight) + IND + "right: isMobile ? '12px' : '32px'," + antesMod.slice(lastRight + (IND + "right: '32px',").length)
      ok++
    }
    content = antesMod + despues
  }

  fs.writeFileSync(filePath, content, 'utf8')
  console.log('Plan B aplicado. Cambios: ' + ok)
}
