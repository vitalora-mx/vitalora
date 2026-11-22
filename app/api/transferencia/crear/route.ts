import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { calcularPedido, desglose, guardarPedido, totalCambio } from '@/lib/checkout'
import { permitirIp } from '@/lib/limites'
import { huellaPedido, revisarPedidoPrevio } from '@/lib/abandonados'
import { correoInstruccionesTransferencia } from '@/lib/correoTransferencia'
import { HORAS_PARA_PAGAR } from '@/lib/datos-transferencia'

// Crea un pedido con método de pago TRANSFERENCIA.
// Estado inicial: 'esperando_comprobante', con ventana de 2 horas.
// Body: { items:[{productoId,varianteId,cantidad}], comprador, direccion, codigoDescuento, totalEsperado }
// Body conSesion: true para comprar con la cuenta (sesión en cookie httpOnly)
// Body pedidoPrevio: { id, token } de un pedido de MP pendiente de este navegador -> pasa a 'abandonado'
export async function POST(req: NextRequest) {
  try {
    // Límite suave por IP (compartido con crear-preferencia): 10 pedidos por hora, 30 al día
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

    // Si dejó un pedido de Mercado Pago pendiente sin pago, se abandona (cambió a transferencia)
    await revisarPedidoPrevio(body?.pedidoPrevio, huellaPedido(p), 'transferencia')

    // Token de acceso a la página del pedido (/transferencia/[id]?t=...): sin él no se ve ni se sube nada
    const accesoToken = randomBytes(24).toString('base64url')

    // Ventana de 2 horas para subir el comprobante
    const limite = new Date(Date.now() + HORAS_PARA_PAGAR * 60 * 60 * 1000)

    // 3. Guardar pedido + items
    const pedido = await guardarPedido(p, {
      estado: 'esperando_comprobante',
      metodo_pago: 'transferencia',
      forma_pago: 'Transferencia bancaria',
      limite_transferencia_at: limite.toISOString(),
      acceso_token: accesoToken,
    })
    if (!pedido) return NextResponse.json({ error: 'Error guardando pedido' }, { status: 500 })

    // Correo con el enlace (con token), datos bancarios, monto y plazo: así puede volver aunque cierre la pestaña
    await correoInstruccionesTransferencia(
      { id: pedido.id, nombre: p.comprador.nombre, email: p.comprador.email, total: p.total },
      accesoToken, limite.toISOString(),
    )

    // Devolver el id del pedido para redirigir a la página de instrucciones
    return NextResponse.json({ pedidoId: pedido.id, token: accesoToken, limite: limite.toISOString() })
  } catch (error) {
    console.error('Error crear pedido transferencia:', error)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }
}
