import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Normaliza texto de ciudad: minúsculas, sin acentos, sin espacios extra
function normalizarCiudad(txt: string): string {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  const { codigo, subtotal, email, ciudad } = await req.json()
  if (!codigo) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  const codigoLimpio = codigo.toUpperCase().trim()
  const emailLimpio = email ? email.toLowerCase().trim() : null
  const { data, error } = await supabaseAdmin
    .from('codigos_descuento')
    .select('*')
    .eq('codigo', codigoLimpio)
    .eq('activo', true)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Código no válido' }, { status: 400 })

  // Verificar usos totales (solo si tiene límite)
  if (data.max_usos && data.usos_actuales >= data.max_usos) {
    return NextResponse.json({ error: 'Este código ya alcanzó el límite de usos' }, { status: 400 })
  }

  // ─── Verificación de usos por email ───
  if (emailLimpio) {
    const { data: usos } = await supabaseAdmin
      .from('codigos_usados')
      .select('id')
      .eq('codigo', codigoLimpio)
      .eq('email', emailLimpio)
    const vecesUsado = usos?.length ?? 0
    if (data.es_influencer) {
      const limitePorEmail = data.max_usos_por_email ?? 3
      if (vecesUsado >= limitePorEmail) {
        return NextResponse.json({
          error: `Ya usaste este código el máximo de ${limitePorEmail} veces permitidas`
        }, { status: 400 })
      }
    } else {
      if (vecesUsado >= 1) {
        return NextResponse.json({ error: 'Ya utilizaste este código anteriormente' }, { status: 400 })
      }
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

  // Calcular descuento de producto
  let montoDescuento = 0
  if (data.tipo === 'porcentaje') {
    montoDescuento = Math.round(subtotal * (data.valor / 100))
  } else {
    montoDescuento = Math.min(data.valor, subtotal)
  }

  // ─── Info de envío (Fase 2) ───
  const descuentoEnvio = data.descuento_envio || 'ninguno'
  const ciudadRestringida = data.ciudad_restringida || null
  // ¿La ciudad del cliente coincide con la restringida? (si no hay restricción, siempre true)
  const ciudadCoincide = !ciudadRestringida
    ? true
    : normalizarCiudad(ciudad || '') === normalizarCiudad(ciudadRestringida)

  return NextResponse.json({
    valido: true,
    codigo: data.codigo,
    tipo: data.tipo,
    valor: data.valor,
    montoDescuento,
    esInfluencer: data.es_influencer ?? false,
    descripcion: data.tipo === 'porcentaje' ? `${data.valor}% de descuento` : `$${data.valor} de descuento`,
    // Campos de envío
    descuentoEnvio,                          // 'ninguno' | 'gratis' | 'fijo'
    envioPrecioFijo: data.envio_precio_fijo || 0,
    ciudadRestringida,                       // nombre de la ciudad o null
    ciudadCoincide,                          // true/false según la dirección del cliente
  })
}