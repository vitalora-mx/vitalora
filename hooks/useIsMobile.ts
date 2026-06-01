'use client'

import { useState, useEffect } from 'react'

// Hook que detecta si la pantalla es de celular.
// Uso: const isMobile = useIsMobile()  -> true en pantallas <= 768px
// Tambien acepta un breakpoint custom: useIsMobile(1024)
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= breakpoint)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
