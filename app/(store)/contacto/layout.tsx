import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Contacto',
  ruta: '/contacto',
  descripcion: 'Escríbenos por WhatsApp, correo o formulario. Te atendemos de lunes a viernes, de 9:00 a 18:00 h.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
