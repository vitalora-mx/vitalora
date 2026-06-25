import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Crea un pedido con método de pago TRANSFERENCIA.
// Estado inicial: 'esperando_comprobante', con ventana de 2 horas.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, comprador, direccion, costoEnvio, userId, descuento, descuentoTipo, codigoDescuento } = body

    const subtotal = items.reduce((sum: number, item: any) => sum + item.precio * item.cantidad, 0)
    const montoDescuento = descuento || 0
    const total = subtotal - montoDescuento + costoEnvio

    // Ventana de 2 horas para subir el comprobante
    const ahora = new Date()
    const limite = new Date(ahora.getTime() + 2 * 60 * 60 * 1000)

    // 1. Guardar pedido
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .insert({
        estado: 'esperando_comprobante',
        metodo_pago: 'transferencia',
        forma_pago: 'Transferencia bancaria',
        limite_transferencia_at: limite.toISOString(),
        nombre: comprador.nombre,
        apellido: comprador.apellido,
        email: comprador.email,
        telefono: comprador.telefono,
        calle: direccion.calle,
        numero: direccion.numero,
        interior: direccion.interior || null,
        colonia: direccion.colonia || null,
        ciudad: direccion.ciudad || null,
        estado_dir: direccion.estado || null,
        cp: direccion.cp,
        referencia: direccion.referencia || null,
        subtotal,
        descuento: montoDescuento,
        descuento_tipo: descuentoTipo || null,
        costo_envio: costoEnvio,
        total,
        user_id: userId || null,
        codigo_descuento: codigoDescuento || null,
      })
      .select()
      .single()

    if (pedidoError) {
      console.error('Error guardando pedido transferencia:', pedidoError)
      return NextResponse.json({ error: 'Error guardando pedido' }, { status: 500 })
    }

    // 2. Guardar items
    const pedidoItems = items.map((item: any) => ({
      pedido_id: pedido.id,
      producto_id: item.id,
      nombre: item.nombre,
      marca: item.marca,
      precio: item.precio,
      cantidad: item.cantidad,
      variante_id: item.varianteId ?? null,
      variante_nombre: item.varianteNombre ?? null,
    }))
    await supabaseAdmin.from('pedido_items').insert(pedidoItems)

    // Devolver el id del pedido para redirigir a la página de instrucciones
    return NextResponse.json({ pedidoId: pedido.id, limite: limite.toISOString() })
  } catch (error) {
    console.error('Error crear pedido transferencia:', error)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }
}
