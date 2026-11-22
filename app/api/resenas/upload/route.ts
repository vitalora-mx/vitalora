import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCliente } from '@/lib/cliente-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/resenas/upload
// Sube una foto de reseña al bucket "resenas" y devuelve su URL pública.
// Requiere sesión de cliente (cookie httpOnly, lib/cliente-auth.ts).
export async function POST(req: NextRequest) {
  try {
    const auth = await requireCliente(req)
    if (!auth.ok) return auth.response
    const userId = auth.cliente.id

    const formData = await req.formData()
    const file = formData.get('file') as File
    const productoId = formData.get('producto_id') as string

    if (!file || !productoId) {
      return NextResponse.json({ error: 'Archivo y producto_id requeridos.' }, { status: 400 })
    }

    // Validar que sea imagen y no muy pesada (máx 5 MB)
    const EXTENSIONES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
    const extension = file ? EXTENSIONES[file.type] : undefined
    if (!extension) {
      return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG o WebP.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no debe superar 5 MB.' }, { status: 400 })
    }

    const productoNum = parseInt(productoId)
    if (!Number.isInteger(productoNum) || productoNum <= 0) {
      return NextResponse.json({ error: 'Producto no válido.' }, { status: 400 })
    }
    // Ruta: producto/usuario/timestamp.ext
    const fileName = `${productoNum}/${userId}/${Date.now()}.${extension}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('resenas')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error subiendo foto de reseña:', uploadError)
      return NextResponse.json({ error: 'No se pudo subir la imagen.' }, { status: 500 })
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
