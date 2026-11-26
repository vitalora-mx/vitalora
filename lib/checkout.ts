// ============================================================
// Cálculo del pedido en el servidor (SOLO SERVIDOR).
// El navegador solo manda {productoId, varianteId, cantidad}, sus datos de envío,
// el código de descuento y el total que vio. Precio, nombre, marca, stock,
// descuentos y envío salen de la base de datos y de lib/envio.ts.
// ============================================================
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { obtenerCliente } from '@/lib/cliente-auth'
import { calcularEnvio } from '@/lib/envio'
import { articuloDeProducto, type CopiaCotizacion } from '@/lib/cotizar-envio'
import type { ArticuloPaquete } from '@/lib/paquete'
import { validarCodigo, montoPrimeraCompra, puedeUsarPrimeraCompra, etiquetaDescuento } from '@/lib/descuentos'
import { productoVisible } from '@/lib/tienda'

const MAX_LINEAS = 50
const MAX_CANTIDAD = 99

export interface LineaPedido {
  productoId: number
  varianteId: number | null
  nombre: string
  marca: string
  varianteNombre: string | null
  precio: number
  cantidad: number
}

export interface Comprador { nombre: string; apellido: string; email: string; telefono: string }
export interface DireccionEnvio {
  calle: string; numero: string; interior: string; colonia: string
  ciudad: string; estado: string; cp: string; referencia: string
}

export interface PedidoCalculado {
  lineas: LineaPedido[]
  subtotal: number
  descuento: number
  descuentoTipo: 'codigo' | 'primera_compra' | null
  descuentoTitulo: string | null
  codigo: string | null
  costoEnvio: number            // incluye el cargo de zona extendida
  cargoZonaExtendida: number
  zonaVerificada: boolean       // false = Skydropx no respondió ("Zona sin verificar")
  envioCotizacion: CopiaCotizacion | null
  origenEnvioId: number | null
  total: number
  userId: string | null
  comprador: Comprador
  direccion: DireccionEnvio
}

// Desglose que se devuelve al navegador cuando el total cambió
export interface Desglose {
  lineas: { productoId: number; varianteId: number | null; nombre: string; varianteNombre: string | null; precio: number; cantidad: number }[]
  subtotal: number
  descuento: number
  descuentoTipo: string | null
  codigo: string | null
  costoEnvio: number
  cargoZonaExtendida: number
  total: number
}

export type ResultadoCheckout =
  | { ok: true; pedido: PedidoCalculado }
  | { ok: false; status: number; body: Record<string, unknown> }

const redondear = (n: number) => Math.round(n * 100) / 100

