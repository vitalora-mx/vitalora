import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Devuelve el detalle de comisiones/ventas del influencer en un rango de fechas
export async function POST(request: Request) {
  try {
    const { email, desde, hasta } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const emailLimpio = email.toLowerCase().trim()

    // Buscar el influencer
    const { data: influencer } = await supabase
      .from('influencers')
      .select('id')
      .eq('email', emailLimpio)
      .maybeSingle()

    if (!influencer) {
      return NextResponse.json({ esInfluencer: false })
    }

    // Construir la consulta de comisiones
    let query = supabase
      .from('influencer_comisiones')
      .select('id, pedido_id, subtotal_venta, monto_comision, estado, created_at, fecha_pago, referencia_pago')
      .eq('influencer_id', influencer.id)
      .order('created_at', { ascending: false })

    // Filtro de fechas (sobre created_at = fecha de la venta)
    if (desde) query = query.gte('created_at', `${desde}T00:00:00`)
    if (hasta) query = query.lte('created_at', `${hasta}T23:59:59`)

    const { data: comisiones } = await query

    const ventas = (comisiones ?? []).map(c => ({
      id: c.id,
      pedido_id: c.pedido_id,
      fecha: c.created_at,
      subtotal: c.subtotal_venta ?? 0,
      comision: c.monto_comision ?? 0,
      estado: c.estado, // pendiente / pagada
      fecha_pago: c.fecha_pago,
      referencia_pago: c.referencia_pago,
    }))

    // Totales del rango
    const totalVentas = ventas.reduce((a, v) => a + v.subtotal, 0)
    const totalComision = ventas.reduce((a, v) => a + v.comision, 0)
    const totalPagado = ventas.filter(v => v.estado === 'pagada').reduce((a, v) => a + v.comision, 0)
    const totalPendiente = ventas.filter(v => v.estado === 'pendiente').reduce((a, v) => a + v.comision, 0)

    return NextResponse.json({
      esInfluencer: true,
      ventas,
      totales: {
        numVentas: ventas.length,
        totalVentas,
        totalComision,
        totalPagado,
        totalPendiente,
      },
    })

  } catch (err) {
    console.error('Error reporte influencer:', err)
    return NextResponse.json({ error: 'Error al generar el reporte' }, { status: 500 })
  }
}
