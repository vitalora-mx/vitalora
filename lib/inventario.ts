import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { formatearNumeroPedido } from '@/lib/utils'

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
// Si al descontar no hay piezas suficientes, el stock queda en 0 (no negativo)
// y se avisa por correo al admin: el pago ya se cobró y hay que conseguir el
// producto o reembolsar.
//
// Por cada renglón del pedido:
//  - con variante_id     -> producto_variantes
//  - producto que es kit -> cada componente (kit_componentes)
//  - producto normal     -> productos
// ============================================================

interface ItemStock { producto_id: number | null; variante_id?: number | null; cantidad: number | null }

// Renglón sin piezas suficientes al descontar
interface Faltante { tabla: 'productos' | 'producto_variantes'; id: number; pedidas: number; habia: number }

// signo -1 = descontar, +1 = devolver. Devuelve las piezas movidas.
// Al descontar, anota en `faltantes` lo que pedía más piezas de las que había.
async function moverStock(items: ItemStock[], signo: 1 | -1, faltantes: Faltante[] = []): Promise<number> {
  const db = createServiceClient()
  let piezas = 0
  const ajustar = (actual: number | null, delta: number) => Math.max(0, (actual || 0) + signo * delta)
  const revisar = (tabla: Faltante['tabla'], id: number, actual: number | null, delta: number) => {
    if (signo < 0 && (actual || 0) < delta) faltantes.push({ tabla, id, pedidas: delta, habia: Math.max(0, actual || 0) })
  }

  for (const item of items) {
    const cantidad = Number(item.cantidad || 0)
    if (cantidad <= 0) continue
    try {
      if (item.variante_id) {
        const { data: variante } = await db.from('producto_variantes').select('stock').eq('id', item.variante_id).maybeSingle()
        if (variante) {
          revisar('producto_variantes', item.variante_id, variante.stock, cantidad)
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
            revisar('productos', comp.producto_id, prodComp.stock, (comp.cantidad || 1) * cantidad)
            await db.from('productos').update({ stock: ajustar(prodComp.stock, (comp.cantidad || 1) * cantidad) }).eq('id', comp.producto_id)
          }
        }
        piezas += cantidad
        continue
      }

      const { data: prod } = await db.from('productos').select('stock').eq('id', item.producto_id).maybeSingle()
      if (prod && item.producto_id) {
        revisar('productos', item.producto_id, prod.stock, cantidad)
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
  const faltantes: Faltante[] = []
  const piezas = await moverStock(await itemsDelPedido(pedidoId), -1, faltantes)
  if (faltantes.length > 0) await avisarStockInsuficiente(pedidoId, faltantes)
  return piezas
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

// ── Aviso al admin: pago confirmado sin piezas suficientes ──
// Nunca frena el pago: si el correo falla, solo queda en el log.
const ADMIN_EMAIL = 'gabomaciel7@gmail.com'
const escHtml = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))

async function avisarStockInsuficiente(pedidoId: number, faltantes: Faltante[]) {
  try {
    const db = createServiceClient()
    const idsProd = faltantes.filter(x => x.tabla === 'productos').map(x => x.id)
    const idsVar = faltantes.filter(x => x.tabla === 'producto_variantes').map(x => x.id)
    const nombres = new Map<string, string>()
    if (idsProd.length) {
      const { data } = await db.from('productos').select('id, nombre').in('id', idsProd)
      for (const p of data || []) nombres.set('productos:' + p.id, p.nombre)
    }
    if (idsVar.length) {
      const { data } = await db.from('producto_variantes').select('id, nombre, productos(nombre)').in('id', idsVar)
      for (const v of (data || []) as any[]) nombres.set('producto_variantes:' + v.id, `${v.productos?.nombre || 'Producto'} (${v.nombre || 'variante'})`)
    }

    const numero = formatearNumeroPedido(pedidoId)
    const filas = faltantes.map(x => {
      const nombre = nombres.get(x.tabla + ':' + x.id) || `${x.tabla === 'productos' ? 'Producto' : 'Variante'} #${x.id}`
      return `<tr><td style="padding:8px;border-bottom:1px solid #EEE;font-size:13px;color:#333;">${escHtml(nombre)}</td>`
        + `<td style="padding:8px;border-bottom:1px solid #EEE;font-size:13px;color:#333;text-align:center;">${x.pedidas}</td>`
        + `<td style="padding:8px;border-bottom:1px solid #EEE;font-size:13px;color:#B45309;text-align:center;font-weight:700;">${x.habia}</td></tr>`
    }).join('')

    const html = `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;padding:32px;">
<h2 style="font-size:18px;color:#B45309;margin:0 0 12px;">Stock insuficiente en un pedido pagado</h2>
<p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 20px;">El pago del pedido <strong>${numero}</strong> ya se cobró, pero no había piezas suficientes de estos productos. El stock quedó en 0. Consigue el producto o reembolsa desde el admin.</p>
<table style="width:100%;border-collapse:collapse;"><tr>
<th style="padding:8px;border-bottom:2px solid #E8E4DA;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#888;text-align:left;">Producto</th>
<th style="padding:8px;border-bottom:2px solid #E8E4DA;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#888;">Pedidas</th>
<th style="padding:8px;border-bottom:2px solid #E8E4DA;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#888;">Había</th>
</tr>${filas}</table>
</div></body></html>`

    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: ADMIN_EMAIL,
      subject: `Stock insuficiente — Pedido ${numero}`,
      html,
    })
  } catch (e) {
    console.error('Error avisando stock insuficiente del pedido', pedidoId, e)
  }
}
