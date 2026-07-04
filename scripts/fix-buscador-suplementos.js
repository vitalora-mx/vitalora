const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'suplementos', 'SuplementosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('buscadorGlobal')) {
  console.log('El buscador ya existe en suplementos. Nada que hacer.')
  process.exit(0)
}

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
    } else {
      console.log('1) No se pudo agregar useRouter. Abortado.')
      process.exit(1)
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

// 3) Insertar la barra antes del bloque derecho.
// El bloque derecho en suplementos: gap: isMobile ? '8px' : '12px' (o similar)
// Buscamos la linea con indentacion de 10 espacios.
const posiblesAnclas = [
  "          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>",
  "          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>",
  "          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>",
]

let anclaUsada = null
for (const a of posiblesAnclas) {
  if (content.includes(a)) { anclaUsada = a; break }
}

if (!anclaUsada) {
  console.log('3) No se encontro el ancla del bloque derecho. Revisar manualmente.')
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('   (Pasos 1 y 2 SI se guardaron.)')
  process.exit(1)
}

const barra = `          {/* buscadorGlobal */}
          <form onSubmit={(e) => { e.preventDefault(); if (busqueda.trim()) router.push(\`/buscar?q=\${encodeURIComponent(busqueda.trim())}\`) }} style={{ flex: 1, maxWidth: isMobile ? '100%' : '420px', order: isMobile ? 3 : 0, width: isMobile ? '100%' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E8E0D5', borderRadius: '100px', padding: isMobile ? '8px 16px' : '9px 18px', background: '#FAFAF7' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar productos..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontFamily: 'inherit', color: '#2C2C2C' }} />
            </div>
          </form>
` + anclaUsada

content = content.replace(anclaUsada, barra)
cambios++
console.log('3) Barra de busqueda insertada.')

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios en suplementos.')
