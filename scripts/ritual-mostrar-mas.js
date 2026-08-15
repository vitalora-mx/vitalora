const fs = require('fs')
const archivo = 'app/(store)/ritual/page.tsx'
let c = fs.readFileSync(archivo, 'utf8')

const usaCRLF = c.includes('\r\n')
c = c.replace(/\r\n/g, '\n')

const buscar = `      .from('ritual_videos')
      .select('*, ritual_temas(nombre)')
      .eq('activo', true)
      .not('posicion', 'is', null)
      .order('posicion', { ascending: true })
      .limit(20),`

const nuevo = `      .from('ritual_videos')
      .select('*, ritual_temas(nombre)')
      .eq('activo', true)
      .order('posicion', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(12),`

if (!c.includes(buscar)) {
  console.log('ERROR: no se encontro la consulta. NO se modifico nada.')
  process.exit(1)
}

c = c.replace(buscar, nuevo)

if (usaCRLF) c = c.replace(/\n/g, '\r\n')

fs.writeFileSync(archivo, c, 'utf8')
console.log('OK: consulta de ritual actualizada.')