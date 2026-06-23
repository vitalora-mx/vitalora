import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Recibe un arreglo de IDs en el nuevo orden deseado.
// La posicion 0 sera la imagen principal.
export async function POST(request: Request) {
  try {
    const { orden } = await request.json() // orden: number[] (ids de producto_imagenes en orden)

    if (!Array.isArray(orden) || orden.length === 0) {
      return NextResponse.json({ error: 'Orden invalido.' }, { status: 400 })
    }

    // Actualizar la posicion de cada imagen segun su indice en el arreglo
    for (let i = 0; i < orden.length; i++) {
      const id = orden[i]
      await supabase
        .from('producto_imagenes')
        .update({ posicion: i })
        .eq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al reordenar imagenes:', err)
    return NextResponse.json({ error: 'Error al reordenar las imagenes.' }, { status: 500 })
  }
}
