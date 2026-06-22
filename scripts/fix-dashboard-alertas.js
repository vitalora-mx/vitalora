const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'api', 'admin', 'dashboard', 'route.ts')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1. Agregar las consultas nuevas justo antes de "function pct"
const ANCLA_PCT = 'function pct(hoy: number, ayer: number) {'
if (content.includes(ANCLA_PCT) && !content.includes('cambiosFiscalesPendientes')) {
  const CONSULTAS = `// --- Solicitudes de cambio fiscal pendientes ---
    const { count: cambiosFiscalesPendientes } = await supabaseAdmin
      .from('influencer_cambios_fiscales')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente')

    // --- CLABEs cambiadas sin revisar ---
    const { data: clabesCambiadas } = await supabaseAdmin
      .from('influencers')
      .select('id, nombre, clabe, clabe_anterior, clabe_cambiada_at')
      .eq('clabe_cambio_revisado', false)
      .order('clabe_cambiada_at', { ascending: false })

    ${ANCLA_PCT}`
  content = content.replace(ANCLA_PCT, CONSULTAS)
  cambios++
}

// 2. Agregar los campos al objeto alertas
const ANCLA_ALERTAS = 'resenasPendientes: resenasPendientes || 0,'
if (content.includes(ANCLA_ALERTAS) && !content.includes('cambiosFiscalesPendientes:')) {
  const NUEVO = `resenasPendientes: resenasPendientes || 0,
        cambiosFiscalesPendientes: cambiosFiscalesPendientes || 0,
        clabesCambiadas: (clabesCambiadas || []).map(c => ({ id: c.id, nombre: c.nombre, clabe: c.clabe, clabe_anterior: c.clabe_anterior, fecha: c.clabe_cambiada_at })),`
  content = content.replace(ANCLA_ALERTAS, NUEVO)
  cambios++
}

if (cambios === 0) {
  console.log('No se aplicaron cambios (puede que ya esten o no se hallaron las anclas).')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: ' + cambios + ' cambio(s) en el dashboard API.')
