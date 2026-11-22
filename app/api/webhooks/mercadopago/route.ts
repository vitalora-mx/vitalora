import { NextRequest, NextResponse } from 'next/server'
import { generarCorreoInfluencer } from '@/lib/correoInfluencer'
import { createClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'
import { formatearNumeroPedido } from '@/lib/utils'
import { filaDescuentoHTML, resumenInternoHTML } from '@/lib/correoPedido'
import { sincronizarReembolsosMP, reembolsarPagoEnCancelado } from '@/lib/reembolsos'
import { registrarComisionVenta } from '@/lib/comisiones'
import { descontarStockUnaVez } from '@/lib/inventario'
import { avisoCancelacionHTML } from '@/lib/correoPedido'

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
    const statusDetail = paymentData.status_detail // puede ser 'partially_refunded'
    // Monto reembolsado reportado por MP (suma de refunds), si existe
    const mpRefunded = typeof paymentData.transaction_amount_refunded === 'number' ? paymentData.transaction_amount_refunded : 0
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

      const datosPago = { mp_payment_id: String(paymentId), forma_pago: formaPagoTexto }
      const estadoAnterior: string = pedido.estado

      // ── Reembolsos (hechos desde el admin o desde el panel de MP) ──
      // Se registran en `reembolsos` y se ajusta el monto; NUNCA se devuelve stock.
      // Respeta los pedidos cancelados (no les cambia el estado).
      if (status === 'refunded' || statusDetail === 'partially_refunded' || mpRefunded > 0) {
        await sincronizarReembolsosMP(pedido.id, paymentData, 'webhook')
        return NextResponse.json({ ok: true })
      }

      // ── Pedido cancelado desde el admin: no se revive ──
      // Si llega un pago aprobado (p. ej. ficha OXXO pagada después), se reembolsa solo y se avisa.
      if (pedido.cancelado_at) {
        if (status === 'approved') await reembolsarPagoEnCancelado(pedido.id, paymentData)
        return NextResponse.json({ ok: true })
      }

      // ── Rechazado / cancelado: solo si el pedido aún no se pagó ──
      // (un 'rejected' tardío de un intento anterior no debe pisar un pedido pagado)
      if (status === 'rejected' || status === 'cancelled') {
        await cambiarEstadoSi(pedido.id, ['pendiente'], 'cancelado', datosPago)
        return NextResponse.json({ ok: true })
      }

      // ── Pendiente / en proceso (p. ej. ficha OXXO generada tras un rechazo) ──
      if (status === 'pending' || status === 'in_process') {
        await cambiarEstadoSi(pedido.id, ESTADOS_ANTES_DEL_PAGO, 'pendiente', datosPago)
        return NextResponse.json({ ok: true })
      }

      if (status !== 'approved') return NextResponse.json({ ok: true })

      // ── Aprobado: los efectos ocurren UNA sola vez ──
      // Verificación de monto: lo cobrado por MP (productos - descuento + envío)
      // debe coincidir con pedido.total. MP reporta el envío aparte en shipping_amount.
      const montoCobrado = Number(paymentData.transaction_amount ?? 0) + Number((paymentData as any).shipping_amount ?? 0)
      const montoEsperado = Number(pedido.total ?? 0)
      const montoCoincide = Math.round(montoCobrado * 100) === Math.round(montoEsperado * 100)
      const destino = montoCoincide ? 'pagado' : 'revision_monto'

      // Cambio atómico: solo la notificación que logra mover el pedido desde
      // 'pendiente'/'cancelado' ejecuta los efectos. Si ya está pagado, preparando,
      // enviado, entregado, revision_monto o reembolsado, no cambia ni repite nada.
      const gano = await cambiarEstadoSi(pedido.id, ESTADOS_ANTES_DEL_PAGO, destino, datosPago)
      if (!gano) return NextResponse.json({ ok: true })

      // Monto distinto: no descontar stock, no confirmar al cliente, no contar el código.
      // Solo avisar al admin para revisarlo a mano.
      if (destino === 'revision_monto') {
        await avisarRevisionMonto(pedido, {
          paymentId: String(paymentId),
          transactionAmount: Number(paymentData.transaction_amount ?? 0),
          shippingAmount: Number((paymentData as any).shipping_amount ?? 0),
          totalPaidAmount: (paymentData as any).transaction_details?.total_paid_amount ?? null,
          montoCobrado,
          montoEsperado,
          estadoAnterior,
        })
        return NextResponse.json({ ok: true })
      }

      // Pago aprobado en un pedido que estaba cancelado: efectos normales + aviso al admin
      if (estadoAnterior === 'cancelado') {
        await avisarPagoEnCancelado(pedido, { paymentId: String(paymentId), montoCobrado })
      }

      // Efectos del pago aprobado (solo llega aquí la notificación que hizo el cambio)
      {
        // Descontar stock (variante / kit / producto normal) una sola vez
        await descontarStockUnaVez(pedido.id)

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

// Estados desde los que un pago aprobado se procesa (una sola vez).
// 'cancelado' cubre el reintento con otra tarjeta tras un rechazo en la misma preferencia
// (los cancelados por el admin, con cancelado_at, se atienden antes y no llegan aquí).
// 'abandonado': el cliente sí pagó después, se procesa normal.
const ESTADOS_ANTES_DEL_PAGO = ['pendiente', 'cancelado', 'abandonado']

// Cambia el estado solo si el pedido sigue en uno de `desde` (update condicional, atómico).
// Devuelve true si ESTA notificación hizo el cambio.
async function cambiarEstadoSi(pedidoId: number, desde: string[], a: string, extra: Record<string, unknown> = {}): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .update({ estado: a, ...extra })
    .eq('id', pedidoId)
    .in('estado', desde)
    .select('id')
  if (error) {
    console.error('Error cambiando estado del pedido', pedidoId, error)
    return false
  }
  return (data?.length ?? 0) > 0
}

// ============================================================
// Aviso al admin: pago aprobado en un pedido que estaba cancelado
// ============================================================
async function avisarPagoEnCancelado(pedido: any, info: { paymentId: string; montoCobrado: number }) {
  const numero = formatearNumeroPedido(pedido.id)
  const monto = `$${Number(info.montoCobrado).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
  try {
    await resend.emails.send({
      from: 'Vitalora Ventas <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `Pago aprobado en un pedido que estaba cancelado - revisar - Pedido ${numero}`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;padding:32px;">
<h2 style="font-size:20px;color:#B45309;margin:0 0 8px;">Pago aprobado en un pedido que estaba cancelado</h2>
<p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 20px;">El pedido <strong>${numero}</strong> estaba en <strong>cancelado</strong> y Mercado Pago aprobó un pago. Se marcó como <strong>pagado</strong> y se aplicaron los efectos normales (stock, correo al cliente, código, comisión). Decide si lo envías o lo reembolsas.</p>
<table style="width:100%;border-collapse:collapse;background:#FAFAF5;">
<tr><td style="padding:6px 12px;color:#666;font-size:13px;">Pedido</td><td style="padding:6px 12px;font-size:13px;text-align:right;"><strong>${numero}</strong></td></tr>
<tr><td style="padding:6px 12px;color:#666;font-size:13px;">Monto cobrado</td><td style="padding:6px 12px;font-size:13px;text-align:right;"><strong>${monto}</strong></td></tr>
<tr><td style="padding:6px 12px;color:#666;font-size:13px;">ID de pago MP</td><td style="padding:6px 12px;font-size:13px;text-align:right;"><strong>${info.paymentId}</strong></td></tr>
</table>
<p style="font-size:13px;color:#666;line-height:1.6;margin:20px 0 0;">Cliente: ${pedido.nombre} ${pedido.apellido} · ${pedido.email}</p>
</div></body></html>`,
    })
  } catch (e) {
    console.error('Error enviando aviso de pago en pedido cancelado:', e)
  }
}

