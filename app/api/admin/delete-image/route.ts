import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  // Obtener la URL de la imagen
  const { data: imagen } = await supabaseAdmin
    .from('producto_imagenes')
    .select('url')
    .eq('id', id)
    .single()

  if (imagen) {
    // Borrar del storage
    const path = imagen.url.split('/productos/')[1]
    if (path) {
      await supabaseAdmin.storage.from('productos').remove([decodeURIComponent(path)])
    }
  }

  // Borrar de la base de datos
  const { error } = await supabaseAdmin
    .from('producto_imagenes')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