function texto(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function error(status: number, mensaje: string, extra: Record<string, unknown> = {}): ResultadoCheckout {
  return { ok: false, status, body: { error: mensaje, ...extra } }
}

// Verifica la sesión del cliente (cookie httpOnly, lib/cliente-auth.ts).
// - body.conSesion no es true      -> invitado (userId null)
// - conSesion y sesión válida      -> id del usuario
// - conSesion y sin sesión válida  -> 'invalido' (la sesión expiró)
async function verificarSesion(body: any): Promise<string | null | 'invalido'> {
  // La sesión va en la cookie httpOnly, que el navegador manda siempre.
  // Por eso el cliente indica con conSesion si quiere comprar con su cuenta;
  // si no (invitado), se ignora la cookie.
  if (body?.conSesion !== true) return null
  try {
    const cliente = await obtenerCliente()
    return cliente ? cliente.id : 'invalido'
  } catch {
    return 'invalido'
  }
}

export function desglose(p: PedidoCalculado): Desglose {
  return {
    lineas: p.lineas.map(l => ({
      productoId: l.productoId, varianteId: l.varianteId, nombre: l.nombre,
      varianteNombre: l.varianteNombre, precio: l.precio, cantidad: l.cantidad,
    })),
    subtotal: p.subtotal,
    descuento: p.descuento,
    descuentoTipo: p.descuentoTipo,
    codigo: p.codigo,
    // En el desglose el envío va sin el cargo, que tiene su propio renglón
    costoEnvio: redondear(p.costoEnvio - p.cargoZonaExtendida),
    cargoZonaExtendida: p.cargoZonaExtendida,
    total: p.total,
  }
}

export async function calcularPedido(req: NextRequest, body: any): Promise<ResultadoCheckout> {
  // ── 1. Datos del comprador y dirección ──
  const c = body?.comprador || {}
  const d = body?.direccion || {}
  const comprador: Comprador = {
    nombre: texto(c.nombre, 100), apellido: texto(c.apellido, 100),
    email: texto(c.email, 200).toLowerCase(), telefono: texto(c.telefono, 30),
  }
  const direccion: DireccionEnvio = {
    calle: texto(d.calle), numero: texto(d.numero, 30), interior: texto(d.interior, 30),
    colonia: texto(d.colonia), ciudad: texto(d.ciudad, 100), estado: texto(d.estado, 100),
    cp: texto(d.cp, 5), referencia: texto(d.referencia, 300),
  }
  if (!comprador.nombre || !comprador.apellido || !comprador.telefono || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(comprador.email)) {
    return error(400, 'Revisa tus datos personales.')
  }
  if (!direccion.calle || !direccion.numero || !direccion.colonia || !direccion.ciudad || !direccion.estado || !/^\d{5}$/.test(direccion.cp)) {
    return error(400, 'Revisa tu dirección de envío.')
  }

  // ── 2. Sesión del cliente ──
  const sesion = await verificarSesion(body)
  if (sesion === 'invalido') {
    return error(401, 'Tu sesión expiró.', { sesionExpirada: true })
  }
  const userId = sesion

  // ── 3. Ítems: solo {productoId, varianteId, cantidad} ──
  if (!Array.isArray(body?.items) || body.items.length === 0) return error(400, 'Tu carrito está vacío.')
  if (body.items.length > MAX_LINEAS) return error(400, 'Tu carrito tiene demasiados productos.')

  const agrupados = new Map<string, { productoId: number; varianteId: number | null; cantidad: number }>()
  for (const it of body.items) {
    const productoId = Number(it?.productoId)
    const varianteId = it?.varianteId == null ? null : Number(it.varianteId)
    const cantidad = Number(it?.cantidad)
    if (!Number.isInteger(productoId) || productoId <= 0) return error(400, 'Producto no válido.')
    if (varianteId !== null && (!Number.isInteger(varianteId) || varianteId <= 0)) return error(400, 'Variante no válida.')
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) return error(400, 'Cantidad no válida.')
    const clave = `${productoId}__${varianteId ?? 'base'}`
    const previo = agrupados.get(clave)
    if (previo) previo.cantidad += cantidad
    else agrupados.set(clave, { productoId, varianteId, cantidad })
  }

  const supabaseAdmin = createServiceClient()
  const ids = [...new Set([...agrupados.values()].map(i => i.productoId))]
  const { data: productos, error: errProd } = await supabaseAdmin
    .from('productos')
    .select('id, nombre, marca, precio, stock, activo, tipo, categoria, peso_g, alto_cm, ancho_cm, largo_cm, producto_variantes(id, producto_id, nombre, precio, stock)')
    .in('id', ids)
  if (errProd) {
    console.error('Checkout: error leyendo productos', errProd)
    return error(500, 'No pudimos verificar tu carrito. Intenta de nuevo.')
  }
  const porId = new Map((productos || []).map((p: any) => [Number(p.id), p]))

  const lineas: LineaPedido[] = []
  const articulos: ArticuloPaquete[] = []
  for (const it of agrupados.values()) {
    const prod: any = porId.get(it.productoId)
    if (!prod || !prod.activo) {
      return error(400, `${prod?.nombre ? `"${prod.nombre}"` : 'Un producto de tu carrito'} ya no está disponible. Quítalo del carrito para continuar.`)
    }
    // Suplementos pausados (lib/tienda.ts): no se pueden comprar
    if (!productoVisible(prod)) {
      return error(400, `"${prod.nombre}" (suplemento) no está disponible por ahora. Quítalo del carrito para continuar.`)
    }
    const variantes: any[] = prod.producto_variantes || []
    let precio = Number(prod.precio)
    let stock = Number(prod.stock) || 0
    let varianteNombre: string | null = null

    if (it.varianteId !== null) {
      const variante = variantes.find(v => Number(v.id) === it.varianteId && Number(v.producto_id) === Number(prod.id))
      if (!variante) return error(400, `La presentación elegida de "${prod.nombre}" ya no está disponible.`)
      if (variante.precio != null) precio = Number(variante.precio)
      stock = Number(variante.stock) || 0
      varianteNombre = variante.nombre ?? null
    } else if (variantes.length > 0) {
      return error(400, `Elige una presentación de "${prod.nombre}" antes de pagar.`)
    }

    if (!Number.isFinite(precio) || precio < 0) return error(400, `"${prod.nombre}" no tiene un precio válido.`)
    if (stock < it.cantidad) {
      const nombreCompleto = varianteNombre ? `${prod.nombre} (${varianteNombre})` : prod.nombre
      return error(400, stock <= 0
        ? `"${nombreCompleto}" está agotado.`
        : `Solo quedan ${stock} piezas de "${nombreCompleto}".`)
    }

    lineas.push({
      productoId: Number(prod.id), varianteId: it.varianteId,
      nombre: prod.nombre, marca: prod.marca || '', varianteNombre,
      precio, cantidad: it.cantidad,
    })
    // Las variantes no tienen peso ni medidas propias: se usan las del producto
    articulos.push(articuloDeProducto(prod, it.cantidad))
  }

  const subtotal = redondear(lineas.reduce((s, l) => s + l.precio * l.cantidad, 0))

  // ── 4. Descuento: código o primera compra (nunca los dos) ──
  let descuento = 0
  let descuentoTipo: PedidoCalculado['descuentoTipo'] = null
  let descuentoTitulo: string | null = null
  let codigo: string | null = null
  let reglaEnvio = null

  const codigoBody = texto(body?.codigoDescuento, 50)
  if (codigoBody) {
    const r = await validarCodigo({ codigo: codigoBody, subtotal, email: comprador.email })
    if (!r.ok) return error(400, `Código ${codigoBody.toUpperCase()}: ${r.error}`, { codigoInvalido: true })
    descuento = r.datos.montoDescuento
    descuentoTipo = 'codigo'
    descuentoTitulo = etiquetaDescuento({ codigo_descuento: r.datos.codigo })
    codigo = r.datos.codigo
    reglaEnvio = r.datos
  } else if (userId && await puedeUsarPrimeraCompra(userId)) {
    descuento = montoPrimeraCompra(subtotal)
    descuentoTipo = descuento > 0 ? 'primera_compra' : null
    descuentoTitulo = etiquetaDescuento({ descuento_tipo: 'primera_compra' })
  }
  descuento = redondear(Math.min(descuento, subtotal))

  // ── 5. Envío (lib/envio.ts) ──
  const envio = await calcularEnvio({
    subtotal,
    codigo: reglaEnvio,
    destino: { cp: direccion.cp, colonia: direccion.colonia, ciudad: direccion.ciudad, estado: direccion.estado },
    articulos,
  })
  if (envio.zona.estado === 'cp_invalido') {
    return error(400, 'No encontramos tu código postal. Revisa tu dirección de envío.', { cpInvalido: true })
  }
  if (envio.zona.estado === 'sin_cobertura') {
    return error(400, 'No tenemos cobertura de paquetería para tu código postal. Escríbenos por WhatsApp y te ayudamos.', { sinCobertura: true })
  }
  const costoEnvio = redondear(envio.costo)
  const cargoZonaExtendida = redondear(envio.cargoZona)

  const total = redondear(subtotal - descuento + costoEnvio)
  if (total <= 0) return error(400, 'El total del pedido no es válido.')

  return {
    ok: true,
    pedido: {
      lineas, subtotal, descuento, descuentoTipo, descuentoTitulo, codigo,
      costoEnvio, cargoZonaExtendida,
      zonaVerificada: envio.zona.verificada,
      envioCotizacion: envio.zona.copia,
      origenEnvioId: envio.zona.origenId,
      total, userId, comprador, direccion,
    },
  }
}

