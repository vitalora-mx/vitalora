const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'components', 'store', 'suplementos', 'SuplementosProductos.tsx')
let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('paginacion-botones')) {
  console.log('Los botones ya existen. Nada que hacer.')
  process.exit(0)
}

const ancla = "            ))}\n          </div>\n        )}"

if (!content.includes(ancla)) {
  console.log('No se encontro el cierre del grid. Abortado.')
  process.exit(1)
}

const botones = `            ))}
          </div>
        )}

        {/* paginacion-botones */}
        {!loading && productosFiltrados.length > 0 && totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: isMobile ? '32px' : '48px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { if (paginaSegura > 1) { setPaginaActual(paginaSegura - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) } }}
              disabled={paginaSegura <= 1}
              style={{ minWidth: '40px', height: '40px', border: '1px solid #E8E0D5', borderRadius: '6px', background: 'white', color: paginaSegura <= 1 ? '#CCC' : '#2C2C2C', cursor: paginaSegura <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaSegura) <= 1)
              .map((n, idx, arr) => {
                const prev = arr[idx - 1]
                const hayGap = prev && n - prev > 1
                return (
                  <span key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hayGap && <span style={{ color: '#AAA', fontSize: '14px' }}>…</span>}
                    <button
                      onClick={() => { setPaginaActual(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      style={{ minWidth: '40px', height: '40px', border: '1px solid', borderColor: n === paginaSegura ? '#6B8F6B' : '#E8E0D5', borderRadius: '6px', background: n === paginaSegura ? '#6B8F6B' : 'white', color: n === paginaSegura ? 'white' : '#2C2C2C', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: n === paginaSegura ? 600 : 400 }}>
                      {n}
                    </button>
                  </span>
                )
              })}

            <button
              onClick={() => { if (paginaSegura < totalPaginas) { setPaginaActual(paginaSegura + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) } }}
              disabled={paginaSegura >= totalPaginas}
              style={{ minWidth: '40px', height: '40px', border: '1px solid #E8E0D5', borderRadius: '6px', background: 'white', color: paginaSegura >= totalPaginas ? '#CCC' : '#2C2C2C', cursor: paginaSegura >= totalPaginas ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </button>
          </div>
        )}`

content = content.replace(ancla, botones)
fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: botones de paginacion insertados en suplementos.')
