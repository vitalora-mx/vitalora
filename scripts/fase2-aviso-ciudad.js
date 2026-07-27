const fs = require('fs')
const archivo = 'app/(store)/checkout/page.tsx'
let c = fs.readFileSync(archivo, 'utf8')

// Buscamos el cierre del bloque "Codigo aplicado" (las lineas 473-476 exactas)
const buscar = `                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: '#3A5A3A' }}>-\${codigoAplicado.montoDescuento.toLocaleString()}</div>
                        <button onClick={quitarCodigo} style={{ background: 'none', border: 'none', fontSize: '14px', color: '#A33', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                )}`

const reemplazar = `                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: '#3A5A3A' }}>-\${codigoAplicado.montoDescuento.toLocaleString()}</div>
                        <button onClick={quitarCodigo} style={{ background: 'none', border: 'none', fontSize: '14px', color: '#A33', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                )}
                {envioBloqueadoPorCiudad && codigoAplicado && (
                  <div style={{ marginBottom: '24px', padding: '14px 16px', background: '#FFF7E6', border: '1px solid #F0D9A0', borderRadius: '4px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#7A5A1A' }}>
                      El envío gratis de este código solo aplica para <strong>{codigoAplicado.ciudadRestringida}</strong>. Como tu dirección es de otra ciudad, el envío se cobra normal. El descuento del producto sí se mantiene.
                    </div>
                  </div>
                )}`

if (!c.includes(buscar)) {
  console.log('ERROR: no se encontro el bloque del codigo aplicado. NO se modifico nada.')
  process.exit(1)
}

c = c.replace(buscar, reemplazar)
fs.writeFileSync(archivo, c, 'utf8')
console.log('OK: aviso de ciudad agregado correctamente.')