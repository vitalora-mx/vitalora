const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'api', 'admin', 'influencers', 'route.ts')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes("accion === 'marcar_clabe_revisada'")) {
  console.log('La accion ya existe. Nada que hacer.')
  process.exit(0)
}

// Insertar la nueva accion justo antes del bloque RECHAZAR / PAUSAR / REACTIVAR
const ANCLA = "// ─── RECHAZAR / PAUSAR / REACTIVAR ───"
const ANCLA_ALT = "if (accion === 'rechazar' || accion === 'pausar' || accion === 'reactivar') {"

const NUEVO_BLOQUE = `// ─── MARCAR CLABE COMO REVISADA ───
    if (accion === 'marcar_clabe_revisada') {
      await supabase
        .from('influencers')
        .update({ clabe_cambio_revisado: true })
        .eq('id', id)
      return NextResponse.json({ ok: true })
    }

    `

let insertado = false
if (content.includes(ANCLA)) {
  content = content.replace(ANCLA, NUEVO_BLOQUE + ANCLA)
  insertado = true
} else if (content.includes(ANCLA_ALT)) {
  content = content.replace(ANCLA_ALT, NUEVO_BLOQUE + ANCLA_ALT)
  insertado = true
}

if (!insertado) {
  console.log('No se encontro el ancla para insertar la accion. Revisa manualmente.')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: accion marcar_clabe_revisada agregada a la API de influencers.')
