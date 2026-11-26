import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdmin(request, "/admin/pedidos")
  if (!adminAuth.ok) return adminAuth.response

  try {
    const { id } = await params

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(`
        id, created_at, estado, mp_payment_id, mp_preference_id,
        nombre, apellido, email, telefono,
        calle, numero, interior, colonia, ciudad, estado_dir, cp, referencia,
        subtotal, descuento, costo_envio, cargo_zona_extendida, zona_extendida, zona_verificada, envio_cotizacion,
        total, monto_reembolsado, forma_pago,
        cancelado_at, cancelado_por, motivo_cancelacion,
        stock_descontado_at, stock_devuelto_at, abandonado_at,
        numero_guia, paqueteria, metodo_pago,
        factura_url,
        requiere_factura, factura_rfc:rfc, factura_razon_social:razon_social, factura_uso_cfdi:uso_cfdi,
        factura_regimen:regimen_fiscal, factura_cp:cp_fiscal, factura_solicitada_at, factura_estado,
        factura_pdf_path, factura_xml_path, factura_enviada_at,
        user_id,
        pedido_items (
          id, producto_id, variante_id, nombre, marca, precio, cantidad, cantidad_reembolsada, variante_nombre
        ),
        reembolsos (
          id, tipo, origen, metodo, estado, monto, monto_calculado, ajustado_a_mano, incluye_envio,
          items, mp_refund_id, motivo, admin_email, error, created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Estadísticas del cliente (si tiene user_id)
    let clienteStats = null
    if (pedido?.user_id) {
      const { data: otrosPedidos } = await supabase
        .from('pedidos')
        .select('id, total')
        .eq('user_id', pedido.user_id)
        .in('estado', ['pagado', 'preparando', 'enviado', 'entregado'])

      if (otrosPedidos) {
        clienteStats = {
          totalCompras: otrosPedidos.length,
          totalGastado: otrosPedidos.reduce((a, p) => a + (p.total ?? 0), 0),
        }
      }
    }

    // Historial más reciente primero
    if (pedido?.reembolsos) {
      pedido.reembolsos.sort((a: { id: number }, b: { id: number }) => b.id - a.id)
    }
    const puedeGestionarDinero = ['dueno', 'gerente'].includes(adminAuth.admin.rol)
    return NextResponse.json({ pedido, clienteStats, puedeGestionarDinero })
  } catch (err) {
    console.error('Error pedido detalle GET:', err)
    return NextResponse.json({ error: 'Error al cargar pedido' }, { status: 500 })
  }
}
