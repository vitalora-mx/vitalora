const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'checkout', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Logo de Mercado Pago en la opcion "Tarjeta o efectivo"
//    Insertamos un <img> dentro del bloque de texto de esa opcion.
//    Ancla: el texto "Tarjeta o efectivo" -> agregamos logo al lado del titulo.
// ─────────────────────────────────────────────────────────────
const anclaMP = `<div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Tarjeta o efectivo</div>`
if (content.includes(anclaMP) && !content.includes('/images/pagos/mercadopago.png')) {
  const reemplazoMP = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Tarjeta o efectivo</div>
                            <img src="/images/pagos/mercadopago.png" alt="Mercado Pago" style={{ height: '20px', width: 'auto' }} />
                          </div>`
  content = content.replace(anclaMP, reemplazoMP)
  cambios++
  console.log('1) Logo de Mercado Pago agregado.')
} else {
  console.log('1) Ancla MP no encontrada o logo ya existe, omitido.')
}

// ─────────────────────────────────────────────────────────────
// 2) Logo de SPEI en la opcion "Transferencia bancaria"
// ─────────────────────────────────────────────────────────────
const anclaSPEI = `<div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Transferencia bancaria</div>`
if (content.includes(anclaSPEI) && !content.includes('/images/pagos/spei.png')) {
  const reemplazoSPEI = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>Transferencia bancaria</div>
                            <img src="/images/pagos/spei.png" alt="SPEI" style={{ height: '18px', width: 'auto' }} />
                          </div>`
  content = content.replace(anclaSPEI, reemplazoSPEI)
  cambios++
  console.log('2) Logo de SPEI agregado.')
} else {
  console.log('2) Ancla SPEI no encontrada o logo ya existe, omitido.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' logos agregados al selector de pago.')
