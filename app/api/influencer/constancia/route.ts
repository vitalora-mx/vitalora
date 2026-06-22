import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    // Validar tipo (solo PDF)
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'El archivo debe ser un PDF.' }, { status: 400 })
    }

    // Validar tamaño (máx 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no debe superar 5 MB.' }, { status: 400 })
    }

    // Nombre único
    const timestamp = Date.now()
    const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const path = `constancias/${timestamp}_${nombreLimpio}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from('influencer-docs')
      .upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (error) {
      console.error('Error al subir constancia:', error)
      return NextResponse.json({ error: 'Error al subir el archivo.' }, { status: 500 })
    }

    // Guardamos solo el path (el bucket es privado; el admin genera URL firmada al revisar)
    return NextResponse.json({ ok: true, path })

  } catch (err) {
    console.error('Error upload constancia:', err)
    return NextResponse.json({ error: 'Error al subir el archivo.' }, { status: 500 })
  }
}
