const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'api', 'admin', 'pedidos', '[id]', 'route.ts')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1) Agregar metodo_pago y paqueteria al select principal.
//    Ancla: "numero_guia, factura_url,"
if (!content.includes('metodo_pago,')) {
  const ancla = 'numero_guia, factura_url,'
  if (content.includes(ancla)) {
    content = content.replace(ancla, 'numero_guia, paqueteria, metodo_pago,\n        factura_url,')
    cambios++
    console.log('1) metodo_pago y paqueteria agregados al select.')
  } else {
    console.log('1) No se encontro ancla numero_guia. Revisar.')
  }
}

// 2) Agregar producto_id y variante_id a los pedido_items (para devolver stock).
//    Ancla: "nombre, marca, precio, cantidad, variante_nombre"
if (!content.includes('producto_id, variante_id')) {
  const anclaItems = 'nombre, marca, precio, cantidad, variante_nombre'
  if (content.includes(anclaItems)) {
    content = content.replace(anclaItems, 'producto_id, variante_id, nombre, marca, precio, cantidad, variante_nombre')
    cambios++
    console.log('2) producto_id y variante_id agregados a pedido_items.')
  } else {
    console.log('2) No se encontro ancla de pedido_items. Revisar.')
  }
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios en la consulta del pedido.')
