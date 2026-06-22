const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'influencer', 'registro', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// El texto del checkbox tiene acentos corruptos en el archivo. Buscamos por el patrón estable.
// Reemplazamos todo el <span> del checkbox de términos.
const BUSCAR_INICIO = 'Acepto los t'
const idx = content.indexOf(BUSCAR_INICIO)

if (idx < 0) {
  console.log('❌ No se encontró el texto del checkbox de términos.')
  process.exit(1)
}

// Encontrar el </span> que cierra ese span
const finSpan = content.indexOf('</span>', idx)
if (finSpan < 0) {
  console.log('❌ No se encontró el cierre del span.')
  process.exit(1)
}

// El texto desde "Acepto los t..." hasta antes de </span>
const textoViejo = content.slice(idx, finSpan)

const textoNuevo = `Acepto los <a href="/influencer/terminos" target="_blank" style={{ color: '#C9A961', textDecoration: 'underline' }}>términos y condiciones</a> del programa de embajadoras: 5% de comisión sobre el subtotal de ventas (sin envío). El pago se solicita manualmente desde mi portal (mínimo $500 MXN), adjuntando mi factura CFDI. *`

content = content.replace(textoViejo, textoNuevo)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Checkbox de términos actualizado con enlace y texto correcto.')
