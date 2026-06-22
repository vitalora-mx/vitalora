import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generar código único tipo "NOMBRE" + 4 dígitos
function generarCodigo(nombre: string): string {
  const base = nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 6)
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${base}${num}`
}

export async function GET() {
  try {
    const { data: influencers, error } = await supabase
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Stats
    const pendientes = influencers?.filter(i => i.estado === 'pendiente').length ?? 0
    const aprobados = influencers?.filter(i => i.estado === 'aprobado').length ?? 0

    return NextResponse.json({
      influencers: influencers ?? [],
      stats: {
        pendientes,
        aprobados,
        total: influencers?.length ?? 0,
      }
    })
  } catch (err) {
    console.error('Error admin influencers GET:', err)
    return NextResponse.json({ error: 'Error al cargar influencers' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, accion, notas } = body

    if (!id || !accion) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Obtener el influencer
    const { data: influencer, error: errInf } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', id)
      .single()

    if (errInf || !influencer) {
      return NextResponse.json({ error: 'Influencer no encontrado' }, { status: 404 })
    }

    // ─── APROBAR ───
    if (accion === 'aprobar') {
      let codigo = influencer.codigo

      // Generar código si no tiene
      if (!codigo) {
        // Intentar hasta encontrar uno único
        let intentos = 0
        let codigoUnico = false
        while (!codigoUnico && intentos < 10) {
          codigo = generarCodigo(influencer.nombre)
          const { data: existe } = await supabase
            .from('codigos_descuento')
            .select('id')
            .eq('codigo', codigo)
            .maybeSingle()
          if (!existe) codigoUnico = true
          intentos++
        }

        // Crear el código de descuento (5%, max 3 usos por email, marcado como influencer)
        const { error: errCodigo } = await supabase
          .from('codigos_descuento')
          .insert({
            codigo,
            tipo: 'porcentaje',
            valor: 5,
            minimo_compra: 0,
            max_usos: null,             // ilimitado en total
            usos_actuales: 0,
            max_usos_por_email: 3,      // máximo 3 por comprador
            es_influencer: true,
            influencer_id: influencer.id,
            activo: true,
            fecha_inicio: new Date().toISOString(),
            fecha_fin: null,
          })

        if (errCodigo) {
          console.error('Error al crear código:', errCodigo)
          return NextResponse.json({ error: 'Error al generar el código de descuento' }, { status: 500 })
        }
      }

      // Actualizar el influencer
      const { error: errUpdate } = await supabase
        .from('influencers')
        .update({
          estado: 'aprobado',
          codigo,
          aprobado_at: new Date().toISOString(),
          notas_admin: notas ?? influencer.notas_admin,
        })
        .eq('id', id)

      if (errUpdate) throw errUpdate

      return NextResponse.json({ ok: true, codigo })
    }

    // ─── RECHAZAR / PAUSAR / REACTIVAR ───
    if (accion === 'rechazar' || accion === 'pausar' || accion === 'reactivar') {
      const nuevoEstado = accion === 'rechazar' ? 'rechazado' : accion === 'pausar' ? 'pausado' : 'aprobado'

      // Si se pausa o rechaza, desactivar su código
      if (influencer.codigo && (accion === 'rechazar' || accion === 'pausar')) {
        await supabase
          .from('codigos_descuento')
          .update({ activo: false })
          .eq('codigo', influencer.codigo)
      }
      // Si se reactiva, volver a activar el código
      if (influencer.codigo && accion === 'reactivar') {
        await supabase
          .from('codigos_descuento')
          .update({ activo: true })
          .eq('codigo', influencer.codigo)
      }

      const { error } = await supabase
        .from('influencers')
        .update({ estado: nuevoEstado, notas_admin: notas ?? influencer.notas_admin })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (err) {
    console.error('Error admin influencers PATCH:', err)
    return NextResponse.json({ error: 'Error al procesar la acción' }, { status: 500 })
  }
}

// Generar URL firmada para ver la constancia (bucket privado)
export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    if (!path) return NextResponse.json({ error: 'Path requerido' }, { status: 400 })

    const { data, error } = await supabase.storage
      .from('influencer-docs')
      .createSignedUrl(path, 300) // válida 5 minutos

    if (error || !data) {
      return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('Error signed url:', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
