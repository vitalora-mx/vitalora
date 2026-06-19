import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Estados que cuentan como "venta confirmada" (ya pagada)
const ESTADOS_VENTA = ['pagado', 'preparando', 'enviado']

function inicioDelDia(fecha: Date) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    // Traer todos los pedidos con sus items
    const { data: pedidos, error } = await supabaseAdmin
      .from('pedidos')
      .select('*, pedido_items(*)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const hoy = inicioDelDia(new Date())
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)

    const ventas = (pedidos || []).filter(p => ESTADOS_VENTA.includes(p.estado))

    // --- Ventas hoy y ayer ---
    const ventasHoy = ventas.filter(p => new Date(p.created_at) >= hoy)
    const ventasAyer = ventas.filter(p => { const d = new Date(p.created_at); return d >= ayer && d < hoy })

    const totalHoy = ventasHoy.reduce((s, p) => s + (p.total || 0), 0)
    const totalAyer = ventasAyer.reduce((s, p) => s + (p.total || 0), 0)
    const pedidosHoy = ventasHoy.length
    const pedidosAyer = ventasAyer.length
    const ticketHoy = pedidosHoy > 0 ? Math.round(totalHoy / pedidosHoy) : 0
    const ticketAyer = pedidosAyer > 0 ? Math.round(totalAyer / pedidosAyer) : 0

    // --- Clientes nuevos hoy (por user_id único que aparece por primera vez hoy) ---
    // Simplificado: pedidos de hoy con user_id distinto
    const clientesHoy = new Set(ventasHoy.map(p => p.user_id || p.email).filter(Boolean)).size

    // --- Ventas últimos 7 días (para la gráfica) ---
    const dias7: { label: string; total: number; esHoy: boolean }[] = []
    const nombresDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy); dia.setDate(dia.getDate() - i)
      const diaSig = new Date(dia); diaSig.setDate(diaSig.getDate() + 1)
      const totalDia = ventas
        .filter(p => { const d = new Date(p.created_at); return d >= dia && d < diaSig })
        .reduce((s, p) => s + (p.total || 0), 0)
      dias7.push({ label: i === 0 ? 'Hoy' : nombresDia[dia.getDay()], total: totalDia, esHoy: i === 0 })
    }
    const total7dias = dias7.reduce((s, d) => s + d.total, 0)
    const pedidos7dias = ventas.filter(p => { const d = new Date(p.created_at); const lim = new Date(hoy); lim.setDate(lim.getDate() - 6); return d >= lim }).length

    // --- Pedidos esperando guía (pagado o preparando, sin numero_guia) ---
    const esperandoGuia = (pedidos || []).filter(p => ['pagado', 'preparando'].includes(p.estado) && !p.numero_guia).length

    // --- Top productos (de pedido_items de ventas confirmadas) ---
    const conteoProductos: Record<string, { nombre: string; cantidad: number; total: number }> = {}
    for (const p of ventas) {
      for (const it of (p.pedido_items || [])) {
        const key = it.nombre || 'Producto'
        if (!conteoProductos[key]) conteoProductos[key] = { nombre: key, cantidad: 0, total: 0 }
        conteoProductos[key].cantidad += it.cantidad || 0
        conteoProductos[key].total += (it.precio || 0) * (it.cantidad || 0)
      }
    }
    const topProductos = Object.values(conteoProductos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)

    // --- Pedidos recientes (últimos 5) ---
    const recientes = (pedidos || []).slice(0, 5).map(p => ({
      id: p.id,
      nombre: `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.email || 'Cliente',
      total: p.total || 0,
      estado: p.estado,
      created_at: p.created_at,
      numProductos: (p.pedido_items || []).reduce((s: number, it: any) => s + (it.cantidad || 0), 0),
    }))

    // --- Productos con stock bajo (consulta aparte) ---
    const { data: productosBajos } = await supabaseAdmin
      .from('productos')
      .select('nombre, stock')
      .lte('stock', 5)
      .eq('activo', true)
      .order('stock', { ascending: true })
      .limit(10)

    // --- Reseñas pendientes ---
    const { count: resenasPendientes } = await supabaseAdmin
      .from('resenas')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente')

    // --- Facturas pendientes (pedidos pagados sin factura_url, con datos de facturación) ---
    // Simplificado: pedidos de venta sin factura_url
    const facturasPendientes = ventas.filter(p => !p.factura_url).length

    function pct(hoy: number, ayer: number) {
      if (ayer === 0) return hoy > 0 ? 100 : 0
      return Math.round(((hoy - ayer) / ayer) * 100)
    }

    return NextResponse.json({
      kpis: {
        ventasHoy: totalHoy,
        ventasTrend: pct(totalHoy, totalAyer),
        pedidosHoy,
        pedidosTrend: pedidosHoy - pedidosAyer,
        ticketPromedio: ticketHoy,
        ticketTrend: pct(ticketHoy, ticketAyer),
        clientesNuevos: clientesHoy,
      },
      alertas: {
        esperandoGuia,
        facturasPendientes,
        stockBajo: (productosBajos || []).map(p => ({ nombre: p.nombre, stock: p.stock })),
        resenasPendientes: resenasPendientes || 0,
      },
      grafica: { dias: dias7, total7dias, pedidos7dias },
      topProductos,
      recientes,
    })
  } catch (e) {
    console.error('Error dashboard:', e)
    return NextResponse.json({ error: 'Error calculando métricas' }, { status: 500 })
  }
}
