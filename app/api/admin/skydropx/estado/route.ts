import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { diagnosticarSkydropx } from '@/lib/skydropx'

// ============================================================
// GET /api/admin/skydropx/estado — diagnóstico de la conexión con Skydropx.
// Solo admin. Prueba las llaves (token nuevo) y el saldo desde el servidor
// donde corre (producción, Preview o local). Nunca devuelve llaves ni token.
// ============================================================

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response

  const diagnostico = await diagnosticarSkydropx()
  return NextResponse.json(diagnostico, { headers: { 'Cache-Control': 'no-store' } })
}
