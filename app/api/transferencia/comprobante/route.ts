import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: obtener datos del pedido de transferencia (para la página de instrucciones)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const email = searchParams.get('email')

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del pedido.' }, { status: 400 })
    }

    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('id, estado, metodo_pago, total, email, nombre, limite_transferencia_at, comprobante_url')
      .eq('id', parseInt(id))
      .maybeSingle()

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    // Verificación ligera: si pasan email, debe coincidir (privacidad básica)
    if (email && pedido.email && pedido.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    if (pedido.metodo_pago !== 'transferencia') {
      return NextResponse.json({ error: 'Este pedido no es por transferencia.' }, { status: 400 })
    }

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
// Recibe FormData con: file, pedidoId
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const pedidoId = formData.get('pedidoId') as string | null

    if (!file || !pedidoId) {
      return NextResponse.json({ error: 'Falta el archivo o el pedido.' }, { status: 400 })
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no debe superar 5MB.' }, { status: 400 })
    }

    // Validar tipo (imágenes o PDF)
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!tiposPermitidos.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.' }, { status: 400 })
    }

    // Verificar que el pedido existe y está esperando comprobante
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('id, estado, metodo_pago, limite_transferencia_at')
      .eq('id', parseInt(pedidoId))
      .maybeSingle()

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
    }

    if (pedido.metodo_pago !== 'transferencia') {
      return NextResponse.json({ error: 'Este pedido no es por transferencia.' }, { status: 400 })
    }

    if (pedido.estado === 'cancelado_sin_pago') {
      return NextResponse.json({ error: 'Este pedido fue cancelado porque venció el plazo de 2 horas.' }, { status: 400 })
    }

    // Si el pedido ya está pagado, no permitir resubir
    if (pedido.estado === 'pagado' || pedido.estado === 'preparando' || pedido.estado === 'enviado' || pedido.estado === 'entregado') {
      return NextResponse.json({ error: 'Este pedido ya fue confirmado.' }, { status: 400 })
    }
    // Estados que permiten subir/resubir: esperando_comprobante, comprobante_en_revision, comprobante_rechazado

    // Subir el archivo a Storage (bucket privado "comprobantes")
    const ext = file.name.split('.').pop() || 'jpg'
    const ruta = `pedido-${pedidoId}-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from('comprobantes')
      .upload(ruta, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Error al subir comprobante:', uploadError)
      return NextResponse.json({ error: 'Error al subir el comprobante.' }, { status: 500 })
    }

    // Actualizar el pedido: guardar ruta del comprobante y cambiar estado
    await supabaseAdmin
      .from('pedidos')
      .update({
        comprobante_url: ruta,
        comprobante_subido_at: new Date().toISOString(),
        estado: 'comprobante_en_revision',
      })
      .eq('id', parseInt(pedidoId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al subir comprobante:', err)
    return NextResponse.json({ error: 'Error al subir el comprobante.' }, { status: 500 })
  }
}
