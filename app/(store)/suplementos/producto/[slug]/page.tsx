import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { construirProductSchema } from '@/lib/structured-data'
import ProductoSuplementoCliente from './ProductoSuplementoCliente'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      title: 'Producto no encontrado',
      robots: { index: false, follow: false },
    }
  }

  const title = p.seo_title || `${p.nombre} — ${p.marca} | Vitalora Suplementos México`
  const description =
    p.seo_description ||
    `${(p.descripcion || p.nombre).slice(0, 155)}. Envío a todo México. Compra en Vitalora.`
  const url = `https://vitalora.com.mx/suplementos/producto/${p.slug}`
  const imagenes = (p.producto_imagenes || [])
    .slice()
    .sort((a: any, b: any) => a.posicion - b.posicion)
    .map((i: any) => i.url)
    .filter(Boolean)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
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
  }
}

export default async function ProductoSuplementoPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const producto = await obtenerProducto(slug)

  if (!producto) notFound()

  const resenas = await obtenerResenas(producto.id)

  const schema = construirProductSchema({
    slug: producto.slug,
    nombre: producto.nombre,
    marca: producto.marca,
    descripcion: producto.descripcion,
    precio: producto.precio,
    stock: producto.stock,
    categoria: producto.categoria,
    sku: producto.sku,
    imagenes: producto.producto_imagenes || [],
    tipo: 'suplemento',
    resenas,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ProductoSuplementoCliente producto={producto} />
    </>
  )
}