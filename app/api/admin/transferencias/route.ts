import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

// Verificar que quien hace la petición es admin activo (cualquier rol con acceso a pedidos)
async function esAdminValido(solicitanteId: string): Promise<{ ok: boolean; rol?: string }> {
  if (!solicitanteId) return { ok: false }
  const { data } = await supabaseAdmin
    .from('admin_usuarios')
    .select('rol, activo')
    .eq('id', solicitanteId)
    .maybeSingle()
  if (!data || !data.activo) return { ok: false }
  return { ok: true, rol: data.rol }
}

// ============================================================
// GET: listar pedidos por transferencia que requieren revisión
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const solicitanteId = searchParams.get('solicitanteId') || ''
    const filtro = searchParams.get('filtro') || 'comprobante_en_revision'

    const auth = await esAdminValido(solicitanteId)
    if (!auth.ok) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    let query = supabaseAdmin
      .from('pedidos')
      .select('id, estado, nombre, apellido, email, telefono, total, comprobante_url, comprobante_subido_at, created_at, metodo_pago')
      .eq('metodo_pago', 'transferencia')
      .order('comprobante_subido_at', { ascending: false, nullsFirst: false })

    if (filtro !== 'todos') {
      query = query.eq('estado', filtro)
    }

    const { data: pedidos } = await query

    return NextResponse.json({ pedidos: pedidos ?? [] })
  } catch (err) {
    console.error('Error al listar pedidos transferencia:', err)
    return NextResponse.json({ error: 'Error al cargar.' }, { status: 500 })
  }
}

// ============================================================
// POST: aprobar o rechazar un comprobante
// body: { solicitanteId, pedidoId, accion: 'aprobar' | 'rechazar' }
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { solicitanteId, pedidoId, accion } = await req.json()

    const auth = await esAdminValido(solicitanteId)
    if (!auth.ok) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    if (!pedidoId || !accion) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }

    // Obtener el pedido con sus items
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('*, pedido_items(*)')
      .eq('id', pedidoId)
      .single()

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    if (pedido.metodo_pago !== 'transferencia') {
      return NextResponse.json({ error: 'Este pedido no es por transferencia.' }, { status: 400 })
    }

    // ─── RECHAZAR ───
    if (accion === 'rechazar') {
      // Usamos 'comprobante_rechazado' (no 'cancelado') para que el pedido
      // se pueda recuperar: el cliente puede resubir comprobante, o el admin re-aprobar.
      await supabaseAdmin
        .from('pedidos')
        .update({ estado: 'comprobante_rechazado' })
        .eq('id', pedidoId)

      // Email al cliente avisando del rechazo
      await enviarEmailRechazo(pedido)

      return NextResponse.json({ ok: true })
    }

    // ─── APROBAR ───
    if (accion === 'aprobar') {
      // Evitar doble procesamiento
      if (pedido.estado === 'pagado' || pedido.estado === 'preparando' || pedido.estado === 'enviado' || pedido.estado === 'entregado') {
        return NextResponse.json({ error: 'Este pedido ya fue confirmado antes.' }, { status: 400 })
      }

      // 1) Marcar como pagado
      await supabaseAdmin
        .from('pedidos')
        .update({ estado: 'pagado' })
        .eq('id', pedidoId)

      // 2) Descontar stock
      await descontarStock(pedido.pedido_items || [])

      // 3) Comisión de influencer
      await procesarComisionInfluencer(pedido)

      // 4) Primera compra
      if (pedido.user_id && pedido.descuento_tipo === 'primera_compra') {
        await supabaseAdmin.from('perfiles').update({ primera_compra_usada: true }).eq('id', pedido.user_id)
      }

      // 5) Códigos de descuento
      if (pedido.codigo_descuento) {
        await supabaseAdmin.rpc('incrementar_uso_codigo', { codigo_param: pedido.codigo_descuento })
        if (pedido.email) {
          try {
            await supabaseAdmin.from('codigos_usados').insert({
              codigo: pedido.codigo_descuento,
              email: pedido.email.toLowerCase(),
              pedido_id: pedido.id,
            })
          } catch {}
        }
      }

      // 6) Emails de confirmación
      await enviarEmails(pedido)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
  } catch (err) {
    console.error('Error al procesar comprobante:', err)
    return NextResponse.json({ error: 'Error al procesar.' }, { status: 500 })
  }
}

