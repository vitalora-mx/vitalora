import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { codigo, subtotal, email } = await req.json()

  if (!codigo) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('codigos_descuento')
    .select('*')
    .eq('codigo', codigo.toUpperCase().trim())
    .eq('activo', true)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Código no válido' }, { status: 400 })

  // Verificar usos totales
  if (data.max_usos && data.usos_actuales >= data.max_usos) {
    return NextResponse.json({ error: 'Este código ya alcanzó el límite de usos' }, { status: 400 })
  }

  // Verificar si este email ya usó el código
  if (email) {
    const { data: usado } = await supabaseAdmin
      .from('codigos_usados')
      .select('id')
      .eq('codigo', codigo.toUpperCase().trim())
      .eq('email', email.toLowerCase().trim())
      .single()

    if (usado) {
      return NextResponse.json({ error: 'Ya utilizaste este código anteriormente' }, { status: 400 })
    }
  }

  // Verificar fechas
  const ahora = new Date()
  if (data.fecha_inicio && new Date(data.fecha_inicio) > ahora) {
    return NextResponse.json({ error: 'Este código aún no está activo' }, { status: 400 })
  }
  if (data.fecha_fin && new Date(data.fecha_fin) < ahora) {
    return NextResponse.json({ error: 'Este código ha expirado' }, { status: 400 })
  }

  // Verificar mínimo de compra
  if (data.minimo_compra && subtotal < data.minimo_compra) {
    return NextResponse.json({ error: `Compra mínima de $${data.minimo_compra.toLocaleString()} MXN para este código` }, { status: 400 })
  }

  // Calcular descuento
  let montoDescuento = 0
  if (data.tipo === 'porcentaje') {
    montoDescuento = Math.round(subtotal * (data.valor / 100))
  } else {
    montoDescuento = Math.min(data.valor, subtotal)
  }

  return NextResponse.json({
    valido: true,
    codigo: data.codigo,
    tipo: data.tipo,
    valor: data.valor,
    montoDescuento,
    descripcion: data.tipo === 'porcentaje' ? `${data.valor}% de descuento` : `$${data.valor} de descuento`,
  })
}
