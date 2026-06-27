const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'pedidos', '[id]', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('reembolsar-transferencia')) {
  console.log('La bifurcacion ya existe. Nada que hacer.')
  process.exit(0)
}

// ───────────────────────────────────────────────────────────
// PASO A: Reemplazar el bloque de texto de confirmacion (que define `texto`)
// El bloque original es exactamente:
//   const texto = esParcial
//     ? `...`
//     : `...`
//   if (!window.confirm(texto)) return
// ───────────────────────────────────────────────────────────
const textoViejo = `const texto = esParcial
      ? \`Vas a reembolsar $\${monto} al cliente. El inventario NO se ajusta solo en parciales: hazlo tu si aplica. Esta accion es irreversible. Continuar?\`
      : \`Vas a reembolsar el TOTAL ($\${pedido.total}) al cliente. El inventario se devolvera automaticamente. Esta accion es irreversible. Continuar?\`
    if (!window.confirm(texto)) return`

const textoNuevo = `const esTransferencia = pedido.metodo_pago === 'transferencia'
    let texto
    if (esTransferencia) {
      texto = esParcial
        ? \`Vas a REGISTRAR un reembolso parcial de $\${monto}. Esto NO mueve dinero: haz la transferencia de devolucion desde tu banco. \${devolverStockTransfer ? 'El stock SE devolvera.' : 'El stock NO se devolvera.'} Continuar?\`
        : \`Vas a REGISTRAR el reembolso TOTAL ($\${pedido.total}). Esto NO mueve dinero: haz la transferencia de devolucion desde tu banco. \${devolverStockTransfer ? 'El stock SE devolvera.' : 'El stock NO se devolvera.'} Continuar?\`
    } else {
      texto = esParcial
        ? \`Vas a reembolsar $\${monto} al cliente. El inventario NO se ajusta solo en parciales: hazlo tu si aplica. Esta accion es irreversible. Continuar?\`
        : \`Vas a reembolsar el TOTAL ($\${pedido.total}) al cliente. El inventario se devolvera automaticamente. Esta accion es irreversible. Continuar?\`
    }
    if (!window.confirm(texto)) return`

if (content.includes(textoViejo)) {
  content = content.replace(textoViejo, textoNuevo)
  console.log('A) Texto de confirmacion bifurcado.')
} else {
  console.log('A) NO se encontro el bloque de texto exacto. Abortado.')
  process.exit(1)
}

// ───────────────────────────────────────────────────────────
// PASO B: Reemplazar el fetch para elegir endpoint y body segun metodo
// Original:
//   const res = await fetch(`/api/admin/pedidos/${params.id}/reembolsar`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: esParcial ? JSON.stringify({ monto }) : JSON.stringify({}),
//   })
// ───────────────────────────────────────────────────────────
const fetchViejo = `const res = await fetch(\`/api/admin/pedidos/\${params.id}/reembolsar\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: esParcial ? JSON.stringify({ monto }) : JSON.stringify({}),
      })`

const fetchNuevo = `const endpoint = esTransferencia
        ? \`/api/admin/pedidos/\${params.id}/reembolsar-transferencia\`
        : \`/api/admin/pedidos/\${params.id}/reembolsar\`
      const bodyData = esTransferencia
        ? (esParcial ? { monto, devolverStock: devolverStockTransfer } : { devolverStock: devolverStockTransfer })
        : (esParcial ? { monto } : {})
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })`

if (content.includes(fetchViejo)) {
  content = content.replace(fetchViejo, fetchNuevo)
  console.log('B) Fetch bifurcado por metodo de pago.')
} else {
  console.log('B) NO se encontro el fetch exacto. Abortado.')
  process.exit(1)
}

// ───────────────────────────────────────────────────────────
// PASO C: Ajustar la condicion de exito para aceptar tanto {success} (MP) como {ok} (transferencia)
// Original: if (res.ok && data.success) {
// ───────────────────────────────────────────────────────────
const condVieja = 'if (res.ok && data.success) {'
const condNueva = 'if (res.ok && (data.success || data.ok)) {'
if (content.includes(condVieja)) {
  content = content.replace(condVieja, condNueva)
  console.log('C) Condicion de exito acepta MP y transferencia.')
} else {
  console.log('C) NO se encontro la condicion de exito. Revisar.')
}

// ───────────────────────────────────────────────────────────
// PASO D: limpiar el estado de la casilla al cerrar (montoReembolso ya se limpia)
// ───────────────────────────────────────────────────────────
content = content.replace(
  "setMostrarReembolso(false)\n          setMontoReembolso('')",
  "setMostrarReembolso(false)\n          setMontoReembolso('')\n          setDevolverStockTransfer(false)"
)

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo: reembolsar() bifurca correctamente entre MP y transferencia.')
