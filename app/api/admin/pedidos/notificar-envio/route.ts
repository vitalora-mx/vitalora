import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { formatearNumeroPedido } from '@/lib/utils'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

// Devuelve el link de rastreo para cada paqueteria.
// Donde es confiable, se precarga el numero de guia en la URL.
// En todos los casos el cliente vera el numero visible para copiar.
function linkRastreo(paqueteria: string, guia: string): string {
  const g = encodeURIComponent(guia.trim())
  switch ((paqueteria || '').toLowerCase()) {
    case 'estafeta':
      // Estafeta acepta el numero en su buscador
      return `https://www.estafeta.com/herramientas/rastreo?guias=${g}`
    case 'dhl':
      return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${g}`
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${g}`
    case 'paquetexpress':
      // Paquetexpress: su URL directa es menos confiable, llevamos a la pagina de rastreo
      return `https://www.paquetexpress.com.mx/rastreo`
    default:
      return `https://www.google.com/search?q=rastrear+${encodeURIComponent(paqueteria)}+${g}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pedidoId } = await req.json()
    if (!pedidoId) {
      return NextResponse.json({ error: 'Falta el id del pedido.' }, { status: 400 })
    }

    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('id, nombre, email, numero_guia, paqueteria')
      .eq('id', pedidoId)
      .maybeSingle()

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    if (!pedido.numero_guia || !pedido.paqueteria) {
      return NextResponse.json({ error: 'El pedido no tiene guía o paquetería.' }, { status: 400 })
    }

    const link = linkRastreo(pedido.paqueteria, pedido.numero_guia)
    const numeroPedido = formatearNumeroPedido(pedido.id)

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
    <div style="font-size:40px;margin-bottom:8px;">📦</div>
    <h1 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">¡Tu pedido va en camino!</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">Hola ${pedido.nombre}, tu pedido <strong>${numeroPedido}</strong> ya fue enviado. Aquí están tus datos de rastreo.</p>
  </div>

  <div style="padding:32px;">
    <div style="background:#FAF7F0;border:1px solid #E8E0D5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Paquetería</div>
      <div style="font-size:20px;font-weight:700;color:#0E0E0E;margin-bottom:20px;">${pedido.paqueteria}</div>

      <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Número de guía</div>
      <div style="font-size:22px;font-weight:700;color:#0E0E0E;font-family:monospace;letter-spacing:0.05em;word-break:break-all;">${pedido.numero_guia}</div>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${link}" target="_blank" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:16px 36px;border-radius:4px;font-size:15px;font-weight:600;letter-spacing:0.05em;">Rastrear mi pedido</a>
    </div>

    <div style="background:#FFF9F0;border:1px solid #E8D5B0;border-radius:6px;padding:16px;">
      <p style="font-size:13px;color:#8B6914;line-height:1.6;margin:0;text-align:center;">
        Si el rastreo no carga automáticamente, copia tu número de guía y pégalo en la página de ${pedido.paqueteria}. La información puede tardar unas horas en aparecer desde que se genera la guía.
      </p>
    </div>
  </div>

  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`

    try {
      await resend.emails.send({
        from: 'Vitalora <hola@vitalora.com.mx>',
        to: pedido.email,
        subject: `Tu pedido ${numeroPedido} va en camino 📦`,
        html,
      })
    } catch (e) {
      console.error('Error al enviar correo de envío:', e)
      return NextResponse.json({ error: 'No se pudo enviar el correo.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en correo de envío:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
