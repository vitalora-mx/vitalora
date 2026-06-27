const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'pedidos', '[id]', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('notificar-reembolso')) {
  console.log('El correo de reembolso ya esta conectado. Nada que hacer.')
  process.exit(0)
}

// Despues de un reembolso exitoso, disparar el correo.
// Anclamos en el bloque de exito dentro de reembolsar():
//   mostrarMsg(data.mensaje || 'Reembolso procesado.')
//   setMostrarReembolso(false)
// Insertamos el disparo del correo justo despues de mostrarMsg.
const ancla = "mostrarMsg(data.mensaje || 'Reembolso procesado.')"

if (!content.includes(ancla)) {
  console.log('No se encontro el ancla de exito del reembolso. Abortado.')
  process.exit(1)
}

const insercion = `mostrarMsg(data.mensaje || 'Reembolso procesado.')
          // Disparar correo de confirmacion de reembolso al cliente
          try {
            await fetch('/api/admin/pedidos/notificar-reembolso', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pedidoId: params.id,
                metodo: esTransferencia ? 'transferencia' : 'mercadopago',
                monto: esParcial ? monto : (pedido.total || 0),
                esParcial,
              }),
            })
          } catch (e) { console.error('Error al enviar correo de reembolso:', e) }`

content = content.replace(ancla, insercion)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: correo de reembolso conectado a ambos flujos (MP y transferencia).')
