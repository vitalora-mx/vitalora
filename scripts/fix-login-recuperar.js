const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'cuenta', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// Insertar el enlace "¿Olvidaste tu contraseña?" justo después del cierre del div del campo Contraseña.
// El campo de contraseña termina con: onKeyDown={e => e.key === 'Enter' && handleAuth()} /></div>
const ANCLA = "onKeyDown={e => e.key === 'Enter' && handleAuth()} /></div>"

if (!content.includes(ANCLA)) {
  console.log('❌ No se encontró el ancla del campo contraseña.')
  process.exit(1)
}

const ENLACE = `onKeyDown={e => e.key === 'Enter' && handleAuth()} /></div>
          {authMode === 'login' && <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}><a href="/recuperar" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a></div>}`

// Reemplazar solo la primera ocurrencia
content = content.replace(ANCLA, ENLACE)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Enlace "¿Olvidaste tu contraseña?" agregado al login.')
