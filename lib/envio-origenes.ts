// ============================================================
// Direcciones de origen de los envíos (SOLO SERVIDOR).
// Viven en la tabla envio_origenes para poder agregar o editar más adelante.
// La predeterminada (Zirándaro, 37749) es la que usa el checkout; el admin
// puede elegir otra al cotizar la guía.
// ============================================================
import { createServiceClient } from '@/lib/supabase/service'
import type { DireccionCotizacion } from '@/lib/skydropx'

export interface OrigenEnvio {
  id: number
  alias: string
  nombre: string
  empresa: string
  calle: string
  numero: string
  colonia: string
  municipio: string
  estado: string
  cp: string
  telefono: string
  email: string
  referencia: string | null
  predeterminado: boolean
  activo: boolean
}

const CAMPOS = 'id, alias, nombre, empresa, calle, numero, colonia, municipio, estado, cp, telefono, email, referencia, predeterminado, activo'

export async function listarOrigenes(): Promise<OrigenEnvio[]> {
  const { data, error } = await createServiceClient()
    .from('envio_origenes')
    .select(CAMPOS)
    .eq('activo', true)
    .order('predeterminado', { ascending: false })
    .order('id')
  if (error) throw new Error('No se pudieron leer los orígenes de envío: ' + error.message)
  return (data || []) as OrigenEnvio[]
}

// Sin id: la predeterminada. Con id: esa, si está activa.
export async function obtenerOrigen(id?: number | null): Promise<OrigenEnvio> {
  let consulta = createServiceClient().from('envio_origenes').select(CAMPOS).eq('activo', true)
  consulta = id ? consulta.eq('id', id) : consulta.eq('predeterminado', true)
  const { data, error } = await consulta.maybeSingle()
  if (error) throw new Error('No se pudo leer el origen de envío: ' + error.message)
  if (!data) throw new Error(id ? `El origen de envío ${id} no existe o está inactivo.` : 'No hay origen de envío predeterminado.')
  return data as OrigenEnvio
}

export function origenParaCotizar(o: OrigenEnvio): DireccionCotizacion {
  return { cp: o.cp, estado: o.estado, municipio: o.municipio, colonia: o.colonia }
}
