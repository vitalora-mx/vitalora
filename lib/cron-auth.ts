import { timingSafeEqual } from 'crypto'

// Verifica que la petición venga del cron de Vercel (Authorization: Bearer CRON_SECRET).
// Si CRON_SECRET no está configurado, se rechaza todo (antes "Bearer undefined" pasaba).
export function cronAutorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET
  if (!secreto) {
    console.error('CRON_SECRET no está configurado: cron rechazado.')
    return false
  }
  const recibido = Buffer.from(request.headers.get('authorization') ?? '')
  const esperado = Buffer.from(`Bearer ${secreto}`)
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado)
}
