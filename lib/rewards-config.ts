// ============================================================
// Vitalora Rewards — interruptor y textos compartidos.
// Sin nada secreto: lo pueden importar el navegador (footer, Mi cuenta),
// proxy.ts y el servidor. La lógica con la base está en lib/rewards.ts.
// ============================================================

// Interruptor del programa. Lo ÚNICO que enciende Rewards en producción.
export const REWARDS_ACTIVO = false

// Para probar en localhost sin encenderlo: NEXT_PUBLIC_REWARDS_PRUEBA=1 en .env.local
// y `npm run dev`. En `next build` / Vercel NODE_ENV es 'production', así que la
// variable no tiene efecto ahí aunque alguien la ponga.
export const REWARDS_VISIBLE =
  REWARDS_ACTIVO ||
  (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_REWARDS_PRUEBA === '1')

export const SITIO_REWARDS = 'https://vitalora.com.mx'

// Mensaje para compartir el código (WhatsApp y menú de compartir del celular).
// Parte 3: cambiar el enlace por `${SITIO_REWARDS}/?codigo=${codigo}` cuando exista.
export function mensajeCompartir(codigo: string): string {
  return `Usa mi código ${codigo} en ${SITIO_REWARDS.replace('https://', '')} y obtén 5% de descuento en cosméticos coreanos ✨`
}
