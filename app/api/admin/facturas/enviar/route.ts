import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { formatearNumeroPedido } from '@/lib/utils'
import { BUCKET_FACTURAS, esCorreoValido } from '@/lib/facturas'

const resend = new Resend(process.env.RESEND_API_KEY)
const COPIA_ADMIN = 'gabomaciel7@gmail.com'
const CANDADO_MINUTOS = 2

// POST { pedidoId, reenviar? } -> manda el PDF y el XML a email_facturacion
export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/facturas')
  if (!adminAuth.ok) return adminAuth.response

  const supabase = createServiceClient()
  let pedidoId = 0
  let candadoTomado = false

  try {
    const body = await req.json()
    pedidoId = Number(body?.pedidoId)
    const reenviar = body?.reenviar === true
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido' }, { status: 400 })

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, nombre, requiere_factura, email_facturacion, factura_pdf_path, factura_xml_path, factura_enviada_at, factura_envios')
      .eq('id', pedidoId)
      .maybeSingle()

    if (!pedido || !pedido.requiere_factura) return NextResponse.json({ error: 'Ese pedido no tiene solicitud de factura' }, { status: 404 })
    if (!pedido.factura_pdf_path || !pedido.factura_xml_path) return NextResponse.json({ error: 'Falta adjuntar el PDF y el XML' }, { status: 400 })
    const destino = String(pedido.email_facturacion || '').trim().toLowerCase()
    if (!esCorreoValido(destino)) return NextResponse.json({ error: 'El correo de envío no es válido' }, { status: 400 })
    if (!reenviar && pedido.factura_enviada_at) return NextResponse.json({ error: 'Esta factura ya fue enviada' }, { status: 409 })
    if (reenviar && !pedido.factura_enviada_at) return NextResponse.json({ error: 'La factura aún no se ha enviado' }, { status: 400 })

    // Candado atómico: solo una petición a la vez puede enviar este pedido
    const limite = new Date(Date.now() - CANDADO_MINUTOS * 60 * 1000).toISOString()
    let candado = supabase
      .from('pedidos')
      .update({ factura_enviando_desde: new Date().toISOString() })
      .eq('id', pedidoId)
      .or(`factura_enviando_desde.is.null,factura_enviando_desde.lt.${limite}`)
    candado = reenviar ? candado.not('factura_enviada_at', 'is', null) : candado.is('factura_enviada_at', null)
    const { data: tomado } = await candado.select('id')
    if (!tomado || tomado.length === 0) {
      return NextResponse.json({ error: reenviar ? 'Ya se está reenviando esta factura' : 'Esta factura ya fue enviada o se está enviando' }, { status: 409 })
    }
    candadoTomado = true

    // Descargar los archivos del bucket privado
    const [pdf, xml] = await Promise.all([
      supabase.storage.from(BUCKET_FACTURAS).download(pedido.factura_pdf_path),
      supabase.storage.from(BUCKET_FACTURAS).download(pedido.factura_xml_path),
    ])
    if (pdf.error || !pdf.data || xml.error || !xml.data) {
      console.error('Error descargando archivos de factura:', pdf.error, xml.error)
      await liberarCandado(pedidoId)
      return NextResponse.json({ error: 'No se pudieron leer los archivos de la factura' }, { status: 500 })
    }

    const numero = formatearNumeroPedido(pedidoId)
    const { error: errCorreo } = await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: destino,
      bcc: COPIA_ADMIN,
      replyTo: 'hola@vitalora.com.mx',
      subject: `Tu factura — Pedido ${numero} — Vitalora`,
      html: `<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
  </div>
  <div style="padding:40px 32px;">
    <h2 style="font-size:22px;color:#0E0E0E;margin:0 0 12px;font-weight:400;">Tu factura está lista</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 12px;">Hola${pedido.nombre ? ' ' + escapar(pedido.nombre) : ''}, adjuntamos la factura (PDF y XML) de tu pedido <strong>${numero}</strong>.</p>
    <p style="font-size:13px;color:#888;line-height:1.7;margin:0;">Si tienes alguna duda, responde a este correo o escríbenos a hola@vitalora.com.mx.</p>
  </div>
</div></body></html>`,
      attachments: [
        { filename: `${numero}.pdf`, content: Buffer.from(await pdf.data.arrayBuffer()) },
        { filename: `${numero}.xml`, content: Buffer.from(await xml.data.arrayBuffer()) },
      ],
    })

    if (errCorreo) {
      console.error('Error enviando factura:', errCorreo)
      await liberarCandado(pedidoId)
      return NextResponse.json({ error: 'No se pudo enviar el correo. Intenta de nuevo.' }, { status: 502 })
    }

    const ahora = new Date().toISOString()
    await supabase
      .from('pedidos')
      .update({
        factura_estado: 'emitida',
        factura_enviada_at: ahora,
        factura_enviada_a: destino,
        factura_envios: (pedido.factura_envios || 0) + 1,
        factura_enviando_desde: null,
      })
      .eq('id', pedidoId)

    return NextResponse.json({ ok: true, enviadaAt: ahora, enviadaA: destino })
  } catch (e) {
    console.error('Error en envío de factura:', e)
    if (candadoTomado) await liberarCandado(pedidoId)
    return NextResponse.json({ error: 'Error al enviar la factura' }, { status: 500 })
  }
}

async function liberarCandado(pedidoId: number) {
  await createServiceClient().from('pedidos').update({ factura_enviando_desde: null }).eq('id', pedidoId)
}

function escapar(txt: string): string {
  return txt.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
