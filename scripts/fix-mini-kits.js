const fs = require('fs')
const path = require('path')

let totalCambios = 0

// ─────────────────────────────────────────────────────────────
// 1) CategoriasCarrusel.tsx (home) - agregar despues de Kits
// ─────────────────────────────────────────────────────────────
const f1 = path.join(__dirname, '..', 'components', 'store', 'CategoriasCarrusel.tsx')
let c1 = fs.readFileSync(f1, 'utf8')
if (c1.includes("Mini Kits")) {
  console.log('1) CategoriasCarrusel ya tiene Mini Kits.')
} else {
  const ancla1 = "{ nombre: 'Kits', img: '/images/categorias/cat-kits.png' },"
  if (c1.includes(ancla1)) {
    c1 = c1.replace(ancla1, ancla1 + "\n  { nombre: 'Mini Kits', img: '/images/categorias/cat-mini-kits.png' },")
    fs.writeFileSync(f1, c1, 'utf8')
    totalCambios++
    console.log('1) Mini Kits agregada en CategoriasCarrusel (home).')
  } else {
    console.log('1) NO se encontro el ancla de Kits en CategoriasCarrusel. Revisar.')
  }
}

// ─────────────────────────────────────────────────────────────
// 2) CosmeticosRutinas.tsx (cosmeticos) - agregar despues de Kits
// ─────────────────────────────────────────────────────────────
const f2 = path.join(__dirname, '..', 'components', 'store', 'cosmeticos', 'CosmeticosRutinas.tsx')
let c2 = fs.readFileSync(f2, 'utf8')
if (c2.includes("Mini Kits")) {
  console.log('2) CosmeticosRutinas ya tiene Mini Kits.')
} else {
  const ancla2 = "{ nombre: 'Kits', img: '/images/categorias/cat-kits.png' },"
  if (c2.includes(ancla2)) {
    c2 = c2.replace(ancla2, ancla2 + "\n  { nombre: 'Mini Kits', img: '/images/categorias/cat-mini-kits.png' },")
    fs.writeFileSync(f2, c2, 'utf8')
    totalCambios++
    console.log('2) Mini Kits agregada en CosmeticosRutinas (cosmeticos).')
  } else {
    console.log('2) NO se encontro el ancla de Kits en CosmeticosRutinas. Revisar.')
  }
}

// ─────────────────────────────────────────────────────────────
// 3) admin productos/editar/page.tsx - agregar al array categoriasCosmeticos
// ─────────────────────────────────────────────────────────────
const f3 = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'productos', 'editar', 'page.tsx')
let c3 = fs.readFileSync(f3, 'utf8')
if (c3.includes("'Mini Kits'")) {
  console.log('3) Admin ya tiene Mini Kits.')
} else {
  // En el array categoriasCosmeticos, agregar 'Mini Kits' despues de 'Kits'
  // El array tiene: ..., 'Kits', 'Cuidado Corporal']
  const ancla3 = "'Kits', 'Cuidado Corporal']"
  if (c3.includes(ancla3)) {
    c3 = c3.replace(ancla3, "'Kits', 'Mini Kits', 'Cuidado Corporal']")
    fs.writeFileSync(f3, c3, 'utf8')
    totalCambios++
    console.log('3) Mini Kits agregada en el admin (categoriasCosmeticos).')
  } else {
    console.log('3) NO se encontro el ancla en el admin. Revisar.')
  }
}

console.log('\nTotal cambios: ' + totalCambios)
