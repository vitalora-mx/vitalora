const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'suplementos', 'SuplementosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('getSegundaImagen')) {
  console.log('El efecto hover ya existe en suplementos. Nada que hacer.')
  process.exit(0)
}

let cambios = 0

// PASO 1: getSegundaImagen
const anclaFn = `  function getImagen(p: Producto) {
    const imgs = p.producto_imagenes?.sort((a, b) => a.posicion - b.posicion)
    return imgs?.[0]?.url || null
  }`

if (content.includes(anclaFn)) {
  const nuevaFn = anclaFn + `

  function getSegundaImagen(p: Producto) {
    const imgs = p.producto_imagenes?.sort((a, b) => a.posicion - b.posicion)
    return imgs?.[1]?.url || null
  }`
  content = content.replace(anclaFn, nuevaFn)
  cambios++
  console.log('1) getSegundaImagen agregada.')
} else {
  console.log('1) No se encontro getImagen. Abortado.')
  process.exit(1)
}

// PASO 2: onMouseEnter (boxShadow 0.08 en suplementos)
const enterViejo = `onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)' }}`
const enterNuevo = `onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; const pri = e.currentTarget.querySelector('.prod-img-principal') as HTMLElement | null; const sec = e.currentTarget.querySelector('.prod-img-secundaria') as HTMLElement | null; if (sec) { if (pri) pri.style.opacity = '0'; sec.style.opacity = '1' } }}`

const leaveViejo = `onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}`
const leaveNuevo = `onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; const pri = e.currentTarget.querySelector('.prod-img-principal') as HTMLElement | null; const sec = e.currentTarget.querySelector('.prod-img-secundaria') as HTMLElement | null; if (sec) { if (pri) pri.style.opacity = producto.stock === 0 ? '0.45' : '1'; sec.style.opacity = '0' } }}`

if (content.includes(enterViejo)) {
  content = content.replace(enterViejo, enterNuevo)
  cambios++
  console.log('2a) onMouseEnter modificado.')
} else {
  console.log('2a) No se encontro onMouseEnter exacto. Abortado.')
  process.exit(1)
}

if (content.includes(leaveViejo)) {
  content = content.replace(leaveViejo, leaveNuevo)
  cambios++
  console.log('2b) onMouseLeave modificado.')
} else {
  console.log('2b) No se encontro onMouseLeave exacto. Abortado.')
  process.exit(1)
}

// PASO 3: imagenes superpuestas
const imgViejo = `<img src={getImagen(producto)!} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: producto.stock === 0 ? 0.45 : 1, filter: producto.stock === 0 ? 'grayscale(60%)' : 'none' }} />`

const imgNuevo = `<>
                        <img src={getImagen(producto)!} alt={producto.nombre} className="prod-img-principal" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: producto.stock === 0 ? 0.45 : 1, filter: producto.stock === 0 ? 'grayscale(60%)' : 'none', transition: 'opacity 0.4s ease' }} />
                        {getSegundaImagen(producto) && producto.stock !== 0 && (
                          <img src={getSegundaImagen(producto)!} alt={producto.nombre} className="prod-img-secundaria" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0, transition: 'opacity 0.4s ease' }} />
                        )}
                      </>`

if (content.includes(imgViejo)) {
  content = content.replace(imgViejo, imgNuevo)
  cambios++
  console.log('3) Imagenes superpuestas colocadas.')
} else {
  console.log('3) No se encontro el <img> exacto. Abortado.')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios en suplementos.')
