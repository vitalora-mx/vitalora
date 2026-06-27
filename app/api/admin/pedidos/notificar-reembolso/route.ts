import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { formatearNumeroPedido } from '@/lib/utils'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/admin/pedidos/notificar-reembolso
// Body: { pedidoId, metodo: 'mercadopago' | 'transferencia', monto, esParcial }
// Envía un correo de confirmación de reembolso al cliente, con texto según el método.
export async function POST(req: NextRequest) {
  try {
    const { pedidoId, metodo, monto, esParcial } = await req.json()
    if (!pedidoId) {
      return NextResponse.json({ error: 'Falta el id del pedido.' }, { status: 400 })
    }

    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('id, nombre, email, total')
      .eq('id', pedidoId)
      .maybeSingle()

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    const numeroPedido = formatearNumeroPedido(pedido.id)
    const montoTexto = (typeof monto === 'number' && monto > 0)
      ? `$${monto.toLocaleString('es-MX')} MXN`
      : `$${(pedido.total || 0).toLocaleString('es-MX')} MXN`

    const tipoTexto = esParcial ? 'reembolso parcial' : 'reembolso'

    // Texto del cuerpo según método de pago
    let cuerpo
    if (metodo === 'transferencia') {
      cuerpo = `Confirmamos que realizamos el ${tipoTexto} de tu pedido <strong>${numeroPedido}</strong> por transferencia bancaria. El monto reembolsado fue de <strong>${montoTexto}</strong>. El depósito ya fue enviado a la cuenta que nos proporcionaste y debería reflejarse en tu banco en breve.`
    } else {
      cuerpo = `Confirmamos que procesamos el ${tipoTexto} de tu pedido <strong>${numeroPedido}</strong> por un monto de <strong>${montoTexto}</strong>. El reembolso se realizó a través de Mercado Pago y se verá reflejado en tu método de pago original según los tiempos de tu banco.`
    }

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">WELLNESS</div>
  </div>

  <div style="padding:40px 32px;text-align:center;border-bottom:1px solid #E8E0D5;">
    <h1 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">Reembolso procesado</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">Hola ${pedido.nombre},</p>
  </div>

  <div style="padding:32px;">
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">${cuerpo}</p>

    <div style="background:#FAF7F0;border:1px solid #E8E0D5;border-radius:8px;padding:20px;text-align:center;">
      <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Monto reembolsado</div>
      <div style="font-size:28px;font-weight:700;color:#0E0E0E;">${montoTexto}</div>
    </div>

    <p style="font-size:13px;color:#888;line-height:1.6;margin:24px 0 0;text-align:center;">
      Si tienes cualquier duda sobre tu reembolso, escríbenos a <a href="mailto:hola@vitalora.com.mx" style="color:#C9A961;">hola@vitalora.com.mx</a>.
    </p>
  </div>

  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`

    try {
      await resend.emails.send({
        from: 'Vitalora <hola@vitalora.com.mx>',
        to: pedido.email,
        subject: `Reembolso procesado — Pedido ${numeroPedido}`,
        html,
      })
    } catch (e) {
      console.error('Error al enviar correo de reembolso:', e)
      return NextResponse.json({ error: 'No se pudo enviar el correo.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en correo de reembolso:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
