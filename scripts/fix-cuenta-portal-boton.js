const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'cuenta', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1. Agregar estado esInfluencerCuenta después de "const [mounted, setMounted] = useState(false)"
const ANCLA_ESTADO = "const [mounted, setMounted] = useState(false)"
if (content.includes(ANCLA_ESTADO) && !content.includes('esInfluencerCuenta')) {
  content = content.replace(
    ANCLA_ESTADO,
    ANCLA_ESTADO + "\n  const [esInfluencerCuenta, setEsInfluencerCuenta] = useState(false)"
  )
  cambios++
}

// 2. Agregar verificación: cuando hay user con email, consultar si es influencer.
// Insertamos un useEffect justo despues de la funcion handleLogout.
const ANCLA_EFFECT = "function handleLogout() { logout(); setTab('perfil') }"
if (content.includes(ANCLA_EFFECT) && !content.includes('setEsInfluencerCuenta(')) {
  const EFFECT = ANCLA_EFFECT + "\n\n" +
"  useEffect(() => {\n" +
"    if (!user?.email) { setEsInfluencerCuenta(false); return }\n" +
"    fetch('/api/influencer/es-influencer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) })\n" +
"      .then(r => r.json())\n" +
"      .then(d => setEsInfluencerCuenta(!!d.esInfluencer))\n" +
"      .catch(() => setEsInfluencerCuenta(false))\n" +
"  }, [user])"
  content = content.replace(ANCLA_EFFECT, EFFECT)
  cambios++
}

// 3. Insertar el boton "Mi portal de embajadora" antes del boton Cerrar Sesion.
const ANCLA_BOTON = `<button onClick={handleLogout} style={{ padding: '10px 20px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar Sesión</button>`

if (content.includes(ANCLA_BOTON) && !content.includes('Mi portal de embajadora')) {
  const NUEVO_BLOQUE = `<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {esInfluencerCuenta && <a href="/influencer/portal" style={{ padding: '10px 20px', background: '#0E0E0E', border: '1px solid #0E0E0E', borderRadius: '6px', color: '#C9A961', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>✦ Mi portal de embajadora</a>}
            <button onClick={handleLogout} style={{ padding: '10px 20px', background: 'none', border: '1px solid #DDD', borderRadius: '6px', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar Sesión</button>
          </div>`
  content = content.replace(ANCLA_BOTON, NUEVO_BLOQUE)
  cambios++
}

if (cambios === 0) {
  console.log('No se aplico ningun cambio (puede que ya estuvieran aplicados o no se hallaron las anclas).')
  process.exit(1)
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: ' + cambios + ' cambio(s) aplicados. Boton de portal visible solo para influencers.')
