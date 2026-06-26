const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'checkout', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// Reemplazo del <img> de Mercado Pago (cualquier height actual) por uno mas grande (40px)
const mpRegex = /<img src="\/images\/pagos\/mercadopago\.png" alt="Mercado Pago" style=\{\{ height: '\d+px', width: 'auto' \}\} \/>/
if (mpRegex.test(content)) {
  content = content.replace(mpRegex, `<img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '40px', width: 'auto' }} />`)
  cambios++
  console.log('1) Logo de Mercado Pago agrandado a 40px.')
} else {
  console.log('1) No se encontro el img de MP.')
}

// Reemplazo del <img> de SPEI por uno mas grande (32px)
const speiRegex = /<img src="\/images\/pagos\/spei\.png" alt="SPEI" style=\{\{ height: '\d+px', width: 'auto' \}\} \/>/
if (speiRegex.test(content)) {
  content = content.replace(speiRegex, `<img src="/images/pagos/spei.png" alt="SPEI" style={{ height: '32px', width: 'auto' }} />`)
  cambios++
  console.log('2) Logo de SPEI agrandado a 32px.')
} else {
  console.log('2) No se encontro el img de SPEI.')
}

// Ademas, mover el logo a la derecha: cambiamos el contenedor del titulo+logo
// de "gap: '8px'" a que empuje el logo a la derecha con margin-left auto en el img.
// Como el img esta dentro de un flex con el titulo, le agregamos marginLeft auto.
// Lo hacemos reemplazando el estilo del img recien insertado para incluir marginLeft.
content = content.replace(
  `<img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '40px', width: 'auto' }} />`,
  `<img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '40px', width: 'auto', marginLeft: 'auto' }} />`
)
content = content.replace(
  `<img src="/images/pagos/spei.png" alt="SPEI" style={{ height: '32px', width: 'auto' }} />`,
  `<img src="/images/pagos/spei.png" alt="SPEI" style={{ height: '32px', width: 'auto', marginLeft: 'auto' }} />`
)

// Para que marginLeft auto funcione, el contenedor flex del titulo debe ocupar
// todo el ancho. Cambiamos los "gap: '8px'" de esos contenedores a incluir flex:1.
// El contenedor es: <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
content = content.split(`<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>`).join(`<div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>`)

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' logos agrandados y movidos a la derecha.')
