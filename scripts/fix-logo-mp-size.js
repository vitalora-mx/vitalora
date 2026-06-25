const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'checkout', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// Aumentar el tamano del logo de Mercado Pago de 20px a 28px
const anclaMP = `<img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '20px', width: 'auto' }} />`
const nuevoMP = `<img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '28px', width: 'auto' }} />`

if (content.includes(anclaMP)) {
  content = content.replace(anclaMP, nuevoMP)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('Listo: logo de Mercado Pago aumentado a 28px.')
} else if (content.includes(nuevoMP)) {
  console.log('El logo ya esta en 28px.')
} else {
  console.log('No se encontro el logo de MP. Revisar manualmente.')
}
