// ============================================================
// Helpers de imágenes para la tienda (cliente y servidor).
// Las fotos nuevas tienen una miniatura de 600 px (lib/optimizar-imagen.ts).
// Las anteriores no tienen miniatura todavía: se usa la imagen de siempre.
// ============================================================

export interface ImagenConMiniatura { url: string; url_miniatura?: string | null }

// Miniatura de una imagen de producto o variante (o la imagen normal si no tiene)
export function miniatura(img: ImagenConMiniatura | null | undefined): string {
  if (!img) return ''
  return img.url_miniatura || img.url || ''
}

// Miniatura de una foto de reseña. Las fotos nuevas se guardan como
// .../resenas/{producto}/{usuario}/{ts}.webp con su miniatura {ts}-600.webp.
// Las anteriores (PNG/JPG) no tienen miniatura: se devuelve la misma URL.
const RE_FOTO_RESENA = /\/storage\/v1\/object\/public\/resenas\/\d+\/[^/]+\/\d+\.webp$/
export function miniaturaResena(url: string): string {
  if (!url || !RE_FOTO_RESENA.test(url)) return url
  return url.replace(/\.webp$/, '-600.webp')
}
