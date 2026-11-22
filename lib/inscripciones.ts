// Interruptor del registro de embajadoras. Cambiar a true para reabrir inscripciones.
export const INSCRIPCIONES_ABIERTAS = false

// Interruptor del programa completo de embajadoras.
// En false: /api/influencer/* y /influencer/portal responden 403 (ver proxy.ts)
// y el cron escalacion-influencers no hace nada.
// No afecta el webhook de Mercado Pago ni el admin de influencers.
//
// ANTES de cambiarlo a true: las rutas de /api/influencer/* identifican a la
// embajadora por el email que manda el navegador. Hay que pasarlas a
// requireCliente (lib/cliente-auth.ts) y usar el correo de la sesión.
export const PROGRAMA_EMBAJADORAS_ACTIVO = false

export const MENSAJE_PROGRAMA_SUSPENDIDO = 'Programa suspendido temporalmente'
