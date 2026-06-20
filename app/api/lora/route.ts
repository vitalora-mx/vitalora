import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Límite de mensajes por sesión
const LIMITE_MENSAJES = 10

// Cache simple en memoria para el catálogo (se refresca cada 10 minutos)
let catalogoCache: string | null = null
let catalogoCacheTime = 0
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

async function obtenerCatalogo(): Promise<string> {
  const ahora = Date.now()
  if (catalogoCache && ahora - catalogoCacheTime < CACHE_TTL) {
    return catalogoCache
  }

  const { data: productos } = await supabase
    .from('productos')
    .select(`
      id, nombre, slug, descripcion, precio, categoria, activo,
      ingredientes_clave, tipo_piel, beneficios, modo_uso,
      producto_variantes (nombre, stock)
    `)
    .eq('activo', true)
    .order('nombre')

  if (!productos || productos.length === 0) {
    return 'Catálogo no disponible en este momento.'
  }

  const lineas = productos.map(p => {
    const variantes = p.producto_variantes?.length > 0
      ? ` | Variantes: ${p.producto_variantes.map((v: { nombre: string; stock: number }) => `${v.nombre} (stock: ${v.stock})`).join(', ')}`
      : ''
    const tipoPiel = p.tipo_piel ? ` | Tipo de piel: ${p.tipo_piel}` : ''
    const beneficios = p.beneficios ? ` | Beneficios: ${p.beneficios}` : ''
    const ingredientes = p.ingredientes_clave ? ` | Ingredientes clave: ${p.ingredientes_clave}` : ''
    const modoUso = p.modo_uso ? ` | Cómo usar: ${p.modo_uso}` : ''
    const precio = `$${p.precio?.toLocaleString('es-MX')} MXN`
    const url = `https://vitalora.com.mx/${p.categoria === 'cosmeticos' ? 'cosmeticos' : 'suplementos'}/${p.slug}`

    return `- ${p.nombre} | Categoría: ${p.categoria} | Precio: ${precio}${tipoPiel}${beneficios}${ingredientes}${modoUso}${variantes} | URL: ${url}`
  })

  catalogoCache = lineas.join('\n')
  catalogoCacheTime = ahora
  return catalogoCache
}

const SISTEMA = (catalogo: string) => `Eres Lora, la asesora de belleza y bienestar de Vitalora, una tienda mexicana especializada en cosméticos K-Beauty y suplementos naturales de alta calidad.

Tu personalidad:
- Cálida, experta y cercana — como una amiga que sabe mucho de skincare
- Hablas en español mexicano natural, sin ser demasiado formal
- Eres entusiasta pero honesta: no recomiendas algo que no sea adecuado para el cliente
- Usas emojis con moderación para dar calidez ✨

Tu misión:
- Ayudar a encontrar el producto perfecto según el tipo de piel, objetivos o preocupaciones del cliente
- Crear rutinas de skincare personalizadas con los productos de Vitalora
- Responder dudas sobre ingredientes, beneficios y modo de uso
- Orientar sobre suplementos según objetivos de bienestar
- Siempre incluir el link del producto cuando lo recomiendes

Reglas importantes:
- SOLO recomienda productos del catálogo de Vitalora que se muestra abajo
- Si no tienes un producto adecuado para lo que pide el cliente, dilo honestamente y sugiere lo más cercano
- Cuando recomiendes un producto, incluye siempre su URL para que puedan comprarlo
- Si un producto tiene stock 0 en todas sus variantes, no lo recomiendes
- Mantén respuestas concisas pero completas — máximo 3-4 párrafos
- Si te preguntan algo fuera de skincare/bienestar/productos, redirige amablemente a tu área de expertise

CATÁLOGO ACTUAL DE VITALORA:
${catalogo}

Recuerda: eres la cara de Vitalora, representa la marca con calidez y profesionalismo.`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, sessionMessageCount = 0 } = body

    // Validar límite de mensajes
    if (sessionMessageCount >= LIMITE_MENSAJES) {
      return NextResponse.json({
        respuesta: `Has alcanzado el límite de ${LIMITE_MENSAJES} mensajes por sesión. ¡Espero haberte ayudado! Si tienes más dudas, puedes contactarnos en hola@vitalora.com.mx 💌`,
        limitAlcanzado: true,
      })
    }

    // Validar que hay mensajes
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 })
    }

    // Obtener catálogo actualizado
    const catalogo = await obtenerCatalogo()

    // Llamar a Claude
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SISTEMA(catalogo),
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const respuesta = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.'

    return NextResponse.json({
      respuesta,
      limitAlcanzado: false,
      mensajesRestantes: LIMITE_MENSAJES - sessionMessageCount - 1,
    })

  } catch (err) {
    console.error('Error Lora API:', err)
    return NextResponse.json({
      respuesta: 'Lo siento, tuve un problema técnico. Intenta de nuevo en un momento 🙏',
      error: true,
    })
  }
}
