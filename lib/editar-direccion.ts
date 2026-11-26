// ============================================================
// Editar la dirección de envío de un pedido desde el admin (SOLO SERVIDOR).
// Solo mientras NO haya guía (ni de Skydropx, ni manual, ni una en proceso).
// Incluye nombre y teléfono de quien recibe (se imprimen en la guía).
// Revisa la zona de la nueva dirección con la misma regla del checkout, deja
// historial y avisa al cliente por correo. El cobro del pedido no cambia.
// ============================================================
import { createServiceClient } from '@/lib/supabase/service'
import { revisarZonaEnvio, articulosDeCarrito } from '@/lib/cotizar-envio'
import { candadoActivo } from '@/lib/reembolsos'
import { enviarCorreoCambioDireccion } from '@/lib/correo-direccion'

export const ESTADOS_EDITAR_DIRECCION = [
  'pendiente', 'esperando_comprobante', 'comprobante_en_revision', 'comprobante_rechazado',
  'revision_monto', 'pagado', 'preparando',
]
const CANDADO_GUIA_MS = 3 * 60 * 1000

export interface DatosDireccion {
  nombre: string; apellido: string; telefono: string
  calle: string; numero: string; interior: string; colonia: string
  ciudad: string; estado: string; cp: string; referencia: string
}

export type AvisoZona = 'cobrar' | 'devolver' | 'sin_verificar' | null

export interface CambioDireccion {
  fecha: string
  por: string
  antes: DatosDireccion
  despues: DatosDireccion
  zona: { estado: string; extendida: boolean; aviso: AvisoZona }
}

const texto = (v: unknown, max = 200) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')

export function limpiarDatos(b: any): DatosDireccion {
  return {
    nombre: texto(b?.nombre, 100), apellido: texto(b?.apellido, 100), telefono: texto(b?.telefono, 30),
    calle: texto(b?.calle), numero: texto(b?.numero, 30), interior: texto(b?.interior, 30),
    colonia: texto(b?.colonia), ciudad: texto(b?.ciudad, 100), estado: texto(b?.estado, 100),
    cp: texto(b?.cp, 5), referencia: texto(b?.referencia, 300),
  }
}

// Las mismas reglas que el checkout (lib/checkout.ts)
function validar(d: DatosDireccion): string | null {
  if (!d.nombre || !d.apellido || !d.telefono) return 'Escribe nombre, apellido y teléfono de quien recibe.'
  if (!d.calle || !d.numero || !d.colonia || !d.ciudad || !d.estado) return 'Completa calle, número, colonia, ciudad y estado.'
  if (!/^\d{5}$/.test(d.cp)) return 'El código postal debe tener 5 dígitos.'
  return null
}

function datosDelPedido(p: any): DatosDireccion {
  return {
    nombre: p.nombre || '', apellido: p.apellido || '', telefono: p.telefono || '',
    calle: p.calle || '', numero: p.numero || '', interior: p.interior || '', colonia: p.colonia || '',
    ciudad: p.ciudad || '', estado: p.estado_dir || '', cp: p.cp || '', referencia: p.referencia || '',
  }
}

type Resultado = { ok: true; aviso: AvisoZona; correo: boolean; sinCambios?: boolean } | { ok: false; status: number; error: string }

