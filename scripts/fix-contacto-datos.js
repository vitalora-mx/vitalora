const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'contacto', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('contacto-datos-google')) {
  console.log('El bloque de datos ya existe. Nada que hacer.')
  process.exit(0)
}

// Insertar el bloque de datos de contacto despues del cierre del div del encabezado.
// El encabezado termina con el </p> de la descripcion y luego </div>.
// Ancla: el texto de la descripcion. Buscamos el cierre del </p> que sigue a "lo antes posible"
// y luego el </div> que cierra el encabezado.

const ancla = `te responderemos lo antes posible.
            </p>
          </div>`

if (!content.includes(ancla)) {
  console.log('No se encontro el cierre del encabezado. Intentando ancla flexible...')
  // Buscar de forma mas flexible
  const idx = content.indexOf('responderemos lo antes posible')
  if (idx === -1) {
    console.log('No se encontro la descripcion. Abortado.')
    process.exit(1)
  }
  // Buscar el siguiente </div> despues de esa frase
  const cierreP = content.indexOf('</p>', idx)
  const cierreDiv = content.indexOf('</div>', cierreP)
  if (cierreDiv === -1) {
    console.log('No se encontro el cierre del encabezado. Abortado.')
    process.exit(1)
  }
  const puntoInsercion = cierreDiv + '</div>'.length
  const bloque = generarBloque()
  content = content.slice(0, puntoInsercion) + '\n' + bloque + content.slice(puntoInsercion)
} else {
  const bloque = generarBloque()
  content = content.replace(ancla, ancla + '\n' + bloque)
}

function generarBloque() {
  return `
          {/* contacto-datos-google: datos de contacto verificables */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--line)', padding: isMobile ? '24px 20px' : '32px', marginBottom: isMobile ? '24px' : '32px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', textAlign: 'center' }}>Datos de contacto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '420px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>📍</span>
                <span style={{ fontSize: '14px', color: 'var(--black)', lineHeight: 1.6 }}>Lago del Bosque 187, Real del Lago, C.P. 36690, Irapuato, Gto., México</span>
              </div>
              <a href="https://wa.me/524622341282" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>💬</span>
                <span style={{ fontSize: '14px', color: 'var(--black)' }}>WhatsApp: 462 234 1282</span>
              </a>
              <a href="mailto:hola@vitalora.com.mx" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>✉️</span>
                <span style={{ fontSize: '14px', color: 'var(--black)' }}>hola@vitalora.com.mx</span>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>🕐</span>
                <span style={{ fontSize: '14px', color: 'var(--black)' }}>Lunes a Viernes, 9:00 - 18:00 hrs</span>
              </div>
            </div>
          </div>`
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: bloque de datos de contacto agregado a la pagina de contacto.')
