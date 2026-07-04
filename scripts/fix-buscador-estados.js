const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'cosmeticos', 'CosmeticosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1) Import de useRouter
if (!content.includes('useRouter')) {
  if (content.includes("from 'next/navigation'")) {
    content = content.replace(/import \{([^}]*)\} from 'next\/navigation'/, (m, p1) => {
      const items = p1.split(',').map(s => s.trim()).filter(Boolean)
      if (!items.includes('useRouter')) items.push('useRouter')
      return `import { ${items.join(', ')} } from 'next/navigation'`
    })
    cambios++
    console.log('1) useRouter agregado a next/navigation.')
  } else {
    const anclaReact = content.match(/import .* from 'react'\n/)
    if (anclaReact) {
      content = content.replace(anclaReact[0], anclaReact[0] + "import { useRouter } from 'next/navigation'\n")
      cambios++
      console.log('1) Import de useRouter agregado (nuevo).')
    }
  }
} else {
  console.log('1) useRouter ya existe.')
}

// 2) Declarar router y busqueda antes del primer useState<Producto
if (!content.includes('const [busqueda, setBusqueda]')) {
  const ancla = "  const [productos, setProductos] = useState<Producto[]>([])"
  if (content.includes(ancla)) {
    content = content.replace(ancla, "  const router = useRouter()\n  const [busqueda, setBusqueda] = useState('')\n" + ancla)
    cambios++
    console.log('2) router y busqueda declarados.')
  } else {
    console.log('2) No se encontro el ancla del useState. Abortado.')
    process.exit(1)
  }
} else {
  console.log('2) busqueda ya declarada.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios.')
