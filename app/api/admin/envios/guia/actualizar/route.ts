import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { actualizarGuia } from '@/lib/guias'

// POST /api/admin/envios/guia/actualizar — termina una guía que Skydropx dejó en proceso.
// Body: { pedidoId }
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response

  const body = await req.json().catch(() => ({}))
  const pedidoId = Number(body?.pedidoId)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 })

  const r = await actualizarGuia(pedidoId)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json(r)
}
