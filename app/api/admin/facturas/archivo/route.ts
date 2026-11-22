import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { formatearNumeroPedido } from '@/lib/utils'
import { BUCKET_FACTURAS, MAX_BYTES_FACTURA, esPdfValido, leerCfdi, rutaArchivoFactura } from '@/lib/facturas'

// POST: sube el PDF o el XML de la factura de un pedido (multipart: pedidoId, tipo, file)
export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/facturas')
  if (!adminAuth.ok) return adminAuth.response

  try {
    const form = await req.formData()
    const pedidoId = Number(form.get('pedidoId'))
    const tipo = String(form.get('tipo') || '')
    const file = form.get('file')

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido' }, { status: 400 })
    if (tipo !== 'pdf' && tipo !== 'xml') return NextResponse.json({ error: 'Tipo de archivo no válido' }, { status: 400 })
    if (!(file instanceof File)) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    if (file.size === 0 || file.size > MAX_BYTES_FACTURA) return NextResponse.json({ error: 'El archivo debe pesar menos de 5 MB' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith(`.${tipo}`)) return NextResponse.json({ error: `El archivo debe ser .${tipo}` }, { status: 400 })

    const supabase = createServiceClient()
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, requiere_factura, rfc, total, factura_enviada_at')
      .eq('id', pedidoId)
      .maybeSingle()
    if (!pedido || !pedido.requiere_factura) return NextResponse.json({ error: 'Ese pedido no tiene solicitud de factura' }, { status: 404 })
    if (pedido.factura_enviada_at) {
      return NextResponse.json({ error: 'La factura ya fue enviada. Usa "Regresar a pendiente" para reemplazar archivos.' }, { status: 409 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    let aviso: string | null = null

    // Validar el contenido real, no solo la extensión
    if (tipo === 'pdf') {
      if (!esPdfValido(bytes)) return NextResponse.json({ error: 'El archivo no es un PDF válido' }, { status: 400 })
    } else {
      const cfdi = leerCfdi(bytes)
      if (!cfdi) return NextResponse.json({ error: 'El XML no es un CFDI válido' }, { status: 400 })
      const rfcPedido = String(pedido.rfc || '').toUpperCase().trim()
      if (!cfdi.rfcReceptor || cfdi.rfcReceptor !== rfcPedido) {
        return NextResponse.json({
          error: `El RFC del receptor en el XML (${cfdi.rfcReceptor || 'sin RFC'}) no coincide con el de la solicitud (${rfcPedido || 'sin RFC'}).`,
        }, { status: 400 })
      }
      if (cfdi.total != null && Math.round(cfdi.total * 100) !== Math.round(Number(pedido.total) * 100)) {
        aviso = `El total del XML ($${cfdi.total}) es distinto al del pedido ($${pedido.total}). Revísalo antes de enviar.`
      }
    }

    const ruta = rutaArchivoFactura(pedido.id, formatearNumeroPedido(pedido.id), tipo)
    const { error: errSubir } = await supabase.storage
      .from(BUCKET_FACTURAS)
      .upload(ruta, bytes, { contentType: tipo === 'pdf' ? 'application/pdf' : 'application/xml', upsert: true })
    if (errSubir) {
      console.error('Error subiendo factura:', errSubir)
      return NextResponse.json({ error: 'No se pudo subir el archivo' }, { status: 500 })
    }

    // Guardar la ruta solo si sigue sin enviarse (evita carrera con un envío en curso)
    const { data: actualizado } = await supabase
      .from('pedidos')
      .update(tipo === 'pdf' ? { factura_pdf_path: ruta } : { factura_xml_path: ruta })
      .eq('id', pedido.id)
      .is('factura_enviada_at', null)
      .select('id')
    if (!actualizado || actualizado.length === 0) {
      return NextResponse.json({ error: 'La factura ya fue enviada; no se reemplazó el archivo.' }, { status: 409 })
    }

    return NextResponse.json({ ok: true, ruta, aviso })
  } catch (e) {
    console.error('Error en archivo de factura:', e)
    return NextResponse.json({ error: 'Error subiendo la factura' }, { status: 500 })
  }
}

// GET ?pedidoId=&tipo=pdf|xml -> enlace firmado de 5 minutos
export async function GET(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/facturas')
  if (!adminAuth.ok) return adminAuth.response

  const pedidoId = Number(req.nextUrl.searchParams.get('pedidoId'))
  const tipo = req.nextUrl.searchParams.get('tipo')
  if (!Number.isInteger(pedidoId) || (tipo !== 'pdf' && tipo !== 'xml')) {
    return NextResponse.json({ error: 'Parámetros no válidos' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('factura_pdf_path, factura_xml_path')
    .eq('id', pedidoId)
    .maybeSingle()
  const ruta = tipo === 'pdf' ? pedido?.factura_pdf_path : pedido?.factura_xml_path
  if (!ruta) return NextResponse.json({ error: 'No hay archivo' }, { status: 404 })

  const { data, error } = await supabase.storage.from(BUCKET_FACTURAS).createSignedUrl(ruta, 300)
  if (error || !data) return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
  return NextResponse.json({ url: data.signedUrl })
}
