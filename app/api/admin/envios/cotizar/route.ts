import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { cotizarGuia } from '@/lib/guias'

// POST /api/admin/envios/cotizar — tarifas y saldo para generar la guía de un pedido.
// Body: { pedidoId, origenId?, empaque?: 'bolsa' | 'caja', pesoKg? }
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response

  const body = await req.json().catch(() => ({}))
  const pedidoId = Number(body?.pedidoId)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 })
  const origenId = body?.origenId == null || body?.origenId === '' ? null : Number(body.origenId)
  if (origenId !== null && (!Number.isInteger(origenId) || origenId <= 0)) return NextResponse.json({ error: 'Origen no válido.' }, { status: 400 })
  const empaque = body?.empaque === 'bolsa' || body?.empaque === 'caja' ? body.empaque : undefined
  let pesoKg: number | undefined
  if (body?.pesoKg !== undefined && body?.pesoKg !== null && body?.pesoKg !== '') {
    pesoKg = Number(body.pesoKg)
    if (!Number.isFinite(pesoKg) || pesoKg <= 0 || pesoKg > 70) return NextResponse.json({ error: 'Peso no válido (0 a 70 kg).' }, { status: 400 })
  }

  const r = await cotizarGuia({ pedidoId, origenId, empaque, pesoKg })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json(r.cotizacion)
}
