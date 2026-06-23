import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: obtener la personalidad actual de LORA
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('lora_config')
      .select('personalidad, actualizado_at')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return NextResponse.json({ personalidad: '', actualizado_at: null })
    }

    return NextResponse.json({
      personalidad: data.personalidad,
      actualizado_at: data.actualizado_at,
    })
  } catch (err) {
    console.error('Error al obtener config de LORA:', err)
    return NextResponse.json({ error: 'Error al cargar la configuracion.' }, { status: 500 })
  }
}

// POST: guardar la nueva personalidad de LORA
export async function POST(request: Request) {
  try {
    const { personalidad } = await request.json()

    if (!personalidad || typeof personalidad !== 'string' || personalidad.trim().length < 50) {
      return NextResponse.json({ error: 'La personalidad debe tener al menos 50 caracteres.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('lora_config')
      .upsert({
        id: 1,
        personalidad: personalidad.trim(),
        actualizado_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error al guardar config de LORA:', error)
      return NextResponse.json({ error: 'Error al guardar la configuracion.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al guardar config de LORA:', err)
    return NextResponse.json({ error: 'Error al guardar la configuracion.' }, { status: 500 })
  }
}
