import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req, "/admin/facturas")
  if (!adminAuth.ok) return adminAuth.response

  try {
    // Pedidos cuyo cliente pidió factura (los guarda /api/facturacion)
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        created_at,
        total,
        estado,
        nombre,
        apellido,
        email,
        factura_estado,
        factura_solicitada_at,
        rfc,
        razon_social,
        regimen_fiscal,
        cp_fiscal,
        uso_cfdi,
        email_facturacion
      `)
      .eq('requiere_factura', true)
      .order('factura_solicitada_at', { ascending: false, nullsFirst: false })

    if (error) throw error

    const lista = pedidos ?? []

    // Stats
    const pendientes = lista.filter(p => !p.factura_estado || p.factura_estado === 'pendiente').length
    const emitidas = lista.filter(p => p.factura_estado === 'emitida').length

    // Calcular fecha límite SAT: último día del mes siguiente a la compra
    const conVencimiento = lista.map(p => {
      const fechaCompra = new Date(p.created_at)
      const vence = new Date(fechaCompra.getFullYear(), fechaCompra.getMonth() + 2, 0) // último día del mes siguiente
      const diasRestantes = Math.ceil((vence.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return { ...p, vence: vence.toISOString(), diasRestantes }
    })

    const vencenProximo = conVencimiento.filter(p =>
      (!p.factura_estado || p.factura_estado === 'pendiente') && p.diasRestantes <= 5 && p.diasRestantes >= 0
    ).length

    return NextResponse.json({
      facturas: conVencimiento,
      stats: { pendientes, emitidas, total: lista.length, vencenProximo }
    })
  } catch (err) {
    console.error('Error facturas GET:', err)
    return NextResponse.json({ error: 'Error al cargar facturas' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const adminAuth = await requireAdmin(request, "/admin/facturas")
  if (!adminAuth.ok) return adminAuth.response

  try {
    const body = await request.json()
    const { pedidoId, estado } = body

    if (!pedidoId || !estado) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    if (!['pendiente', 'emitida'].includes(estado)) {
      return NextResponse.json({ error: 'Estado de factura no válido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('pedidos')
      .update({ factura_estado: estado })
      .eq('id', pedidoId)
      .eq('requiere_factura', true)
      .select('id')

    if (error) throw error
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Ese pedido no tiene solicitud de factura' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error facturas PATCH:', err)
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
