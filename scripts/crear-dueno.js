// ============================================================
// Crea la PRIMERA cuenta de administrador (Dueño).
// Se corre UNA sola vez desde la terminal.
//
// Uso:
//   node scripts/crear-dueno.js "correo@ejemplo.com" "Tu Nombre" "tuContraseña"
//
// Lee las credenciales de Supabase desde .env.local
// ============================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leer .env.local manualmente
function leerEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const contenido = fs.readFileSync(envPath, 'utf8')
  const env = {}
  contenido.split('\n').forEach(linea => {
    const limpia = linea.trim()
    if (!limpia || limpia.startsWith('#')) return
    const idx = limpia.indexOf('=')
    if (idx === -1) return
    const clave = limpia.slice(0, idx).trim()
    let valor = limpia.slice(idx + 1).trim()
    // Quitar comillas si las tiene
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1)
    }
    env[clave] = valor
  })
  return env
}

async function main() {
  const [email, nombre, password] = process.argv.slice(2)

  if (!email || !nombre || !password) {
    console.log('Uso: node scripts/crear-dueno.js "correo@ejemplo.com" "Tu Nombre" "tuContraseña"')
    process.exit(1)
  }

  if (password.length < 8) {
    console.log('La contraseña debe tener al menos 8 caracteres.')
    process.exit(1)
  }

  const env = leerEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.log('No se encontraron NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const emailLimpio = email.toLowerCase().trim()

  // 1) Ver si el usuario ya existe en Auth
  let userId = null
  let page = 1
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data) break
    const encontrado = data.users.find(u => u.email && u.email.toLowerCase() === emailLimpio)
    if (encontrado) { userId = encontrado.id; break }
    if (data.users.length < 1000) break
    page++
  }

  // 2) Si no existe, crearlo
  if (!userId) {
    const { data: nuevo, error: errNuevo } = await supabase.auth.admin.createUser({
      email: emailLimpio,
      password,
      email_confirm: true,
    })
    if (errNuevo || !nuevo.user) {
      console.log('Error al crear el usuario:', errNuevo?.message)
      process.exit(1)
    }
    userId = nuevo.user.id
    console.log('Usuario creado en Supabase Auth.')
  } else {
    // Si ya existe, actualizar su contraseña
    await supabase.auth.admin.updateUserById(userId, { password })
    console.log('Usuario ya existia; contraseña actualizada.')
  }

  // 3) Registrarlo como Dueño en admin_usuarios
  const { error: errAdmin } = await supabase
    .from('admin_usuarios')
    .upsert({
      id: userId,
      email: emailLimpio,
      nombre,
      rol: 'dueno',
      activo: true,
    })

  if (errAdmin) {
    console.log('Error al registrar en admin_usuarios:', errAdmin.message)
    process.exit(1)
  }

  console.log('\n✓ LISTO. Tu cuenta de Dueño esta creada:')
  console.log('  Email:', emailLimpio)
  console.log('  Rol: Dueño (acceso total)')
  console.log('\nYa puedes entrar al admin con ese email y contraseña.')
}

main()
