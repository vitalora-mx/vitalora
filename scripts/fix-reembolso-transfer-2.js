const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'pedidos', '[id]', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1) Agregar metodo_pago a la interfaz Pedido (despues de paqueteria que ya agregamos)
if (!content.includes('metodo_pago: string | null')) {
  const ancla = 'paqueteria: string | null'
  if (content.includes(ancla)) {
    content = content.replace(ancla, "paqueteria: string | null\n  metodo_pago: string | null")
    cambios++
    console.log('1) metodo_pago agregado a la interfaz Pedido.')
  } else {
    console.log('1) No se encontro paqueteria en la interfaz. Revisar.')
  }
}

// 2) Agregar estado para la casilla de devolver stock (despues de montoReembolso)
if (!content.includes('devolverStockTransfer')) {
  const ancla = "const [montoReembolso, setMontoReembolso] = useState('')"
  if (content.includes(ancla)) {
    content = content.replace(ancla, ancla + "\n  const [devolverStockTransfer, setDevolverStockTransfer] = useState(false)")
    cambios++
    console.log('2) Estado devolverStockTransfer agregado.')
  } else {
    console.log('2) No se encontro montoReembolso. Revisar.')
  }
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios.')
