// lib/structured-data.ts
// Genera datos estructurados Schema.org Product (JSON-LD) para Google.
// Se inyecta en las paginas de producto para que Google muestre
// nombre, precio, disponibilidad, marca e imagen en los resultados.

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
}

export function inyectarProductSchema(p: ProductoSchema) {
  // Quitar cualquier schema previo (al cambiar de producto)
  const previo = document.getElementById('producto-schema')
  if (previo) previo.remove()

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
    brand: {
      '@type': 'Brand',
      name: p.marca,
    },
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
      seller: {
        '@type': 'Organization',
        name: 'Vitalora',
      },
    },
  }

  if (imagenes.length > 0) {
    schema.image = imagenes
  }

  const script = document.createElement('script')
  script.id = 'producto-schema'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema)
  document.head.appendChild(script)
}
