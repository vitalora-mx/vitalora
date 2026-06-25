import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cancela los pedidos por transferencia que:
//  - están en estado 'esperando_comprobante'
//  - su límite de 2 horas ya pasó
//  - nunca subieron comprobante
// Se ejecuta periódicamente vía cron.
export async function GET(request: Request) {
  // Verificar el secreto del cron (igual que el de escalación)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const ahora = new Date().toISOString()

    // Buscar pedidos esperando comprobante cuyo límite ya venció
    const { data: vencidos } = await supabaseAdmin
      .from('pedidos')
      .select('id')
      .eq('metodo_pago', 'transferencia')
      .eq('estado', 'esperando_comprobante')
      .lt('limite_transferencia_at', ahora)

    if (!vencidos || vencidos.length === 0) {
      return NextResponse.json({ ok: true, cancelados: 0 })
    }

    const ids = vencidos.map(p => p.id)

    // Cancelarlos
    await supabaseAdmin
      .from('pedidos')
      .update({ estado: 'cancelado_sin_pago' })
      .in('id', ids)

    return NextResponse.json({ ok: true, cancelados: ids.length, ids })
  } catch (err) {
    console.error('Error en cron de cancelación de transferencias:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
