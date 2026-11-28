import { NextRequest, NextResponse } from 'next/server'
import { requireCliente } from '@/lib/cliente-auth'
import { REWARDS_VISIBLE, miembroPorUsuario, saldoDe, historialDe } from '@/lib/rewards'

// GET — Monedero Rewards del cliente de la sesión.
// { miembro: null } si no está inscrito; si lo está: código, estado, saldo e historial.
// ?antesDe=<id> pide la siguiente página del historial (solo movimientos).
export async function GET(req: NextRequest) {
  if (!REWARDS_VISIBLE) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response

  try {
    const miembro = await miembroPorUsuario(auth.cliente.id)
    if (!miembro) return NextResponse.json({ miembro: null })

    const antesDe = Number(req.nextUrl.searchParams.get('antesDe')) || null
    const historial = await historialDe(miembro.id, auth.cliente.id, { antesDe })
    if (antesDe) return NextResponse.json(historial)

    const saldo = await saldoDe(miembro.id)
    return NextResponse.json({
      miembro: { codigo: miembro.codigo, estado: miembro.estado },
      saldo,
      ...historial,
    })
  } catch (e) {
    console.error('Error cargando Monedero Rewards:', e)
    return NextResponse.json({ error: 'No pudimos cargar tu Monedero. Intenta de nuevo.' }, { status: 500 })
  }
}
