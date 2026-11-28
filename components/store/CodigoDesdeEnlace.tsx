'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { guardarCodigoEnlace, limpiarCodigoEnlace } from '@/lib/codigo-guardado'

// Lee ?codigo= de cualquier página de la tienda, lo guarda (lib/codigo-guardado.ts)
// y lo quita de la dirección para que no se quede en la barra ni se comparta por accidente.
// No muestra nada: el aviso aparece en el checkout cuando el código se aplica.
export default function CodigoDesdeEnlace() {
  const pathname = usePathname()

  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('codigo')) return
    const codigo = limpiarCodigoEnlace(url.searchParams.get('codigo'))
    if (codigo) guardarCodigoEnlace(codigo)
    url.searchParams.delete('codigo')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }, [pathname])

  return null
}
