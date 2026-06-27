const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'envios-devoluciones', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// La seccion 1 quedo danada y se fusiono con parte de la 5, comiendose 2,3,4,5.
// Vamos a reemplazar ese objeto danado por las secciones 1 a 5 correctas.
// Identificamos el objeto danado por su contenido unico: "se procesan a trav" + "se genera con los datos"

// Buscar el inicio del objeto de la seccion 1
const inicioSec1 = content.indexOf("{ titulo: '1. Cobertura de env")
if (inicioSec1 === -1) {
  console.log('No se encontro la seccion 1. Abortado.')
  process.exit(1)
}

// Buscar el final de ese objeto danado: termina justo antes de "{ titulo: '6. Paquete no entregado'"
const inicioSec6 = content.indexOf("{ titulo: '6. Paquete no entregado'")
if (inicioSec6 === -1) {
  console.log('No se encontro la seccion 6. Abortado.')
  process.exit(1)
}

// Las secciones 1 a 5 correctas (con acentos bien escritos)
const seccionesCorrectas = `{ titulo: '1. Cobertura de env\u00edos', contenido: 'Realizamos env\u00edos a cualquier direcci\u00f3n dentro de la Rep\u00fablica Mexicana. No realizamos env\u00edos internacionales.' },
  { titulo: '2. Costos de env\u00edo', contenido: 'Compras menores a $1,000 MXN: costo de env\u00edo de $99 MXN. Compras iguales o mayores a $1,000 MXN: env\u00edo gratuito a cualquier parte de M\u00e9xico.' },
  { titulo: 'Env\u00edos a zonas extendidas', contenido: 'Algunas localidades de dif\u00edcil acceso o zonas extendidas pueden tener un costo de env\u00edo adicional que no se refleja en el total de tu compra. Si tu domicilio se encuentra en una de estas zonas, nos pondremos en contacto contigo antes de procesar tu pedido para informarte.' },
  { titulo: '3. Tiempos de entrega', contenido: 'El tiempo estimado de entrega es de 2 a 5 d\u00edas h\u00e1biles a partir de la confirmaci\u00f3n del pago. Los tiempos pueden variar en zonas rurales o extendidas. Los d\u00edas h\u00e1biles no incluyen s\u00e1bados, domingos ni d\u00edas festivos.' },
  { titulo: '4. Seguimiento del pedido', contenido: 'Una vez enviado el pedido, el comprador recibir\u00e1 un correo electr\u00f3nico con el n\u00famero de gu\u00eda de rastreo. El estado del pedido y n\u00famero de gu\u00eda tambi\u00e9n estar\u00e1n disponibles en la secci\u00f3n "Mis Pedidos" de la cuenta del usuario.' },
  { titulo: '5. Cambio de direcci\u00f3n', contenido: 'Una vez realizado el pago, NO es posible modificar la direcci\u00f3n de env\u00edo, debido a que la gu\u00eda se genera con los datos ingresados al momento de la compra. Si necesitas cancelar tu pedido antes de que sea enviado, cont\u00e1ctanos a hola@vitalora.com.mx. Si el pedido ya fue entregado a la paqueter\u00eda, los costos de env\u00edo no ser\u00e1n reembolsables.' },
  `

content = content.slice(0, inicioSec1) + seccionesCorrectas + content.slice(inicioSec6)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: secciones 1 a 5 reconstruidas correctamente (con zonas extendidas incluida).')
