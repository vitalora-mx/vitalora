const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'checkout', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('metodo-pago-selector')) {
  console.log('El selector ya existe. Nada que hacer.')
  process.exit(0)
}

// ─────────────────────────────────────────────────────────────
// 1) Insertar el selector ANTES del div de botones (Regresar/Pagar)
//    Ancla: el div de botones del paso 3. Para asegurarnos de tomar el
//    correcto, buscamos la combinacion con setPaso(2) que es unica del paso 3.
// ─────────────────────────────────────────────────────────────
const anclaBotones = `<div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setPaso(2)}`

const idxBotones = content.indexOf(anclaBotones)
if (idxBotones === -1) {
  console.log('NO se encontro el div de botones del paso 3. Abortado.')
  process.exit(1)
}

const selector = `{/* metodo-pago-selector */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Metodo de pago</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div onClick={() => setMetodoPago('mercadopago')} style={{ padding: '16px', border: '2px solid', borderColor: metodoPago === 'mercadopago' ? 'var(--sage-deep)' : 'var(--line)', borderRadius: '6px', cursor: 'pointer', background: metodoPago === 'mercadopago' ? '#F0F7F0' : 'white', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: metodoPago === 'mercadopago' ? 'var(--sage-deep)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {metodoPago === 'mercadopago' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sage-deep)' }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Tarjeta o efectivo</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paga con tarjeta, OXXO o dinero en Mercado Pago. Inmediato.</div>
                        </div>
                      </div>
                    </div>
                    <div onClick={() => setMetodoPago('transferencia')} style={{ padding: '16px', border: '2px solid', borderColor: metodoPago === 'transferencia' ? 'var(--sage-deep)' : 'var(--line)', borderRadius: '6px', cursor: 'pointer', background: metodoPago === 'transferencia' ? '#F0F7F0' : 'white', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: metodoPago === 'transferencia' ? 'var(--sage-deep)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {metodoPago === 'transferencia' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sage-deep)' }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Transferencia bancaria</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transfiere por SPEI y sube tu comprobante. Confirmacion manual.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                `

content = content.slice(0, idxBotones) + selector + content.slice(idxBotones)
console.log('1) Selector visual insertado.')

// ─────────────────────────────────────────────────────────────
// 2) Cambiar el texto del boton segun el metodo.
//    El texto vive dentro de: {enviando ? 'Procesando...' : '<emoji> Pagar con Mercado Pago'}
//    En vez de manipular comillas (riesgoso por el emoji corrupto), reemplazamos
//    la subcadena "Pagar con Mercado Pago" por una expresion JSX.
//    PERO eso la dejaria dentro de un string. Mejor: reemplazamos el patron
//    " : '...Pagar con Mercado Pago'}" completo si lo encontramos limpio.
// ─────────────────────────────────────────────────────────────
// Estrategia segura: buscar "Pagar con Mercado Pago'}" y el "? 'Procesando...' : '" antes.
const marcadorFin = "Pagar con Mercado Pago'}"
const idxFin = content.indexOf(marcadorFin)
const marcadorProcesando = "'Procesando...' : '"
const idxProc = content.indexOf(marcadorProcesando)

if (idxFin !== -1 && idxProc !== -1 && idxProc < idxFin) {
  // Reemplazar desde despues de "'Procesando...' : '" hasta el final del texto
  // por una expresion que cierre el string y use ternario.
  // Resultado deseado:
  //   {enviando ? 'Procesando...' : (metodoPago === 'transferencia' ? 'Continuar con transferencia' : 'Pagar con Mercado Pago')}
  const inicioReemplazo = idxProc
  const finReemplazo = idxFin + marcadorFin.length
  const nuevoFragmento = "'Procesando...' : (metodoPago === 'transferencia' ? 'Continuar con transferencia' : 'Pagar con Mercado Pago')}"
  content = content.slice(0, inicioReemplazo) + nuevoFragmento + content.slice(finReemplazo)
  console.log('2) Texto del boton ahora es dinamico segun metodo.')
} else {
  console.log('2) No se encontro el patron exacto del texto del boton. El selector SI quedo; el texto del boton se puede ajustar manualmente despues.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. Selector de metodo de pago agregado al checkout.')
