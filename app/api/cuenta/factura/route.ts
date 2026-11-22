import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireCliente } from '@/lib/cliente-auth'
import { BUCKET_FACTURAS } from '@/lib/facturas'

// GET /api/cuenta/factura?pedidoId=123&tipo=pdf|xml
// Enlace firmado (60 s) al PDF o XML de la factura, solo para el dueño del pedido
// y solo cuando la factura ya se envió al cliente.
export async function GET(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response

  const pedidoId = Number(req.nextUrl.searchParams.get('pedidoId'))
  const tipo = req.nextUrl.searchParams.get('tipo')
  if (!Number.isInteger(pedidoId) || pedidoId <= 0 || (tipo !== 'pdf' && tipo !== 'xml')) {
    return NextResponse.json({ error: 'Parámetros no válidos' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('factura_pdf_path, factura_xml_path, factura_enviada_at')
    .eq('id', pedidoId)
    .eq('user_id', auth.cliente.id)
    .maybeSingle()

  // Mismo 404 si el pedido no existe, es de otra persona o aún no tiene factura
  const ruta = tipo === 'pdf' ? pedido?.factura_pdf_path : pedido?.factura_xml_path
  if (!pedido || !pedido.factura_enviada_at || !ruta) {
    return NextResponse.json({ error: 'Factura no disponible' }, { status: 404 })
  }

  const nombreArchivo = ruta.split('/').pop() || `factura.${tipo}`
  const { data, error } = await supabase.storage
    .from(BUCKET_FACTURAS)
    .createSignedUrl(ruta, 60, { download: nombreArchivo })
  if (error || !data) return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })

  return NextResponse.json({ url: data.signedUrl })
}
