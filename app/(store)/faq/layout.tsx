import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Preguntas frecuentes',
  ruta: '/faq',
  descripcion: 'Respuestas a las dudas más comunes sobre nuestros productos, envíos, pagos y devoluciones.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
