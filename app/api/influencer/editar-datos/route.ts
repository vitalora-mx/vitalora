import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = 'gabomaciel7@gmail.com'

export async function POST(request: Request) {
  try {
    const { email, accion, datos } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const emailLimpio = email.toLowerCase().trim()

    const { data: influencer } = await supabase
      .from('influencers')
      .select('*')
      .eq('email', emailLimpio)
      .maybeSingle()

    if (!influencer) return NextResponse.json({ error: 'Influencer no encontrado' }, { status: 404 })

    // ─── Obtener datos ───
    if (accion === 'obtener') {
      const { data: cambioPendiente } = await supabase
        .from('influencer_cambios_fiscales')
        .select('*')
        .eq('influencer_id', influencer.id)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .maybeSingle()

      return NextResponse.json({
        datos: {
          nombre: influencer.nombre,
          telefono: influencer.telefono,
          instagram: influencer.instagram,
          tiktok: influencer.tiktok,
          youtube: influencer.youtube,
          facebook: influencer.facebook,
          otra_red: influencer.otra_red,
          seguidores: influencer.seguidores,
          banco: influencer.banco,
          clabe: influencer.clabe,
          titular_cuenta: influencer.titular_cuenta,
          fiscal_rfc: influencer.fiscal_rfc,
          fiscal_razon_social: influencer.fiscal_razon_social,
          fiscal_regimen: influencer.fiscal_regimen,
          fiscal_cp: influencer.fiscal_cp,
        },
        cambioFiscalPendiente: cambioPendiente ?? null,
      })
    }

    // ─── Guardar datos personales/redes/bancarios (libre) ───
    if (accion === 'guardar_personales') {
      const {
        nombre, telefono, instagram, tiktok, youtube, facebook, otra_red, seguidores,
        banco, clabe, titular_cuenta,
      } = datos

      if (clabe && (clabe.length !== 18 || !/^\d{18}$/.test(clabe))) {
        return NextResponse.json({ error: 'La CLABE debe tener exactamente 18 dígitos.' }, { status: 400 })
      }

      // Detectar cambio de CLABE
      const clabeNueva = clabe?.trim() ?? null
      const clabeCambio = clabeNueva && clabeNueva !== influencer.clabe

      const update: any = {
        nombre: nombre?.trim() ?? influencer.nombre,
        telefono: telefono?.trim() ?? null,
        instagram: instagram?.trim() ?? null,
        tiktok: tiktok?.trim() ?? null,
        youtube: youtube?.trim() ?? null,
        facebook: facebook?.trim() ?? null,
        otra_red: otra_red?.trim() ?? null,
        seguidores: seguidores?.trim() ?? null,
        banco: banco?.trim() ?? null,
        clabe: clabeNueva,
        titular_cuenta: titular_cuenta?.trim() ?? null,
      }

      // Si cambió la CLABE, registrar para alerta de seguridad
      if (clabeCambio) {
        update.clabe_anterior = influencer.clabe
        update.clabe_cambiada_at = new Date().toISOString()
        update.clabe_cambio_revisado = false
      }

      const { error } = await supabase.from('influencers').update(update).eq('id', influencer.id)

      if (error) {
        console.error('Error al guardar datos personales:', error)
        return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    // ─── Solicitar cambio de datos fiscales (requiere aprobación + constancia obligatoria) ───
    if (accion === 'solicitar_fiscal') {
      const { fiscal_rfc, fiscal_razon_social, fiscal_regimen, fiscal_cp, constancia_url } = datos

      if (!fiscal_rfc || !fiscal_razon_social || !fiscal_regimen) {
        return NextResponse.json({ error: 'Completa todos los datos fiscales.' }, { status: 400 })
      }

      // Constancia ahora es OBLIGATORIA
      if (!constancia_url) {
        return NextResponse.json({ error: 'Debes subir tu Constancia de Situación Fiscal actualizada.' }, { status: 400 })
      }

      const { data: pendiente } = await supabase
        .from('influencer_cambios_fiscales')
        .select('id')
        .eq('influencer_id', influencer.id)
        .eq('estado', 'pendiente')
        .maybeSingle()

      if (pendiente) {
        return NextResponse.json({ error: 'Ya tienes una solicitud de cambio fiscal en revisión.' }, { status: 409 })
      }

      const { error } = await supabase
        .from('influencer_cambios_fiscales')
        .insert({
          influencer_id: influencer.id,
          fiscal_rfc: fiscal_rfc.toUpperCase().trim(),
          fiscal_razon_social: fiscal_razon_social.trim(),
          fiscal_regimen,
          fiscal_cp: fiscal_cp?.trim() ?? null,
          constancia_url,
          estado: 'pendiente',
        })

      if (error) {
        console.error('Error al solicitar cambio fiscal:', error)
        return NextResponse.json({ error: 'Error al enviar la solicitud.' }, { status: 500 })
      }

      // Enviar correo de aviso al admin
      try {
        await resend.emails.send({
          from: 'Vitalora <hola@vitalora.com.mx>',
          to: ADMIN_EMAIL,
          subject: `Solicitud de cambio fiscal — ${influencer.nombre}`,
          html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">CAMBIO FISCAL</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;color:#0E0E0E;margin:0 0 16px;">Solicitud de cambio de datos fiscales</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 8px;">La embajadora <strong>${influencer.nombre}</strong> (${influencer.email}) solicitó modificar sus datos fiscales.</p>
    <div style="background:#FAFAF5;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="font-size:13px;color:#333;margin:0 0 6px;"><strong>Nuevo RFC:</strong> ${fiscal_rfc.toUpperCase()}</p>
      <p style="font-size:13px;color:#333;margin:0 0 6px;"><strong>Nueva razón social:</strong> ${fiscal_razon_social}</p>
      <p style="font-size:13px;color:#333;margin:0;"><strong>Nuevo régimen:</strong> ${fiscal_regimen}</p>
    </div>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">Los datos actuales siguen vigentes hasta que apruebes el cambio.</p>
    <div style="text-align:center;">
      <a href="https://vitalora.com.mx/admin/cambios-fiscales" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600;">Revisar solicitud</a>
    </div>
  </div>
</div></body></html>`,
        })
      } catch (emailErr) {
        console.error('Error al enviar correo de cambio fiscal:', emailErr)
        // No bloqueamos la solicitud si el correo falla
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (err) {
    console.error('Error editar datos influencer:', err)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
