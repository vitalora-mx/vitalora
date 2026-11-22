import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createServiceClient } from '@/lib/supabase/service'
import { calcularPedido, desglose, guardarPedido, totalCambio } from '@/lib/checkout'
import { permitirIp } from '@/lib/limites'
import { huellaPedido, revisarPedidoPrevio } from '@/lib/abandonados'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

// Body: { items:[{productoId,varianteId,cantidad}], comprador, direccion, codigoDescuento, totalEsperado }
// Body conSesion: true para comprar con la cuenta (sesión en cookie httpOnly)
// Body pedidoPrevio: { id, token } del pedido de MP que este navegador creó antes:
//   mismo pedido (huella igual) -> se reutiliza con su enlace de pago; distinto -> el anterior pasa a 'abandonado'
// Respuesta: { init_point, pedidoId, token }
export async function POST(req: NextRequest) {
  try {
    // Límite suave por IP (compartido con transferencia/crear): 10 pedidos por hora, 30 al día
    if (!(await permitirIp(req, 'pedido', 10, 30))) {
      return NextResponse.json({ error: 'Demasiados intentos de compra. Espera unos minutos o escríbenos a hola@vitalora.com.mx' }, { status: 429 })
    }

    const body = await req.json()

    // 1. Calcular todo en el servidor
    const calculo = await calcularPedido(req, body)
    if (!calculo.ok) return NextResponse.json(calculo.body, { status: calculo.status })
    const p = calculo.pedido

    // 2. Si el total cambió respecto al que vio el cliente, no crear el pedido
    if (totalCambio(p, body?.totalEsperado)) {
      return NextResponse.json({ totalCambio: true, desglose: desglose(p) }, { status: 409 })
    }

    // 3. ¿Es el mismo pedido que dejó pendiente? Reutilizarlo. Si no, abandonar el anterior.
    const huella = huellaPedido(p)
    const previo = await revisarPedidoPrevio(body?.pedidoPrevio, huella, 'mercadopago')
    if (previo) {
      return NextResponse.json({ init_point: previo.reutilizar.initPoint, pedidoId: previo.reutilizar.id, token: previo.reutilizar.token, reutilizado: true })
    }

    // 4. Guardar pedido + items (con su token para poder reutilizarlo después)
    const accesoToken = randomBytes(24).toString('base64url')
    const pedido = await guardarPedido(p, { estado: 'pendiente', metodo_pago: 'mercadopago', acceso_token: accesoToken, huella })
    if (!pedido) return NextResponse.json({ error: 'Error guardando pedido' }, { status: 500 })

    // 5. Items para MP (descuento como item negativo)
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

    // 6. Crear preferencia en MP
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

    // 7. Guardar preference_id y el enlace de pago (para reutilizarlo)
    await createServiceClient()
      .from('pedidos')
      .update({ mp_preference_id: result.id, mp_init_point: result.init_point })
      .eq('id', pedido.id)

    return NextResponse.json({ init_point: result.init_point, pedidoId: pedido.id, token: accesoToken })
  } catch (error) {
    console.error('Error Mercado Pago:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Error al crear preferencia' }, { status: 500 })
  }
}
