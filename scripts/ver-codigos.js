const fs = require('fs')
const contenido = fs.readFileSync('app/(admin)/admin/codigos/page.tsx', 'utf8')

console.log('===== TOTAL DE CARACTERES:', contenido.length, '=====\n')

// Busca los useState para entender el formulario
const estados = contenido.match(/useState[^\n]*/g) || []
console.log('----- ESTADOS (useState) -----')
estados.forEach(e => console.log(e))

// Busca los campos del formulario (name= o value=)
const nombres = contenido.match(/name=["'][^"']*["']/g) || []
console.log('\n----- CAMPOS name= -----')
nombres.forEach(n => console.log(n))

// Busca dónde se arma el objeto que se envía
console.log('\n----- LINEAS CON minimo_compra -----')
contenido.split('\n').forEach((linea, i) => {
  if (linea.includes('minimo_compra') || linea.includes('descuento_envio') || linea.includes('tipo')) {
    console.log((i + 1) + ': ' + linea.trim())
  }
})