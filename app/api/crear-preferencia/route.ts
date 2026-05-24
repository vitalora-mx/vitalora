import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, comprador, direccion, costoEnvio } = body

    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: String(item.id),
          title: item.nombre,
          quantity: item.cantidad,
          unit_price: item.precio,
          currency_id: 'MXN',
          dimensions: '10x10x10,300',
        })),
        payer: {
          name: comprador.nombre,
          surname: comprador.apellido,
          email: comprador.email,
          phone: { number: comprador.telefono },
        },
        shipments: {
          mode: 'me2',
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
      },
    })

    return NextResponse.json({ init_point: result.init_point })
  } catch (error) {
    console.error('Error Mercado Pago:', error)
    return NextResponse.json({ error: 'Error al crear preferencia' }, { status: 500 })
  }
}