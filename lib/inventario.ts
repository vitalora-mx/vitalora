import { createServiceClient } from '@/lib/supabase/service'

// ============================================================
// Inventario de pedidos (SOLO SERVIDOR)
//
// El stock de un pedido se descuenta UNA sola vez (al confirmarse el pago) y se
// devuelve UNA sola vez (solo al CANCELAR desde el admin). Las marcas
// pedidos.stock_descontado_at / stock_devuelto_at lo garantizan aunque lleguen
// avisos repetidos o dos clics a la vez: solo quien logra poner la marca mueve stock.
//
// Los REEMBOLSOS nunca tocan el stock.
//
// Por cada renglón del pedido:
//  - con variante_id     -> producto_variantes
//  - producto que es kit -> cada componente (kit_componentes)
//  - producto normal     -> productos
// ============================================================

interface ItemStock { producto_id: number | null; variante_id?: number | null; cantidad: number | null }

// signo -1 = descontar, +1 = devolver. Devuelve las piezas movidas.
async function moverStock(items: ItemStock[], signo: 1 | -1): Promise<number> {
  const db = createServiceClient()
  let piezas = 0
  const ajustar = (actual: number | null, delta: number) => Math.max(0, (actual || 0) + signo * delta)

  for (const item of items) {
    const cantidad = Number(item.cantidad || 0)
    if (cantidad <= 0) continue
    try {
      if (item.variante_id) {
        const { data: variante } = await db.from('producto_variantes').select('stock').eq('id', item.variante_id).maybeSingle()
        if (variante) {
          await db.from('producto_variantes').update({ stock: ajustar(variante.stock, cantidad) }).eq('id', item.variante_id)
          piezas += cantidad
        }
        continue
      }

      const { data: componentes } = await db.from('kit_componentes').select('producto_id, cantidad').eq('kit_id', item.producto_id)
      if (componentes && componentes.length > 0) {
        for (const comp of componentes) {
          const { data: prodComp } = await db.from('productos').select('stock').eq('id', comp.producto_id).maybeSingle()
          if (prodComp) {
            await db.from('productos').update({ stock: ajustar(prodComp.stock, (comp.cantidad || 1) * cantidad) }).eq('id', comp.producto_id)
          }
        }
        piezas += cantidad
        continue
      }

      const { data: prod } = await db.from('productos').select('stock').eq('id', item.producto_id).maybeSingle()
      if (prod) {
        await db.from('productos').update({ stock: ajustar(prod.stock, cantidad) }).eq('id', item.producto_id)
        piezas += cantidad
      }
    } catch (e) {
      console.error(`Error ${signo < 0 ? 'descontando' : 'devolviendo'} stock del item`, item.producto_id, e)
    }
  }
  return piezas
}

async function itemsDelPedido(pedidoId: number): Promise<ItemStock[]> {
  const { data } = await createServiceClient().from('pedido_items').select('producto_id, variante_id, cantidad').eq('pedido_id', pedidoId)
  return data || []
}

// Al confirmarse el pago (webhook MP o transferencia aprobada).
// Devuelve las piezas descontadas (0 si ya se había descontado).
export async function descontarStockUnaVez(pedidoId: number): Promise<number> {
  const { data } = await createServiceClient()
    .from('pedidos')
    .update({ stock_descontado_at: new Date().toISOString() })
    .eq('id', pedidoId)
    .is('stock_descontado_at', null)
    .select('id')
  if ((data?.length ?? 0) === 0) return 0
  return moverStock(await itemsDelPedido(pedidoId), -1)
}

// Al cancelar desde el admin: devuelve TODAS las piezas (sin guía nada salió del almacén).
// Solo si el pedido había descontado stock y no se había devuelto antes.
export async function devolverStockUnaVez(pedidoId: number): Promise<number> {
  const { data } = await createServiceClient()
    .from('pedidos')
    .update({ stock_devuelto_at: new Date().toISOString() })
    .eq('id', pedidoId)
    .not('stock_descontado_at', 'is', null)
    .is('stock_devuelto_at', null)
    .select('id')
  if ((data?.length ?? 0) === 0) return 0
  return moverStock(await itemsDelPedido(pedidoId), 1)
}
