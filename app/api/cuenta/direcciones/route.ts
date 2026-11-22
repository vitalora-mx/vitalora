import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireCliente } from '@/lib/cliente-auth'

const supabaseAdmin = createServiceClient()

// Campos que el cliente puede escribir. Nunca: id, user_id, created_at.
const CAMPOS_TEXTO: Record<string, number> = {
  nombre_etiqueta: 40, calle: 200, numero: 30, interior: 30, colonia: 120,
  ciudad: 120, estado: 60, cp: 10, referencia: 300,
}

type Resultado = { ok: true; campos: Record<string, string | boolean | null> } | { ok: false; error: string }

function limpiar(body: Record<string, unknown>): Resultado {
  const campos: Record<string, string | boolean | null> = {}
  for (const [campo, max] of Object.entries(CAMPOS_TEXTO)) {
    if (!(campo in body)) continue
    const v = body[campo]
    if (v === null) campos[campo] = null
    else if (typeof v === 'string') campos[campo] = v.trim().slice(0, max)
    else return { ok: false, error: `Campo no válido: ${campo}` }
  }
  if ('es_principal' in body) {
    if (typeof body.es_principal !== 'boolean') return { ok: false, error: 'Campo no válido: es_principal' }
    campos.es_principal = body.es_principal
  }
  return { ok: true, campos }
}

// GET — listar direcciones del usuario
export async function GET(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response

  const { data, error } = await supabaseAdmin
    .from('direcciones')
    .select('*')
    .eq('user_id', auth.cliente.id)
    .order('es_principal', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'No se pudieron cargar las direcciones' }, { status: 500 })
  return NextResponse.json(data)
}

// POST — crear dirección
export async function POST(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response
  const userId = auth.cliente.id

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  const r = limpiar(body)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  if (!r.campos.calle || !r.campos.numero || !r.campos.cp) {
    return NextResponse.json({ error: 'Calle, número y CP son obligatorios' }, { status: 400 })
  }

  // Si es principal, quitar principal de las demás
  if (r.campos.es_principal) {
    await supabaseAdmin.from('direcciones').update({ es_principal: false }).eq('user_id', userId)
  }

  const { data, error } = await supabaseAdmin
    .from('direcciones')
    .insert({ ...r.campos, user_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'No se pudo guardar la dirección' }, { status: 500 })
  return NextResponse.json(data)
}

// PUT — editar dirección
export async function PUT(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response
  const userId = auth.cliente.id

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const r = limpiar(body)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  if (Object.keys(r.campos).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  // Confirmar que la dirección es de este usuario antes de tocar las demás
  const { data: propia } = await supabaseAdmin
    .from('direcciones').select('id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (!propia) return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 })

  // Si se marca como principal, quitar principal de las demás
  if (r.campos.es_principal) {
    await supabaseAdmin.from('direcciones').update({ es_principal: false }).eq('user_id', userId)
  }

  const { data, error } = await supabaseAdmin
    .from('direcciones')
    .update(r.campos)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'No se pudo guardar la dirección' }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — borrar dirección
export async function DELETE(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('direcciones')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.cliente.id)

  if (error) return NextResponse.json({ error: 'No se pudo borrar la dirección' }, { status: 500 })
  return NextResponse.json({ success: true })
}
