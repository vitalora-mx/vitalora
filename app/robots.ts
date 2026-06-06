import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // No rastrear el panel admin ni las APIs
      disallow: ['/admin', '/api/'],
    },
    sitemap: 'https://vitalora.com.mx/sitemap.xml',
  }
}
