const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'suplementos', 'SuplementosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('paginaActual')) {
  console.log('La paginacion ya existe. Nada que hacer.')
  process.exit(0)
}

let cambios = 0

// 1) Estado paginaActual (despues de busqueda o productos)
if (content.includes("const [busqueda, setBusqueda] = useState('')")) {
  content = content.replace("const [busqueda, setBusqueda] = useState('')", "const [busqueda, setBusqueda] = useState('')\n  const [paginaActual, setPaginaActual] = useState(1)")
  cambios++
  console.log('1) Estado paginaActual agregado.')
} else if (content.includes("const [productos, setProductos] = useState<Producto[]>([])")) {
  content = content.replace("const [productos, setProductos] = useState<Producto[]>([])", "const [productos, setProductos] = useState<Producto[]>([])\n  const [paginaActual, setPaginaActual] = useState(1)")
  cambios++
  console.log('1) Estado paginaActual agregado (fallback).')
} else {
  console.log('1) No se encontro ancla de estado. Abortado.')
  process.exit(1)
}

// 2) Calculo de paginacion despues del sort precio-desc
const anclaSort = "if (orden === 'precio-desc') productosFiltrados.sort((a, b) => b.precio - a.precio)"
if (content.includes(anclaSort)) {
  const calculo = anclaSort + `

  // Paginacion: 20 productos por pagina
  const PRODUCTOS_POR_PAGINA = 20
  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA))
  const paginaSegura = Math.min(paginaActual, totalPaginas)
  const productosPagina = productosFiltrados.slice((paginaSegura - 1) * PRODUCTOS_POR_PAGINA, paginaSegura * PRODUCTOS_POR_PAGINA)`
  content = content.replace(anclaSort, calculo)
  cambios++
  console.log('2) Calculo de paginacion agregado.')
} else {
  console.log('2) No se encontro el sort. Abortado.')
  process.exit(1)
}

// 3) Cambiar el .map
if (content.includes("{productosFiltrados.map(producto => (")) {
  content = content.replace("{productosFiltrados.map(producto => (", "{productosPagina.map(producto => (")
  cambios++
  console.log('3) El .map ahora usa productosPagina.')
} else {
  console.log('3) No se encontro el .map. Abortado.')
  process.exit(1)
}

// 4) useEffect para reiniciar pagina al cambiar filtros
const anclaFiltro = "  let productosFiltrados = productos.filter"
if (content.includes(anclaFiltro)) {
  const efecto = `  // Reiniciar a la pagina 1 cuando cambian los filtros
  useEffect(() => { setPaginaActual(1) }, [categoriaActiva, marcasSeleccionadas, categoriasSeleccionadas, orden])

  let productosFiltrados = productos.filter`
  content = content.replace(anclaFiltro, efecto)
  cambios++
  console.log('4) useEffect para reiniciar pagina agregado.')
} else {
  console.log('4) No se encontro ancla para useEffect. Revisar.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios (logica). Falta insertar botones.')
