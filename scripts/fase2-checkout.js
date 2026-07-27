const fs = require('fs')
const archivo = 'app/(store)/checkout/page.tsx'
let c = fs.readFileSync(archivo, 'utf8')

const cambios = [
  {
    nombre: '1. Ampliar estado codigoAplicado con datos de envio',
    buscar: `  const [codigoAplicado, setCodigoAplicado] = useState<{ codigo: string; tipo: string; valor: number; montoDescuento: number; descripcion: string } | null>(null)`,
    reemplazar: `  const [codigoAplicado, setCodigoAplicado] = useState<{ codigo: string; tipo: string; valor: number; montoDescuento: number; descripcion: string; descuentoEnvio?: string; envioPrecioFijo?: number; ciudadRestringida?: string | null; ciudadCoincide?: boolean } | null>(null)`,
  },
  {
    nombre: '2. Enviar la ciudad al validar el codigo',
    buscar: `        body: JSON.stringify({ codigo: codigoInput, subtotal: total(), email: form.email }),`,
    reemplazar: `        body: JSON.stringify({ codigo: codigoInput, subtotal: total(), email: form.email, ciudad: form.ciudad }),`,
  },
  {
    nombre: '3. Recalcular costo de envio con la regla de codigo/ciudad',
    buscar: `  const costoEnvio = subtotal >= ENVIO_GRATIS ? 0 : COSTO_ENVIO`,
    reemplazar: `  // Regla sagrada: compra >= 1000 => envio gratis siempre, sin importar codigo ni ciudad
  let costoEnvio = subtotal >= ENVIO_GRATIS ? 0 : COSTO_ENVIO
  // Descuento de envio por codigo (solo si NO aplica ya el gratis por monto)
  let envioBloqueadoPorCiudad = false
  if (costoEnvio > 0 && codigoAplicado && codigoAplicado.descuentoEnvio && codigoAplicado.descuentoEnvio !== 'ninguno') {
    const ciudadOk = !codigoAplicado.ciudadRestringida ||
      normalizarCiudadCheckout(form.ciudad) === normalizarCiudadCheckout(codigoAplicado.ciudadRestringida)
    if (ciudadOk) {
      if (codigoAplicado.descuentoEnvio === 'gratis') costoEnvio = 0
      else if (codigoAplicado.descuentoEnvio === 'fijo') costoEnvio = codigoAplicado.envioPrecioFijo || 0
    } else if (form.ciudad.trim() !== '') {
      // El codigo tiene envio pero la ciudad no coincide: envio normal + aviso
      envioBloqueadoPorCiudad = true
    }
  }`,
  },
  {
    nombre: '4. Agregar funcion normalizarCiudadCheckout antes del return del componente',
    buscar: `  const totalFinal = subtotal - montoDescuento + costoEnvio`,
    reemplazar: `  const totalFinal = subtotal - montoDescuento + costoEnvio
  // (helper definido abajo del archivo)`,
  },
]

// Verificar todos antes de tocar nada
let ok = true
for (const cambio of cambios) {
  if (!c.includes(cambio.buscar)) {
    console.log('ERROR en: ' + cambio.nombre)
    console.log('   No se encontro el texto. NO se modifico nada.')
    ok = false
    break
  }
}

// La funcion helper se agrega una sola vez, al inicio del archivo despues de los imports
const helperFn = `
function normalizarCiudadCheckout(txt: string): string {
  return (txt || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim()
}
`

if (ok) {
  for (const cambio of cambios) {
    c = c.replace(cambio.buscar, cambio.reemplazar)
  }
  // Insertar el helper justo despues del bloque de imports (antes de la primera const o export)
  const marcadorExport = c.indexOf('export default function')
  if (marcadorExport !== -1 && !c.includes('function normalizarCiudadCheckout')) {
    c = c.slice(0, marcadorExport) + helperFn + '\n' + c.slice(marcadorExport)
  }
  fs.writeFileSync(archivo, c, 'utf8')
  console.log('OK: los cambios del checkout se aplicaron correctamente.')
} else {
  console.log('No se guardo ningun cambio. El archivo quedo intacto.')
}