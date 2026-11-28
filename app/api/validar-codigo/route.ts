import { NextRequest, NextResponse } from 'next/server'
import { validarCodigo } from '@/lib/descuentos'
import { ciudadCoincide } from '@/lib/envio'
import { permitirIp } from '@/lib/limites'

export async function POST(req: NextRequest) {
  const { codigo, subtotal, email, ciudad } = await req.json().catch(() => ({}))
  if (!codigo || typeof codigo !== 'string') return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  // Límite por IP para que no se puedan probar códigos a lo loco: 20 por hora, 60 al día
  if (!(await permitirIp(req, 'codigo', 20, 60))) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' }, { status: 429 })
  }

  const resultado = await validarCodigo({ codigo, subtotal, email })
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: 400 })
  const d = resultado.datos

  return NextResponse.json({
    valido: true,
    codigo: d.codigo,
    tipo: d.tipo,
    valor: d.valor,
    montoDescuento: d.montoDescuento,
    esInfluencer: d.esInfluencer,
    esRewards: d.rewardsMiembroId !== null, // nunca se manda el id del miembro
    descripcion: d.descripcion,
    // Campos de envío
    descuentoEnvio: d.descuentoEnvio,          // 'ninguno' | 'gratis' | 'fijo'
    envioPrecioFijo: d.envioPrecioFijo,
    ciudadRestringida: d.ciudadRestringida,    // nombre de la ciudad o null
    ciudadCoincide: ciudadCoincide(ciudad || '', d.ciudadRestringida),
  })
}
