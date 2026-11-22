import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createServiceClient } from '@/lib/supabase/service'
import { calcularPedido, desglose, guardarPedido, totalCambio } from '@/lib/checkout'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

// Body: { items:[{productoId,varianteId,cantidad}], comprador, direccion, codigoDescuento, totalEsperado }
// Body conSesion: true para comprar con la cuenta (sesión en cookie httpOnly)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Calcular todo en el servidor
    const calculo = await calcularPedido(req, body)
    if (!calculo.ok) return NextResponse.json(calculo.body, { status: calculo.status })
    const p = calculo.pedido

    // 2. Si el total cambió respecto al que vio el cliente, no crear el pedido
    if (totalCambio(p, body?.totalEsperado)) {
      return NextResponse.json({ totalCambio: true, desglose: desglose(p) }, { status: 409 })
    }

    // 3. Guardar pedido + items
    const pedido = await guardarPedido(p, { estado: 'pendiente' })
    if (!pedido) return NextResponse.json({ error: 'Error guardando pedido' }, { status: 500 })

    // 4. Items para MP (descuento como item negativo)
    const mpItems = p.lineas.map(l => ({
      id: String(l.productoId),
      title: l.varianteNombre ? `${l.nombre} (${l.varianteNombre})` : l.nombre,
      quantity: l.cantidad,
      unit_price: l.precio,
      currency_id: 'MXN',
    }))
    if (p.descuento > 0) {
      mpItems.push({
        id: 'descuento',
        title: p.descuentoTitulo || 'Descuento',
        quantity: 1,
        unit_price: -p.descuento,
        currency_id: 'MXN',
      })
    }

    // 5. Crear preferencia en MP
    const preference = new Preference(client)
    const result = await preference.create({
      body: {
        items: mpItems,
        payer: {
          name: p.comprador.nombre,
          surname: p.comprador.apellido,
          email: p.comprador.email,
          phone: { number: p.comprador.telefono },
        },
        shipments: {
          mode: 'not_specified',
          cost: p.costoEnvio,
          receiver_address: {
            zip_code: p.direccion.cp,
            street_name: p.direccion.calle.normalize('NFD').replace(/[̀-ͯ]/g, ''),
            street_number: p.direccion.numero,
            floor: p.direccion.interior || '',
            apartment: p.direccion.referencia || '',
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
        payment_methods: {
          // Excluir transferencia bancaria SPEI: las transferencias van por el sistema manual de Vitalora.
          // Se mantienen tarjetas, efectivo (OXXO) y dinero en cuenta de Mercado Pago.
          excluded_payment_types: [
            { id: 'bank_transfer' },
          ],
        },
      },
    })

    // 6. Guardar preference_id
    await createServiceClient()
      .from('pedidos')
      .update({ mp_preference_id: result.id })
      .eq('id', pedido.id)

    return NextResponse.json({ init_point: result.init_point })
  } catch (error) {
    console.error('Error Mercado Pago:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Error al crear preferencia' }, { status: 500 })
  }
}
