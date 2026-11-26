import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sincronizarRastreo } from '@/lib/rastreo'

// GET  /api/admin/envios/rastreo?pedidoId=123 → historial de rastreo del pedido
// POST /api/admin/envios/rastreo { pedidoId }  → consulta Skydropx ahora ("Actualizar rastreo")
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response
  const pedidoId = Number(new URL(req.url).searchParams.get('pedidoId'))
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 })
  const { data, error } = await createServiceClient()
    .from('envio_eventos')
    .select('id, numero_guia, estado, descripcion, ubicacion, ocurrido_at, fuente')
    .eq('pedido_id', pedidoId)
    .order('ocurrido_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: 'No se pudo leer el historial.' }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response
  const body = await req.json().catch(() => ({}))
  const pedidoId = Number(body?.pedidoId)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 })
  const r = await sincronizarRastreo(pedidoId)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json(r)
}
