import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import RitualVideoCliente from './RitualVideoCliente'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function limpiarTexto(txt: string): string {
  return (txt || '').replace(/\*\*/g, '').replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim()
}

function recortar(txt: string, max: number): string {
  if (txt.length <= max) return txt
  const corte = txt.slice(0, max)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > max * 0.6 ? corte.slice(0, ultimoEspacio) : corte).trim()
}

async function obtenerVideo(slug: string) {
  const { data: video, error } = await supabase
    .from('ritual_videos')
    .select('*, ritual_temas(nombre)')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (error || !video) return null

  const { data: relaciones } = await supabase
    .from('ritual_video_productos')
    .select('posicion, productos(*, producto_imagenes(*))')
    .eq('video_id', video.id)
    .order('posicion', { ascending: true })

  const productos = (relaciones || [])
    .map((r: { productos: unknown }) => r.productos)
    .filter(Boolean)

  return { ...video, productos }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const v = await obtenerVideo(slug)

  if (!v) {
    return {
      title: { absolute: 'Video no encontrado | Vitalora' },
      robots: { index: false, follow: false },
    }
  }

  const titulo = limpiarTexto(v.titulo)
  const title = `${recortar(titulo, 50)} | Ritual Vitalora`
  const base = limpiarTexto(v.descripcion) || titulo
  const description = `${recortar(base, 120)}. Aprende con Vitalora K-Beauty.`
  const url = `https://vitalora.com.mx/ritual/${v.slug}`
  const thumbnail = v.youtube_id
    ? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`
    : undefined

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'video.other',
      locale: 'es_MX',
      siteName: 'Vitalora',
      title,
      description,
      url,
      images: thumbnail ? [thumbnail] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: thumbnail ? [thumbnail] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

export default async function RitualVideoPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const video = await obtenerVideo(slug)

  if (!video) notFound()

  const thumbnail = video.youtube_id
    ? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`
    : undefined

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: limpiarTexto(video.titulo),
    description: limpiarTexto(video.descripcion) || limpiarTexto(video.titulo),
    thumbnailUrl: thumbnail ? [thumbnail] : undefined,
    embedUrl: video.youtube_id ? `https://www.youtube.com/embed/${video.youtube_id}` : undefined,
    uploadDate: video.created_at,
    publisher: { '@type': 'Organization', name: 'Vitalora' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <RitualVideoCliente video={video} />
    </>
  )
}