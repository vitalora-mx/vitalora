const fs = require('fs')
const archivo = 'app/api/admin/codigos/route.ts'
let c = fs.readFileSync(archivo, 'utf8')

const usaCRLF = c.includes('\r\n')
c = c.replace(/\r\n/g, '\n')

const buscar = `      ciudad_restringida: ciudadLimpia,
    })
    .select().single()`

const nuevo = `      ciudad_restringida: ciudadLimpia,
      influencer_id: body.influencer_id ? Number(body.influencer_id) : null,
      es_influencer: body.influencer_id ? true : false,
    })
    .select().single()`

if (!c.includes(buscar)) {
  console.log('ERROR: no se encontro el insert. NO se modifico nada.')
  process.exit(1)
}

c = c.replace(buscar, nuevo)

if (usaCRLF) c = c.replace(/\n/g, '\r\n')

fs.writeFileSync(archivo, c, 'utf8')
console.log('OK: influencer_id y es_influencer agregados al POST de codigos.')