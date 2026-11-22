import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { procesarReembolsoAdmin } from '@/lib/reembolsos'

// POST /api/admin/pedidos/[id]/reembolsar  (solo dueño y gerente)
// Mercado Pago: devuelve el dinero en MP. Transferencia: solo lo registra
// (la devolución se hace desde el banco).
// Body:
//   { total: true, motivo? }                                   -> todo lo que falta por devolver
//   { items: [{ pedido_item_id, cantidad }], incluirEnvio?, monto?, motivo? } -> parcial
//     (monto opcional: ajuste a mano; si no se manda, se usa el calculado)
// Nunca devuelve stock: el inventario se ajusta a mano.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminAuth = await requireAdmin(request, '/admin/pedidos', { roles: ['dueno', 'gerente'] })
  if (!adminAuth.ok) return adminAuth.response

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const r = await procesarReembolsoAdmin(Number(id), { id: adminAuth.admin.id, email: adminAuth.admin.email }, body)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json(r)
  } catch (error) {
    console.error('Error en reembolso admin:', error)
    return NextResponse.json({ error: 'Error interno al procesar el reembolso.' }, { status: 500 })
  }
}
