import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombre, email, telefono,
      instagram, tiktok, youtube, facebook, otra_red, seguidores,
      fiscal_rfc, fiscal_razon_social, fiscal_regimen, fiscal_cp,
      constancia_url,
      puede_facturar,
      banco, clabe, titular_cuenta,
    } = body

    // Validaciones básicas
    if (!nombre || !email) {
      return NextResponse.json({ error: 'Nombre y email son obligatorios.' }, { status: 400 })
    }

    if (!puede_facturar) {
      return NextResponse.json({
        error: 'Para participar en el programa necesitas poder emitir facturas CFDI.'
      }, { status: 400 })
    }

    if (!fiscal_rfc || !fiscal_razon_social || !fiscal_regimen) {
      return NextResponse.json({ error: 'Los datos fiscales son obligatorios.' }, { status: 400 })
    }

    if (!constancia_url) {
      return NextResponse.json({ error: 'Debes subir tu Constancia de Situación Fiscal.' }, { status: 400 })
    }

    if (!clabe || clabe.length !== 18 || !/^\d{18}$/.test(clabe)) {
      return NextResponse.json({ error: 'La CLABE debe tener exactamente 18 dígitos.' }, { status: 400 })
    }

    if (!banco || !titular_cuenta) {
      return NextResponse.json({ error: 'Los datos bancarios son obligatorios.' }, { status: 400 })
    }

    // Verificar que el email no esté ya registrado
    const { data: existente } = await supabase
      .from('influencers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existente) {
      return NextResponse.json({
        error: 'Ya existe una solicitud con este correo. Te contactaremos pronto.'
      }, { status: 409 })
    }

    // Insertar el registro como pendiente
    const { error } = await supabase
      .from('influencers')
      .insert({
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        telefono: telefono?.trim() ?? null,
        instagram: instagram?.trim() ?? null,
        tiktok: tiktok?.trim() ?? null,
        youtube: youtube?.trim() ?? null,
        facebook: facebook?.trim() ?? null,
        otra_red: otra_red?.trim() ?? null,
        seguidores: seguidores?.trim() ?? null,
        fiscal_rfc: fiscal_rfc.toUpperCase().trim(),
        fiscal_razon_social: fiscal_razon_social.trim(),
        fiscal_regimen: fiscal_regimen,
        fiscal_cp: fiscal_cp?.trim() ?? null,
        constancia_url: constancia_url,
        puede_facturar: true,
        banco: banco.trim(),
        clabe: clabe.trim(),
        titular_cuenta: titular_cuenta.trim(),
        estado: 'pendiente',
      })

    if (error) {
      console.error('Error al registrar influencer:', error)
      return NextResponse.json({ error: 'Error al procesar el registro.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Error registro influencer:', err)
    return NextResponse.json({ error: 'Error al procesar el registro.' }, { status: 500 })
  }
}
