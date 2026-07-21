// lib/structured-data.ts
// Genera datos estructurados Schema.org Product (JSON-LD) para Google.

interface ProductoSchema {
  slug: string
  nombre: string
  marca: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  sku?: string | null
  imagenes: { url: string }[]
  tipo: 'cosmetico' | 'suplemento'
  resenas?: {
    promedio: number
    total: number
    items?: { autor: string; estrellas: number; titulo?: string | null; comentario?: string | null; fecha: string }[]
  }
}

// NUEVA: construye el objeto para renderizar en el HTML del servidor
export function construirProductSchema(p: ProductoSchema): Record<string, unknown> {
  const baseUrl = 'https://vitalora.com.mx'
  const ruta = p.tipo === 'cosmetico' ? 'cosmeticos' : 'suplementos'
  const urlProducto = `${baseUrl}/${ruta}/producto/${p.slug}`
  const imagenes = (p.imagenes || []).map(img => img.url).filter(Boolean)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    description: p.descripcion || p.nombre,
    sku: p.sku || undefined,
    brand: { '@type': 'Brand', name: p.marca },
    category: p.categoria,
    url: urlProducto,
    offers: {
      '@type': 'Offer',
      url: urlProducto,
      priceCurrency: 'MXN',
      price: p.precio,
      availability: p.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Vitalora' },
    },
  }

  if (imagenes.length > 0) schema.image = imagenes

  if (p.resenas && p.resenas.total > 0 && p.resenas.promedio > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.resenas.promedio,
      reviewCount: p.resenas.total,
      bestRating: 5,
      worstRating: 1,
    }
    if (p.resenas.items && p.resenas.items.length > 0) {
      schema.review = p.resenas.items.slice(0, 10).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.autor },
        reviewRating: { '@type': 'Rating', ratingValue: r.estrellas, bestRating: 5, worstRating: 1 },
        name: r.titulo || undefined,
        reviewBody: r.comentario || undefined,
        datePublished: r.fecha,
      }))
    }
  }

  return schema
}

// ANTIGUA: se mantiene por compatibilidad (inyección por DOM)
export function inyectarProductSchema(p: ProductoSchema) {
  const previo = document.getElementById('producto-schema')
  if (previo) previo.remove()
  const script = document.createElement('script')
  script.id = 'producto-schema'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(construirProductSchema(p))
  document.head.appendChild(script)
}