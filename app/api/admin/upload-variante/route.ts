import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const varianteId = formData.get('variante_id') as string
    const posicion = formData.get('posicion') as string

    if (!file || !varianteId) {
      return NextResponse.json({ error: 'Archivo y variante_id requeridos' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `variantes/${varianteId}/${Date.now()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('productos')
      .upload(fileName, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('productos')
      .getPublicUrl(fileName)

    const { error: dbError } = await supabaseAdmin
      .from('variante_imagenes')
      .insert({
        variante_id: parseInt(varianteId),
        url: publicUrl,
        posicion: parseInt(posicion || '0'),
      })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl })
  } catch {
    return NextResponse.json({ error: 'Error subiendo imagen de variante' }, { status: 500 })
  }
}

// DELETE ?id=123 -> borra una imagen de variante (del storage y la BD)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data: img } = await supabaseAdmin.from('variante_imagenes').select('url').eq('id', id).single()
  if (img) {
    const path = img.url.split('/productos/')[1]
    if (path) await supabaseAdmin.storage.from('productos').remove([decodeURIComponent(path)])
  }

  const { error } = await supabaseAdmin.from('variante_imagenes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
