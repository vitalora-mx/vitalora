import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const pedidoId = formData.get('pedido_id') as string

    if (!file || !pedidoId) return NextResponse.json({ error: 'Archivo y pedido_id requeridos' }, { status: 400 })

    const fileExt = file.name.split('.').pop()
    const fileName = `facturas/${pedidoId}/factura-${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('productos')
      .upload(fileName, buffer, { contentType: file.type, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabaseAdmin.storage.from('productos').getPublicUrl(fileName)

    await supabaseAdmin.from('pedidos').update({ factura_url: publicUrl }).eq('id', parseInt(pedidoId))

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Error subiendo factura' }, { status: 500 })
  }
}
