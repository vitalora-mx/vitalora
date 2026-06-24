import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/admin/pedidos/[id]/reembolsar
// Body opcional: { monto?: number }
//  - sin monto  -> reembolso TOTAL (devuelve todo el pago)
//  - con monto   -> reembolso PARCIAL (devuelve solo esa cantidad)
//
// Mercado Pago disparara el webhook con status 'refunded', que ya
// devuelve stock y marca el pedido como 'reembolsado' automaticamente.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Buscar el pedido y su mp_payment_id
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .select('id, estado, mp_payment_id, total')
      .eq('id', id)
      .single()

    if (pedidoError || !pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    if (!pedido.mp_payment_id) {
      return NextResponse.json({ error: 'Este pedido no tiene un pago de Mercado Pago asociado.' }, { status: 400 })
    }

    if (pedido.estado !== 'pagado') {
      return NextResponse.json({ error: `Solo se pueden reembolsar pedidos pagados. Estado actual: ${pedido.estado}.` }, { status: 400 })
    }

    // 2. Leer monto opcional del body (reembolso parcial)
    let monto: number | null = null
    try {
      const body = await request.json()
      if (body && typeof body.monto === 'number' && body.monto > 0) {
        monto = body.monto
      }
    } catch {
      // sin body -> reembolso total
    }

    // Validar que el parcial no exceda el total del pedido
    if (monto !== null && monto > (pedido.total || 0)) {
      return NextResponse.json({ error: `El monto a reembolsar ($${monto}) no puede ser mayor al total del pedido ($${pedido.total}).` }, { status: 400 })
    }

    // 3. Llamar a la API de reembolsos de Mercado Pago
    // Header de idempotencia para evitar reembolsos duplicados por reintentos.
    const idempotencyKey = `refund-${pedido.id}-${monto ?? 'total'}-${Date.now()}`

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${pedido.mp_payment_id}/refunds`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: monto !== null ? JSON.stringify({ amount: monto }) : JSON.stringify({}),
      }
    )

    const mpData = await mpRes.json()

    if (!mpRes.ok) {
      console.error('Error MP reembolso:', mpData)
      const msg = mpData?.message || mpData?.error || 'Error al procesar el reembolso en Mercado Pago.'
      return NextResponse.json({ error: msg, detalle: mpData }, { status: mpRes.status })
    }

    // 4. Exito. El webhook de MP se encargara de devolver stock y marcar 'reembolsado'.
    // Para reembolsos parciales el pedido puede quedar 'pagado' en MP; igual avisamos al admin.
    return NextResponse.json({
      success: true,
      tipo: monto !== null ? 'parcial' : 'total',
      monto: monto ?? pedido.total,
      refund_id: mpData?.id || null,
      mensaje: monto !== null
        ? `Reembolso parcial de $${monto} procesado correctamente.`
        : 'Reembolso total procesado correctamente. El inventario se actualizara automaticamente.',
    })
  } catch (error) {
    console.error('Error en reembolso admin:', error)
    return NextResponse.json({ error: 'Error interno al procesar el reembolso.' }, { status: 500 })
  }
}
