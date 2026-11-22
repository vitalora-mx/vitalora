import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { esCorreoValido } from '@/lib/facturas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req, "/admin/facturas")
  if (!adminAuth.ok) return adminAuth.response

  try {
    // Pedidos cuyo cliente pidió factura (los guarda /api/facturacion)
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        created_at,
        total,
        estado,
        nombre,
        apellido,
        email,
        factura_estado,
        factura_solicitada_at,
        rfc,
        razon_social,
        regimen_fiscal,
        cp_fiscal,
        uso_cfdi,
        email_facturacion,
        factura_pdf_path,
        factura_xml_path,
        factura_enviada_at,
        factura_enviada_a,
        factura_envios
      `)
      .eq('requiere_factura', true)
      .order('factura_solicitada_at', { ascending: false, nullsFirst: false })

    if (error) throw error

    const lista = pedidos ?? []

    // Stats
    const pendientes = lista.filter(p => !p.factura_estado || p.factura_estado === 'pendiente').length
    const emitidas = lista.filter(p => p.factura_estado === 'emitida').length

    // Calcular fecha límite SAT: último día del mes siguiente a la compra
    const conVencimiento = lista.map(p => {
      const fechaCompra = new Date(p.created_at)
      const vence = new Date(fechaCompra.getFullYear(), fechaCompra.getMonth() + 2, 0) // último día del mes siguiente
      const diasRestantes = Math.ceil((vence.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return { ...p, vence: vence.toISOString(), diasRestantes }
    })

    const vencenProximo = conVencimiento.filter(p =>
      (!p.factura_estado || p.factura_estado === 'pendiente') && p.diasRestantes <= 5 && p.diasRestantes >= 0
    ).length

    return NextResponse.json({
      facturas: conVencimiento,
      stats: { pendientes, emitidas, total: lista.length, vencenProximo }
    })
  } catch (err) {
    console.error('Error facturas GET:', err)
    return NextResponse.json({ error: 'Error al cargar facturas' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const adminAuth = await requireAdmin(request, "/admin/facturas")
  if (!adminAuth.ok) return adminAuth.response

  try {
    const body = await request.json()
    const pedidoId = Number(body?.pedidoId)
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // A) Editar el correo de envío (se usa en "Enviar" y en "Reenviar")
    if (body.emailFacturacion !== undefined) {
      const correo = String(body.emailFacturacion || '').trim().toLowerCase()
      if (!esCorreoValido(correo)) {
        return NextResponse.json({ error: 'El correo no es válido' }, { status: 400 })
      }
      const { data, error } = await supabase
        .from('pedidos')
        .update({ email_facturacion: correo })
        .eq('id', pedidoId)
        .eq('requiere_factura', true)
        .select('id')
      if (error) throw error
      if (!data || data.length === 0) return NextResponse.json({ error: 'Ese pedido no tiene solicitud de factura' }, { status: 404 })
      return NextResponse.json({ ok: true, emailFacturacion: correo })
    }

    // B) Regresar a pendiente: desbloquea los archivos para corregirlos y enviar de nuevo.
    //    'emitida' solo se pone al enviar la factura (/api/admin/facturas/enviar).
    if (body.estado === 'pendiente') {
      const limite = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('pedidos')
        .update({ factura_estado: 'pendiente', factura_enviada_at: null })
        .eq('id', pedidoId)
        .eq('requiere_factura', true)
        .or(`factura_enviando_desde.is.null,factura_enviando_desde.lt.${limite}`)
        .select('id')
      if (error) throw error
      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'No se pudo regresar a pendiente (¿se está enviando?)' }, { status: 409 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err) {
    console.error('Error facturas PATCH:', err)
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
