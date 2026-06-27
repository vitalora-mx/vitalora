const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'pedidos', '[id]', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// ─────────────────────────────────────────────────────────────
// 1) Agregar estado paqueteriaInput despues de guiaInput
// ─────────────────────────────────────────────────────────────
if (!content.includes('paqueteriaInput')) {
  const anclaEstado = "const [guiaInput, setGuiaInput] = useState('')"
  if (content.includes(anclaEstado)) {
    content = content.replace(
      anclaEstado,
      anclaEstado + "\n  const [paqueteriaInput, setPaqueteriaInput] = useState('')"
    )
    cambios++
    console.log('1) Estado paqueteriaInput agregado.')
  } else {
    console.log('1) No se encontro ancla guiaInput. Abortado.')
    process.exit(1)
  }
}

// ─────────────────────────────────────────────────────────────
// 2) Reemplazar la funcion guardarGuia completa
// ─────────────────────────────────────────────────────────────
const guardarViejo = `  async function guardarGuia() {
    if (!guiaInput.trim()) return
    setGuardando(true)
    await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, numero_guia: guiaInput.trim(), estado: 'enviado' }),
    })`

// Buscar de forma flexible (puede variar indentacion). Usamos marcador unico.
const idxGuardar = content.indexOf('async function guardarGuia()')
if (idxGuardar !== -1) {
  // Encontrar el cierre del fetch original: buscamos el body con numero_guia y estado enviado
  const idxBody = content.indexOf("body: JSON.stringify({ id: params.id, numero_guia: guiaInput.trim(), estado: 'enviado' }),", idxGuardar)
  if (idxBody !== -1) {
    // Reemplazar el body para incluir paqueteria
    content = content.replace(
      "body: JSON.stringify({ id: params.id, numero_guia: guiaInput.trim(), estado: 'enviado' }),",
      "body: JSON.stringify({ id: params.id, numero_guia: guiaInput.trim(), paqueteria: paqueteriaInput, estado: 'enviado' }),"
    )
    cambios++
    console.log('2) guardarGuia ahora envia paqueteria.')

    // Agregar el disparo del correo despues del fetch (antes de mostrarMsg)
    const anclaMsg = "mostrarMsg('N"
    const idxMsg = content.indexOf(anclaMsg, idxGuardar)
    if (idxMsg !== -1) {
      const envioCorreo = `// Disparar correo de envio al cliente con datos de rastreo
      try {
        await fetch('/api/admin/pedidos/notificar-envio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedidoId: params.id }),
        })
      } catch (e) { console.error('Error al enviar correo de envio:', e) }
      `
      content = content.slice(0, idxMsg) + envioCorreo + content.slice(idxMsg)
      cambios++
      console.log('3) Disparo de correo agregado en guardarGuia.')
    }

    // Tambien limpiar paqueteriaInput al cerrar
    content = content.replace(
      "setMostrarGuiaInput(false)\n    setGuiaInput('')",
      "setMostrarGuiaInput(false)\n    setGuiaInput('')\n    setPaqueteriaInput('')"
    )
  } else {
    console.log('2) No se encontro el body del fetch. Revisar.')
  }
} else {
  console.log('2) No se encontro guardarGuia. Abortado.')
}

// ─────────────────────────────────────────────────────────────
// 4) Validacion: guardarGuia requiere tambien paqueteria
// ─────────────────────────────────────────────────────────────
content = content.replace(
  "  async function guardarGuia() {\n    if (!guiaInput.trim()) return",
  "  async function guardarGuia() {\n    if (!guiaInput.trim() || !paqueteriaInput) return"
)

fs.writeFileSync(filePath, content, 'utf8')
console.log('\nListo. ' + cambios + ' cambios aplicados (logica).')
