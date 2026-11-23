// ============================================================
// Respaldo en el NAVEGADOR para fotos muy pesadas (solo cliente).
// Vercel corta las peticiones de más de ~4.5 MB, así que si una foto pesa más
// de 4 MB se reduce aquí a 2400 px (JPG 90 %) antes de enviarla.
// La optimización real (WebP 1600 px + miniatura 600 px) la hace el servidor.
// Si el navegador no puede leer la foto (por ejemplo HEIC), se manda tal cual
// y el servidor responde con un mensaje claro.
// ============================================================

const LIMITE_BYTES = 4 * 1024 * 1024
const LADO_MAXIMO = 2400

export async function reducirSiEsMuyPesada(file: File): Promise<File> {
  if (file.size <= LIMITE_BYTES || typeof document === 'undefined') return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
    const ancho = Math.round(bitmap.width * escala)
    const alto = Math.round(bitmap.height * escala)
    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#ffffff' // JPG no tiene transparencia
    ctx.fillRect(0, 0, ancho, alto)
    ctx.drawImage(bitmap, 0, 0, ancho, alto)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.9))
    if (!blob) return file
    const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], nombre, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
