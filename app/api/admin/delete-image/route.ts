import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { borrarImagenProducto, estadoProducto, MENSAJE_ARCHIVADO } from '@/lib/productos-admin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// DELETE ?id=123 -> borra una foto de producto (archivo, miniatura y fila)
export async function DELETE(req: NextRequest) {
  const adminAuth = await requireAdmin(req, "/admin/productos")
  if (!adminAuth.ok) return adminAuth.response

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '')
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  // Las fotos de un producto archivado son historial: no se tocan
  const { data: img } = await supabaseAdmin.from('producto_imagenes').select('producto_id').eq('id', id).maybeSingle()
  if (!img) return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
  const estado = await estadoProducto(Number(img.producto_id))
  if (estado?.archivado) return NextResponse.json({ error: MENSAJE_ARCHIVADO }, { status: 409 })

  const r = await borrarImagenProducto(id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 })
  return NextResponse.json({ success: true })
}
