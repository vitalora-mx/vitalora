import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verifica si un email pertenece a un influencer (aprobado o pausado)
export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ esInfluencer: false })

    const { data } = await supabase
      .from('influencers')
      .select('estado')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    // Es influencer si existe y está aprobado o pausado (no rechazado/pendiente)
    const esInfluencer = !!data && (data.estado === 'aprobado' || data.estado === 'pausado')

    return NextResponse.json({ esInfluencer })
  } catch {
    return NextResponse.json({ esInfluencer: false })
  }
}
