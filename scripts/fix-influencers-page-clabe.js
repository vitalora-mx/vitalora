const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'influencers', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1. Agregar campos al interface Influencer (despues de clabe)
const ANCLA_INTERFACE = 'clabe: string | null'
if (content.includes(ANCLA_INTERFACE) && !content.includes('clabe_cambio_revisado')) {
  content = content.replace(
    ANCLA_INTERFACE,
    `clabe: string | null
  clabe_anterior: string | null
  clabe_cambiada_at: string | null
  clabe_cambio_revisado: boolean | null`
  )
  cambios++
}

// 2. Reemplazar el Campo CLABE por CLABE + alerta de cambio
const ANCLA_CLABE = '<Campo label="CLABE" valor={inf.clabe} mono />'
if (content.includes(ANCLA_CLABE) && !content.includes('clabe_cambio_revisado ===')) {
  const NUEVO_CLABE = `<Campo label="CLABE" valor={inf.clabe} mono />
              {inf.clabe_cambio_revisado === false && (
                <div style={{ gridColumn: '1 / -1', marginTop: '8px', padding: '12px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, marginBottom: '4px' }}>{'\\u26A0'} CLABE modificada recientemente</p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5 }}>
                    {inf.clabe_anterior ? \`Anterior: \${inf.clabe_anterior}\` : ''}
                    {inf.clabe_cambiada_at ? \` \\u00b7 \${new Date(inf.clabe_cambiada_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}\` : ''}
                  </p>
                  <button onClick={() => ejecutar('marcar_clabe_revisada')} disabled={procesando}
                    style={{ marginTop: '8px', padding: '7px 14px', background: '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {'\\u2713'} Marcar como revisada
                  </button>
                </div>
              )}`
  content = content.replace(ANCLA_CLABE, NUEVO_CLABE)
  cambios++
}

if (cambios === 0) {
  console.log('No se aplicaron cambios. Revisa las anclas manualmente.')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: ' + cambios + ' cambio(s) en la pagina de influencers.')
