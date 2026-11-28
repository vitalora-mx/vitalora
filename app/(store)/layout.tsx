import CodigoDesdeEnlace from '@/components/store/CodigoDesdeEnlace'

// ?codigo=XXXX en cualquier página de la tienda guarda el código para el checkout
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <><CodigoDesdeEnlace />{children}</>;
}
