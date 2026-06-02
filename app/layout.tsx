import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Italiana } from 'next/font/google'
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
  title: 'Vitalora — K-Beauty & Bienestar Auténtico',
  description: 'Cosméticos coreanos auténticos y suplementos de alta pureza para México.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${italiana.variable}`}>
      <body>{children}</body>
    </html>
  )
}
