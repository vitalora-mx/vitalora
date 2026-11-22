import { NextRequest, NextResponse } from 'next/server'
import { calcularPedido, desglose, guardarPedido, totalCambio } from '@/lib/checkout'

// Crea un pedido con método de pago TRANSFERENCIA.
// Estado inicial: 'esperando_comprobante', con ventana de 2 horas.
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

    // Ventana de 2 horas para subir el comprobante
    const limite = new Date(Date.now() + 2 * 60 * 60 * 1000)

    // 3. Guardar pedido + items
    const pedido = await guardarPedido(p, {
      estado: 'esperando_comprobante',
      metodo_pago: 'transferencia',
      forma_pago: 'Transferencia bancaria',
      limite_transferencia_at: limite.toISOString(),
    })
    if (!pedido) return NextResponse.json({ error: 'Error guardando pedido' }, { status: 500 })

    // Devolver el id del pedido para redirigir a la página de instrucciones
    return NextResponse.json({ pedidoId: pedido.id, limite: limite.toISOString() })
  } catch (error) {
    console.error('Error crear pedido transferencia:', error)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }
}
