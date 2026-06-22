import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MINIMO_RETIRO = 500

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = (formData.get('email') as string)?.toLowerCase().trim()
    const file = formData.get('factura') as File | null

    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    if (!file) return NextResponse.json({ error: 'Debes adjuntar tu factura CFDI (PDF).' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'La factura debe ser un PDF.' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'El archivo no debe superar 5 MB.' }, { status: 400 })

    // Buscar el influencer
    const { data: influencer } = await supabase
      .from('influencers')
      .select('id, estado')
      .eq('email', email)
      .maybeSingle()

    if (!influencer) return NextResponse.json({ error: 'Influencer no encontrado.' }, { status: 404 })
    if (influencer.estado !== 'aprobado') return NextResponse.json({ error: 'Tu cuenta no está activa.' }, { status: 403 })

    // Verificar que no tenga ya una solicitud pendiente
    const { data: pendiente } = await supabase
      .from('influencer_pagos')
      .select('id')
      .eq('influencer_id', influencer.id)
      .eq('estado', 'solicitado')
      .maybeSingle()

    if (pendiente) {
      return NextResponse.json({ error: 'Ya tienes una solicitud de pago en proceso.' }, { status: 409 })
    }

    // Obtener comisiones disponibles (pendientes sin pago)
    const { data: comisiones } = await supabase
      .from('influencer_comisiones')
      .select('id, monto_comision')
      .eq('influencer_id', influencer.id)
      .eq('estado', 'pendiente')
      .is('pago_id', null)

    const disponibles = comisiones ?? []
    const saldo = disponibles.reduce((a, c) => a + (c.monto_comision ?? 0), 0)

    if (saldo < MINIMO_RETIRO) {
      return NextResponse.json({ error: `El monto mínimo para solicitar pago es $${MINIMO_RETIRO} MXN.` }, { status: 400 })
    }

    // Subir la factura
    const timestamp = Date.now()
    const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const facturaPath = `facturas-pago/${influencer.id}_${timestamp}_${nombreLimpio}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: errUpload } = await supabase.storage
      .from('influencer-docs')
      .upload(facturaPath, buffer, { contentType: 'application/pdf', upsert: false })

    if (errUpload) {
      console.error('Error al subir factura:', errUpload)
      return NextResponse.json({ error: 'Error al subir la factura.' }, { status: 500 })
    }

    // Crear la solicitud de pago
    const { data: pago, error: errPago } = await supabase
      .from('influencer_pagos')
      .insert({
        influencer_id: influencer.id,
        monto: saldo,
        factura_url: facturaPath,
        estado: 'solicitado',
      })
      .select('id')
      .single()

    if (errPago || !pago) {
      console.error('Error al crear solicitud:', errPago)
      return NextResponse.json({ error: 'Error al crear la solicitud.' }, { status: 500 })
    }

    // Vincular las comisiones a esta solicitud
    const ids = disponibles.map(c => c.id)
    await supabase
      .from('influencer_comisiones')
      .update({ pago_id: pago.id })
      .in('id', ids)

    // Reiniciar la alerta de saldo (ya solicitó)
    await supabase
      .from('influencers')
      .update({ saldo_alerta_desde: null })
      .eq('id', influencer.id)

    return NextResponse.json({ ok: true, monto: saldo })

  } catch (err) {
    console.error('Error solicitar pago:', err)
    return NextResponse.json({ error: 'Error al procesar la solicitud.' }, { status: 500 })
  }
}
