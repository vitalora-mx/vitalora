import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST /api/admin/pedidos/[id]/reembolsar-transferencia
// Body: { monto?: number, devolverStock?: boolean }
//  - sin monto  -> reembolso TOTAL  -> estado 'reembolsado'
//  - con monto   -> reembolso PARCIAL -> estado 'reembolso_parcial'
// NO mueve dinero (la devolución la hace el admin manualmente desde su banco).
// Solo registra el reembolso y, si devolverStock=true, regresa el stock al inventario.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const monto: number | null = (body && typeof body.monto === 'number' && body.monto > 0) ? body.monto : null
    const devolverStockFlag: boolean = !!(body && body.devolverStock)

    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('id, estado, metodo_pago, total, monto_reembolsado, pedido_items(*)')
      .eq('id', id)
      .single()

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    if (pedido.metodo_pago !== 'transferencia') {
      return NextResponse.json({ error: 'Este pedido no es por transferencia. Usa el reembolso de Mercado Pago.' }, { status: 400 })
    }

    if (pedido.estado !== 'pagado' && pedido.estado !== 'reembolso_parcial') {
      return NextResponse.json({ error: `Solo se pueden reembolsar pedidos pagados o con reembolso parcial. Estado actual: ${pedido.estado}.` }, { status: 400 })
    }

    // Validar monto parcial contra el saldo restante
    const saldoRestante = (pedido.total || 0) - (pedido.monto_reembolsado || 0)
    if (monto !== null && monto > saldoRestante) {
      return NextResponse.json({ error: `El monto a reembolsar ($${monto}) no puede ser mayor al saldo restante ($${saldoRestante}).` }, { status: 400 })
    }

    const esParcial = monto !== null
    const nuevoEstado = esParcial ? 'reembolso_parcial' : 'reembolsado'
    const nuevoMontoReembolsado = esParcial
      ? (pedido.monto_reembolsado || 0) + (monto || 0)
      : (pedido.total || 0)

    // Actualizar el pedido
    await supabaseAdmin
      .from('pedidos')
      .update({ estado: nuevoEstado, monto_reembolsado: nuevoMontoReembolsado })
      .eq('id', id)

    // Devolver stock si se pidió
    let stockDevuelto = false
    if (devolverStockFlag) {
      await devolverStock(pedido.pedido_items || [])
      stockDevuelto = true
    }

    const mensaje = esParcial
      ? `Reembolso parcial de $${monto} registrado.${stockDevuelto ? ' Stock devuelto.' : ''} Recuerda hacer la transferencia de devolución desde tu banco.`
      : `Reembolso total registrado.${stockDevuelto ? ' Stock devuelto.' : ''} Recuerda hacer la transferencia de devolución desde tu banco.`

    return NextResponse.json({ ok: true, mensaje })
  } catch (err) {
    console.error('Error en reembolso de transferencia:', err)
    return NextResponse.json({ error: 'Error al registrar el reembolso.' }, { status: 500 })
  }
}

// Devuelve stock al inventario (variante / kit / producto normal)
async function devolverStock(items: any[]) {
  for (const item of items) {
    const cantidad = item.cantidad || 0
    if (cantidad <= 0) continue
    try {
      if (item.variante_id) {
        const { data: variante } = await supabaseAdmin.from('producto_variantes').select('stock').eq('id', item.variante_id).single()
        if (variante) {
          await supabaseAdmin.from('producto_variantes').update({ stock: (variante.stock || 0) + cantidad }).eq('id', item.variante_id)
        }
        continue
      }
      const { data: componentes } = await supabaseAdmin.from('kit_componentes').select('producto_id, cantidad').eq('kit_id', item.producto_id)
      if (componentes && componentes.length > 0) {
        for (const comp of componentes) {
          const { data: prodComp } = await supabaseAdmin.from('productos').select('stock').eq('id', comp.producto_id).single()
          if (prodComp) {
            const sumar = (comp.cantidad || 1) * cantidad
            await supabaseAdmin.from('productos').update({ stock: (prodComp.stock || 0) + sumar }).eq('id', comp.producto_id)
          }
        }
        continue
      }
      const { data: prod } = await supabaseAdmin.from('productos').select('stock').eq('id', item.producto_id).single()
      if (prod) {
        await supabaseAdmin.from('productos').update({ stock: (prod.stock || 0) + cantidad }).eq('id', item.producto_id)
      }
    } catch (e) {
      console.error('Error devolviendo stock del item', item.producto_id, e)
    }
  }
}
