import { NextResponse } from 'next/server'
import { cronAutorizado } from '@/lib/cron-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { limpiarPendientesViejos } from '@/lib/abandonados'
import { sincronizarPendientes } from '@/lib/rastreo'

// Hasta 40 consultas de rastreo, una tras otra (límite de Skydropx: 2 por segundo)
export const maxDuration = 300

// Limpieza diaria de pedidos sin pago (cron de Vercel, una vez al día):
//  1. Transferencias sin comprobante válido cuyo plazo venció -> 'cancelado_sin_pago'
//     - 'esperando_comprobante': 2 horas desde que se creó el pedido
//     - 'comprobante_rechazado': 24 horas desde el rechazo
//  2. Pedidos de Mercado Pago en 'pendiente', sin pago y con más de 2 horas -> 'abandonado'
//     (se caduca su preferencia; si MP tiene un pago, p. ej. ficha OXXO, no se tocan)
// Ninguno de los dos manda correo ni toca el inventario.
export async function GET(request: Request) {
  // Verificar el secreto del cron (se rechaza si CRON_SECRET no existe)
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createServiceClient()

    // 1) Transferencias vencidas (solo si siguen esperando comprobante o con el comprobante rechazado)
    const { data: cancelados } = await supabaseAdmin
      .from('pedidos')
      .update({ estado: 'cancelado_sin_pago' })
      .eq('metodo_pago', 'transferencia')
      .in('estado', ['esperando_comprobante', 'comprobante_rechazado'])
      .lt('limite_transferencia_at', new Date().toISOString())
      .select('id')

    // 2) Pedidos de Mercado Pago abandonados
    const { abandonados, conPago } = await limpiarPendientesViejos()

    // 3) Rastreo de guías de Skydropx (respaldo si no llegó el aviso). Un fallo aquí no detiene lo anterior.
    let rastreo: Awaited<ReturnType<typeof sincronizarPendientes>> | { error: string }
    try {
      rastreo = await sincronizarPendientes(40)
    } catch (e) {
      console.error('Cron: rastreo de guías falló', e)
      rastreo = { error: 'rastreo falló' }
    }

    return NextResponse.json({
      rastreo,
      ok: true,
      cancelados: cancelados?.length ?? 0,
      idsCancelados: (cancelados || []).map(p => p.id),
      abandonados: abandonados.length,
      idsAbandonados: abandonados,
      pendientesConPagoEnMP: conPago,
    })
  } catch (err) {
    console.error('Error en cron de limpieza de pedidos:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