// ============================================================
// Aviso al admin: el monto cobrado por MP no coincide con pedido.total
// ============================================================
async function avisarRevisionMonto(pedido: any, info: {
  paymentId: string
  transactionAmount: number
  shippingAmount: number
  totalPaidAmount: number | null
  montoCobrado: number
  montoEsperado: number
  estadoAnterior: string
}) {
  const fmt = (n: number | null) => n == null ? '—' : `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
  const numero = formatearNumeroPedido(pedido.id)
  const fila = (k: string, v: string) => `<tr><td style="padding:6px 12px;color:#666;font-size:13px;">${k}</td><td style="padding:6px 12px;font-size:13px;color:#222;text-align:right;"><strong>${v}</strong></td></tr>`
  try {
    await resend.emails.send({
      from: 'Vitalora Ventas <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `⚠️ Revisar monto - Pedido ${numero} - cobrado ${fmt(info.montoCobrado)} vs esperado ${fmt(info.montoEsperado)}`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;padding:32px;">
<h2 style="font-size:20px;color:#B33;margin:0 0 8px;">Pago con monto distinto al pedido</h2>
<p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 20px;">El pedido <strong>${numero}</strong> quedó en estado <strong>revision_monto</strong>. No se descontó stock, no se envió confirmación al cliente y no se contó el uso del código. Revísalo en Mercado Pago antes de enviarlo.</p>
<table style="width:100%;border-collapse:collapse;background:#FAFAF5;">
${fila('Total del pedido (esperado)', fmt(info.montoEsperado))}
${fila('Cobrado: transaction_amount + shipping_amount', fmt(info.montoCobrado))}
${fila('transaction_amount', fmt(info.transactionAmount))}
${fila('shipping_amount', fmt(info.shippingAmount))}
${fila('total_paid_amount', fmt(info.totalPaidAmount))}
${fila('Diferencia', fmt(Math.round((info.montoCobrado - info.montoEsperado) * 100) / 100))}
${fila('ID de pago MP', info.paymentId)}
${fila('Estado anterior del pedido', info.estadoAnterior)}
</table>
<p style="font-size:13px;color:#666;line-height:1.6;margin:20px 0 0;">Cliente: ${pedido.nombre} ${pedido.apellido} · ${pedido.email}<br>Subtotal ${fmt(pedido.subtotal)} · Descuento ${fmt(pedido.descuento || 0)} · Envío ${fmt(pedido.costo_envio || 0)}${pedido.codigo_descuento ? ` · Código ${pedido.codigo_descuento}` : ''}</p>
</div></body></html>`,
    })
  } catch (e) {
    console.error('Error enviando aviso de revision_monto:', e)
  }
}

