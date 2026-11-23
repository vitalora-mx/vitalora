// ============================================================
// Operaciones de productos e imágenes del admin (SOLO SERVIDOR).
// ============================================================
import { createServiceClient } from '@/lib/supabase/service'
import { rutasDeImagen } from '@/lib/optimizar-imagen'

export const MENSAJE_ARCHIVADO = 'Este producto está archivado. Restáuralo para poder editarlo.'

// Estado de archivo de un producto: null si no existe
export async function estadoProducto(id: number): Promise<{ archivado: boolean } | null> {
  const db = createServiceClient()
  const { data } = await db.from('productos').select('id, archivado').eq('id', id).maybeSingle()
  return data ? { archivado: data.archivado === true } : null
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
