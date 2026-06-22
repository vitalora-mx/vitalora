const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'influencer', 'terminos', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1. En "Registro y aprobación": aclarar que la factura va a la razón social fiscal
const v1 = 'Para participar es <strong>obligatorio poder emitir facturas (CFDI)</strong> a nombre de Vitalora por concepto de servicios de publicidad o comisiones por ventas.'
const n1 = 'Para participar es <strong>obligatorio poder emitir facturas (CFDI)</strong> a nombre de <strong>Vanguardia Importaciones &amp; Logística de México S.A. de C.V.</strong> (RFC: VIA210820163) por concepto de servicios de publicidad o comisiones por ventas.'
if (content.includes(v1)) { content = content.replace(v1, n1); cambios++ }

// 2. En "Obligaciones fiscales": especificar a quién se emite la factura
const v2 = 'Debes emitir la factura CFDI correspondiente a Vitalora por cada pago recibido.'
const n2 = 'Debes emitir la factura CFDI correspondiente a <strong>Vanguardia Importaciones &amp; Logística de México S.A. de C.V.</strong> por cada pago recibido.'
if (content.includes(v2)) { content = content.replace(v2, n2); cambios++ }

// 3. En "Obligaciones fiscales": dato de los datos fiscales disponibles en el portal (queda igual, solo confirmamos)
// (sin cambio necesario)

if (cambios === 0) {
  console.log('⚠️ No se encontraron los textos a reemplazar. Verifica el archivo.')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log(`✅ Términos actualizados: ${cambios} referencias fiscales corregidas a la razón social.`)
