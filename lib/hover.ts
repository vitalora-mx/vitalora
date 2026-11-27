import type { PointerEvent } from 'react'

// Efectos de hover solo con mouse (skill mobile-native).
// En celular el navegador simula un hover al tocar y lo deja "pegado" hasta
// tocar otra cosa (la tarjeta se queda levantada). Con onPointerEnter /
// onPointerLeave y pointerType se ignoran los toques y el lápiz; en
// computadora el efecto queda igual que con onMouseEnter / onMouseLeave.
//
// Uso:
//   onPointerEnter={soloMouse(e => { e.currentTarget.style.transform = '...' })}
//   onPointerLeave={soloMouse(e => { e.currentTarget.style.transform = '' })}
export function soloMouse<T extends Element>(fn: (e: PointerEvent<T>) => void) {
  return (e: PointerEvent<T>) => {
    if (e.pointerType === 'mouse') fn(e)
  }
}
