import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = 'https://vitalora.com.mx'
const ROLES_VALIDOS = ['dueno', 'gerente', 'editor', 'ventas']

// Helper: verificar que quien hace la peticion es Dueño
async function esDueno(solicitanteId: string): Promise<boolean> {
  if (!solicitanteId) return false
  const { data } = await supabaseAdmin
    .from('admin_usuarios')
    .select('rol, activo')
    .eq('id', solicitanteId)
    .maybeSingle()
  return !!data && data.activo && data.rol === 'dueno'
}

// GET: listar todos los usuarios admin (solo dueño)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const solicitanteId = searchParams.get('solicitanteId') || ''

    if (!(await esDueno(solicitanteId))) {
      return NextResponse.json({ error: 'Solo el Dueño puede gestionar usuarios.' }, { status: 403 })
    }

    const { data: usuarios } = await supabaseAdmin
      .from('admin_usuarios')
      .select('id, email, nombre, rol, activo, created_at')
      .order('created_at', { ascending: true })

    return NextResponse.json({ usuarios: usuarios ?? [] })
  } catch (err) {
    console.error('Error al listar usuarios admin:', err)
    return NextResponse.json({ error: 'Error al cargar usuarios.' }, { status: 500 })
  }
}

// POST: invitar a un nuevo usuario admin (solo dueño)
export async function POST(request: Request) {
  try {
    const { solicitanteId, email, nombre, rol } = await request.json()

    if (!(await esDueno(solicitanteId))) {
      return NextResponse.json({ error: 'Solo el Dueño puede invitar usuarios.' }, { status: 403 })
    }

    if (!email || !nombre || !rol) {
      return NextResponse.json({ error: 'Faltan datos (email, nombre o rol).' }, { status: 400 })
    }

    if (!ROLES_VALIDOS.includes(rol)) {
      return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 })
    }

    const emailLimpio = email.toLowerCase().trim()

    // Verificar que no exista ya como admin
    const { data: yaExiste } = await supabaseAdmin
      .from('admin_usuarios')
      .select('id')
      .eq('email', emailLimpio)
      .maybeSingle()

    if (yaExiste) {
      return NextResponse.json({ error: 'Ya existe un usuario admin con ese correo.' }, { status: 400 })
    }

    // Buscar si el email ya tiene cuenta en Supabase Auth
    let userId: string | null = null
    let page = 1
    while (page <= 20) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data) break
      const encontrado = data.users.find(u => u.email && u.email.toLowerCase() === emailLimpio)
      if (encontrado) { userId = encontrado.id; break }
      if (data.users.length < 1000) break
      page++
    }

    // Si no existe, crear cuenta con contraseña temporal aleatoria
    if (!userId) {
      const passwordTemp = crypto.randomBytes(24).toString('hex')
      const { data: nuevo, error: errNuevo } = await supabaseAdmin.auth.admin.createUser({
        email: emailLimpio,
        password: passwordTemp,
        email_confirm: true,
      })
      if (errNuevo || !nuevo.user) {
        return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 500 })
      }
      userId = nuevo.user.id
    }

    // Registrar en admin_usuarios
    const { error: errAdmin } = await supabaseAdmin
      .from('admin_usuarios')
      .insert({
        id: userId,
        email: emailLimpio,
        nombre,
        rol,
        activo: true,
        invitado_por: solicitanteId,
      })

    if (errAdmin) {
      console.error('Error al registrar admin:', errAdmin)
      return NextResponse.json({ error: 'No se pudo registrar el usuario.' }, { status: 500 })
    }

    // Generar token para que cree su contraseña (válido 7 días)
    const token = crypto.randomBytes(32).toString('hex')
    const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await supabaseAdmin.from('password_reset_tokens').insert({
      email: emailLimpio,
      token,
      expira_at: expira.toISOString(),
    })
    const enlace = `${BASE_URL}/recuperar/nueva?token=${token}&destino=admin`

    // Enviar correo de invitación
    const rolLabel = rol === 'dueno' ? 'Dueño' : rol === 'gerente' ? 'Gerente' : rol === 'editor' ? 'Editor' : 'Ventas'
    try {
      await resend.emails.send({
        from: 'Vitalora <hola@vitalora.com.mx>',
        to: emailLimpio,
        subject: 'Acceso al panel de administración — Vitalora',
        html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="150" style="display:block;margin:0 auto;max-width:150px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:6px;">ADMINISTRACIÓN</div>
  </div>
  <div style="padding:40px 32px;">
    <h2 style="font-size:22px;color:#0E0E0E;margin:0 0 16px;font-weight:400;">Hola ${nombre.split(' ')[0]},</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
      Se te ha dado acceso al panel de administración de Vitalora con el rol de <strong>${rolLabel}</strong>. Para empezar, crea tu contraseña haciendo clic en el botón:
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${enlace}" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:0.05em;">Crear mi contraseña</a>
    </div>
    <p style="font-size:13px;color:#777;line-height:1.6;margin:0;">
      Una vez creada, podrás entrar en <a href="${BASE_URL}/admin" style="color:#C9A961;">vitalora.com.mx/admin</a> con tu correo y contraseña. Este enlace expira en 7 días.
    </p>
  </div>
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`,
      })
    } catch (emailErr) {
      console.error('Error al enviar correo de invitación:', emailErr)
      // No bloqueamos: el usuario quedó creado, se puede reenviar
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al invitar usuario admin:', err)
    return NextResponse.json({ error: 'Error al invitar usuario.' }, { status: 500 })
  }
}

// DELETE: eliminar por completo a un usuario admin (solo dueño)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const solicitanteId = searchParams.get('solicitanteId') || ''
    const id = searchParams.get('id') || ''

    if (!(await esDueno(solicitanteId))) {
      return NextResponse.json({ error: 'Solo el Dueño puede eliminar usuarios.' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del usuario.' }, { status: 400 })
    }

    // No permitir eliminarse a si mismo
    if (id === solicitanteId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 400 })
    }

    // Verificar el rol del usuario a eliminar (no permitir borrar a otro Dueño)
    const { data: objetivo } = await supabaseAdmin
      .from('admin_usuarios')
      .select('rol')
      .eq('id', id)
      .maybeSingle()

    if (objetivo?.rol === 'dueno') {
      return NextResponse.json({ error: 'No se puede eliminar a un Dueño.' }, { status: 400 })
    }

    // 1) Quitarlo de admin_usuarios
    const { error: errAdmin } = await supabaseAdmin
      .from('admin_usuarios')
      .delete()
      .eq('id', id)

    if (errAdmin) {
      return NextResponse.json({ error: 'No se pudo eliminar de la lista de admins.' }, { status: 500 })
    }

    // 2) Eliminar su cuenta de Supabase Auth por completo
    //    (asi, si se reinvita, recibe una invitacion nueva desde cero)
    try {
      await supabaseAdmin.auth.admin.deleteUser(id)
    } catch (e) {
      console.error('Error al eliminar usuario de Auth (no critico):', e)
      // No bloqueamos: ya salio de admin_usuarios, que es lo que controla el acceso
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al eliminar usuario admin:', err)
    return NextResponse.json({ error: 'Error al eliminar usuario.' }, { status: 500 })
  }
}

// PATCH: cambiar rol o activar/desactivar (solo dueño)
export async function PATCH(request: Request) {
  try {
    const { solicitanteId, id, rol, activo } = await request.json()

    if (!(await esDueno(solicitanteId))) {
      return NextResponse.json({ error: 'Solo el Dueño puede modificar usuarios.' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del usuario.' }, { status: 400 })
    }

    // No permitir que el dueño se desactive o se quite el rol a sí mismo
    if (id === solicitanteId) {
      return NextResponse.json({ error: 'No puedes modificar tu propia cuenta de Dueño.' }, { status: 400 })
    }

    const cambios: { rol?: string; activo?: boolean } = {}
    if (rol !== undefined) {
      if (!ROLES_VALIDOS.includes(rol)) {
        return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 })
      }
      cambios.rol = rol
    }
    if (activo !== undefined) {
      cambios.activo = activo
    }

    const { error } = await supabaseAdmin
      .from('admin_usuarios')
      .update(cambios)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'No se pudo actualizar.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al modificar usuario admin:', err)
    return NextResponse.json({ error: 'Error al modificar usuario.' }, { status: 500 })
  }
}
