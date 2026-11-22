import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { permitirIp, permitirClave } from '@/lib/limites'

const supabaseAdmin = createServiceClient()

// Tipos permitidos y la extensión que se guarda (no se confía en el nombre del archivo)
const TIPOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
const MAX_BYTES = 5 * 1024 * 1024
const ESTADOS_CONFIRMADOS = ['pagado', 'preparando', 'enviado', 'entregado']

function mismoToken(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// El pedido solo se puede ver o tocar con su token de acceso (?t=...).
// Sin token guardado (pedidos anteriores a la Fase D) no hay acceso.
// Siempre el mismo 404 si no existe, no es de transferencia o el token no coincide.
async function pedidoConAcceso(idTexto: string | null, token: string | null) {
  const id = Number(idTexto)
  if (!Number.isInteger(id) || id <= 0) return null
  const { data: pedido } = await supabaseAdmin
    .from('pedidos')
    .select('id, estado, metodo_pago, total, nombre, limite_transferencia_at, comprobante_url, acceso_token')
    .eq('id', id)
    .maybeSingle()
  if (!pedido || pedido.metodo_pago !== 'transferencia') return null
  if (!pedido.acceso_token || !token || !mismoToken(pedido.acceso_token, token)) return null
  return pedido
}

const NO_ENCONTRADO = () => NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })

// GET: datos del pedido para la página de instrucciones
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pedido = await pedidoConAcceso(searchParams.get('id'), searchParams.get('t'))
    if (!pedido) return NO_ENCONTRADO()

    return NextResponse.json({
      pedido: {
        id: pedido.id,
        estado: pedido.estado,
        total: pedido.total,
        nombre: pedido.nombre,
        limite: pedido.limite_transferencia_at,
        tieneComprobante: !!pedido.comprobante_url,
      },
    })
  } catch (err) {
    console.error('Error al obtener pedido transferencia:', err)
    return NextResponse.json({ error: 'Error al cargar el pedido.' }, { status: 500 })
  }
}

// POST: subir el comprobante de pago
// Recibe FormData con: file, pedidoId, t (token de acceso)
export async function POST(req: NextRequest) {
  try {
    // Límite por IP: 10 subidas por hora, 30 al día
    if (!(await permitirIp(req, 'comprobante', 10, 30))) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const pedidoId = formData.get('pedidoId')
    const token = formData.get('t')

    if (!(file instanceof File) || typeof pedidoId !== 'string') {
      return NextResponse.json({ error: 'Falta el archivo o el pedido.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El archivo no debe superar 5MB.' }, { status: 400 })
    }
    const ext = TIPOS[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.' }, { status: 400 })
    }

    const pedido = await pedidoConAcceso(pedidoId, typeof token === 'string' ? token : null)
    if (!pedido) return NO_ENCONTRADO()

    if (pedido.estado === 'cancelado_sin_pago') {
      return NextResponse.json({ error: 'Este pedido fue cancelado porque venció el plazo de 2 horas.' }, { status: 400 })
    }
    if (ESTADOS_CONFIRMADOS.includes(pedido.estado)) {
      return NextResponse.json({ error: 'Este pedido ya fue confirmado.' }, { status: 400 })
    }
    // Estados que permiten subir/resubir: esperando_comprobante, comprobante_en_revision, comprobante_rechazado

    // Máximo 5 comprobantes por pedido
    if (!(await permitirClave(`comprobante-pedido:${pedido.id}`, 5, 5))) {
      return NextResponse.json({ error: 'Ya subiste varios comprobantes para este pedido. Escríbenos a hola@vitalora.com.mx' }, { status: 429 })
    }

    // Subir el archivo a Storage (bucket privado "comprobantes")
    const ruta = `pedido-${pedido.id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('comprobantes')
      .upload(ruta, await file.arrayBuffer(), { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Error al subir comprobante:', uploadError)
      return NextResponse.json({ error: 'Error al subir el comprobante.' }, { status: 500 })
    }

    // Guardar ruta del comprobante y cambiar estado (solo si sigue en un estado que lo permite)
    await supabaseAdmin
      .from('pedidos')
      .update({
        comprobante_url: ruta,
        comprobante_subido_at: new Date().toISOString(),
        estado: 'comprobante_en_revision',
      })
      .eq('id', pedido.id)
      .in('estado', ['esperando_comprobante', 'comprobante_en_revision', 'comprobante_rechazado'])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al subir comprobante:', err)
    return NextResponse.json({ error: 'Error al subir el comprobante.' }, { status: 500 })
  }
}
