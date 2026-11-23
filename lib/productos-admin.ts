// ============================================================
// Operaciones de productos e imágenes del admin (SOLO SERVIDOR).
// ============================================================
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rutasDeImagen } from '@/lib/optimizar-imagen'

export const MENSAJE_ARCHIVADO = 'Este producto está archivado. Restáuralo para poder editarlo.'

// Estado de archivo de un producto: null si no existe
export async function estadoProducto(id: number): Promise<{ archivado: boolean } | null> {
  const db = createServiceClient()
  const { data } = await db.from('productos').select('id, archivado').eq('id', id).maybeSingle()
  return data ? { archivado: data.archivado === true } : null
}

// Producto al que pertenece una variante (null si la variante no existe)
export async function productoDeVariante(varianteId: number): Promise<number | null> {
  if (!Number.isInteger(varianteId) || varianteId <= 0) return null
  const db = createServiceClient()
  const { data } = await db.from('producto_variantes').select('producto_id').eq('id', varianteId).maybeSingle()
  return data ? Number(data.producto_id) : null
}

// Para rutas del admin que modifican un producto: devuelve la respuesta de error
// si el producto no existe (404) o está archivado (409); null si se puede continuar.
export async function bloqueoPorArchivado(productoId: number | null): Promise<NextResponse | null> {
  if (productoId == null || !Number.isInteger(productoId) || productoId <= 0) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }
  const estado = await estadoProducto(productoId)
  if (!estado) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  if (estado.archivado) return NextResponse.json({ error: MENSAJE_ARCHIVADO }, { status: 409 })
  return null
}

// Borra UNA foto de producto: su archivo, su miniatura y su fila en producto_imagenes.
// Es lo que ejecuta el botón de quitar foto del admin (/api/admin/delete-image).
export async function borrarImagenProducto(imagenId: number): Promise<{ ok: true; rutas: string[] } | { ok: false; error: string }> {
  const db = createServiceClient()
  const { data: imagen } = await db.from('producto_imagenes').select('id, url, url_miniatura').eq('id', imagenId).maybeSingle()
  if (!imagen) return { ok: false, error: 'Imagen no encontrada' }

  const rutas = rutasDeImagen(imagen, 'productos')
  if (rutas.length) {
    const { error: errStorage } = await db.storage.from('productos').remove(rutas)
    if (errStorage) console.error('Error borrando archivos de imagen:', errStorage)
  }
  const { error } = await db.from('producto_imagenes').delete().eq('id', imagenId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, rutas }
}
