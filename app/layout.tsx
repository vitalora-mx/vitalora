import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Italiana } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

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
    'Cosméticos coreanos auténticos y suplementos de alta pureza para México. Envío nacional, productos originales importados de Corea.',
  keywords: [
    'cosméticos coreanos',
    'k-beauty México',
    'skincare coreano',
    'suplementos',
    'cuidado de la piel',
    'productos coreanos originales',
  ],
  authors: [{ name: 'Vitalora' }],
  creator: 'Vitalora',
  publisher: 'Vitalora',

  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://vitalora.com.mx',
    siteName: 'Vitalora',
    title: 'Vitalora — K-Beauty & Bienestar Auténtico',
    description:
      'Cosméticos coreanos auténticos y suplementos de alta pureza para México.',
    images: [
      {
        url: '/images/logo/logo-footer.png',
        width: 1200,
        height: 630,
        alt: 'Vitalora',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vitalora — K-Beauty & Bienestar Auténtico',
    description:
      'Cosméticos coreanos auténticos y suplementos de alta pureza para México.',
    images: ['/images/logo/logo-footer.png'],
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