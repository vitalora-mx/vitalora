const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'checkout', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// OPCION 1: Mercado Pago
// Estructura actual: <div flex gap12> [radio] [div [div flex[titulo+logo]] [desc]] </div>
// Nueva: <div flex space-between> [div flex gap12 [radio][div [titulo][desc]]] [logo grande] </div>
// ─────────────────────────────────────────────────────────────

// Bloque interno actual de MP (titulo + logo juntos)
const mpViejo = `<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: metodoPago === 'mercadopago' ? 'var(--sage-deep)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {metodoPago === 'mercadopago' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sage-deep)' }} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Tarjeta o efectivo</div>
                              <img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '20px', width: 'auto' }} />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paga con tarjeta, OXXO o dinero en Mercado Pago. Inmediato.</div>
                          </div>
                        </div>`

const mpNuevo = `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: metodoPago === 'mercadopago' ? 'var(--sage-deep)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {metodoPago === 'mercadopago' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sage-deep)' }} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Tarjeta o efectivo</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paga con tarjeta, OXXO o dinero en Mercado Pago. Inmediato.</div>
                            </div>
                          </div>
                          <img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '42px', width: 'auto', flexShrink: 0 }} />
                        </div>`

if (content.includes(mpViejo)) {
  content = content.replace(mpViejo, mpNuevo)
  cambios++
  console.log('1) Logo de Mercado Pago movido a la derecha y agrandado (42px).')
} else {
  console.log('1) NO se encontro el bloque de MP exacto. Revisar manualmente.')
}

// ─────────────────────────────────────────────────────────────
// OPCION 2: Transferencia / SPEI
// ─────────────────────────────────────────────────────────────
const speiViejo = `<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: metodoPago === 'transferencia' ? 'var(--sage-deep)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {metodoPago === 'transferencia' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sage-deep)' }} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Transferencia bancaria</div>
                              <img src="/images/pagos/spei.png" alt="SPEI" style={{ height: '18px', width: 'auto' }} />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transfiere por SPEI y sube tu comprobante. Confirmacion manual.</div>
                          </div>
                        </div>`

const speiNuevo = `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: metodoPago === 'transferencia' ? 'var(--sage-deep)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {metodoPago === 'transferencia' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sage-deep)' }} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Transferencia bancaria</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transfiere por SPEI y sube tu comprobante. Confirmacion manual.</div>
                            </div>
                          </div>
                          <img src="/images/pagos/spei.png" alt="SPEI" style={{ height: '34px', width: 'auto', flexShrink: 0 }} />
                        </div>`

if (content.includes(speiViejo)) {
  content = content.replace(speiViejo, speiNuevo)
  cambios++
  console.log('2) Logo de SPEI movido a la derecha y agrandado (34px).')
} else {
  console.log('2) NO se encontro el bloque de SPEI exacto. Revisar manualmente.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' bloques actualizados.')
