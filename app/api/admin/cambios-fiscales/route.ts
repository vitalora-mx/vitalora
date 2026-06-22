import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: lista de solicitudes de cambio fiscal pendientes (con datos del influencer)
export async function GET() {
  try {
    const { data: solicitudes, error } = await supabase
      .from('influencer_cambios_fiscales')
      .select(`
        *,
        influencers (id, nombre, email, fiscal_rfc, fiscal_razon_social, fiscal_regimen, fiscal_cp)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const pendientes = (solicitudes ?? []).filter(s => s.estado === 'pendiente')

    return NextResponse.json({
      solicitudes: solicitudes ?? [],
      numPendientes: pendientes.length,
    })
  } catch (err) {
    console.error('Error admin cambios fiscales GET:', err)
    return NextResponse.json({ error: 'Error al cargar' }, { status: 500 })
  }
}

// PATCH: aprobar o rechazar una solicitud
export async function PATCH(request: Request) {
  try {
    const { id, accion, notas } = await request.json()
    if (!id || !accion) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    const { data: solicitud } = await supabase
      .from('influencer_cambios_fiscales')
      .select('*')
      .eq('id', id)
      .single()

    if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    if (solicitud.estado !== 'pendiente') return NextResponse.json({ error: 'Esta solicitud ya fue resuelta' }, { status: 400 })

    if (accion === 'aprobar') {
      // Aplicar los nuevos datos fiscales al influencer
      const update: any = {
        fiscal_rfc: solicitud.fiscal_rfc,
        fiscal_razon_social: solicitud.fiscal_razon_social,
        fiscal_regimen: solicitud.fiscal_regimen,
        fiscal_cp: solicitud.fiscal_cp,
      }
      // Solo actualizar constancia si subieron una nueva
      if (solicitud.constancia_url) update.constancia_url = solicitud.constancia_url

      await supabase.from('influencers').update(update).eq('id', solicitud.influencer_id)

      await supabase
        .from('influencer_cambios_fiscales')
        .update({ estado: 'aprobado', notas_admin: notas ?? null, resuelto_at: new Date().toISOString() })
        .eq('id', id)

      return NextResponse.json({ ok: true })
    }

    if (accion === 'rechazar') {
      await supabase
        .from('influencer_cambios_fiscales')
        .update({ estado: 'rechazado', notas_admin: notas ?? null, resuelto_at: new Date().toISOString() })
        .eq('id', id)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err) {
    console.error('Error admin cambios fiscales PATCH:', err)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}

// POST: generar URL firmada para ver la constancia nueva
export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    if (!path) return NextResponse.json({ error: 'Path requerido' }, { status: 400 })

    const { data, error } = await supabase.storage
      .from('influencer-docs')
      .createSignedUrl(path, 300)

    if (error || !data) return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
    return NextResponse.json({ url: data.signedUrl })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
