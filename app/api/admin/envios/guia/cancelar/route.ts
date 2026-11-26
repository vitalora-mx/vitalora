import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { cancelarGuia } from '@/lib/guias'

// POST /api/admin/envios/guia/cancelar — cancela la guía en Skydropx (solo dueño y gerente).
// Body: { pedidoId, motivo }
export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos', { roles: ['dueno', 'gerente'] })
  if (!adminAuth.ok) return adminAuth.response

  const body = await req.json().catch(() => ({}))
  const pedidoId = Number(body?.pedidoId)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 })

  const r = await cancelarGuia(pedidoId, body?.motivo, adminAuth.admin.email)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ok: true })
}
