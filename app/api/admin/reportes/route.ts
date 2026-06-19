import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  try {
    let query = supabase
      .from('pedidos')
      .select(`
        id,
        created_at,
        total,
        subtotal,
        costo_envio,
        estado,
        forma_pago,
        email_invitado,
        user_id,
        perfiles:user_id (nombre, apellido, email),
        pedido_items (
          cantidad,
          precio_unitario,
          nombre_producto,
          variante_nombre
        )
      `)
      .in('estado', ['pagado', 'preparando', 'enviado', 'entregado'])
      .order('created_at', { ascending: false })

    if (desde) query = query.gte('created_at', desde)
    if (hasta) {
      const hastaFin = new Date(hasta)
      hastaFin.setHours(23, 59, 59, 999)
      query = query.lte('created_at', hastaFin.toISOString())
    }

    const { data: pedidos, error } = await query

    if (error) throw error

    // Calcular resumen
    const totalBruto = pedidos?.reduce((a, p) => a + (p.total ?? 0), 0) ?? 0
    const totalEnvio = pedidos?.reduce((a, p) => a + (p.costo_envio ?? 0), 0) ?? 0
    const subtotalSinEnvio = pedidos?.reduce((a, p) => a + (p.subtotal ?? (p.total ?? 0) - (p.costo_envio ?? 0)), 0) ?? 0
    // IVA estimado: 16% sobre subtotal (incluido en precio)
    const ivaEstimado = subtotalSinEnvio * 0.16 / 1.16
    // Comisión MP estimada: 3.6% + IVA (aprox 4.18%)
    const comisionMP = totalBruto * 0.0418
    const neto = totalBruto - comisionMP

    return NextResponse.json({
      pedidos: pedidos ?? [],
      resumen: {
        totalBruto,
        totalEnvio,
        ivaEstimado,
        comisionMP,
        neto,
        totalPedidos: pedidos?.length ?? 0,
      }
    })
  } catch (err) {
    console.error('Error reportes GET:', err)
    return NextResponse.json({ error: 'Error al cargar reportes' }, { status: 500 })
  }
}
