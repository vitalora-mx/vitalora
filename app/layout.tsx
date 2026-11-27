import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Italiana } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { SUPLEMENTOS_ACTIVO } from '@/lib/tienda'
import { OG_IMAGEN_DEFECTO } from '@/lib/compartir'

// Textos que cambian según el interruptor de suplementos (lib/tienda.ts)
const DESCRIPCION_SITIO = SUPLEMENTOS_ACTIVO
  ? 'Cosméticos coreanos auténticos y suplementos de alta pureza para México. Envío nacional, productos originales importados de Corea.'
  : 'Cosméticos coreanos auténticos para México. Envío nacional, productos originales importados de Corea.'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const italiana = Italiana({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-italiana',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://vitalora.com.mx'),
  title: {
    default: 'Vitalora — K-Beauty & Bienestar Auténtico',
    template: '%s | Vitalora',
  },
  description:
    DESCRIPCION_SITIO,
  keywords: [
    'cosméticos coreanos',
    'k-beauty México',
    'skincare coreano',
    ...(SUPLEMENTOS_ACTIVO ? ['suplementos'] : []),
    'cuidado de la piel',
    'productos coreanos originales',
  ],
  authors: [{ name: 'Vitalora' }],
  creator: 'Vitalora',
  publisher: 'Vitalora',

  // Base para todas las páginas. Sin url/title/description a propósito: las
  // páginas que no definen los suyos no deben verse como la de inicio al
  // compartirse (las redes usan entonces el <title> y la description de la página).
  // Ojo: una página que define su propio openGraph reemplaza este completo,
  // así que debe incluir images (OG_IMAGEN_DEFECTO o la suya).
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Vitalora',
    images: [OG_IMAGEN_DEFECTO],
  },
  twitter: {
    card: 'summary_large_image',
    images: [OG_IMAGEN_DEFECTO],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // color de la barra del navegador en el celular (crema de la marca, --bg-cream)
  themeColor: '#F5F0E8',
}

const GA_ID = 'G-74CFHNZRBB'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${italiana.variable}`}>
      <body>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  )
}