import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

// ============================================================
// Límites de uso por IP o por clave (tabla limites_envio + función registrar_envio).
// La IP y los correos se guardan con hash, nunca en claro.
// En Vercel, x-forwarded-for lo pone Vercel con la IP real del cliente.
// ============================================================

export function ipDe(req: Request): string {
  const reenviada = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return reenviada || req.headers.get('x-real-ip')?.trim() || 'desconocida'
}

export function hashClave(valor: string): string {
  return createHash('sha256').update('vitalora:' + valor).digest('hex')
}

// Registra un uso de `clave` y dice si se permite (true) o ya se pasó del límite (false).
// Si la base falla, se permite (para no tumbar la tienda) y se registra el error.
export async function permitirClave(clave: string, maxHora: number, maxDia: number): Promise<boolean> {
  const { data, error } = await createServiceClient().rpc('registrar_envio', {
    p_clave: clave,
    p_max_hora: maxHora,
    p_max_dia: maxDia,
  })
  if (error) {
    console.error(`Error revisando límite (${clave.split(':')[0]}):`, error)
    return true
  }
  return data === true
}

// Límite por IP para una acción (ej. 'lora', 'codigo', 'recuperar').
export function permitirIp(req: Request, accion: string, maxHora: number, maxDia: number): Promise<boolean> {
  return permitirClave(`${accion}:${hashClave(ipDe(req))}`, maxHora, maxDia)
}
