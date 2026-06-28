const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'productos', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// Cambiar el estilo de la barra de cambios: de sticky-top a fixed-bottom flotante.
const estiloViejo = `style={{ position: 'sticky', top: '12px', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '14px 20px', background: '#FFF8E0', border: '1px solid #E8D080', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}`

const estiloNuevo = `style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 48px)', maxWidth: '900px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px 24px', background: '#FFF8E0', border: '1px solid #E8D080', borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}`

if (content.includes(estiloViejo)) {
  content = content.replace(estiloViejo, estiloNuevo)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log('Listo: la barra de guardar ahora flota fija en la parte inferior de la pantalla.')
} else if (content.includes("position: 'fixed', bottom: '24px'")) {
  console.log('La barra ya es flotante. Nada que hacer.')
} else {
  console.log('No se encontro el estilo exacto de la barra. Revisar manualmente.')
}
