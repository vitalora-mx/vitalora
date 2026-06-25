const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'checkout', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Agregar estado metodoPago despues de datosConfirmados
// ─────────────────────────────────────────────────────────────
if (!content.includes('metodoPago')) {
  const anclaEstado = 'const [datosConfirmados, setDatosConfirmados] = useState(false)'
  if (content.includes(anclaEstado)) {
    content = content.replace(
      anclaEstado,
      anclaEstado + "\n  const [metodoPago, setMetodoPago] = useState('mercadopago')"
    )
    cambios++
    console.log('1) Estado metodoPago agregado.')
  } else {
    console.log('1) NO se encontro ancla de datosConfirmados. Abortado.')
    process.exit(1)
  }
} else {
  console.log('1) metodoPago ya existe, omitido.')
}

// ─────────────────────────────────────────────────────────────
// 2) Modificar handlePagar para bifurcar segun metodo.
//    Insertamos al inicio de handlePagar (despues de setEnviando(true))
//    una rama para transferencia.
// ─────────────────────────────────────────────────────────────
if (!content.includes('/api/transferencia/crear')) {
  const anclaHandle = `  async function handlePagar() {
      setEnviando(true)`
  // Ojo: la indentacion puede variar. Probamos con la version sin indentacion exacta.
  const anclaHandleFlex = 'async function handlePagar() {'
  const idxHandle = content.indexOf(anclaHandleFlex)
  if (idxHandle === -1) {
    console.log('2) NO se encontro handlePagar. Abortado.')
    process.exit(1)
  }
  // Encontrar el setEnviando(true) que sigue
  const idxSetEnviando = content.indexOf('setEnviando(true)', idxHandle)
  if (idxSetEnviando === -1) {
    console.log('2) NO se encontro setEnviando(true). Abortado.')
    process.exit(1)
  }
  const finSetEnviando = idxSetEnviando + 'setEnviando(true)'.length

  const ramaTransferencia = `

      // Si el metodo es transferencia, crear pedido por transferencia y redirigir
      if (metodoPago === 'transferencia') {
        try {
          const resT = await fetch('/api/transferencia/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              comprador: { nombre: form.nombre, apellido: form.apellido, email: form.email, telefono: form.telefono },
              direccion: { cp: form.cp, calle: form.calle, numero: form.numero, interior: form.interior, colonia: form.colonia, ciudad: form.ciudad, estado: form.estado, referencia: form.referencia },
              costoEnvio,
              userId: user?.id || null,
              descuento: montoDescuento,
              descuentoTipo: codigoAplicado ? 'codigo' : (descuentoPrimeraCompra ? 'primera_compra' : null),
              codigoDescuento: codigoAplicado ? codigoAplicado.codigo : null,
            }),
          })
          const dataT = await resT.json()
          if (dataT.pedidoId) {
            // Limpiar carrito antes de redirigir
            window.location.href = '/transferencia/' + dataT.pedidoId
            return
          } else {
            alert('Error al crear el pedido. Intenta de nuevo.')
            setEnviando(false)
            return
          }
        } catch (e) {
          console.error(e)
          alert('Error al procesar. Intenta de nuevo.')
          setEnviando(false)
          return
        }
      }`

  content = content.slice(0, finSetEnviando) + ramaTransferencia + content.slice(finSetEnviando)
  cambios++
  console.log('2) Rama de transferencia agregada en handlePagar.')
} else {
  console.log('2) Rama de transferencia ya existe, omitido.')
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nParcial listo. ' + cambios + ' cambios aplicados. Falta el selector visual (paso 3).')
