import { metadatosPagina } from '@/lib/compartir'

// Metadatos de la página (page.tsx es componente de cliente y no puede declararlos)
export const metadata = metadatosPagina({
  titulo: 'Solicita tu factura',
  ruta: '/facturacion',
  descripcion: 'Solicita la factura de tu compra en Vitalora; te enviamos el PDF y el XML por correo.',
  indexar: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
