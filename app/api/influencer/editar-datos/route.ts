import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: obtener todos los datos editables del influencer + si tiene cambio fiscal pendiente
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

    // ─── Obtener datos (para llenar el formulario de edición) ───
    if (accion === 'obtener') {
      // ¿Tiene un cambio fiscal pendiente?
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

    // ─── Guardar datos personales/redes/bancarios (libre, al instante) ───
    if (accion === 'guardar_personales') {
      const {
        nombre, telefono, instagram, tiktok, youtube, facebook, otra_red, seguidores,
        banco, clabe, titular_cuenta,
      } = datos

      // Validar CLABE si viene
      if (clabe && (clabe.length !== 18 || !/^\d{18}$/.test(clabe))) {
        return NextResponse.json({ error: 'La CLABE debe tener exactamente 18 dígitos.' }, { status: 400 })
      }

      const { error } = await supabase
        .from('influencers')
        .update({
          nombre: nombre?.trim() ?? influencer.nombre,
          telefono: telefono?.trim() ?? null,
          instagram: instagram?.trim() ?? null,
          tiktok: tiktok?.trim() ?? null,
          youtube: youtube?.trim() ?? null,
          facebook: facebook?.trim() ?? null,
          otra_red: otra_red?.trim() ?? null,
          seguidores: seguidores?.trim() ?? null,
          banco: banco?.trim() ?? null,
          clabe: clabe?.trim() ?? null,
          titular_cuenta: titular_cuenta?.trim() ?? null,
        })
        .eq('id', influencer.id)

      if (error) {
        console.error('Error al guardar datos personales:', error)
        return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    // ─── Solicitar cambio de datos fiscales (requiere aprobación) ───
    if (accion === 'solicitar_fiscal') {
      const { fiscal_rfc, fiscal_razon_social, fiscal_regimen, fiscal_cp, constancia_url } = datos

      if (!fiscal_rfc || !fiscal_razon_social || !fiscal_regimen) {
        return NextResponse.json({ error: 'Completa todos los datos fiscales.' }, { status: 400 })
      }

      // Verificar que no tenga ya una solicitud pendiente
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
          constancia_url: constancia_url ?? null,
          estado: 'pendiente',
        })

      if (error) {
        console.error('Error al solicitar cambio fiscal:', error)
        return NextResponse.json({ error: 'Error al enviar la solicitud.' }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (err) {
    console.error('Error editar datos influencer:', err)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
