const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', '(store)', 'cuenta', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

let cambios = 0

// 1. Modificar handleAuth para redirigir al portal si es influencer.
// Buscamos la línea exacta del setAuth.
const ANCLA = "useAuthStore.getState().setAuth(data.user, data.session); setAuthLoading(false)"

if (!content.includes(ANCLA)) {
  console.log('❌ No se encontró la línea de setAuth en handleAuth.')
  process.exit(1)
}

const NUEVO = `useAuthStore.getState().setAuth(data.user, data.session)
    // Si el usuario es influencer, redirigir a su portal
    try {
      const resInf = await fetch('/api/influencer/es-influencer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.user.email }) })
      const infData = await resInf.json()
      if (infData.esInfluencer) { window.location.href = '/influencer/portal'; return }
    } catch {}
    setAuthLoading(false)`

content = content.replace(ANCLA, NUEVO)
cambios++

fs.writeFileSync(filePath, content, 'utf8')
console.log(\`✅ handleAuth actualizado: \${cambios} cambio(s). Influencers serán redirigidos a su portal.\`)
