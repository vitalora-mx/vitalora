const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1. Actualizar el tipo TypeScript de alertas
const TIPO_VIEJO = `stockBajo: { nombre: string; stock: number }[]; resenasPendientes: number`
const TIPO_NUEVO = `stockBajo: { nombre: string; stock: number }[]; resenasPendientes: number
    cambiosFiscalesPendientes: number
    clabesCambiadas: { id: number; nombre: string; clabe: string; clabe_anterior: string; fecha: string }[]`
if (content.includes(TIPO_VIEJO) && !content.includes('cambiosFiscalesPendientes')) {
  content = content.replace(TIPO_VIEJO, TIPO_NUEVO)
  cambios++
}

// 2. Agregar las dos alertas nuevas despues de la de resenas
const ALERTA_RESENAS_FIN = `title={\`\${data.alertas.resenasPendientes} reseña\${data.alertas.resenasPendientes > 1 ? 's' : ''} por moderar\`} desc="Apruébalas para que aparezcan en los productos." />
                )}`

// Como los acentos pueden venir mal codificados, buscamos por un patron mas robusto
const idxResenas = content.indexOf('resenasPendientes > 1')
if (idxResenas !== -1 && !content.includes('cambiosFiscalesPendientes >')) {
  // Encontrar el cierre ")}" despues de la alerta de resenas
  const desde = content.indexOf(')}', idxResenas)
  if (desde !== -1) {
    const insertarEn = desde + 2
    const NUEVAS_ALERTAS = `
              {data.alertas.cambiosFiscalesPendientes > 0 && (
                <AlertCard color="#C9A961" icon="\u{1F4CB}" title={\`\${data.alertas.cambiosFiscalesPendientes} cambio\${data.alertas.cambiosFiscalesPendientes > 1 ? 's' : ''} fiscal\${data.alertas.cambiosFiscalesPendientes > 1 ? 'es' : ''} por revisar\`} desc="Embajadoras solicitaron modificar sus datos fiscales." />
              )}
              {data.alertas.clabesCambiadas.length > 0 && (
                <AlertCard color="#EF4444" icon="\u{1F3E6}" title={\`\${data.alertas.clabesCambiadas.length} CLABE\${data.alertas.clabesCambiadas.length > 1 ? 's' : ''} modificada\${data.alertas.clabesCambiadas.length > 1 ? 's' : ''}\`} desc={data.alertas.clabesCambiadas.slice(0, 3).map(c => c.nombre).join(', ') + '. Revisa en Influencers.'} />
              )}`
    content = content.slice(0, insertarEn) + NUEVAS_ALERTAS + content.slice(insertarEn)
    cambios++
  }
}

// 3. Actualizar la condicion de "Todo en orden"
const COND_VIEJA = `data.alertas.esperandoGuia === 0 && data.alertas.resenasPendientes === 0 && data.alertas.stockBajo.length === 0`
const COND_NUEVA = `data.alertas.esperandoGuia === 0 && data.alertas.resenasPendientes === 0 && data.alertas.stockBajo.length === 0 && data.alertas.cambiosFiscalesPendientes === 0 && data.alertas.clabesCambiadas.length === 0`
if (content.includes(COND_VIEJA)) {
  content = content.replace(COND_VIEJA, COND_NUEVA)
  cambios++
}

if (cambios === 0) {
  console.log('No se aplicaron cambios. Revisa las anclas manualmente.')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: ' + cambios + ' cambio(s) en la pagina del dashboard.')
