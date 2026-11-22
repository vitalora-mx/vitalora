import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireCliente } from '@/lib/cliente-auth'

const supabaseAdmin = createServiceClient()

// GET — pedidos del cliente de la sesión.
// No se devuelven rutas internas de archivos: solo tiene_factura (PDF y XML listos y enviados).
export async function GET(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response

  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .select(`
      id, estado, total, subtotal, descuento, costo_envio, created_at,
      nombre, apellido, calle, numero, ciudad, estado_dir, cp, numero_guia, paqueteria,
      factura_pdf_path, factura_xml_path, factura_enviada_at,
      pedido_items (producto_id, nombre, marca, precio, cantidad, variante_nombre)
    `)
    .eq('user_id', auth.cliente.id)
    .neq('estado', 'abandonado') // pedidos que nunca se pagaron: no se le muestran al cliente
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'No se pudieron cargar los pedidos' }, { status: 500 })

  const pedidos = (data ?? []).map(({ factura_pdf_path, factura_xml_path, factura_enviada_at, ...p }) => ({
    ...p,
    tiene_factura: !!(factura_pdf_path && factura_xml_path && factura_enviada_at),
  }))
  return NextResponse.json(pedidos)
}
