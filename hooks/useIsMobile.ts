'use client'

import { useCallback, useSyncExternalStore } from 'react'

// Hook que detecta si la pantalla es de celular.
// Uso: const isMobile = useIsMobile()  -> true en pantallas <= 768px
// Tambien acepta un breakpoint custom: useIsMobile(1024)
//
// Usa useSyncExternalStore para que React haga un segundo render con el ancho
// real después de hidratar. Antes se leía window.innerWidth en el estado
// inicial: al abrir una página directo, el HTML del servidor (escritorio) no
// coincidía con el cliente, React no corregía los estilos y el celular se
// quedaba con el diseño de escritorio. Al navegar dentro del sitio usa el
// ancho real desde el primer render, sin parpadeo.
export function useIsMobile(breakpoint: number = 768): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('resize', onChange)
    window.addEventListener('orientationchange', onChange)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('orientationchange', onChange)
    }
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth <= breakpoint,
    () => false,
  )
}
