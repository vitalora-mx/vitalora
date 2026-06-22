const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'cuenta', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

const ANCLA = "useAuthStore.getState().setAuth(data.user, data.session); setAuthLoading(false)"

if (!content.includes(ANCLA)) {
  if (content.includes('es-influencer')) {
    console.log('ℹ️ El cambio ya estaba aplicado. Nada que hacer.')
    process.exit(0)
  }
  console.log('No se encontro la linea de setAuth en handleAuth.')
  process.exit(1)
}

const NUEVO = "useAuthStore.getState().setAuth(data.user, data.session)\n" +
"    try {\n" +
"      const resInf = await fetch('/api/influencer/es-influencer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.user.email }) })\n" +
"      const infData = await resInf.json()\n" +
"      if (infData.esInfluencer) { window.location.href = '/influencer/portal'; return }\n" +
"    } catch {}\n" +
"    setAuthLoading(false)"

content = content.replace(ANCLA, NUEVO)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Listo: handleAuth actualizado. Influencers seran redirigidos a su portal.')
