import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = 'https://vitalora.com.mx'

// Generar código único tipo "NOMBRE" + 4 dígitos
function generarCodigo(nombre: string): string {
  const base = nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 6)
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${base}${num}`
}

export async function GET() {
  try {
    const { data: influencers, error } = await supabase
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const pendientes = influencers?.filter(i => i.estado === 'pendiente').length ?? 0
    const aprobados = influencers?.filter(i => i.estado === 'aprobado').length ?? 0

    return NextResponse.json({
      influencers: influencers ?? [],
      stats: { pendientes, aprobados, total: influencers?.length ?? 0 }
    })
  } catch (err) {
    console.error('Error admin influencers GET:', err)
    return NextResponse.json({ error: 'Error al cargar influencers' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, accion, notas } = body

    if (!id || !accion) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const { data: influencer, error: errInf } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', id)
      .single()

    if (errInf || !influencer) {
      return NextResponse.json({ error: 'Influencer no encontrado' }, { status: 404 })
    }

    // ─── APROBAR ───
    if (accion === 'aprobar') {
      let codigo = influencer.codigo

      // 1) Generar código si no tiene
      if (!codigo) {
        let intentos = 0
        let codigoUnico = false
        while (!codigoUnico && intentos < 10) {
          codigo = generarCodigo(influencer.nombre)
          const { data: existe } = await supabase
            .from('codigos_descuento')
            .select('id')
            .eq('codigo', codigo)
            .maybeSingle()
          if (!existe) codigoUnico = true
          intentos++
        }

        const { error: errCodigo } = await supabase
          .from('codigos_descuento')
          .insert({
            codigo,
            tipo: 'porcentaje',
            valor: 5,
            minimo_compra: 0,
            max_usos: null,
            usos_actuales: 0,
            max_usos_por_email: 3,
            es_influencer: true,
            influencer_id: influencer.id,
            activo: true,
            fecha_inicio: new Date().toISOString(),
            fecha_fin: null,
          })

        if (errCodigo) {
          console.error('Error al crear código:', errCodigo)
          return NextResponse.json({ error: 'Error al generar el código de descuento' }, { status: 500 })
        }
      }

      // 2) Crear cuenta de Supabase si no existe
      let cuentaCreada = false
      const emailLimpio = influencer.email.toLowerCase().trim()

      // Verificar si ya tiene cuenta en el sistema de auth
      let usuarioExistente = null
      for (let page = 1; page <= 20; page++) {
        const { data: usersData } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
        if (!usersData) break
        usuarioExistente = usersData.users.find(u => u.email?.toLowerCase() === emailLimpio) ?? null
        if (usuarioExistente) break
        if (usersData.users.length < 1000) break
      }

      if (!usuarioExistente) {
        // Crear usuario con contraseña aleatoria temporal (la cambiará vía correo)
        const passwordTemp = crypto.randomBytes(24).toString('hex')
        const { data: nuevoUser, error: errUser } = await supabase.auth.admin.createUser({
          email: emailLimpio,
          password: passwordTemp,
          email_confirm: true,
        })

        if (!errUser && nuevoUser.user) {
          cuentaCreada = true
          // Poner el nombre en su perfil (el perfil se crea por trigger; lo actualizamos por id)
          const [nombre, ...apellidoArr] = influencer.nombre.split(' ')
          await supabase
            .from('perfiles')
            .update({ nombre, apellido: apellidoArr.join(' ') })
            .eq('id', nuevoUser.user.id)
        } else if (errUser) {
          console.error('Error al crear cuenta de influencer:', errUser)
        }
      }

      // 3) Generar token para que establezca su contraseña
      const token = crypto.randomBytes(32).toString('hex')
      const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días para el primer acceso
      await supabase.from('password_reset_tokens').insert({
        email: emailLimpio,
        token,
        expira_at: expira.toISOString(),
      })
      const enlacePassword = `${BASE_URL}/recuperar/nueva?token=${token}`

      // 4) Actualizar el influencer a aprobado
      const { error: errUpdate } = await supabase
        .from('influencers')
        .update({
          estado: 'aprobado',
          codigo,
          aprobado_at: new Date().toISOString(),
          notas_admin: notas ?? influencer.notas_admin,
        })
        .eq('id', id)

      if (errUpdate) throw errUpdate

      // 5) Enviar correo de bienvenida
      try {
        await resend.emails.send({
          from: 'Vitalora <hola@vitalora.com.mx>',
          to: emailLimpio,
          subject: '¡Bienvenida al programa de embajadoras de Vitalora! ✦',
          html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:560px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="150" style="display:block;margin:0 auto;max-width:150px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:6px;">EMBAJADORAS</div>
  </div>
  <div style="padding:40px 32px;">
    <h2 style="font-size:24px;color:#0E0E0E;margin:0 0 16px;font-weight:400;">¡Felicidades, ${influencer.nombre.split(' ')[0]}!</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
      Tu solicitud fue aprobada. Ya eres parte del programa de embajadoras de Vitalora. 🎉
    </p>
    <div style="background:#0E0E0E;border:1px solid #C9A961;border-radius:6px;padding:24px;text-align:center;margin:0 0 24px;">
      <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(201,169,97,0.7);margin-bottom:8px;">Tu código de descuento</div>
      <div style="font-size:30px;letter-spacing:0.1em;color:#C9A961;font-family:Georgia,serif;">${codigo}</div>
    </div>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 8px;">
      Comparte tu código con tu comunidad: les da <strong>5% de descuento</strong> y tú ganas <strong>5% de comisión</strong> por cada venta.
    </p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
      Para entrar a tu portal y crear tu contraseña, haz clic aquí:
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${enlacePassword}" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:0.05em;">Crear mi contraseña</a>
    </div>
    <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">
      Una vez creada, podrás acceder a tu portal en <a href="${BASE_URL}/influencer/portal" style="color:#C9A961;">vitalora.com.mx/influencer/portal</a> para ver tus ventas, comisiones y solicitar tus pagos. Este enlace expira en 7 días.
    </p>
  </div>
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`,
        })
      } catch (emailErr) {
        console.error('Error al enviar correo de bienvenida:', emailErr)
        // No bloqueamos la aprobación si el correo falla
      }

      return NextResponse.json({ ok: true, codigo, cuentaCreada })
    }

    // ─── ELIMINAR ───
    if (accion === 'eliminar') {
      // Verificar que no tenga saldo pendiente
      // 1) Comisiones pendientes sin pagar
      const { data: comisionesPend } = await supabase
        .from('influencer_comisiones')
        .select('id, monto_comision')
        .eq('influencer_id', id)
        .eq('estado', 'pendiente')

      const saldoPendiente = (comisionesPend ?? []).reduce((a, c) => a + (c.monto_comision ?? 0), 0)

      // 2) Solicitudes de pago en proceso
      const { data: solicitudesPend } = await supabase
        .from('influencer_pagos')
        .select('id')
        .eq('influencer_id', id)
        .eq('estado', 'solicitado')

      if (saldoPendiente > 0 || (solicitudesPend && solicitudesPend.length > 0)) {
        return NextResponse.json({
          error: 'No puedes eliminar a esta embajadora porque tiene saldo o pagos pendientes. Resuelve los pagos primero.'
        }, { status: 400 })
      }

      // Sin saldo pendiente: borrar todo
      // a) Borrar su código de descuento
      if (influencer.codigo) {
        await supabase.from('codigos_descuento').delete().eq('codigo', influencer.codigo)
      }

      // b) Borrar comisiones (todas ya están pagadas o no hay) y pagos
      await supabase.from('influencer_comisiones').delete().eq('influencer_id', id)
      await supabase.from('influencer_pagos').delete().eq('influencer_id', id)

      // c) Borrar su cuenta de Supabase Auth (para liberar el correo)
      const emailLimpio = influencer.email.toLowerCase().trim()
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('id')
        .eq('email', emailLimpio)
        .maybeSingle()

      if (perfil) {
        try {
          await supabase.auth.admin.deleteUser(perfil.id)
        } catch (e) {
          console.error('Error al borrar cuenta auth:', e)
        }
      }

      // d) Borrar el registro del influencer
      await supabase.from('influencers').delete().eq('id', id)

      return NextResponse.json({ ok: true, eliminado: true })
    }

    // ─── MARCAR CLABE COMO REVISADA ───
    if (accion === 'marcar_clabe_revisada') {
      await supabase
        .from('influencers')
        .update({ clabe_cambio_revisado: true })
        .eq('id', id)
      return NextResponse.json({ ok: true })
    }

    // ─── RECHAZAR / PAUSAR / REACTIVAR ───
    if (accion === 'rechazar' || accion === 'pausar' || accion === 'reactivar') {
      const nuevoEstado = accion === 'rechazar' ? 'rechazado' : accion === 'pausar' ? 'pausado' : 'aprobado'

      if (influencer.codigo && (accion === 'rechazar' || accion === 'pausar')) {
        await supabase
          .from('codigos_descuento')
          .update({ activo: false })
          .eq('codigo', influencer.codigo)
      }
      if (influencer.codigo && accion === 'reactivar') {
        await supabase
          .from('codigos_descuento')
          .update({ activo: true })
          .eq('codigo', influencer.codigo)
      }

      const { error } = await supabase
        .from('influencers')
        .update({ estado: nuevoEstado, notas_admin: notas ?? influencer.notas_admin })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (err) {
    console.error('Error admin influencers PATCH:', err)
    return NextResponse.json({ error: 'Error al procesar la acción' }, { status: 500 })
  }
}

// Generar URL firmada para ver la constancia (bucket privado)
export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    if (!path) return NextResponse.json({ error: 'Path requerido' }, { status: 400 })

    const { data, error } = await supabase.storage
      .from('influencer-docs')
      .createSignedUrl(path, 300)

    if (error || !data) {
      return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('Error signed url:', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
