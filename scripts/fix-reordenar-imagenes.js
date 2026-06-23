const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'productos', 'editar', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Agregar la funcion moverImagen despues de quitarImagenExistente
// ─────────────────────────────────────────────────────────────
const anclaFuncion = `  async function quitarImagenExistente(imgId: number) {
    await fetch(\`/api/admin/delete-image?id=\${imgId}\`, { method: 'DELETE' })
    setImagenesExistentes(prev => prev.filter(img => img.id !== imgId))
  }`

const nuevaFuncion = anclaFuncion + `

  async function moverImagen(index: number, direccion: number) {
    const nuevoIndex = index + direccion
    if (nuevoIndex < 0 || nuevoIndex >= imagenesExistentes.length) return
    const nuevoArreglo = [...imagenesExistentes]
    const temp = nuevoArreglo[index]
    nuevoArreglo[index] = nuevoArreglo[nuevoIndex]
    nuevoArreglo[nuevoIndex] = temp
    setImagenesExistentes(nuevoArreglo)
    // Persistir el nuevo orden en Supabase
    try {
      await fetch('/api/admin/reordenar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: nuevoArreglo.map(img => img.id) }),
      })
    } catch (e) {
      console.error('Error al reordenar:', e)
    }
  }

  async function hacerPrincipal(index: number) {
    if (index === 0) return
    const nuevoArreglo = [...imagenesExistentes]
    const [elegida] = nuevoArreglo.splice(index, 1)
    nuevoArreglo.unshift(elegida)
    setImagenesExistentes(nuevoArreglo)
    try {
      await fetch('/api/admin/reordenar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: nuevoArreglo.map(img => img.id) }),
      })
    } catch (e) {
      console.error('Error al reordenar:', e)
    }
  }`

if (content.includes(anclaFuncion) && !content.includes('async function moverImagen')) {
  content = content.replace(anclaFuncion, nuevaFuncion)
  cambios++
  console.log('1) Funciones moverImagen y hacerPrincipal agregadas.')
} else if (content.includes('async function moverImagen')) {
  console.log('1) Las funciones ya existian, omitido.')
} else {
  console.log('1) NO se encontro el ancla de quitarImagenExistente. Revisar manualmente.')
}

// ─────────────────────────────────────────────────────────────
// 2) Reemplazar el JSX de las imagenes existentes (usar index en el map + controles)
// ─────────────────────────────────────────────────────────────
const anclaJSX = `                {imagenesExistentes.map(img => (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <img src={img.url} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #DDD', background: 'white' }} />
                      <button onClick={() => quitarImagenExistente(img.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✕</button>
                    </div>
                  ))}`

const nuevoJSX = `                {imagenesExistentes.map((img, idx) => (
                    <div key={img.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={img.url} alt="" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: idx === 0 ? '2px solid #C9A961' : '1px solid #DDD', background: 'white' }} />
                        <button onClick={() => quitarImagenExistente(img.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#F33', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✕</button>
                        {idx === 0 && (
                          <div style={{ position: 'absolute', bottom: '4px', left: '4px', padding: '2px 6px', background: '#C9A961', color: 'white', fontSize: '9px', borderRadius: '3px', fontWeight: 700 }}>Principal</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button type="button" onClick={() => moverImagen(idx, -1)} disabled={idx === 0} title="Mover a la izquierda" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: idx === 0 ? '#F5F5F5' : 'white', color: idx === 0 ? '#CCC' : '#333', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '12px' }}>◀</button>
                        {idx !== 0 && (
                          <button type="button" onClick={() => hacerPrincipal(idx)} title="Hacer principal" style={{ padding: '0 8px', height: '24px', borderRadius: '4px', border: '1px solid #C9A961', background: 'white', color: '#8B7530', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>★ Principal</button>
                        )}
                        <button type="button" onClick={() => moverImagen(idx, 1)} disabled={idx === imagenesExistentes.length - 1} title="Mover a la derecha" style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #CCC', background: idx === imagenesExistentes.length - 1 ? '#F5F5F5' : 'white', color: idx === imagenesExistentes.length - 1 ? '#CCC' : '#333', cursor: idx === imagenesExistentes.length - 1 ? 'default' : 'pointer', fontSize: '12px' }}>▶</button>
                      </div>
                    </div>
                  ))}`

if (content.includes(anclaJSX)) {
  content = content.replace(anclaJSX, nuevoJSX)
  cambios++
  console.log('2) JSX de imagenes existentes actualizado con controles de orden.')
} else if (content.includes('hacerPrincipal(idx)')) {
  console.log('2) El JSX ya tenia los controles, omitido.')
} else {
  console.log('2) NO se encontro el ancla del JSX. Puede que el formato (comillas, espacios) difiera. Revisar manualmente.')
}

// Tambien actualizar el texto de ayuda
const textoViejo = `click en ✕ para eliminar de Supabase:`
const textoNuevo = `usa ◀ ▶ para reordenar o ★ para hacer principal · ✕ elimina:`
if (content.includes(textoViejo)) {
  content = content.replace(textoViejo, textoNuevo)
  console.log('3) Texto de ayuda actualizado.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios principales aplicados.')
