const fs = require('fs')
const archivo = 'app/(store)/checkout/page.tsx'
let c = fs.readFileSync(archivo, 'utf8')

const cambios = [
  {
    nombre: 'Linea 493 - recuadro de envio',
    buscar: `                      {costoEnvio === 0 ? 'GRATIS' : '$99 MXN'}`,
    reemplazar: `                      {costoEnvio === 0 ? 'GRATIS' : \`$\${costoEnvio} MXN\`}`,
  },
  {
    nombre: 'Linea 591 - resumen de envio',
    buscar: `                  <span>{costoEnvio === 0 ? 'Gratis' : '$99 MXN'}</span>`,
    reemplazar: `                  <span>{costoEnvio === 0 ? 'Gratis' : \`$\${costoEnvio} MXN\`}</span>`,
  },
]

let ok = true
for (const cambio of cambios) {
  if (!c.includes(cambio.buscar)) {
    console.log('ERROR en: ' + cambio.nombre + ' — no se encontro el texto. NO se modifico nada.')
    ok = false
    break
  }
}

if (ok) {
  for (const cambio of cambios) {
    c = c.replace(cambio.buscar, cambio.reemplazar)
  }
  fs.writeFileSync(archivo, c, 'utf8')
  console.log('OK: los 2 textos de envio ahora muestran el monto real.')
} else {
  console.log('No se guardo ningun cambio. El archivo quedo intacto.')
}