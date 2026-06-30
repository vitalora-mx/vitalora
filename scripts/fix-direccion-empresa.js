const fs = require('fs')
const path = require('path')

const dirVieja = 'Lago del Bosque 187, Real del Lago, C.P. 36690, Irapuato, Gto., México'
const dirNueva = 'Circuito Luna 103, Zirándaro, San Miguel de Allende, Guanajuato, C.P. 37749, México'

const archivos = [
  path.join(__dirname, '..', 'components', 'store', 'Footer.tsx'),
  path.join(__dirname, '..', 'app', '(store)', 'contacto', 'page.tsx'),
]

let totalCambios = 0

archivos.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('No existe: ' + filePath)
    return
  }
  let content = fs.readFileSync(filePath, 'utf8')
  if (content.includes(dirVieja)) {
    content = content.split(dirVieja).join(dirNueva)
    fs.writeFileSync(filePath, content, 'utf8')
    totalCambios++
    console.log('Direccion actualizada en: ' + path.basename(path.dirname(filePath)) + '/' + path.basename(filePath))
  } else {
    console.log('No se encontro la direccion vieja en: ' + path.basename(filePath) + ' (revisar)')
  }
})

console.log('\nTotal archivos actualizados: ' + totalCambios)
