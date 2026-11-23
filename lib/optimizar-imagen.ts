// ============================================================
// Optimización de imágenes al subirlas (SOLO SERVIDOR).
// Cada foto se guarda en dos versiones WebP:
//  - principal: máximo 1600 px por lado (calidad 80)
//  - miniatura: máximo 600 px por lado (calidad 75), para listas, carrito, etc.
// Corrige la rotación de las fotos de celular, no agranda las chicas y quita
// los metadatos (EXIF, incluida la ubicación GPS).
// ============================================================
import sharp from 'sharp'

export const LADO_PRINCIPAL = 1600
export const LADO_MINIATURA = 600
export const CALIDAD_PRINCIPAL = 80
export const CALIDAD_MINIATURA = 75
export const SUFIJO_MINIATURA = '-600'

// Formatos de entrada aceptados (HEIC/HEIF no: sharp no los lee)
const FORMATOS_ACEPTADOS = new Set(['jpeg', 'png', 'webp'])

export type ResultadoOptimizacion =
  | { ok: true; principal: Buffer; miniatura: Buffer; ancho: number; alto: number }
  | { ok: false; error: string }

export async function optimizarImagen(entrada: ArrayBuffer | Buffer | Uint8Array): Promise<ResultadoOptimizacion> {
  const buffer = Buffer.isBuffer(entrada) ? entrada : Buffer.from(entrada as ArrayBuffer)
  let formato: string | undefined
  try {
    // limitInputPixels evita imágenes gigantes que agoten la memoria (≈ 50 MP)
    const meta = await sharp(buffer, { limitInputPixels: 50_000_000 }).metadata()
    formato = meta.format
  } catch {
    return { ok: false, error: 'El archivo no es una imagen válida.' }
  }
  if (!formato || !FORMATOS_ACEPTADOS.has(formato)) {
    return { ok: false, error: 'Formato no soportado. Sube una imagen JPG, PNG o WebP.' }
  }

  try {
    const base = () => sharp(buffer, { limitInputPixels: 50_000_000 }).rotate()
    const { data: principal, info } = await base()
      .resize({ width: LADO_PRINCIPAL, height: LADO_PRINCIPAL, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: CALIDAD_PRINCIPAL })
      .toBuffer({ resolveWithObject: true })
    const miniatura = await base()
      .resize({ width: LADO_MINIATURA, height: LADO_MINIATURA, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: CALIDAD_MINIATURA })
      .toBuffer()
    return { ok: true, principal, miniatura, ancho: info.width, alto: info.height }
  } catch (e) {
    console.error('Error optimizando imagen:', e)
    return { ok: false, error: 'No se pudo procesar la imagen. Intenta con otra foto.' }
  }
}

// Ruta dentro del bucket a partir de la URL pública (o null si no es del bucket)
export function rutaEnBucket(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null
  const marca = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marca)
  if (i < 0) return null
  const ruta = url.slice(i + marca.length).split('?')[0]
  return ruta ? decodeURIComponent(ruta) : null
}

// Rutas a borrar de una imagen (principal + miniatura si existe)
export function rutasDeImagen(img: { url?: string | null; url_miniatura?: string | null }, bucket: string): string[] {
  return [rutaEnBucket(img.url, bucket), rutaEnBucket(img.url_miniatura, bucket)].filter((r): r is string => !!r)
}
