const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'pedidos', '[id]', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// La funcion imprimirGuia abre una URL de Mercado Libre. La cambiamos para que
// simplemente abra el formulario de guia (mostrarGuiaInput) en vez de ML.
const viejo = `  function imprimirGuia() {
    if (!pedido?.numero_guia) {
      setMostrarGuiaInput(true)
      return
    }
    window.open(\`https://www.mercadolibre.com.mx/envios/label/print?shipment_id=\${pedido.numero_guia}\`, '_blank')
  }`

const nuevo = `  function imprimirGuia() {
    // Abre el formulario para capturar/editar la paqueteria y el numero de guia.
    // (Las guias se generan en Skydropx; aqui solo registramos el numero y notificamos al cliente.)
    if (pedido?.numero_guia) {
      setGuiaInput(pedido.numero_guia)
      setPaqueteriaInput(pedido.paqueteria || '')
    }
    setMostrarGuiaInput(true)
  }`

if (content.includes(viejo)) {
  content = content.replace(viejo, nuevo)
  console.log('Listo: imprimirGuia ya no usa Mercado Libre, ahora abre el formulario de guia.')
} else {
  // Intento mas flexible: solo reemplazar la linea del window.open de ML
  const regexML = /window\.open\(`https:\/\/www\.mercadolibre\.com\.mx\/envios\/label\/print\?shipment_id=\$\{pedido\.numero_guia\}`, '_blank'\)/
  if (regexML.test(content)) {
    content = content.replace(regexML, 'setMostrarGuiaInput(true)')
    console.log('Listo (via regex): se quito la URL de Mercado Libre.')
  } else {
    console.log('No se encontro la funcion imprimirGuia con ML. Quiza ya fue cambiada.')
  }
}

// Tambien necesitamos que el pedido tenga el campo paqueteria en su tipo/interfaz.
// Agregar 'paqueteria' a la interfaz Pedido si no existe.
if (!content.includes('paqueteria: string | null')) {
  const anclaTipo = 'numero_guia: string | null'
  if (content.includes(anclaTipo)) {
    content = content.replace(anclaTipo, "numero_guia: string | null\n  paqueteria: string | null")
    console.log('Campo paqueteria agregado a la interfaz Pedido.')
  }
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Hecho.')
