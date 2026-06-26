const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'productos', 'editar', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Reemplazar el <input type="file"> feo de imagenes del producto
//    por un boton claro con label.
//    Ancla exacta:
//    <input type="file" accept="image/*" multiple onChange={handleImagenes} style={{ marginBottom: '12px' }} />
// ─────────────────────────────────────────────────────────────
const inputViejo = `<input type="file" accept="image/*" multiple onChange={handleImagenes} style={{ marginBottom: '12px' }} />`

const botonNuevo = `<div style={{ marginBottom: '12px' }}>
            <label htmlFor="input-imagenes-producto" style={{ display: 'inline-block', cursor: 'pointer', padding: '12px 24px', background: 'white', border: '2px solid #C9A961', borderRadius: '6px', color: '#8B7530', fontSize: '14px', fontWeight: 600 }}>
              📎 Seleccionar imágenes
            </label>
            <input id="input-imagenes-producto" type="file" accept="image/*" multiple onChange={handleImagenes} style={{ display: 'none' }} />
            <span style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>Puedes seleccionar varias a la vez</span>
          </div>`

if (content.includes(inputViejo)) {
  content = content.replace(inputViejo, botonNuevo)
  cambios++
  console.log('1) Boton visible de seleccionar imagenes agregado.')
} else {
  console.log('1) No se encontro el input de imagenes exacto. Revisar.')
}

// ─────────────────────────────────────────────────────────────
// 2) Agregar controles de reordenar bajo cada preview nueva.
//    El bloque actual de cada preview termina con el div "Nueva".
//    Buscamos el cierre del map de previews y agregamos los botones.
//    Ancla: el div "Nueva" y su cierre, dentro del map.
// ─────────────────────────────────────────────────────────────
const previewViejo = `                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #4A4', background: 'white' }} />
                    <button onClick={() => quitarImagenNueva(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✕</button>
                    <div style={{ position: 'absolute', bottom: '4px', left: '4px', padding: '2px 6px', background: '#4A4', color: 'white', fontSize: '9px', borderRadius: '3px' }}>Nueva</div>
                  </div>`

// Como el caracter de la X puede estar corrupto, usamos un enfoque por posicion:
// buscamos el inicio del map de previews y reescribimos cada item con controles.
// Estrategia: reemplazar solo el contenido interno usando un patron mas corto y robusto.

// Patron robusto: buscar 'Nueva</div>' que cierra cada preview y el </div> que le sigue,
// e insertar los controles ANTES del cierre del contenedor de la preview.
// Primero, envolvemos la imagen y agregamos una fila de controles debajo.

// Reemplazo por regex flexible (tolera la X corrupta):
const previewRegex = /(<div key=\{i\} style=\{\{ position: 'relative' \}\}>\s*<img src=\{src\}[^>]*\/>\s*<button onClick=\{\(\) => quitarImagenNueva\(i\)\}[^>]*>[^<]*<\/button>\s*<div style=\{\{ position: 'absolute', bottom: '4px', left: '4px'[^>]*>Nueva<\/div>\s*<\/div>)/

if (previewRegex.test(content)) {
  content = content.replace(previewRegex, `<div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={src} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: i === 0 ? '2px solid #C9A961' : '1px solid #4A4', background: 'white' }} />
                      <button type="button" onClick={() => quitarImagenNueva(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>×</button>
                      <div style={{ position: 'absolute', bottom: '4px', left: '4px', padding: '2px 6px', background: i === 0 ? '#C9A961' : '#4A4', color: 'white', fontSize: '9px', borderRadius: '3px' }}>{i === 0 ? 'Principal' : 'Nueva'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button type="button" onClick={() => moverPreview(i, -1)} disabled={i === 0} title="Mover a la izquierda" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: i === 0 ? '#F5F5F5' : 'white', color: i === 0 ? '#CCC' : '#333', cursor: i === 0 ? 'default' : 'pointer', fontSize: '12px' }}>{'<'}</button>
                      {i !== 0 && (
                        <button type="button" onClick={() => hacerPrincipalPreview(i)} title="Hacer principal" style={{ padding: '0 8px', height: '24px', borderRadius: '4px', border: '1px solid #C9A961', background: 'white', color: '#8B7530', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>Principal</button>
                      )}
                      <button type="button" onClick={() => moverPreview(i, 1)} disabled={i === previewsNuevas.length - 1} title="Mover a la derecha" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: i === previewsNuevas.length - 1 ? '#F5F5F5' : 'white', color: i === previewsNuevas.length - 1 ? '#CCC' : '#333', cursor: i === previewsNuevas.length - 1 ? 'default' : 'pointer', fontSize: '12px' }}>{'>'}</button>
                    </div>
                  </div>`)
  cambios++
  console.log('2) Controles de reordenar agregados a las previews nuevas.')
} else {
  console.log('2) No se encontro el bloque de preview con regex. Revisar manualmente.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios aplicados.')
