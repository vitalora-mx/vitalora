import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Envíos y devoluciones',
  ruta: '/envios-devoluciones',
  descripcion: 'Envíos a todo México en 3 a 7 días hábiles. Devoluciones dentro de 30 días en productos sin abrir. Consulta la política completa.',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
