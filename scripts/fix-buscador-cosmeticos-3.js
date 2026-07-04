const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'cosmeticos', 'CosmeticosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('buscadorGlobal')) {
  console.log('El buscador ya existe. Nada que hacer.')
  process.exit(0)
}

// El bloque derecho abre con esta linea (10 espacios de indentacion):
const ancla = "          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>"

if (!content.includes(ancla)) {
  console.log('No se encontro el ancla del bloque derecho. Abortado.')
  process.exit(1)
}

const barra = `          {/* buscadorGlobal */}
          <form onSubmit={(e) => { e.preventDefault(); if (busqueda.trim()) router.push(\`/buscar?q=\${encodeURIComponent(busqueda.trim())}\`) }} style={{ flex: 1, maxWidth: isMobile ? '100%' : '420px', order: isMobile ? 3 : 0, width: isMobile ? '100%' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E8E0D5', borderRadius: '100px', padding: isMobile ? '8px 16px' : '9px 18px', background: '#FAFAF7' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar productos..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontFamily: 'inherit', color: '#2C2C2C' }} />
            </div>
          </form>
` + ancla

content = content.replace(ancla, barra)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: barra de busqueda insertada en cosmeticos.')
