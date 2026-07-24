const fs = require('fs')

const archivo = 'app/(admin)/admin/productos/editar/page.tsx'

const viejo = `const categoriasSuplementos = ['Vitaminas', 'Minerales', 'Proteínas', 'Colágeno', 'Probióticos', 'Omega 3', 'Antioxidantes', 'Energía', 'Cabello y Piel', 'Digestión', 'Sueño', 'Kits']`

const nuevo = `const categoriasSuplementos = ['Energía y Rendimiento', 'Músculo y Recuperación', 'Control de Peso', 'Sueño y Relajación', 'Defensas e Inmunidad', 'Digestión', 'Belleza', 'Vitaminas y Minerales']`

let contenido = fs.readFileSync(archivo, 'utf8')

if (!contenido.includes(viejo)) {
  console.log('ERROR: no se encontro la linea original. No se hizo ningun cambio.')
  process.exit(1)
}

contenido = contenido.replace(viejo, nuevo)
fs.writeFileSync(archivo, contenido, 'utf8')
console.log('OK: categorias de suplementos actualizadas en el admin.')