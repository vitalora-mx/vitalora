import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

export async function POST(request: Request) {
  try {
    const { email, desde, hasta } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const emailLimpio = email.toLowerCase().trim()

    const { data: influencer } = await supabase
      .from('influencers')
      .select('id, nombre, codigo')
      .eq('email', emailLimpio)
      .maybeSingle()

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer no encontrado' }, { status: 404 })
    }

    let query = supabase
      .from('influencer_comisiones')
      .select('pedido_id, subtotal_venta, monto_comision, estado, created_at, fecha_pago, referencia_pago')
      .eq('influencer_id', influencer.id)
      .order('created_at', { ascending: false })

    if (desde) query = query.gte('created_at', `${desde}T00:00:00`)
    if (hasta) query = query.lte('created_at', `${hasta}T23:59:59`)

    const { data: comisiones } = await query
    const ventas = comisiones ?? []

    // Construir las filas del Excel
    const filas = ventas.map(c => ({
      'Fecha de venta': fmtFecha(c.created_at),
      'No. de pedido': `#${String(c.pedido_id).slice(-6).toUpperCase()}`,
      'Subtotal de venta (MXN)': Number((c.subtotal_venta ?? 0).toFixed(2)),
      'Tu comisión 5% (MXN)': Number((c.monto_comision ?? 0).toFixed(2)),
      'Estado': c.estado === 'pagada' ? 'Pagada' : 'Pendiente',
      'Fecha de pago': c.fecha_pago ? fmtFecha(c.fecha_pago) : '—',
      'Referencia de pago': c.referencia_pago ?? '—',
    }))

    // Fila de totales
    const totalComision = ventas.reduce((a, c) => a + (c.monto_comision ?? 0), 0)
    const totalVenta = ventas.reduce((a, c) => a + (c.subtotal_venta ?? 0), 0)
    filas.push({
      'Fecha de venta': '',
      'No. de pedido': '',
      'Subtotal de venta (MXN)': Number(totalVenta.toFixed(2)),
      'Tu comisión 5% (MXN)': Number(totalComision.toFixed(2)),
      'Estado': 'TOTAL',
      'Fecha de pago': '',
      'Referencia de pago': '',
    })

    // Crear el libro de Excel: primero el encabezado, luego las filas
    const ws = XLSX.utils.aoa_to_sheet([
      [`Reporte de ventas — ${influencer.nombre} (código ${influencer.codigo})`],
      [`Periodo: ${desde ? fmtFecha(desde + 'T12:00:00') : 'inicio'} al ${hasta ? fmtFecha(hasta + 'T12:00:00') : 'hoy'}`],
    ])

    // Agregar las filas de datos a partir de la fila 3 (con sus encabezados de columna)
    XLSX.utils.sheet_add_json(ws, filas, { origin: 'A3' })

    // Anchos de columna
    ws['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 22 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas')

    // Generar el buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const nombreArchivo = `reporte-ventas-${influencer.codigo ?? 'vitalora'}-${desde ?? 'inicio'}-${hasta ?? 'hoy'}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })

  } catch (err) {
    console.error('Error Excel influencer:', err)
    return NextResponse.json({ error: 'Error al generar el Excel' }, { status: 500 })
  }
}
