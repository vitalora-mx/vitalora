import type { Metadata } from 'next'

// ============================================================
// Vista previa al compartir (og:image / twitter:image).
// - Imagen por defecto: public/images/compartir-vitalora.jpg (1200x630).
// - Productos: JPG generado al vuelo por app/og/producto/[archivo]/route.ts
//   a partir de su primera foto (las fotos del bucket son WebP y WhatsApp
//   no siempre las muestra).
// ============================================================

export const OG_ANCHO = 1200
export const OG_ALTO = 630

export const OG_IMAGEN_DEFECTO = {
  url: '/images/compartir-vitalora.jpg',
  width: OG_ANCHO,
  height: OG_ALTO,
  alt: 'Vitalora — Lo mejor del skincare coreano, 100% original',
}

// Imagen para compartir de un producto. `primeraFoto` es la URL de su primera
// foto (por posición); se usa su nombre de archivo como versión para que los
// cachés (CDN, WhatsApp, Facebook) pidan una imagen nueva si la foto cambia.
export function ogImagenProducto(slug: string, nombre: string, primeraFoto?: string) {
  if (!primeraFoto) return OG_IMAGEN_DEFECTO
  const archivo = primeraFoto.split('/').pop() || ''
  const version = archivo.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]/g, '')
  return {
    url: `/og/producto/${encodeURIComponent(slug)}.jpg${version ? `?v=${version}` : ''}`,
    width: OG_ANCHO,
    height: OG_ALTO,
    alt: nombre,
  }
}

// Metadatos de una página fija (nosotros, FAQ, políticas...). Si lleva
// descripción, se puede compartir con la imagen por defecto; `indexar: false`
// la deja fuera de los buscadores. Sin descripción = página privada o de
// proceso (carrito, cuenta...): solo título y noindex.
export function metadatosPagina(o: {
  titulo: string
  ruta: string
  descripcion?: string
  indexar?: boolean
}): Metadata {
  const indexar = o.indexar ?? true
  // Título completo (absolute): una página anidada en otra con layout propio
  // (p. ej. /recuperar/nueva) no hereda la plantilla "%s | Vitalora" del raíz.
  if (!o.descripcion) {
    return { title: { absolute: `${o.titulo} | Vitalora` }, robots: { index: false, follow: false } }
  }
  const url = `https://vitalora.com.mx${o.ruta}`
  return {
    title: { absolute: `${o.titulo} | Vitalora` },
    description: o.descripcion,
    ...(indexar ? { alternates: { canonical: url } } : {}),
    openGraph: {
      type: 'website',
      locale: 'es_MX',
      siteName: 'Vitalora',
      title: `${o.titulo} | Vitalora`,
      description: o.descripcion,
      url,
      images: [OG_IMAGEN_DEFECTO],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${o.titulo} | Vitalora`,
      description: o.descripcion,
      images: [OG_IMAGEN_DEFECTO],
    },
    robots: { index: indexar, follow: true },
  }
}
