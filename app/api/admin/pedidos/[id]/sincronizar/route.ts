import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { cargarPedidoReembolso, consultarPagoMP, montosPagoMP, sincronizarReembolsosMP } from '@/lib/reembolsos'

const ROLES = { roles: ['dueno', 'gerente'] as ('dueno' | 'gerente')[] }

// Compara el pedido con su pago en Mercado Pago.
async function comparar(id: number) {
  const pedido = await cargarPedidoReembolso(id)
  if (!pedido) return { error: 'Pedido no encontrado.', status: 404 } as const
  if (!pedido.mp_payment_id) return { error: 'Este pedido no tiene un pago de Mercado Pago.', status: 400 } as const
  const pago = await consultarPagoMP(pedido.mp_payment_id)
  if (!pago) return { error: 'No se pudo consultar el pago en Mercado Pago.', status: 502 } as const

  const { pagado, reembolsadoMP } = montosPagoMP(pago)
  const registrados = new Set((pedido.reembolsos || []).map((r: any) => String(r.mp_refund_id)).filter((x: string) => x !== 'null'))
  const refunds = ((pago.refunds || []) as any[]).map(r => ({
    id: String(r.id), monto: Number(r.amount || 0), estado: r.status, fecha: r.date_created, registrado: registrados.has(String(r.id)),
  }))
  const montoBase = Number(pedido.monto_reembolsado || 0)
  const diferencias: string[] = []
  if (reembolsadoMP > montoBase + 0.005) diferencias.push(`Mercado Pago reembolsó $${reembolsadoMP} y aquí hay registrados $${montoBase}.`)
  if (refunds.some(r => r.estado === 'approved' && !r.registrado)) diferencias.push('Hay reembolsos de Mercado Pago sin registrar en el historial.')
  // Solo informativo: activar un pago perdido implica stock y correos, se revisa a mano
  const pagoSinRegistrar = pago.status === 'approved' && ['pendiente', 'cancelado', 'abandonado'].includes(pedido.estado) && !pedido.cancelado_at
  if (pagoSinRegistrar) diferencias.push('Mercado Pago tiene este pago APROBADO pero el pedido no está pagado aquí. No se aplica automáticamente: revísalo a mano.')

  return {
    pedido, pago,
    resumen: {
      mp: { estado: pago.status, detalle: pago.status_detail, pagado, reembolsado: reembolsadoMP, refunds },
      base: { estado: pedido.estado, montoReembolsado: montoBase, total: Number(pedido.total || 0) },
      diferencias,
      hayQueAplicar: reembolsadoMP > montoBase + 0.005 || refunds.some(r => r.estado === 'approved' && !r.registrado),
    },
  } as const
}

// GET: solo muestra la comparación
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdmin(request, '/admin/pedidos', ROLES)
  if (!adminAuth.ok) return adminAuth.response
  const { id } = await params
  const c = await comparar(Number(id))
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })
  return NextResponse.json(c.resumen)
}

// POST: aplica los reembolsos que tiene Mercado Pago y faltan aquí (no toca stock)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdmin(request, '/admin/pedidos', ROLES)
  if (!adminAuth.ok) return adminAuth.response
  try {
    const { id } = await params
    const c = await comparar(Number(id))
    if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })
    if (!c.resumen.hayQueAplicar) {
      return NextResponse.json({ ok: true, mensaje: 'No hay reembolsos de Mercado Pago por registrar.', resumen: c.resumen })
    }
    const r = await sincronizarReembolsosMP(c.pedido.id, c.pago, 'sincronizacion')
    if (r.omitido) return NextResponse.json({ error: `No se aplicó: ${r.omitido}.` }, { status: 409 })
    const partes = [`Sincronizado: reembolsado $${r.montoAntes} → $${r.montoDespues}; estado ${r.estadoAntes} → ${r.estadoDespues}.`]
    if (r.parcialExterno) partes.push('Fue un reembolso parcial hecho en el panel de MP: la comisión no se ajustó.')
    partes.push('El inventario no se ajusta automáticamente.')
    return NextResponse.json({ ok: true, mensaje: partes.join(' '), resultado: r })
  } catch (error) {
    console.error('Error al sincronizar con MP:', error)
    return NextResponse.json({ error: 'Error interno al sincronizar.' }, { status: 500 })
  }
}
