const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'inventario', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// Corregir el tipo del estado stocks para que acepte ambos valores de 'tipo'
const BUSCAR = `  const [stocks, setStocks] = useState(
    tieneVariantes
      ? producto.producto_variantes.map(v => ({ id: v.id, nombre: v.nombre, stock: v.stock, tipo: 'variante' as const }))
      : [{ id: producto.id, nombre: 'Stock general', stock: producto.stock ?? 0, tipo: 'producto' as const }]
  )`

const REEMPLAZAR = `  type StockItem = { id: string; nombre: string; stock: number; tipo: 'variante' | 'producto' }
  const [stocks, setStocks] = useState<StockItem[]>(
    tieneVariantes
      ? producto.producto_variantes.map(v => ({ id: v.id, nombre: v.nombre, stock: v.stock, tipo: 'variante' as const }))
      : [{ id: producto.id, nombre: 'Stock general', stock: producto.stock ?? 0, tipo: 'producto' as const }]
  )`

if (!content.includes(BUSCAR)) {
  console.log('❌ No se encontró el texto a reemplazar.')
  process.exit(1)
}

content = content.split(BUSCAR).join(REEMPLAZAR)
fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Error de TypeScript corregido en inventario/page.tsx')
