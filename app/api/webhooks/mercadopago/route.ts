import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envia notificaciones de tipo "payment"
    if (body.type === 'payment' || body.action === 'payment.updated' || body.action === 'payment.created') {
      const paymentId = body.data?.id
      if (!paymentId) return NextResponse.json({ ok: true })

      // Obtener detalles del pago de MP
      const payment = new Payment(mpClient)
      const paymentData = await payment.get({ id: paymentId })

      const status = paymentData.status // approved, rejected, pending, in_process, cancelled, refunded
      const preferenceId = (paymentData as any).preference_id
      const externalRef = (paymentData as any).external_reference
      const tipoPagoMP = (paymentData as any).payment_type_id || ''
      const mapaFormaPago: Record<string, string> = { credit_card: 'Tarjeta de credito', debit_card: 'Tarjeta de debito', prepaid_card: 'Tarjeta prepagada', bank_transfer: 'Transferencia SPEI', account_money: 'Dinero en cuenta Mercado Pago', ticket: 'Efectivo (OXXO/tiendas)', atm: 'Cajero / deposito' }
      const formaPagoTexto = mapaFormaPago[tipoPagoMP] || (tipoPagoMP ? tipoPagoMP : 'No especificada')

      // Buscar pedido en DB
      const { data: pedido } = await supabaseAdmin
        .from('pedidos')
        .select('*, pedido_items(*)')
        .eq('id', parseInt(externalRef || '0'))
        .single()

      if (!pedido) {
        console.log('Pedido no encontrado para preference:', preferenceId)
        return NextResponse.json({ ok: true })
      }

      // Mapear estado de MP a nuestro estado
      let nuevoEstado = pedido.estado
      if (status === 'approved') nuevoEstado = 'pagado'
      else if (status === 'rejected' || status === 'cancelled') nuevoEstado = 'cancelado'
      else if (status === 'refunded') nuevoEstado = 'reembolsado'
      else if (status === 'pending' || status === 'in_process') nuevoEstado = 'pendiente'

      // Actualizar pedido
      await supabaseAdmin
        .from('pedidos')
        .update({ estado: nuevoEstado, mp_payment_id: String(paymentId), forma_pago: formaPagoTexto })
        .eq('id', pedido.id)

      // Si fue aprobado y antes no estaba pagado: descontar stock, enviar emails, marcar primera compra
      if (status === 'approved' && pedido.estado !== 'pagado') {
        // Descontar stock (variante / kit / producto normal)
        await descontarStock(pedido.pedido_items || [])

        await enviarEmails(pedido)

        // Marcar primera_compra_usada si aplica
        if (pedido.user_id && pedido.descuento_tipo === 'primera_compra') {
          await supabaseAdmin
            .from('perfiles')
            .update({ primera_compra_usada: true })
            .eq('id', pedido.user_id)
        }

        // Incrementar usos del codigo de descuento
        if (pedido.codigo_descuento) {
          await supabaseAdmin.rpc('incrementar_uso_codigo', { codigo_param: pedido.codigo_descuento })
        }
        // Registrar que este email ya uso el codigo
        if (pedido.codigo_descuento && pedido.email) {
          try {
            await supabaseAdmin.from('codigos_usados').insert({
              codigo: pedido.codigo_descuento,
              email: pedido.email.toLowerCase(),
              pedido_id: pedido.id,
            })
          } catch {}
        }

        // ════════════════════════════════════════════════════════
        // NUEVO: Lógica del programa de influencers
        // ════════════════════════════════════════════════════════
        if (pedido.codigo_descuento) {
          await procesarComisionInfluencer(pedido)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error webhook MP:', error)
    return NextResponse.json({ ok: true }) // Siempre responder 200 a MP
  }
}

// GET para verificacion de MP
export async function GET() {
  return NextResponse.json({ ok: true })
}

// ============================================================
// PROGRAMA DE INFLUENCERS
// Cuando un pedido pagado usó un código de influencer:
//   1. Candado: si el comprador tiene cuenta, marcar primera_compra_usada
//      (pierde el descuento de primera compra para siempre)
//   2. Registrar la comisión del 5% sobre el subtotal (sin envío)
// ============================================================
async function procesarComisionInfluencer(pedido: any) {
  try {
    // Verificar si el código usado es de un influencer
    const { data: codigo } = await supabaseAdmin
      .from('codigos_descuento')
      .select('es_influencer, influencer_id')
      .eq('codigo', pedido.codigo_descuento)
      .single()

    if (!codigo || !codigo.es_influencer || !codigo.influencer_id) {
      return // No es código de influencer, no hacer nada
    }

    // 1) CANDADO DE EXCLUSIÓN MUTUA
    // Si el comprador tiene cuenta, marcar primera_compra_usada = true
    // (al usar un código de influencer, pierde el descuento de primera compra)
    if (pedido.user_id) {
      await supabaseAdmin
        .from('perfiles')
        .update({ primera_compra_usada: true })
        .eq('id', pedido.user_id)
    }

    // 2) REGISTRAR COMISIÓN
    // Verificar que este pedido no tenga ya una comisión registrada (evitar duplicados)
    const { data: comisionExistente } = await supabaseAdmin
      .from('influencer_comisiones')
      .select('id')
      .eq('pedido_id', pedido.id)
      .maybeSingle()

    if (comisionExistente) return // Ya se registró

    // La comisión es 5% del subtotal SIN envío
    const subtotalVenta = pedido.subtotal || 0
    const montoComision = Math.round(subtotalVenta * 0.05 * 100) / 100

    await supabaseAdmin
      .from('influencer_comisiones')
      .insert({
        influencer_id: codigo.influencer_id,
        pedido_id: pedido.id,
        subtotal_venta: subtotalVenta,
        monto_comision: montoComision,
        estado: 'pendiente',
      })

  } catch (e) {
    console.error('Error al procesar comisión de influencer:', e)
  }
}

// ============================================================
// Descuento de stock al confirmarse el pago
// - item con variante_id  -> descuenta de producto_variantes
// - item que es kit        -> descuenta de cada componente (kit_componentes)
// - item producto normal   -> descuenta de productos
// ============================================================
async function descontarStock(items: any[]) {
  for (const item of items) {
    const cantidad = item.cantidad || 0
    if (cantidad <= 0) continue

    try {
      // 1) Si el item es de una variante: descontar de la variante
      if (item.variante_id) {
        const { data: variante } = await supabaseAdmin
          .from('producto_variantes')
          .select('stock')
          .eq('id', item.variante_id)
          .single()
        if (variante) {
          const nuevoStock = Math.max(0, (variante.stock || 0) - cantidad)
          await supabaseAdmin
            .from('producto_variantes')
            .update({ stock: nuevoStock })
            .eq('id', item.variante_id)
        }
        continue // ya descontamos esta linea
      }

      // 2) Revisar si el producto es un kit (tiene componentes)
      const { data: componentes } = await supabaseAdmin
        .from('kit_componentes')
        .select('producto_id, cantidad')
        .eq('kit_id', item.producto_id)

      if (componentes && componentes.length > 0) {
        // Es un kit: descontar de cada componente
        for (const comp of componentes) {
          const { data: prodComp } = await supabaseAdmin
            .from('productos')
            .select('stock')
            .eq('id', comp.producto_id)
            .single()
          if (prodComp) {
            const restar = (comp.cantidad || 1) * cantidad
            const nuevoStock = Math.max(0, (prodComp.stock || 0) - restar)
            await supabaseAdmin
              .from('productos')
              .update({ stock: nuevoStock })
              .eq('id', comp.producto_id)
          }
        }
        continue
      }

      // 3) Producto normal: descontar del producto
      const { data: prod } = await supabaseAdmin
        .from('productos')
        .select('stock')
        .eq('id', item.producto_id)
        .single()
      if (prod) {
        const nuevoStock = Math.max(0, (prod.stock || 0) - cantidad)
        await supabaseAdmin
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.producto_id)
      }
    } catch (e) {
      console.error('Error descontando stock del item', item.producto_id, e)
    }
  }
}

