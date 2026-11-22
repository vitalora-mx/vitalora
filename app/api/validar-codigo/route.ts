import { NextRequest, NextResponse } from 'next/server'
import { validarCodigo } from '@/lib/descuentos'
import { ciudadCoincide } from '@/lib/envio'

export async function POST(req: NextRequest) {
  const { codigo, subtotal, email, ciudad } = await req.json()
  if (!codigo) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

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
    descripcion: d.descripcion,
    // Campos de envío
    descuentoEnvio: d.descuentoEnvio,          // 'ninguno' | 'gratis' | 'fijo'
    envioPrecioFijo: d.envioPrecioFijo,
    ciudadRestringida: d.ciudadRestringida,    // nombre de la ciudad o null
    ciudadCoincide: ciudadCoincide(ciudad || '', d.ciudadRestringida),
  })
}
