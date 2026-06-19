const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'layout.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// Arreglar acentos corruptos
content = content.split('OperaciÃ³n').join('Operación')
content = content.split('CatÃ¡logo').join('Catálogo')
content = content.split('ReseÃ±as').join('Reseñas')
content = content.split('ContraseÃ±a').join('Contraseña')
content = content.split('ADMINISTRACIÃ"N').join('ADMINISTRACIÓN')

// Agregar Inventario en la sección Catálogo (antes de Productos)
const ICONO_INVENTARIO = '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'

const BUSCAR = "{ label: 'Productos', href: '/admin/productos',"
const REEMPLAZAR = `{ label: 'Inventario', href: '/admin/inventario', icon: ICON('${ICONO_INVENTARIO}') },\n      { label: 'Productos', href: '/admin/productos',`

if (!content.includes(BUSCAR)) {
  console.log('❌ No se encontró el texto a reemplazar. Verifica el archivo.')
  process.exit(1)
}

content = content.split(BUSCAR).join(REEMPLAZAR)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ layout.tsx actualizado correctamente')
