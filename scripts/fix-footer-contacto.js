const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'Footer.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('footer-contacto-google')) {
  console.log('El bloque de contacto ya existe. Nada que hacer.')
  process.exit(0)
}

// Insertar el bloque de contacto despues del cierre del div de redes sociales.
// El bloque de redes termina con: }}>{red.label}</a>\n              ))}\n            </div>
// Buscamos ese cierre exacto.
const anclaRedes = `}}>{red.label}</a>
              ))}
            </div>`

if (!content.includes(anclaRedes)) {
  console.log('No se encontro el cierre del div de redes. Abortado.')
  process.exit(1)
}

const bloqueContacto = anclaRedes + `

            {/* footer-contacto-google: datos de contacto verificables */}
            <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>📍</span>
                <span style={{ fontSize: '13px', color: 'rgba(245,240,232,0.6)', lineHeight: 1.6 }}>Lago del Bosque 187, Real del Lago, C.P. 36690, Irapuato, Gto., México</span>
              </div>
              <a href="https://wa.me/524622341282" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>💬</span>
                <span style={{ fontSize: '13px', color: 'rgba(245,240,232,0.6)' }}>WhatsApp: 462 234 1282</span>
              </a>
              <a href="mailto:hola@vitalora.com.mx" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>✉️</span>
                <span style={{ fontSize: '13px', color: 'rgba(245,240,232,0.6)' }}>hola@vitalora.com.mx</span>
              </a>
            </div>`

content = content.replace(anclaRedes, bloqueContacto)

// Agregar la razon social en el copyright de abajo.
// El copyright es: <span>? 2026 Vitalora. Todos los derechos reservados.</span>
const copyViejoPatron = /<span>\S* 2026 Vitalora\. Todos los derechos reservados\.<\/span>/
if (copyViejoPatron.test(content)) {
  content = content.replace(copyViejoPatron, "<span>© 2026 Vitalora · VANGUARDIA IMPORTACIONES & LOGÍSTICA DE MÉXICO S.A. DE C.V. · Todos los derechos reservados.</span>")
  console.log('Razon social agregada al copyright.')
} else {
  console.log('Aviso: no se pudo actualizar el copyright (patron no encontrado), pero el bloque de contacto si se agrego.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: bloque de contacto agregado al footer.')
