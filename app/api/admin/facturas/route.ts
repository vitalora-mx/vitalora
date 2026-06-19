import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Pedidos que tienen solicitud de factura (tienen RFC guardado)
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        created_at,
        total,
        estado,
        factura_estado,
        factura_rfc,
        factura_razon_social,
        factura_uso_cfdi,
        factura_regimen,
        factura_cp,
        email_invitado,
        user_id,
        perfiles:user_id (nombre, apellido, email)
      `)
      .not('factura_rfc', 'is', null)
      .order('created_at', { ascending: false })

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
  try {
    const body = await request.json()
    const { pedidoId, estado } = body

    if (!pedidoId || !estado) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ factura_estado: estado })
      .eq('id', pedidoId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error facturas PATCH:', err)
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
