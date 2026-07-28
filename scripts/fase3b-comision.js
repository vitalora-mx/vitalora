const fs = require('fs')
const archivo = 'app/api/webhooks/mercadopago/route.ts'
let c = fs.readFileSync(archivo, 'utf8')

// Bloque original: calcula 5% fijo y registra
const buscar = `    if (comisionExistente) return // Ya se registró

    // La comisión es 5% del subtotal SIN envío
    const subtotalVenta = pedido.subtotal || 0
    const montoComision = Math.round(subtotalVenta * 0.05 * 100) / 100

    await supabaseAdmin
      .from('influencer_comisiones')
      .insert({
        influencer_id: codigo.influencer_id,
        pedido_id: pedido.id,
        subtotal_venta: subtotalVenta,
        monto_comision: montoComision,
        estado: 'pendiente',
      })`

const reemplazar = `    if (comisionExistente) return // Ya se registró

    // ─── Comisión variable: leer configuración del influencer ───
    const { data: influencerDatos } = await supabaseAdmin
      .from('influencers')
      .select('tipo_comision, comision_valor')
      .eq('id', codigo.influencer_id)
      .maybeSingle()

    // Valores por defecto: 5% (comportamiento histórico) si no hay config
    const tipoComision = influencerDatos?.tipo_comision || 'porcentaje'
    const comisionValor = influencerDatos?.comision_valor != null ? Number(influencerDatos.comision_valor) : 5

    // La comisión se calcula sobre el subtotal SIN envío
    const subtotalVenta = pedido.subtotal || 0

    let montoComision = 0
    if (tipoComision === 'monto_fijo') {
      // Monto fijo por cada unidad vendida: sumar todas las cantidades del pedido
      const { data: items } = await supabaseAdmin
        .from('pedido_items')
        .select('cantidad')
        .eq('pedido_id', pedido.id)
      const totalUnidades = (items || []).reduce((suma, it) => suma + (it.cantidad || 0), 0)
      montoComision = Math.round(totalUnidades * comisionValor * 100) / 100
    } else {
      // Porcentaje (normal 5% o VIP con % más alto)
      montoComision = Math.round(subtotalVenta * (comisionValor / 100) * 100) / 100
    }

    await supabaseAdmin
      .from('influencer_comisiones')
      .insert({
        influencer_id: codigo.influencer_id,
        pedido_id: pedido.id,
        subtotal_venta: subtotalVenta,
        monto_comision: montoComision,
        estado: 'pendiente',
      })`

if (!c.includes(buscar)) {
  console.log('ERROR: no se encontro el bloque original de comision. NO se modifico nada.')
  process.exit(1)
}

c = c.replace(buscar, reemplazar)
fs.writeFileSync(archivo, c, 'utf8')
console.log('OK: calculo de comision variable aplicado.')