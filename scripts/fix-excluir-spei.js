const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'api', 'crear-preferencia', 'route.ts')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('excluded_payment_types')) {
  console.log('La exclusion de SPEI ya existe. Nada que hacer.')
  process.exit(0)
}

// Anclar en external_reference: String(pedido.id) y agregar payment_methods despues
const ancla = 'external_reference: String(pedido.id),'

if (!content.includes(ancla)) {
  console.log('NO se encontro el ancla external_reference. Abortado.')
  process.exit(1)
}

// Agregar el bloque de exclusion de transferencia SPEI (bank_transfer)
// despues de external_reference, dentro del body de la preferencia
const nuevo = `external_reference: String(pedido.id),
        payment_methods: {
          // Excluir transferencia bancaria SPEI: las transferencias van por el sistema manual de Vitalora.
          // Se mantienen tarjetas, efectivo (OXXO) y dinero en cuenta de Mercado Pago.
          excluded_payment_types: [
            { id: 'bank_transfer' },
          ],
        },`

content = content.replace(ancla, nuevo)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: SPEI (bank_transfer) excluido del checkout de Mercado Pago.')
