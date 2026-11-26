import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { puedeCambiarA, ESTADOS_CON_GUIA, PAQUETERIAS } from '@/lib/estados-pedido'
import { candadoActivo } from '@/lib/reembolsos'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req, "/admin/pedidos")
  if (!adminAuth.ok) return adminAuth.response

  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .select('*, pedido_items(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT: solo estado (por el camino normal), número de guía y paquetería.
// Cancelado / Reembolsado / Reembolso parcial NO se ponen aquí: tienen sus propios botones.
export async function PUT(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/pedidos")
  if (!adminAuth.ok) return adminAuth.response

  const body = await req.json().catch(() => null)
  const id = Number(body?.id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data: actual } = await supabaseAdmin
    .from('pedidos')
    .select('id, estado, reembolso_en_curso_desde, skydropx_shipment_id, guia_en_curso_desde')
    .eq('id', id)
    .maybeSingle()
  if (!actual) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  const cambios: Record<string, string> = {}

  if (body.estado !== undefined) {
    if (typeof body.estado !== 'string' || !puedeCambiarA(actual.estado, body.estado)) {
      return NextResponse.json({ error: `No se puede pasar de "${actual.estado}" a "${body.estado}" a mano.` }, { status: 400 })
    }
    if (body.estado !== actual.estado) cambios.estado = body.estado
  }

  if (body.numero_guia !== undefined || body.paqueteria !== undefined) {
    if (!ESTADOS_CON_GUIA.includes(actual.estado)) {
      return NextResponse.json({ error: `No se puede registrar guía en un pedido "${actual.estado}".` }, { status: 400 })
    }
    if (candadoActivo(actual)) {
      return NextResponse.json({ error: 'Hay un reembolso o cancelación en proceso para este pedido. Espera un momento.' }, { status: 409 })
    }
    // La guía de Skydropx se maneja desde su tarjeta (cancelarla primero para registrar una manual)
    if (actual.skydropx_shipment_id || (actual.guia_en_curso_desde && Date.now() - Date.parse(actual.guia_en_curso_desde) < 3 * 60 * 1000)) {
      return NextResponse.json({ error: 'Este pedido tiene una guía de Skydropx. Para registrar una manual, primero cancela la de Skydropx.' }, { status: 409 })
    }
    const guia = typeof body.numero_guia === 'string' ? body.numero_guia.trim() : ''
    if (!guia || guia.length > 60) return NextResponse.json({ error: 'Número de guía no válido.' }, { status: 400 })
    if (!PAQUETERIAS.includes(body.paqueteria)) return NextResponse.json({ error: 'Paquetería no válida.' }, { status: 400 })
    cambios.numero_guia = guia
    cambios.paqueteria = body.paqueteria
  }

  if (Object.keys(cambios).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  // Solo si el estado no cambió mientras tanto
  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .update(cambios)
    .eq('id', id)
    .eq('estado', actual.estado)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Error actualizando pedido:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el pedido' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'El pedido cambió mientras tanto. Recarga la página.' }, { status: 409 })
  return NextResponse.json(data)
}
