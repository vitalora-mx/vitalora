import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { construirProductSchema } from '@/lib/structured-data'
import ProductoCosmeticoCliente from './ProductoCosmeticoCliente'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Limpia Markdown y espacios sobrantes para meta descriptions
function limpiarTexto(txt: string): string {
  return (txt || '')
    .replace(/\*\*/g, '')
    .replace(/[*_#`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function recortar(txt: string, max: number): string {
  if (txt.length <= max) return txt
  const corte = txt.slice(0, max)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > max * 0.6 ? corte.slice(0, ultimoEspacio) : corte).trim()
}

async function obtenerProducto(slug: string) {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*), producto_videos(*), producto_variantes(*, variante_imagenes(*))')
    .eq('slug', slug)
    .eq('activo', true)
    .single()
  if (error || !data) return null
  return data
}

async function obtenerResenas(productoId: number) {
  const { data, error } = await supabase
    .from('resenas')
    .select('*')
    .eq('producto_id', productoId)
    .eq('estado', 'aprobada')
  if (error || !data || data.length === 0) return undefined
  const total = data.length
  const promedio = Math.round((data.reduce((s: number, r: any) => s + (r.estrellas || 0), 0) / total) * 10) / 10
  return {
    promedio,
    total,
    items: data.map((x: any) => ({
      autor: x.autor_nombre,
      estrellas: x.estrellas,
      titulo: x.titulo,
      comentario: x.comentario,
      fecha: x.created_at,
    })),
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const p = await obtenerProducto(slug)

  if (!p) {
    return {
      title: { absolute: 'Producto no encontrado | Vitalora' },
      robots: { index: false, follow: false },
    }
  }

  const nombreLimpio = limpiarTexto(p.nombre)
  const title = p.seo_title || `${recortar(nombreLimpio, 45)} | Vitalora`

  const base = limpiarTexto(p.descripcion) || nombreLimpio
  const description =
    p.seo_description ||
    `${recortar(base, 120)}. Envío a todo México. Compra en Vitalora.`

  const url = `https://vitalora.com.mx/cosmeticos/producto/${p.slug}`
  const imagenes = (p.producto_imagenes || [])
    .slice()
    .sort((a: any, b: any) => a.posicion - b.posicion)
    .map((i: any) => i.url)
    .filter(Boolean)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      locale: 'es_MX',
      siteName: 'Vitalora',
      title,
      description,
      url,
      images: imagenes.length > 0 ? imagenes.slice(0, 1) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imagenes.length > 0 ? imagenes.slice(0, 1) : undefined,
    },
    robots: { index: true, follow: true },
    other: {
      'og:type': 'product',
      'product:price:amount': String(p.precio),
      'product:price:currency': 'MXN',
      'product:availability': p.stock > 0 ? 'in stock' : 'out of stock',
    },
  }
}

export default async function ProductoCosmeticoPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const producto = await obtenerProducto(slug)

  if (!producto) notFound()

  const resenas = await obtenerResenas(producto.id)

  const schema = construirProductSchema({
    slug: producto.slug,
    nombre: limpiarTexto(producto.nombre),
    marca: producto.marca,
    descripcion: limpiarTexto(producto.descripcion),
    precio: producto.precio,
    stock: producto.stock,
    categoria: producto.categoria,
    sku: producto.sku,
    imagenes: producto.producto_imagenes || [],
    tipo: 'cosmetico',
    resenas,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ProductoCosmeticoCliente producto={producto} />
    </>
  )
}