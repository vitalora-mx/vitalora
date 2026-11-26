import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { enviarCorreoGuia } from '@/lib/correo-guia'

// Correo al cliente con la guía (registro manual de guía). El texto vive en lib/correo-guia.ts.
export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/pedidos")
  if (!adminAuth.ok) return adminAuth.response

  const { pedidoId } = await req.json().catch(() => ({}))
  const id = Number(pedidoId)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Falta el id del pedido.' }, { status: 400 })

  const r = await enviarCorreoGuia(id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === 'Pedido no encontrado.' ? 404 : 400 })
  return NextResponse.json({ ok: true })
}
