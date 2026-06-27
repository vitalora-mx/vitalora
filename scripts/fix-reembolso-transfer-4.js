const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'pedidos', '[id]', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('devolver-stock-checkbox')) {
  console.log('La casilla ya existe. Nada que hacer.')
  process.exit(0)
}

// Insertar la casilla de stock + aviso de transferencia despues del bloque condicional
// total/parcial. Anclamos en el cierre de ese bloque: el </div> que cierra el div del parcial,
// seguido de ")}" que cierra el ternario.
// El parcial termina con:
//             style={{ width: '100%', padding: '8px 10px', ... boxSizing: 'border-box' }} />
//           </div>
//         )}
// Buscamos ese patron de cierre del ternario.

const ancla = `style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E4DA', borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                      )}`

if (!content.includes(ancla)) {
  console.log('NO se encontro el cierre del bloque total/parcial. Abortado.')
  process.exit(1)
}

const insercion = ancla + `

                      {/* devolver-stock-checkbox: solo para transferencias */}
                      {pedido.metodo_pago === 'transferencia' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div style={{ padding: '8px 10px', background: 'rgba(201,169,97,0.1)', border: '1px solid rgba(201,169,97,0.4)', borderRadius: '5px' }}>
                            <p style={{ fontSize: '11px', color: '#8B7530', lineHeight: 1.5, margin: 0 }}>Este registro NO mueve dinero. Haz la transferencia de devolucion al cliente desde tu banco y registra aqui para tu control.</p>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#2C2C2C' }}>
                            <input type="checkbox" checked={devolverStockTransfer} onChange={e => setDevolverStockTransfer(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                            Devolver productos al inventario
                          </label>
                        </div>
                      )}`

content = content.replace(ancla, insercion)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: casilla de stock + aviso de transferencia agregados.')
