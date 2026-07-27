import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('codigos_descuento')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Normaliza campos de envío/ciudad (Fase 1: códigos de envío)
  const descEnvio = body.descuento_envio || 'ninguno'
  const ciudadLimpia = body.ciudad_restringida && String(body.ciudad_restringida).trim() !== ''
    ? String(body.ciudad_restringida).trim()
    : null

  const { data, error } = await supabaseAdmin
    .from('codigos_descuento')
    .insert({
      codigo: body.codigo.toUpperCase().trim(),
      tipo: body.tipo,
      valor: body.valor,
      minimo_compra: body.minimo_compra || 0,
      max_usos: body.max_usos || null,
      fecha_inicio: body.fecha_inicio || new Date().toISOString(),
      fecha_fin: body.fecha_fin || null,
      activo: true,
      descuento_envio: descEnvio,
      envio_precio_fijo: descEnvio === 'fijo' ? (body.envio_precio_fijo || 0) : 0,
      ciudad_restringida: ciudadLimpia,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...campos } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('codigos_descuento').update(campos).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const { error } = await supabaseAdmin.from('codigos_descuento').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}