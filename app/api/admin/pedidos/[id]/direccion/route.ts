import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { editarDireccion } from '@/lib/editar-direccion'

// PUT /api/admin/pedidos/[id]/direccion — editar la dirección de envío (solo dueño y gerente).
// Solo mientras el pedido no tenga guía. Body: { nombre, apellido, telefono, calle, numero,
// interior, colonia, ciudad, estado, cp, referencia }
export const maxDuration = 30

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos', { roles: ['dueno', 'gerente'] })
  if (!adminAuth.ok) return adminAuth.response

  const { id } = await params
  const pedidoId = Number(id)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 })

  const r = await editarDireccion(pedidoId, body, adminAuth.admin.email)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json(r)
}
