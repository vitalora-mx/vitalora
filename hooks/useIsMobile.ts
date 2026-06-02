'use client'

import { useState, useEffect } from 'react'

// Hook que detecta si la pantalla es de celular.
// Uso: const isMobile = useIsMobile()  -> true en pantallas <= 768px
// Tambien acepta un breakpoint custom: useIsMobile(1024)
export function useIsMobile(breakpoint: number = 768): boolean {
  // Inicializa leyendo el ancho real si ya estamos en el navegador.
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= breakpoint
    }
    return false
  })

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= breakpoint)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [breakpoint])

  return isMobile
}
