import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(`
        id, created_at, estado, mp_payment_id, mp_preference_id,
        nombre, apellido, email, telefono,
        calle, numero, interior, colonia, ciudad, estado_dir, cp, referencia,
        subtotal, costo_envio, total, forma_pago,
        numero_guia, factura_url,
        factura_rfc, factura_razon_social, factura_uso_cfdi, factura_regimen, factura_cp, factura_estado,
        user_id, email_invitado,
        pedido_items (
          nombre, marca, precio, cantidad, variante_nombre
        )
      `)
      .eq('id', params.id)
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

    return NextResponse.json({ pedido, clienteStats })
  } catch (err) {
    console.error('Error pedido detalle GET:', err)
    return NextResponse.json({ error: 'Error al cargar pedido' }, { status: 500 })
  }
}
