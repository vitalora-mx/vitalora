const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("/admin/transferencias")) {
  console.log('Transferencias ya esta en el sidebar. Nada que hacer.')
  process.exit(0)
}

// Localizar el final de la linea de Pedidos (termina con "0"/>') },)
// Anclamos en el inicio de la linea de Facturas para insertar antes.
const anclaFacturas = "{ label: 'Facturas', href: '/admin/facturas'"
const idx = content.indexOf(anclaFacturas)
if (idx === -1) {
  console.log('NO se encontro la linea de Facturas. Abortado.')
  process.exit(1)
}

// Icono de transferencia (dos flechas en intercambio)
const iconoTransfer = `ICON('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>')`

const nuevaLinea = `{ label: 'Transferencias', href: '/admin/transferencias', icon: ${iconoTransfer} },
      `

content = content.slice(0, idx) + nuevaLinea + content.slice(idx)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: Transferencias agregado al sidebar despues de Pedidos.')