export async function editarDireccion(pedidoId: number, cuerpo: unknown, adminEmail: string): Promise<Resultado> {
  const db = createServiceClient()
  const nuevos = limpiarDatos(cuerpo)
  const error = validar(nuevos)
  if (error) return { ok: false, status: 400, error }

  const { data: p } = await db.from('pedidos')
    .select('id, estado, email, nombre, apellido, telefono, calle, numero, interior, colonia, ciudad, estado_dir, cp, referencia, numero_guia, skydropx_shipment_id, guia_en_curso_desde, reembolso_en_curso_desde, cargo_zona_extendida, direccion_anterior, pedido_items ( producto_id, cantidad )')
    .eq('id', pedidoId).maybeSingle()
  if (!p) return { ok: false, status: 404, error: 'Pedido no encontrado.' }
  if (!ESTADOS_EDITAR_DIRECCION.includes(p.estado)) return { ok: false, status: 400, error: `No se puede editar la dirección de un pedido "${p.estado}".` }
  if (p.numero_guia || p.skydropx_shipment_id) return { ok: false, status: 400, error: 'El pedido ya tiene guía. Para cambiar la dirección, primero cancela la guía.' }
  if (p.guia_en_curso_desde && Date.now() - Date.parse(p.guia_en_curso_desde) < CANDADO_GUIA_MS) return { ok: false, status: 409, error: 'Se está generando una guía para este pedido. Espera un momento.' }
  if (candadoActivo(p)) return { ok: false, status: 409, error: 'Hay un reembolso o cancelación en proceso para este pedido.' }

  const antes = datosDelPedido(p)
  if (JSON.stringify(antes) === JSON.stringify(nuevos)) return { ok: true, aviso: null, correo: false, sinCambios: true }

  // Zona de la nueva dirección (misma regla que el checkout)
  const items = (p.pedido_items || []).filter((i: any) => i.producto_id).map((i: any) => ({ productoId: Number(i.producto_id), cantidad: Number(i.cantidad) }))
  const zona = await revisarZonaEnvio({
    destino: { cp: nuevos.cp, colonia: nuevos.colonia, ciudad: nuevos.ciudad, estado: nuevos.estado },
    articulos: await articulosDeCarrito(items),
    timeoutMs: 8000,
  })
  if (zona.estado === 'cp_invalido') return { ok: false, status: 400, error: `No encontramos el código postal ${nuevos.cp}. Revisa la dirección.` }
  if (zona.estado === 'sin_cobertura') return { ok: false, status: 400, error: 'Ninguna paquetería tiene cobertura para esa dirección. No se guardó el cambio.' }
  const pagoCargo = Number(p.cargo_zona_extendida || 0) > 0
  let aviso: AvisoZona = null
  if (zona.estado === 'sin_verificar') aviso = 'sin_verificar'
  else if (zona.zonaExtendida && !pagoCargo) aviso = 'cobrar'
  else if (!zona.zonaExtendida && pagoCargo) aviso = 'devolver'

  const cambio: CambioDireccion = {
    fecha: new Date().toISOString(), por: adminEmail, antes, despues: nuevos,
    zona: { estado: zona.estado, extendida: zona.zonaExtendida, aviso },
  }
  const historial = Array.isArray(p.direccion_anterior) ? p.direccion_anterior : []

  // Solo si sigue sin guía, sin guía en proceso y en un estado permitido
  const { data: hecho, error: errUpd } = await db.from('pedidos').update({
    nombre: nuevos.nombre, apellido: nuevos.apellido, telefono: nuevos.telefono,
    calle: nuevos.calle, numero: nuevos.numero, interior: nuevos.interior || null, colonia: nuevos.colonia,
    ciudad: nuevos.ciudad, estado_dir: nuevos.estado, cp: nuevos.cp, referencia: nuevos.referencia || null,
    direccion_editada_at: cambio.fecha, direccion_editada_por: adminEmail,
    direccion_anterior: [...historial, cambio],
  })
    .eq('id', p.id)
    .in('estado', ESTADOS_EDITAR_DIRECCION)
    .is('numero_guia', null)
    .is('skydropx_shipment_id', null)
    .or(`guia_en_curso_desde.is.null,guia_en_curso_desde.lt.${new Date(Date.now() - CANDADO_GUIA_MS).toISOString()}`)
    .select('id')
  if (errUpd) { console.error('Editar dirección:', errUpd); return { ok: false, status: 500, error: 'No se pudo guardar la dirección.' } }
  if (!hecho?.length) return { ok: false, status: 409, error: 'El pedido cambió mientras tanto (¿se generó una guía?). Recarga la página.' }

  await db.from('envio_eventos').insert({
    pedido_id: p.id, numero_guia: null, estado: 'direccion_editada',
    descripcion: `Por ${adminEmail}: ${nuevos.calle} ${nuevos.numero}, ${nuevos.colonia}, ${nuevos.ciudad}, ${nuevos.cp}`.slice(0, 300),
    ocurrido_at: cambio.fecha, fuente: 'manual', huella: `direccion:${p.id}:${cambio.fecha}`,
  })

  const correo = await enviarCorreoCambioDireccion(p.id, p.email, nuevos)
  return { ok: true, aviso, correo }
}
