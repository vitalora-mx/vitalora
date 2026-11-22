import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireCliente } from '@/lib/cliente-auth'

const supabaseAdmin = createServiceClient()

// Campos que el cliente puede editar (texto, con largo máximo).
// Nunca: id, primera_compra_usada, created_at.
const CAMPOS_TEXTO: Record<string, number> = {
  nombre: 100, apellido: 100, telefono: 30,
  envio_calle: 200, envio_numero: 30, envio_interior: 30, envio_colonia: 120,
  envio_ciudad: 120, envio_estado: 60, envio_cp: 10, envio_referencia: 300,
  rfc: 13, razon_social: 300, regimen_fiscal: 10, uso_cfdi: 10, email_facturacion: 200,
  factura_calle: 200, factura_numero: 30, factura_interior: 30, factura_colonia: 120,
  factura_ciudad: 120, factura_estado: 60, factura_cp: 10,
}
const CAMPOS_BOOLEANOS = ['factura_misma_direccion']

// GET — obtener perfil
export async function GET(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response

  const { data, error } = await supabaseAdmin
    .from('perfiles')
    .select('*')
    .eq('id', auth.cliente.id)
    .single()

  if (error) return NextResponse.json({ error: 'No se pudo cargar el perfil' }, { status: 500 })
  return NextResponse.json(data)
}

// PUT — actualizar perfil (solo campos permitidos; el resto se ignora)
export async function PUT(req: NextRequest) {
  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })

  const cambios: Record<string, string | boolean | null> = {}
  for (const [campo, max] of Object.entries(CAMPOS_TEXTO)) {
    if (!(campo in body)) continue
    const v = body[campo]
    if (v === null || v === '') cambios[campo] = v === null ? null : ''
    else if (typeof v === 'string') cambios[campo] = v.trim().slice(0, max)
    else return NextResponse.json({ error: `Campo no válido: ${campo}` }, { status: 400 })
  }
  for (const campo of CAMPOS_BOOLEANOS) {
    if (!(campo in body)) continue
    if (typeof body[campo] !== 'boolean') return NextResponse.json({ error: `Campo no válido: ${campo}` }, { status: 400 })
    cambios[campo] = body[campo]
  }
  if (typeof cambios.rfc === 'string') cambios.rfc = cambios.rfc.toUpperCase()

  if (Object.keys(cambios).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('perfiles')
    .update(cambios)
    .eq('id', auth.cliente.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'No se pudo guardar el perfil' }, { status: 500 })
  return NextResponse.json(data)
}
