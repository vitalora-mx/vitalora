import { NextRequest, NextResponse } from 'next/server'
import { permitirIp } from '@/lib/limites'
import { articulosDeCarrito, revisarZonaEnvio } from '@/lib/cotizar-envio'

// ============================================================
// POST /api/envio/cotizar — el checkout pregunta si la dirección es zona extendida.
// Recibe la dirección y {productoId, cantidad}; peso y medidas salen de la base.
// Responde solo el resultado (nunca las tarifas de Skydropx):
//   ok (con cargo o sin él) · sin_cobertura · cp_invalido · sin_verificar
// El cobro real lo vuelve a calcular el servidor al pagar (lib/envio.ts),
// con la misma cotización guardada.
// ============================================================

const TIMEOUT_MS = 7000
const MAX_LINEAS = 50

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const d = body?.direccion || {}
  const destino = { cp: texto(d.cp, 5), colonia: texto(d.colonia, 200), ciudad: texto(d.ciudad, 100), estado: texto(d.estado, 100) }
  if (!/^\d{5}$/.test(destino.cp) || !destino.colonia || !destino.ciudad || !destino.estado) {
    return NextResponse.json({ error: 'Dirección incompleta.' }, { status: 400 })
  }

  const items: { productoId: number; cantidad: number }[] = []
  if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > MAX_LINEAS) {
    return NextResponse.json({ error: 'Carrito no válido.' }, { status: 400 })
  }
  for (const it of body.items) {
    const productoId = Number(it?.productoId)
    const cantidad = Number(it?.cantidad)
    if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      return NextResponse.json({ error: 'Carrito no válido.' }, { status: 400 })
    }
    items.push({ productoId, cantidad })
  }

  // Límite por IP: protege el límite de Skydropx (2 por segundo para toda la cuenta)
  if (!(await permitirIp(req, 'cotizar-envio', 30, 200))) {
    return NextResponse.json({ estado: 'sin_verificar', cargo: 0, zonaExtendida: false, limite: true })
  }

  try {
    const articulos = await articulosDeCarrito(items)
    const r = await revisarZonaEnvio({ destino, articulos, timeoutMs: TIMEOUT_MS })
    return NextResponse.json({ estado: r.estado, cargo: r.estado === 'ok' ? r.cargo : 0, zonaExtendida: r.estado === 'ok' && r.zonaExtendida })
  } catch (e) {
    console.error('Cotizar envío:', e)
    return NextResponse.json({ estado: 'sin_verificar', cargo: 0, zonaExtendida: false })
  }
}
