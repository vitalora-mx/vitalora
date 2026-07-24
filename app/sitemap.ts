import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://vitalora.com.mx'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Paginas fijas del sitio
  const paginasFijas: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/cosmeticos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/suplementos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/ritual`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/ritual/videos`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/nosotros`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contacto`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/terminos`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/envios-devoluciones`, changeFrequency: 'monthly', priority: 0.4 },
  ]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Paginas de productos (leidas de Supabase)
  let paginasProductos: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabase
      .from('productos')
      .select('slug, tipo, categoria')
      .eq('activo', true)

    if (data) {
      paginasProductos = data.map((p) => {
        const ruta = p.tipo === 'suplemento' ? 'suplementos' : 'cosmeticos'
        return {
          url: `${BASE}/${ruta}/producto/${p.slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }
      })
    }
  } catch (e) {
    console.error('Error generando sitemap de productos:', e)
  }

  // Paginas de videos de Ritual
  let paginasVideos: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabase
      .from('ritual_videos')
      .select('slug, created_at')
      .eq('activo', true)

    if (data) {
      paginasVideos = data.map((v) => ({
        url: `${BASE}/ritual/${v.slug}`,
        lastModified: v.created_at ? new Date(v.created_at) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (e) {
    console.error('Error generando sitemap de videos:', e)
  }

  return [...paginasFijas, ...paginasProductos, ...paginasVideos]
}