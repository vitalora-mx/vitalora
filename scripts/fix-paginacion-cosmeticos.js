const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'cosmeticos', 'CosmeticosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('paginaActual')) {
  console.log('La paginacion ya existe. Nada que hacer.')
  process.exit(0)
}

let cambios = 0
const POR_PAGINA = 20

// 1) Agregar estado paginaActual (despues del estado busqueda o productos)
const anclaEstado = "const [busqueda, setBusqueda] = useState('')"
if (content.includes(anclaEstado)) {
  content = content.replace(anclaEstado, anclaEstado + "\n  const [paginaActual, setPaginaActual] = useState(1)")
  cambios++
  console.log('1) Estado paginaActual agregado.')
} else {
  // fallback: despues de productos
  const alt = "const [productos, setProductos] = useState<Producto[]>([])"
  content = content.replace(alt, alt + "\n  const [paginaActual, setPaginaActual] = useState(1)")
  cambios++
  console.log('1) Estado paginaActual agregado (fallback).')
}

// 2) Despues del sort de orden, calcular la paginacion.
// Ancla: la linea del sort precio-desc
const anclaSort = "if (orden === 'precio-desc') productosFiltrados.sort((a, b) => b.precio - a.precio)"
if (content.includes(anclaSort)) {
  const calculo = anclaSort + `

  // Paginacion: 20 productos por pagina
  const PRODUCTOS_POR_PAGINA = ${POR_PAGINA}
  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA))
  const paginaSegura = Math.min(paginaActual, totalPaginas)
  const productosPagina = productosFiltrados.slice((paginaSegura - 1) * PRODUCTOS_POR_PAGINA, paginaSegura * PRODUCTOS_POR_PAGINA)`
  content = content.replace(anclaSort, calculo)
  cambios++
  console.log('2) Calculo de paginacion agregado.')
} else {
  console.log('2) No se encontro el ancla del sort. Abortado.')
  process.exit(1)
}

// 3) Cambiar el .map para usar productosPagina
const anclaMap = "{productosFiltrados.map(producto => ("
if (content.includes(anclaMap)) {
  content = content.replace(anclaMap, "{productosPagina.map(producto => (")
  cambios++
  console.log('3) El .map ahora usa productosPagina.')
} else {
  console.log('3) No se encontro el .map. Abortado.')
  process.exit(1)
}

// 4) Reiniciar a pagina 1 cuando cambian filtros. Agregar useEffect.
// Lo insertamos despues de la declaracion de paginaActual usando un marcador.
// Buscamos un buen lugar: despues del useEffect que carga productos, o antes del return.
// Estrategia simple: agregar un useEffect que observe rutinaActiva, marcasSeleccionadas, orden.
const anclaReturn = "  let productosFiltrados = productos.filter"
if (content.includes(anclaReturn)) {
  const efecto = `  // Reiniciar a la pagina 1 cuando cambian los filtros
  useEffect(() => { setPaginaActual(1) }, [rutinaActiva, marcasSeleccionadas, orden])

  let productosFiltrados = productos.filter`
  content = content.replace(anclaReturn, efecto)
  cambios++
  console.log('4) useEffect para reiniciar pagina agregado.')
} else {
  console.log('4) No se encontro el ancla para el useEffect. Revisar.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios (falta insertar los botones de paginacion - paso 5).')