// ============================================================
// PATCH: generar URL firmada para ver el comprobante (bucket privado)
// body: { solicitanteId, pedidoId }
// ============================================================
export async function PATCH(req: NextRequest) {
  try {
    const { solicitanteId, pedidoId } = await req.json()

    const auth = await esAdminValido(solicitanteId)
    if (!auth.ok) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('comprobante_url')
      .eq('id', pedidoId)
      .maybeSingle()

    if (!pedido?.comprobante_url) {
      return NextResponse.json({ error: 'Este pedido no tiene comprobante.' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from('comprobantes')
      .createSignedUrl(pedido.comprobante_url, 300) // válida 5 minutos

    if (error || !data) {
      return NextResponse.json({ error: 'No se pudo generar el enlace.' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('Error al generar URL del comprobante:', err)
    return NextResponse.json({ error: 'Error.' }, { status: 500 })
  }
}

// ============================================================
// Funciones auxiliares (copiadas del webhook, autocontenidas)
// ============================================================
async function descontarStock(items: any[]) {
  for (const item of items) {
    const cantidad = item.cantidad || 0
    if (cantidad <= 0) continue
    try {
      if (item.variante_id) {
        const { data: variante } = await supabaseAdmin.from('producto_variantes').select('stock').eq('id', item.variante_id).single()
        if (variante) {
          const nuevoStock = Math.max(0, (variante.stock || 0) - cantidad)
          await supabaseAdmin.from('producto_variantes').update({ stock: nuevoStock }).eq('id', item.variante_id)
        }
        continue
      }
      const { data: componentes } = await supabaseAdmin.from('kit_componentes').select('producto_id, cantidad').eq('kit_id', item.producto_id)
      if (componentes && componentes.length > 0) {
        for (const comp of componentes) {
          const { data: prodComp } = await supabaseAdmin.from('productos').select('stock').eq('id', comp.producto_id).single()
          if (prodComp) {
            const restar = (comp.cantidad || 1) * cantidad
            const nuevoStock = Math.max(0, (prodComp.stock || 0) - restar)
            await supabaseAdmin.from('productos').update({ stock: nuevoStock }).eq('id', comp.producto_id)
          }
        }
        continue
      }
      const { data: prod } = await supabaseAdmin.from('productos').select('stock').eq('id', item.producto_id).single()
      if (prod) {
        const nuevoStock = Math.max(0, (prod.stock || 0) - cantidad)
        await supabaseAdmin.from('productos').update({ stock: nuevoStock }).eq('id', item.producto_id)
      }
    } catch (e) {
      console.error('Error descontando stock del item', item.producto_id, e)
    }
  }
}

async function procesarComisionInfluencer(pedido: any) {
  try {
    if (!pedido.codigo_descuento) return
    const { data: codigo } = await supabaseAdmin
      .from('codigos_descuento')
      .select('es_influencer, influencer_id')
      .eq('codigo', pedido.codigo_descuento)
      .single()

    if (!codigo || !codigo.es_influencer || !codigo.influencer_id) return

    if (pedido.user_id) {
      await supabaseAdmin.from('perfiles').update({ primera_compra_usada: true }).eq('id', pedido.user_id)
    }

    const { data: comisionExistente } = await supabaseAdmin
      .from('influencer_comisiones')
      .select('id')
      .eq('pedido_id', pedido.id)
      .maybeSingle()

    if (comisionExistente) return

    const subtotalVenta = pedido.subtotal || 0
    const montoComision = Math.round(subtotalVenta * 0.05 * 100) / 100

    await supabaseAdmin.from('influencer_comisiones').insert({
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

async function enviarEmails(pedido: any) {
  const items = pedido.pedido_items || []
  const subtotal = pedido.subtotal || 0
  const costoEnvio = pedido.costo_envio || 0
  const total = pedido.total || 0
  const productosHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; font-size: 14px; color: #333;">
        <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A961; margin-bottom: 4px;">${item.marca || ''}</div>
        <div style="font-weight: 500;">${item.nombre}${item.variante_nombre ? ` <span style="color:#888;font-weight:400;">(${item.variante_nombre})</span>` : ''}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: center; font-size: 14px; color: #666;">x${item.cantidad}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E8E0D5; text-align: right; font-size: 14px; font-weight: 600; color: #333;">$${(item.precio * item.cantidad).toLocaleString()} MXN</td>
    </tr>
  `).join('')

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
    <h1 style="font-size:24px;color:#0E0E0E;margin:0 0 8px;font-weight:400;">¡Pago confirmado!</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0;">Hola ${pedido.nombre}, confirmamos tu transferencia. Tu pedido <strong>#${pedido.id}</strong> ya está en proceso.</p>
  </div>
  <div style="padding:32px;">
    <table style="width:100%;border-collapse:collapse;">${productosHTML}</table>
    <div style="margin-top:24px;padding-top:16px;border-top:2px solid #0E0E0E;">
      <table style="width:100%;font-size:14px;color:#555;">
        <tr><td style="padding:4px 0;">Subtotal</td><td style="padding:4px 0;text-align:right;">$${subtotal.toLocaleString()} MXN</td></tr>
        <tr><td style="padding:4px 0;">Envío</td><td style="padding:4px 0;text-align:right;">${costoEnvio === 0 ? 'Gratis' : '$' + costoEnvio.toLocaleString() + ' MXN'}</td></tr>
        <tr><td style="padding:8px 0;font-size:16px;font-weight:700;color:#0E0E0E;">Total</td><td style="padding:8px 0;text-align:right;font-size:16px;font-weight:700;color:#0E0E0E;">$${total.toLocaleString()} MXN</td></tr>
      </table>
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
      subject: `Pago confirmado — Pedido #${pedido.id}`,
      html: emailCliente,
    })
  } catch (e) {
    console.error('Error email cliente:', e)
  }

  // Email al admin
  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: 'gabomaciel7@gmail.com',
      subject: `Transferencia confirmada — Pedido #${pedido.id}`,
      html: `<p>El pedido #${pedido.id} de ${pedido.nombre} (${pedido.email}) por transferencia fue confirmado. Total: $${total.toLocaleString()} MXN.</p>`,
    })
  } catch (e) {
    console.error('Error email admin:', e)
  }
}

async function enviarEmailRechazo(pedido: any) {
  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: pedido.email,
      subject: `Sobre tu pedido #${pedido.id}`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:32px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:15px;color:#333;line-height:1.7;">Hola ${pedido.nombre},</p>
    <p style="font-size:14px;color:#555;line-height:1.7;">No pudimos confirmar el pago de tu pedido <strong>#${pedido.id}</strong> por transferencia. Esto puede deberse a que aún no recibimos la transferencia, o a que el comprobante que subiste no correspondía o no se veía con claridad.</p>
    <p style="font-size:14px;color:#555;line-height:1.7;"><strong>¿Qué puedes hacer?</strong></p>
    <ul style="font-size:14px;color:#555;line-height:1.7;padding-left:20px;">
      <li>Si subiste un archivo equivocado, puedes subir tu comprobante correcto de nuevo desde el enlace de tu pedido.</li>
      <li>Nos pondremos en contacto contigo por teléfono o WhatsApp para ayudarte a resolverlo.</li>
    </ul>
    <p style="font-size:14px;color:#555;line-height:1.7;">También puedes escribirnos a <a href="mailto:hola@vitalora.com.mx" style="color:#C9A961;">hola@vitalora.com.mx</a> si tienes cualquier duda.</p>
  </div>
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`,
    })
  } catch (e) {
    console.error('Error email rechazo:', e)
  }
}
