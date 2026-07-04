const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'cosmeticos', 'CosmeticosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('buscadorGlobal')) {
  console.log('El buscador ya existe. Nada que hacer.')
  process.exit(0)
}

let cambios = 0

// 1) Importar useRouter (si no esta). Verificar el import de next/navigation o next/link.
if (!content.includes('useRouter')) {
  if (content.includes("from 'next/navigation'")) {
    // Ya importa algo de next/navigation, agregar useRouter
    content = content.replace(/import \{([^}]*)\} from 'next\/navigation'/, (m, p1) => {
      const items = p1.split(',').map(s => s.trim()).filter(Boolean)
      if (!items.includes('useRouter')) items.push('useRouter')
      return `import { ${items.join(', ')} } from 'next/navigation'`
    })
    cambios++
    console.log('1) useRouter agregado al import de next/navigation.')
  } else {
    // Agregar un import nuevo despues del import de react
    const anclaReact = content.match(/import .* from 'react'\n/)
    if (anclaReact) {
      content = content.replace(anclaReact[0], anclaReact[0] + "import { useRouter } from 'next/navigation'\n")
      cambios++
      console.log('1) Import de useRouter agregado (nuevo).')
    } else {
      console.log('1) No se pudo agregar useRouter. Abortado.')
      process.exit(1)
    }
  }
}

// 2) Declarar router y estado busqueda dentro del componente.
//    Ancla: el primer useState del componente.
if (!content.includes('const [busqueda, setBusqueda]')) {
  const anclaEstado = "const [productos, setProductos] = useState<Producto[]>([])"
  if (content.includes(anclaEstado)) {
    content = content.replace(anclaEstado, "const router = useRouter()\n  const [busqueda, setBusqueda] = useState('')\n  const [productos, setProductos] = useState<Producto[]>([])")
    cambios++
    console.log('2) router y estado busqueda declarados.')
  } else {
    console.log('2) No se encontro el primer useState. Abortado.')
    process.exit(1)
  }
}

// 3) Insertar la barra de busqueda entre el bloque de Marcas y el bloque derecho.
//    Ancla: el cierre del bloque Marcas + apertura del bloque derecho.
const ancla3 = "            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>\n              {!isMobile && <Link href=\"/suplementos\""

const barraBusqueda = `            {/* buscadorGlobal */}
            <form onSubmit={(e) => { e.preventDefault(); if (busqueda.trim()) router.push(\`/buscar?q=\${encodeURIComponent(busqueda.trim())}\`) }} style={{ flex: 1, maxWidth: isMobile ? '100%' : '420px', order: isMobile ? 3 : 0, width: isMobile ? '100%' : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E8E0D5', borderRadius: '100px', padding: isMobile ? '8px 16px' : '9px 18px', background: '#FAFAF7' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar productos..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontFamily: 'inherit', color: '#2C2C2C' }} />
              </div>
            </form>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
              {!isMobile && <Link href="/suplementos"`

if (content.includes(ancla3)) {
  content = content.replace(ancla3, barraBusqueda)
  cambios++
  console.log('3) Barra de busqueda insertada.')
} else {
  console.log('3) No se encontro el ancla del bloque derecho. Abortado.')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios en cosmeticos.')
