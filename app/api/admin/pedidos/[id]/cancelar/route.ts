import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { cancelarPedido } from '@/lib/reembolsos'

// POST /api/admin/pedidos/[id]/cancelar  (solo dueño y gerente)
// Body: { motivo }
// Solo si el pedido no tiene guía y no está enviado ni entregado.
//  - Mercado Pago pagado: reembolso de lo que falta en MP
//  - Transferencia pagada o en revisión: se registra; la devolución se hace desde el banco
//  - Sin pago: caduca la preferencia de MP (y cancela una ficha OXXO pendiente)
// No devuelve stock. Manda el correo "Tu pedido fue cancelado".
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdmin(request, '/admin/pedidos', { roles: ['dueno', 'gerente'] })
  if (!adminAuth.ok) return adminAuth.response

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const r = await cancelarPedido(Number(id), { id: adminAuth.admin.id, email: adminAuth.admin.email }, body?.motivo)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json(r)
  } catch (error) {
    console.error('Error al cancelar pedido:', error)
    return NextResponse.json({ error: 'Error interno al cancelar el pedido.' }, { status: 500 })
  }
}
