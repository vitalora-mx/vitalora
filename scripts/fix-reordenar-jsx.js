const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'productos', 'editar', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('hacerPrincipal(idx)')) {
  console.log('El JSX ya tenia los controles. Nada que hacer.')
  process.exit(0)
}

// Anclas limpias (sin caracteres especiales):
// Inicio: la linea del map
// Fin: el cierre "))}" que sigue al div de cada imagen
const inicio = '{imagenesExistentes.map(img => ('
const fin = '))}'

const idxInicio = content.indexOf(inicio)
if (idxInicio === -1) {
  console.log('NO se encontro el inicio del map. Abortado.')
  process.exit(1)
}

// Buscar el primer "))}" despues del inicio
const idxFin = content.indexOf(fin, idxInicio)
if (idxFin === -1) {
  console.log('NO se encontro el cierre "))}" del map. Abortado.')
  process.exit(1)
}

// El bloque viejo va desde idxInicio hasta el final de "))}"
const bloqueViejo = content.slice(idxInicio, idxFin + fin.length)

// Verificar que el bloque viejo contenga la imagen (seguridad)
if (!bloqueViejo.includes('quitarImagenExistente(img.id)')) {
  console.log('El bloque encontrado no parece ser el correcto (no contiene quitarImagenExistente). Abortado por seguridad.')
  console.log('--- bloque encontrado ---')
  console.log(bloqueViejo)
  process.exit(1)
}

const bloqueNuevo = `{imagenesExistentes.map((img, idx) => (
                    <div key={img.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={img.url} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: idx === 0 ? '2px solid #C9A961' : '1px solid #DDD', background: 'white' }} />
                        <button type="button" onClick={() => quitarImagenExistente(img.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>X</button>
                        {idx === 0 && (
                          <div style={{ position: 'absolute', bottom: '4px', left: '4px', padding: '2px 6px', background: '#C9A961', color: 'white', fontSize: '9px', borderRadius: '3px', fontWeight: 700 }}>Principal</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button type="button" onClick={() => moverImagen(idx, -1)} disabled={idx === 0} title="Mover a la izquierda" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: idx === 0 ? '#F5F5F5' : 'white', color: idx === 0 ? '#CCC' : '#333', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '12px' }}>{'<'}</button>
                        {idx !== 0 && (
                          <button type="button" onClick={() => hacerPrincipal(idx)} title="Hacer principal" style={{ padding: '0 8px', height: '24px', borderRadius: '4px', border: '1px solid #C9A961', background: 'white', color: '#8B7530', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>Principal</button>
                        )}
                        <button type="button" onClick={() => moverImagen(idx, 1)} disabled={idx === imagenesExistentes.length - 1} title="Mover a la derecha" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: idx === imagenesExistentes.length - 1 ? '#F5F5F5' : 'white', color: idx === imagenesExistentes.length - 1 ? '#CCC' : '#333', cursor: idx === imagenesExistentes.length - 1 ? 'default' : 'pointer', fontSize: '12px' }}>{'>'}</button>
                      </div>
                    </div>
                  ))}`

content = content.slice(0, idxInicio) + bloqueNuevo + content.slice(idxFin + fin.length)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: JSX de imagenes existentes reemplazado con controles de orden.')