// Si el total que vio el cliente no coincide con el del servidor, no se crea el pedido.
export function totalCambio(pedido: PedidoCalculado, totalEsperado: unknown): boolean {
  const esperado = Number(totalEsperado)
  if (!Number.isFinite(esperado)) return true
  return Math.round(esperado * 100) !== Math.round(pedido.total * 100)
}

// Inserta el pedido y sus ítems. Si fallan los ítems, borra el pedido.
export async function guardarPedido(p: PedidoCalculado, extra: Record<string, unknown>): Promise<{ id: number } | null> {
  const supabaseAdmin = createServiceClient()
  const { data: pedido, error: pedidoError } = await supabaseAdmin
    .from('pedidos')
    .insert({
      ...extra,
      nombre: p.comprador.nombre,
      apellido: p.comprador.apellido,
      email: p.comprador.email,
      telefono: p.comprador.telefono,
      calle: p.direccion.calle,
      numero: p.direccion.numero,
      interior: p.direccion.interior || null,
      colonia: p.direccion.colonia || null,
      ciudad: p.direccion.ciudad || null,
      estado_dir: p.direccion.estado || null,
      cp: p.direccion.cp,
      referencia: p.direccion.referencia || null,
      subtotal: p.subtotal,
      descuento: p.descuento,
      descuento_tipo: p.descuentoTipo,
      costo_envio: p.costoEnvio,
      cargo_zona_extendida: p.cargoZonaExtendida,
      zona_extendida: p.cargoZonaExtendida > 0,
      zona_verificada: p.zonaVerificada,
      envio_cotizacion: p.envioCotizacion,
      origen_envio_id: p.origenEnvioId,
      total: p.total,
      user_id: p.userId,
      codigo_descuento: p.codigo,
    })
    .select('id')
    .single()

  if (pedidoError || !pedido) {
    console.error('Error guardando pedido:', pedidoError)
    return null
  }

  const { error: itemsError } = await supabaseAdmin.from('pedido_items').insert(
    p.lineas.map(l => ({
      pedido_id: pedido.id,
      producto_id: l.productoId,
      nombre: l.nombre,
      marca: l.marca,
      precio: l.precio,
      cantidad: l.cantidad,
      variante_id: l.varianteId,
      variante_nombre: l.varianteNombre,
    }))
  )
  if (itemsError) {
    console.error('Error guardando items del pedido:', itemsError)
    await supabaseAdmin.from('pedidos').delete().eq('id', pedido.id)
    return null
  }

  return { id: pedido.id }
}
