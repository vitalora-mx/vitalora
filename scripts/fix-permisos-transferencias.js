const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'lib', 'admin-permisos.ts')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("/admin/transferencias")) {
  console.log('Transferencias ya esta en permisos. Nada que hacer.')
  process.exit(0)
}

// Insertar '/admin/transferencias' despues de cada aparicion de '/admin/pedidos',
// (la version con coma al final). Aparece en TODAS_SECCIONES, gerente y ventas.
// Usamos un replace global del patron exacto de la linea de pedidos.
const patronPedidos = "'/admin/pedidos',"
const cantidad = (content.match(/\/admin\/pedidos',/g) || []).length

// Reemplazo: agregar la linea de transferencias justo despues, preservando indentacion.
// Como la indentacion puede variar, hacemos un replace que duplica el patron con la nueva linea.
content = content.split(patronPedidos).join("'/admin/pedidos',\n  '/admin/transferencias',")

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: /admin/transferencias agregado en ' + cantidad + ' lugares (dueno via TODAS_SECCIONES, gerente, ventas).')
