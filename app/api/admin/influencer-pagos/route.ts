import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOPE_ALERTA = 5000

// GET: lista de solicitudes de pago + resumen de saldos por influencer
export async function GET() {
  try {
    // Solicitudes de pago con datos del influencer
    const { data: solicitudes, error: errSol } = await supabase
      .from('influencer_pagos')
      .select(`
        *,
        influencers (id, nombre, email, banco, clabe, titular_cuenta, fiscal_rfc, fiscal_razon_social)
      `)
      .order('solicitado_at', { ascending: false })

    if (errSol) throw errSol

    // Saldos acumulados pendientes por influencer (comisiones sin pagar y sin solicitud)
    const { data: influencers } = await supabase
      .from('influencers')
      .select('id, nombre, email, estado, saldo_alerta_desde')
      .eq('estado', 'aprobado')

    const { data: comisionesPendientes } = await supabase
      .from('influencer_comisiones')
      .select('influencer_id, monto_comision, estado, pago_id')
      .eq('estado', 'pendiente')
      .is('pago_id', null)

    // Calcular saldo por influencer
    const saldos = (influencers ?? []).map(inf => {
      const suyas = (comisionesPendientes ?? []).filter(c => c.influencer_id === inf.id)
      const saldo = suyas.reduce((a, c) => a + (c.monto_comision ?? 0), 0)

      // Calcular días en alerta si superó el tope
      let diasEnAlerta = null
      let nivelAlerta = null
      if (inf.saldo_alerta_desde) {
        const dias = Math.floor((Date.now() - new Date(inf.saldo_alerta_desde).getTime()) / (1000 * 60 * 60 * 24))
        diasEnAlerta = dias
        if (dias >= 30) nivelAlerta = 'pausar'
        else if (dias >= 15) nivelAlerta = 'duro'
        else nivelAlerta = 'suave'
      }

      return {
        influencer_id: inf.id,
        nombre: inf.nombre,
        email: inf.email,
        saldo,
        ventas: suyas.length,
        superaTope: saldo >= TOPE_ALERTA,
        diasEnAlerta,
        nivelAlerta,
      }
    }).filter(s => s.saldo > 0)

    saldos.sort((a, b) => b.saldo - a.saldo)

    const totalPendientePago = (solicitudes ?? [])
      .filter(s => s.estado === 'solicitado')
      .reduce((a, s) => a + (s.monto ?? 0), 0)

    return NextResponse.json({
      solicitudes: solicitudes ?? [],
      saldos,
      stats: {
        solicitudesPendientes: (solicitudes ?? []).filter(s => s.estado === 'solicitado').length,
        totalPendientePago,
        enAlerta: saldos.filter(s => s.superaTope).length,
      }
    })
  } catch (err) {
    console.error('Error admin pagos GET:', err)
    return NextResponse.json({ error: 'Error al cargar pagos' }, { status: 500 })
  }
}

// PATCH: marcar una solicitud como pagada o rechazada
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { pagoId, accion, referencia, notas } = body

    if (!pagoId || !accion) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const { data: pago, error: errPago } = await supabase
      .from('influencer_pagos')
      .select('*')
      .eq('id', pagoId)
      .single()

    if (errPago || !pago) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (accion === 'pagar') {
      // Marcar la solicitud como pagada
      await supabase
        .from('influencer_pagos')
        .update({
          estado: 'pagado',
          referencia_pago: referencia ?? null,
          notas_admin: notas ?? null,
          pagado_at: new Date().toISOString(),
        })
        .eq('id', pagoId)

      // Marcar todas las comisiones vinculadas a este pago como pagadas
      await supabase
        .from('influencer_comisiones')
        .update({ estado: 'pagada', fecha_pago: new Date().toISOString(), referencia_pago: referencia ?? null })
        .eq('pago_id', pagoId)

      // Reiniciar la alerta de saldo del influencer (ya cobró)
      await supabase
        .from('influencers')
        .update({ saldo_alerta_desde: null })
        .eq('id', pago.influencer_id)

      return NextResponse.json({ ok: true })
    }

    if (accion === 'rechazar') {
      // Devolver las comisiones a estado pendiente (desvincular del pago)
      await supabase
        .from('influencer_comisiones')
        .update({ pago_id: null })
        .eq('pago_id', pagoId)

      await supabase
        .from('influencer_pagos')
        .update({ estado: 'rechazado', notas_admin: notas ?? null })
        .eq('id', pagoId)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (err) {
    console.error('Error admin pagos PATCH:', err)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}

// POST: generar URL firmada para ver la factura del influencer
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
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