// ============================================================
// PROGRAMA DE INFLUENCERS
// Cuando un pedido pagado usó un código de embajadora:
//   1. Registrar la comisión (lib/comisiones.ts: candado de primera compra,
//      cálculo por porcentaje o monto fijo por pieza, copia de la configuración)
//   2. Avisar a la embajadora por correo
// ============================================================
async function procesarComisionInfluencer(pedido: any) {
  try {
    const comision = await registrarComisionVenta(pedido)
    if (!comision) return

    try {
      const { data: inf } = await supabaseAdmin
        .from('influencers')
        .select('nombre, email')
        .eq('id', comision.influencerId)
        .maybeSingle()

      if (inf && inf.email) {
        const { data: itemsCorreo } = await supabaseAdmin
          .from('pedido_items')
          .select('nombre, marca, precio, cantidad, variante_nombre')
          .eq('pedido_id', pedido.id)

        const listaItems = itemsCorreo || []
        const totalPiezas = listaItems.reduce((s, it) => s + (it.cantidad || 0), 0)
        const costoEnvioPedido = pedido.costo_envio != null ? Number(pedido.costo_envio) : 0
        const totalPedido = pedido.total != null ? Number(pedido.total) : (comision.subtotalVenta + costoEnvioPedido)

        const correo = generarCorreoInfluencer({
          nombreInfluencer: inf.nombre || 'Embajadora',
          codigo: pedido.codigo_descuento,
          numeroPedido: formatearNumeroPedido(pedido.id),
          items: listaItems,
          totalPiezas,
          subtotal: comision.subtotalVenta,
          costoEnvio: costoEnvioPedido,
          total: totalPedido,
          ciudad: pedido.ciudad || '',
          montoComision: comision.montoComision,
          tipoComision: comision.tipoComision,
          comisionValor: comision.comisionValor,
        })

        await resend.emails.send({
          from: 'Vitalora <hola@vitalora.com.mx>',
          to: inf.email,
          subject: correo.asunto,
          html: correo.html,
        })
      }
    } catch (correoInfError) {
      console.error('Error enviando correo al influencer:', correoInfError)
    }

  } catch (e) {
    console.error('Error al procesar comisión de influencer:', e)
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
    <p style="font-size:14px;color:#888;margin:0;">Pedido ${formatearNumeroPedido(pedido.id)} &mdash; Tu pedido esta siendo preparado.</p>
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
      ${filaDescuentoHTML(pedido, 'font-size:13px;padding:4px 0;', 'font-size:13px;text-align:right;padding:4px 0;')}
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
  ${avisoCancelacionHTML()}
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
      subject: `Pago confirmado - Pedido ${formatearNumeroPedido(pedido.id)} - Vitalora`,
      html: emailCliente,
    })

    const productosTexto = items.map((item: any) => `${item.marca} - ${item.nombre}${item.variante_nombre ? ` (${item.variante_nombre})` : ''} x${item.cantidad} -> $${(item.precio * item.cantidad).toLocaleString()} MXN`).join('\n')

    await resend.emails.send({
      from: 'Vitalora Ventas <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `Pago confirmado - Pedido ${formatearNumeroPedido(pedido.id)} - $${total.toLocaleString()} MXN`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:white;"><div style="background:#0E0E0E;padding:24px;text-align:center;"><img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" /><div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">PAGO CONFIRMADO</div></div><div style="padding:32px;"><h2 style="font-size:20px;color:#0E0E0E;margin:0 0 24px;">Pedido ${formatearNumeroPedido(pedido.id)}</h2><div style="background:#F0F7F0;border:1px solid #A8C5A0;border-radius:4px;padding:16px;margin-bottom:24px;text-align:center;"><div style="font-size:28px;font-weight:700;color:#333;">$${total.toLocaleString()} MXN</div></div><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Cliente</h3><p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 20px;">${pedido.nombre} ${pedido.apellido}<br>${pedido.email}<br>${pedido.telefono}</p><h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Direccion</h3><p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 20px;">${pedido.calle} ${pedido.numero}<br>${pedido.colonia || ''}<br>${pedido.ciudad || ''}, ${pedido.estado_dir || ''} CP ${pedido.cp}</p>${resumenInternoHTML(pedido)}<h3 style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Productos</h3><pre style="font-size:13px;color:#333;line-height:1.8;white-space:pre-wrap;margin:0;background:#FAFAF5;padding:16px;border-radius:4px;">${productosTexto}</pre></div></div></body></html>`,
    })
  } catch (emailError) {
    console.error('Error enviando emails desde webhook:', emailError)
  }
}
