import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOPE_ALERTA = 5000
const MINIMO_RETIRO = 500

// Datos fiscales de Vitalora para que el influencer facture
const DATOS_FISCALES_VITALORA = {
  razon_social: 'VANGUARDIA IMPORTACIONES & LOGISTICA DE MEXICO S.A. DE C.V.',
  rfc: 'VIA210820163',
  regimen: '601 — General de Ley Personas Morales',
  cp: '37749',
  domicilio: 'Circuito Luna 103, San Miguel de Allende, Guanajuato',
  uso_cfdi: 'G03 — Gastos en general',
  concepto: 'Servicios de publicidad / comisiones por ventas',
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const emailLimpio = email.toLowerCase().trim()

    // Buscar el influencer por email
    const { data: influencer } = await supabase
      .from('influencers')
      .select('*')
      .eq('email', emailLimpio)
      .maybeSingle()

    if (!influencer) {
      return NextResponse.json({ esInfluencer: false })
    }

    // Comisiones del influencer
    const { data: comisiones } = await supabase
      .from('influencer_comisiones')
      .select('id, subtotal_venta, monto_comision, estado, created_at, pago_id, pedido_id')
      .eq('influencer_id', influencer.id)
      .order('created_at', { ascending: false })

    const todas = comisiones ?? []

    // Saldo disponible: comisiones pendientes sin solicitud de pago vinculada
    const disponibles = todas.filter(c => c.estado === 'pendiente' && !c.pago_id)
    const saldoDisponible = disponibles.reduce((a, c) => a + (c.monto_comision ?? 0), 0)

    // Total histórico ganado (pagadas + pendientes)
    const totalGanado = todas.reduce((a, c) => a + (c.monto_comision ?? 0), 0)
    const totalPagado = todas.filter(c => c.estado === 'pagada').reduce((a, c) => a + (c.monto_comision ?? 0), 0)

    // Solicitudes de pago
    const { data: pagos } = await supabase
      .from('influencer_pagos')
      .select('*')
      .eq('influencer_id', influencer.id)
      .order('solicitado_at', { ascending: false })

    // ¿Tiene una solicitud pendiente?
    const solicitudPendiente = (pagos ?? []).find(p => p.estado === 'solicitado') ?? null

    // Calcular nivel de alerta si superó el tope
    let nivelAlerta = null
    let diasEnAlerta = null
    if (influencer.saldo_alerta_desde) {
      const dias = Math.floor((Date.now() - new Date(influencer.saldo_alerta_desde).getTime()) / (1000 * 60 * 60 * 24))
      diasEnAlerta = dias
      if (dias >= 30) nivelAlerta = 'pausar'
      else if (dias >= 15) nivelAlerta = 'duro'
      else nivelAlerta = 'suave'
    }

    return NextResponse.json({
      esInfluencer: true,
      influencer: {
        id: influencer.id,
        nombre: influencer.nombre,
        email: influencer.email,
        codigo: influencer.codigo,
        estado: influencer.estado,
        banco: influencer.banco,
        clabe: influencer.clabe,
        titular_cuenta: influencer.titular_cuenta,
        fiscal_rfc: influencer.fiscal_rfc,
        fiscal_razon_social: influencer.fiscal_razon_social,
      },
      finanzas: {
        saldoDisponible,
        totalGanado,
        totalPagado,
        numVentas: todas.length,
        puedeRetirar: saldoDisponible >= MINIMO_RETIRO && !solicitudPendiente && influencer.estado === 'aprobado',
        minimoRetiro: MINIMO_RETIRO,
        topeAlerta: TOPE_ALERTA,
      },
      ventas: disponibles.map(c => ({
        id: c.id,
        subtotal: c.subtotal_venta,
        comision: c.monto_comision,
        fecha: c.created_at,
      })),
      pagos: (pagos ?? []).map(p => ({
        id: p.id,
        monto: p.monto,
        estado: p.estado,
        solicitado_at: p.solicitado_at,
        pagado_at: p.pagado_at,
        referencia: p.referencia_pago,
      })),
      solicitudPendiente,
      nivelAlerta,
      diasEnAlerta,
      datosFiscalesVitalora: DATOS_FISCALES_VITALORA,
    })

  } catch (err) {
    console.error('Error portal influencer:', err)
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 })
  }
}