async function enviarEmails(pedido: any) {
  const items = pedido.pedido_items || []
  const subtotal = pedido.subtotal || 0
  const costoEnvio = pedido.costo_envio || 0
  const total = pedido.total || 0

  const productosHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; font-size: 14px; color: #333;">
        <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin-bottom: 4px;">${item.marca}</div>
        <div style="font-weight: 500;">${item.nombre}${item.variante_nombre ? ` <span style="color:#888;font-weight:400;">(${item.variante_nombre})</span>` : ''}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: center; font-size: 14px; color: #666;">x${item.cantidad}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: right; font-size: 14px; font-weight: 600; color: #333;">$${(item.precio * item.cantidad).toLocaleString()} MXN</td>
    </tr>
  `).join('')

  // Email al cliente
  const emailCliente = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>
  <div style="padding:40px 32px;text-align:center;border-bottom:1px solid #E8E0D5;">
    <div style="width:60px;height:60px;border-radius:50%;background:#F0F7F0;border:2px solid #6B8F6B;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px;">&#10003;</div>
    <h2 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">&iexcl;Pago confirmado, ${pedido.nombre}!</h2>
    <p style="font-size:14px;color:#888;margin:0;">Pedido #${pedido.id} &mdash; Tu pedido esta siendo preparado.</p>
  </div>
  <div style="padding:32px;">
    <h3 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A961;margin:0 0 20px;">Detalle del pedido</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Producto</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Cant.</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Precio</th>
      </tr></thead>
      <tbody>${productosHTML}</tbody>
    </table>
    <table style="width:100%;margin-top:20px;padding-top:16px;border-top:1px solid #E8E0D5;">
      <tr><td style="font-size:13px;color:#888;padding:4px 0;">Subtotal</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">$${subtotal.toLocaleString()} MXN</td></tr>
      <tr><td style="font-size:13px;color:${costoEnvio === 0 ? '#6B8F6B' : '#888'};padding:4px 0;">Envio</td><td style="font-size:13px;color:${costoEnvio === 0 ? '#6B8F6B' : '#333'};text-align:right;padding:4px 0;">${costoEnvio === 0 ? 'Gratis' : '$' + costoEnvio + ' MXN'}</td></tr>
      <tr><td colspan="2" style="padding-top:12px;border-top:2px solid #0E0E0E;"></td></tr>
      <tr><td style="font-size:18px;font-weight:600;color:#0E0E0E;padding:4px 0;">Total</td><td style="font-size:18px;font-weight:600;color:#0E0E0E;text-align:right;padding:4px 0;">$${total.toLocaleString()} MXN</td></tr>
    </table>
  </div>
  <div style="padding:24px 32px;background:#FAFAF5;border-top:1px solid #E8E0D5;">
    <h3 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Direccion de envio</h3>
    <p style="font-size:14px;color:#333;line-height:1.7;margin:0;">${pedido.nombre} ${pedido.apellido}<br>${pedido.calle} ${pedido.numero}${pedido.interior ? ', Int. ' + pedido.interior : ''}<br>${pedido.colonia || ''}<br>${pedido.ciudad || ''}, ${pedido.estado_dir || ''} CP ${pedido.cp}</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="font-size:13px;color:#888;">Te enviaremos tu numero de guia cuando el pedido sea enviado.</p>
  </div>
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <div style="margin-bottom:16px;"><img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="110" style="display:block;margin:0 auto;max-width:110px;height:auto;opacity:0.8;" /></div>
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0 0 8px;">&iquest;Tienes dudas? Escribenos a</p>
    <a href="mailto:hola@vitalora.com.mx" style="font-size:13px;color:#C9A961;text-decoration:none;">hola@vitalora.com.mx</a>
  </div>
</div></body></html>`

  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: pedido.email,
      subject: `Pago confirmado - Pedido #${pedido.id} - Vitalora`,
      html: emailCliente,
    })

    const productosTexto = items.map((item: any) => `${item.marca} - ${item.nombre}${item.variante_nombre ? ` (${item.variante_nombre})` : ''} x${item.cantidad} -> $${(item.precio * item.cantidad).toLocaleString()} MXN`).join('\n')

    await resend.emails.send({
      from: 'Vitalora Ventas <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `Pago confirmado - Pedido #${pedido.id} - $${total.toLocaleString()} MXN`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;"><div style="background:#0E0E0E;padding:24px;text-align:center;"><img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" /><div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">PAGO CONFIRMADO</div></div><div style="padding:32px;"><h2 style="font-size:20px;color:#0E0E0E;margin:0 0 24px;">Pedido #${pedido.id}</h2><div style="background:#F0F7F0;border:1px solid #A8C5A0;border-radius:4px;padding:16px;margin-bottom:24px;text-align:center;"><div style="font-size:28px;font-weight:700;color:#333;">$${total.toLocaleString()} MXN</div></div><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Cliente</h3><p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 20px;">${pedido.nombre} ${pedido.apellido}<br>${pedido.email}<br>${pedido.telefono}</p><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Direccion</h3><p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 20px;">${pedido.calle} ${pedido.numero}<br>${pedido.colonia || ''}<br>${pedido.ciudad || ''}, ${pedido.estado_dir || ''} CP ${pedido.cp}</p><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Productos</h3><pre style="font-size:13px;color:#333;line-height:1.8;white-space:pre-wrap;margin:0;background:#FAFAF5;padding:16px;border-radius:4px;">${productosTexto}</pre></div></div></body></html>`,
    })
  } catch (emailError) {
    console.error('Error enviando emails desde webhook:', emailError)
  }
}
