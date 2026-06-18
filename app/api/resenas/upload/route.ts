import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/resenas/upload
// Sube una foto de reseña al bucket "resenas" y devuelve su URL pública.
// Requiere usuario autenticado (header x-user-id).
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const productoId = formData.get('producto_id') as string

    if (!file || !productoId) {
      return NextResponse.json({ error: 'Archivo y producto_id requeridos.' }, { status: 400 })
    }

    // Validar que sea imagen y no muy pesada (máx 5 MB)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no debe superar 5 MB.' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    // Ruta: producto/usuario/timestamp.ext
    const fileName = `${productoId}/${userId}/${Date.now()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('resenas')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('resenas')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error subiendo foto de reseña:', error)
    return NextResponse.json({ error: 'Error subiendo la imagen.' }, { status: 500 })
  }
}
