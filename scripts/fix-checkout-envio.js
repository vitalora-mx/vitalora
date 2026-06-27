const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'checkout', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Corregir el texto "Envio — Mercado Envios" -> "Envio estandar"
//    El texto tiene acentos corruptos. Usamos anclas por posicion:
//    buscamos el patron entre '>' y '</div>' que contiene "Mercado Env".
// ─────────────────────────────────────────────────────────────
const idxMercadoEnv = content.indexOf('Mercado Env')
if (idxMercadoEnv !== -1) {
  // Buscar el '>' que abre este texto (hacia atras) y el '<' que lo cierra (hacia adelante)
  const aperturaTexto = content.lastIndexOf('>', idxMercadoEnv) + 1
  const cierreTexto = content.indexOf('<', idxMercadoEnv)
  if (aperturaTexto > 0 && cierreTexto !== -1) {
    content = content.slice(0, aperturaTexto) + 'Env\u00edo est\u00e1ndar' + content.slice(cierreTexto)
    cambios++
    console.log('1) Texto cambiado a "Envio estandar".')
  } else {
    console.log('1) No se pudo aislar el texto. Revisar.')
  }
} else {
  console.log('1) No se encontro "Mercado Env". Quiza ya fue corregido.')
}

// ─────────────────────────────────────────────────────────────
// 2) Agregar leyenda de zonas extendidas despues del bloque de envio.
//    El bloque de envio termina con la linea de GRATIS/$99 y dos </div></div>.
//    Anclamos en "{costoEnvio === 0 ? 'GRATIS' : '$99 MXN'}" y buscamos el cierre
//    del contenedor del bloque de envio para insertar despues.
// ─────────────────────────────────────────────────────────────
if (!content.includes('zonas-extendidas-leyenda')) {
  const anclaPrecio = "{costoEnvio === 0 ? 'GRATIS' : '$99 MXN'}"
  const idxPrecio = content.indexOf(anclaPrecio)
  if (idxPrecio !== -1) {
    // Despues del precio vienen: </div> (cierra el precio), </div> (cierra el flex),
    // </div> (cierra el bloque de envio). Buscamos el tercer </div> despues del precio.
    let pos = idxPrecio
    let cierres = 0
    let idxInsertar = -1
    while (cierres < 3) {
      pos = content.indexOf('</div>', pos + 1)
      if (pos === -1) break
      cierres++
      if (cierres === 3) idxInsertar = pos + '</div>'.length
    }
    if (idxInsertar !== -1) {
      const leyenda = `
                  {/* zonas-extendidas-leyenda */}
                  <div style={{ marginBottom: '24px', padding: '14px 16px', background: '#FFF9F0', border: '1px solid #E8D5B0', borderRadius: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B6914', marginBottom: '4px' }}>Envíos a zonas extendidas</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>Algunas localidades de difícil acceso o zonas extendidas pueden tener un costo de envío adicional que no se refleja en el total. Si tu domicilio aplica, nos pondremos en contacto contigo antes de procesar tu pedido.</div>
                  </div>`
      content = content.slice(0, idxInsertar) + leyenda + content.slice(idxInsertar)
      cambios++
      console.log('2) Leyenda de zonas extendidas agregada.')
    } else {
      console.log('2) No se pudo ubicar el punto de insercion. Revisar.')
    }
  } else {
    console.log('2) No se encontro el ancla del precio de envio.')
  }
} else {
  console.log('2) La leyenda ya existe, omitido.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios aplicados en el checkout.')
