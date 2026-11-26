import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { crearGuia } from '@/lib/guias'

// POST /api/admin/envios/guia — crea la guía en Skydropx (descuenta saldo).
// Body: { pedidoId, cotizacionId, rateId }
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response

  const body = await req.json().catch(() => ({}))
  const pedidoId = Number(body?.pedidoId)
  const cotizacionId = Number(body?.cotizacionId)
  const rateId = typeof body?.rateId === 'string' ? body.rateId.trim().slice(0, 100) : ''
  if (!Number.isInteger(pedidoId) || pedidoId <= 0 || !Number.isInteger(cotizacionId) || cotizacionId <= 0 || !rateId) {
    return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
  }

  const r = await crearGuia({ pedidoId, cotizacionId, rateId })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json(r)
}
