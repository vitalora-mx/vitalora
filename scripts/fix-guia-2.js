const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'pedidos', '[id]', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('paqueteria-selector')) {
  console.log('El selector de paqueteria ya existe. Nada que hacer.')
  process.exit(0)
}

// ─────────────────────────────────────────────────────────────
// Insertar el selector de paqueteria dentro del bloque mostrarGuiaInput,
// justo antes del <input type="text" ... value={guiaInput}.
// El texto "Ingresa el numero de guia de Mercado Envios" lo cambiamos tambien.
// ─────────────────────────────────────────────────────────────

// 1) Cambiar el texto que menciona "Mercado Env" en el input de guia.
const idxTexto = content.indexOf('Ingresa el n')
if (idxTexto !== -1) {
  const idxMercado = content.indexOf('Mercado Env', idxTexto)
  if (idxMercado !== -1 && idxMercado - idxTexto < 80) {
    // Reemplazar todo el texto del <p> por uno generico
    const aperturaP = content.lastIndexOf('>', idxTexto) + 1
    const cierreP = content.indexOf('</p>', idxTexto)
    if (aperturaP > 0 && cierreP !== -1) {
      content = content.slice(0, aperturaP) + 'Selecciona la paqueter\u00eda e ingresa el n\u00famero de gu\u00eda:' + content.slice(cierreP)
      console.log('1) Texto del input actualizado (sin Mercado Envios).')
    }
  }
}

// 2) Insertar el <select> de paqueteria antes del <input ... value={guiaInput}
const anclaInput = '<input type="text" placeholder='
const idxInput = content.indexOf(anclaInput)
if (idxInput === -1) {
  console.log('2) No se encontro el input de guia. Abortado.')
  process.exit(1)
}

const selector = `{/* paqueteria-selector */}
                      <select value={paqueteriaInput} onChange={e => setPaqueteriaInput(e.target.value)} className="guia-input" style={{ marginBottom: '4px' }}>
                        <option value="">— Elige paquetería —</option>
                        <option value="Estafeta">Estafeta</option>
                        <option value="DHL">DHL</option>
                        <option value="FedEx">FedEx</option>
                        <option value="Paquetexpress">Paquetexpress</option>
                      </select>
                      `

content = content.slice(0, idxInput) + selector + content.slice(idxInput)
console.log('2) Selector de paqueteria insertado.')

// 3) Actualizar el placeholder del input de guia (opcional, lo dejamos generico)
content = content.replace('placeholder="Ej. 123456789"', 'placeholder="Número de guía"')

// 4) Que el boton Guardar tambien requiera paqueteria seleccionada
content = content.replace(
  "onClick={guardarGuia} disabled={!guiaInput.trim() || guardando}",
  "onClick={guardarGuia} disabled={!guiaInput.trim() || !paqueteriaInput || guardando}"
)
content = content.replace(
  "background: guiaInput.trim() ? '#0E0E0E' : '#E8E4DA', color: guiaInput.trim() ? '#C9A961' : '#A8A8A8', fontSize: '12px', cursor: guiaInput.trim() ? 'pointer' : 'not-allowed'",
  "background: (guiaInput.trim() && paqueteriaInput) ? '#0E0E0E' : '#E8E4DA', color: (guiaInput.trim() && paqueteriaInput) ? '#C9A961' : '#A8A8A8', fontSize: '12px', cursor: (guiaInput.trim() && paqueteriaInput) ? 'pointer' : 'not-allowed'"
)

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. Selector de paqueteria y validaciones agregados.')
