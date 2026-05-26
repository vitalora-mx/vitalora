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
    const productoId = formData.get('producto_id') as string
    const posicion = formData.get('posicion') as string

    if (!file || !productoId) {
      return NextResponse.json({ error: 'Archivo y producto_id requeridos' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${productoId}/${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('productos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('productos')
      .getPublicUrl(fileName)

    const { error: dbError } = await supabaseAdmin
      .from('producto_imagenes')
      .insert({
        producto_id: parseInt(productoId),
        url: publicUrl,
        posicion: parseInt(posicion || '0'),
      })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Error subiendo imagen' }, { status: 500 })
  }
}
