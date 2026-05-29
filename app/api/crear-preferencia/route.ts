import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, comprador, direccion, costoEnvio, userId, descuento, descuentoTipo, codigoDescuento } = body

    const subtotal = items.reduce((sum: number, item: any) => sum + item.precio * item.cantidad, 0)
    const montoDescuento = descuento || 0
    const total = subtotal - montoDescuento + costoEnvio

    // 1. Guardar pedido en Supabase
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .insert({
        estado: 'pendiente',
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
      console.error('Error guardando pedido:', pedidoError)
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
    }))
    await supabaseAdmin.from('pedido_items').insert(pedidoItems)

    // 3. Crear items para MP (con descuento aplicado como item negativo)
    const mpItems = items.map((item: any) => ({
      id: String(item.id),
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio,
      currency_id: 'MXN',
    }))

    // Agregar descuento como item negativo si aplica
    if (montoDescuento > 0) {
      mpItems.push({
        id: 'descuento',
        title: 'Descuento 5% primera compra',
        quantity: 1,
        unit_price: -montoDescuento,
        currency_id: 'MXN',
      })
    }

    // 4. Crear preferencia en MP
    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: {
          name: comprador.nombre,
          surname: comprador.apellido,
          email: comprador.email,
          phone: { number: comprador.telefono },
        },
        shipments: {
          mode: 'not_specified',
          cost: costoEnvio,
          receiver_address: {
            zip_code: direccion.cp,
            street_name: direccion.calle.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
            street_number: direccion.numero,
            floor: direccion.interior || '',
            apartment: direccion.referencia || '',
          },
        },
        back_urls: {
          success: 'https://vitalora.com.mx/gracias',
          failure: 'https://vitalora.com.mx/checkout',
          pending: 'https://vitalora.com.mx/checkout',
        },
        auto_return: 'approved',
        statement_descriptor: 'VITALORA',
        notification_url: 'https://vitalora.com.mx/api/webhooks/mercadopago',
        external_reference: String(pedido.id),
      },
    })

    // 5. Guardar preference_id
    await supabaseAdmin
      .from('pedidos')
      .update({ mp_preference_id: result.id })
      .eq('id', pedido.id)

    return NextResponse.json({ init_point: result.init_point })
  } catch (error) {
    console.error('Error Mercado Pago:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Error al crear preferencia' }, { status: 500 })
  }
}
