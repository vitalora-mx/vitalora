import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { listarOrigenes } from '@/lib/envio-origenes'

// GET /api/admin/envios/origenes — direcciones de origen activas (la predeterminada primero)
export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response
  try {
    const origenes = await listarOrigenes()
    return NextResponse.json(origenes.map(o => ({ id: o.id, alias: o.alias, cp: o.cp, municipio: o.municipio, predeterminado: o.predeterminado })))
  } catch (e) {
    console.error('Orígenes:', e)
    return NextResponse.json({ error: 'No se pudieron leer los orígenes.' }, { status: 500 })
  }
}
