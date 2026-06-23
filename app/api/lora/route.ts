import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIMITE_MENSAJES = 10

// Cache del catalogo
let catalogoCache: string | null = null
let catalogoCacheTime = 0
const CACHE_TTL = 10 * 60 * 1000

// Cache de la personalidad (editable desde el admin)
let personalidadCache: string | null = null
let personalidadCacheTime = 0
const PERSONALIDAD_TTL = 2 * 60 * 1000

async function obtenerCatalogo(): Promise<string> {
  const ahora = Date.now()
  if (catalogoCache && ahora - catalogoCacheTime < CACHE_TTL) {
    return catalogoCache
  }

  const { data: productos, error } = await supabase
    .from('productos')
    .select(`
      id, nombre, slug, descripcion, precio, categoria, tipo, activo, stock,
      ingredientes, como_usar, beneficios, para_quien, como_tomar, advertencias,
      producto_variantes (nombre, stock)
    `)
    .eq('activo', true)
    .order('nombre')

  if (error) {
    console.error('Error al obtener catalogo:', error)
    return 'Catalogo no disponible en este momento.'
  }

  if (!productos || productos.length === 0) {
    return 'Catalogo no disponible en este momento.'
  }

  const conStock = productos.map(p => {
    const stockTotal = p.producto_variantes?.length > 0
      ? p.producto_variantes.reduce((a: number, v: { stock: number }) => a + (v.stock ?? 0), 0)
      : (p.stock ?? 0)
    return { ...p, stockTotal }
  })

  conStock.sort((a, b) => b.stockTotal - a.stockTotal)

  const lineas = conStock.map(p => {
    const variantes = p.producto_variantes?.length > 0
      ? ` | Variantes: ${p.producto_variantes.map((v: { nombre: string; stock: number }) => `${v.nombre} (stock: ${v.stock})`).join(', ')}`
      : ''
    const beneficios = Array.isArray(p.beneficios) && p.beneficios.length > 0
      ? ` | Beneficios: ${p.beneficios.join(', ')}`
      : ''
    const ingredientes = p.ingredientes ? ` | Ingredientes: ${p.ingredientes}` : ''
    const comoUsar = p.como_usar ? ` | Como usar: ${p.como_usar}` : ''
    const comoTomar = p.como_tomar ? ` | Como tomar: ${p.como_tomar}` : ''
    const paraQuien = p.para_quien ? ` | Para quien: ${p.para_quien}` : ''
    const descripcion = p.descripcion ? ` | Descripcion: ${p.descripcion}` : ''
    const disponibilidad = p.stockTotal > 0 ? `EN STOCK (${p.stockTotal} uds.)` : 'AGOTADO'
    const precio = `$${p.precio?.toLocaleString('es-MX')} MXN`
    const ruta = p.tipo === 'cosmetico' ? 'cosmeticos' : 'suplementos'
    const url = `https://vitalora.com.mx/${ruta}/${p.slug}`

    return `- ${p.nombre} [${disponibilidad}] | Tipo: ${p.tipo} | Precio: ${precio}${descripcion}${beneficios}${ingredientes}${paraQuien}${comoUsar}${comoTomar}${variantes} | URL: ${url}`
  })

  catalogoCache = lineas.join('\n')
  catalogoCacheTime = ahora
  return catalogoCache
}

// Personalidad por defecto (respaldo si la tabla lora_config falla o esta vacia)
const PERSONALIDAD_DEFAULT = `Eres Lora, la asesora de belleza y bienestar de Vitalora, una tienda mexicana especializada en cosméticos K-Beauty y suplementos naturales de alta calidad.

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

FLUJO DE DIAGNÓSTICO PARA RUTINA PERSONALIZADA:
Cuando el cliente pida una rutina para atacar un problema, una rutina personalizada o algo similar, NO recomiendes productos de inmediato. Primero haz un breve diagnóstico haciendo estas preguntas DE UNA EN UNA (haz una pregunta, espera la respuesta, y luego la siguiente — nunca todas juntas):

1. PROBLEMA A ATACAR: Pregunta primero qué problema principal le gustaría resolver y dale una lista de entre 5 y 10 opciones concretas que tus productos (cosméticos y suplementos) puedan ayudar a tratar. Por ejemplo: acné y granitos, poros dilatados, exceso de grasa, manchas oscuras o hiperpigmentación, líneas de expresión y arrugas, piel deshidratada o reseca, opacidad y falta de luminosidad, rojeces o irritación, textura desigual, falta de firmeza, o energía y bienestar desde adentro. Siempre incluye una opción de "Otro (cuéntame cuál)". Ajusta las opciones según lo que realmente puedas tratar con tu catálogo.

2. TIPO DE PIEL: Pregunta su tipo de piel con opciones: piel grasa, piel seca, piel mixta, piel sensible, o piel normal.

3. ALERGIAS Y SENSIBILIDADES: Pregunta de forma clara si es alérgico/a o sensible a algún ingrediente o tipo de producto (por ejemplo: fragancias, ácidos, retinol, ciertos activos, etc.), o si ha tenido alguna reacción previa con productos de skincare. Esto es importante para no recomendarle algo que le cause una reacción.

4. PREFERENCIAS (opcional): Pregunta si tiene alguna preferencia como texturas ligeras, rutina corta y simple, o un presupuesto específico.

Después de tener esta información, arma una rutina completa paso a paso (limpieza, tratamiento, hidratación, protección de día) con los productos de Vitalora que mejor se ajusten, evitando cualquier ingrediente al que el cliente haya indicado ser alérgico o sensible.

Reglas importantes:
- SOLO recomienda productos del catálogo de Vitalora que se muestra abajo. NUNCA digas que no tienes acceso al catálogo: el catálogo está aquí mismo.
- PRIORIDAD DE INVENTARIO: cuando varios productos sirvan para el mismo problema o paso de la rutina, recomienda PRIMERO los que tengan MAYOR inventario disponible (el catálogo está ordenado de mayor a menor stock). Solo recomienda uno con menor stock si el cliente lo pide específicamente o si es claramente el más adecuado para su caso.
- Si no tienes un producto adecuado para lo que pide el cliente, dilo honestamente y sugiere lo más cercano del catálogo
- Cuando recomiendes un producto, incluye siempre su URL completa para que puedan comprarlo
- Si un producto está marcado como AGOTADO, no lo recomiendes (o avisa que está temporalmente agotado)
- Mantén respuestas concisas pero completas
- Si te preguntan algo fuera de skincare/bienestar/productos, redirige amablemente a tu área de expertise

AVISO MÉDICO OBLIGATORIO:
Siempre que hagas una recomendación de producto, rutina o suplemento, termina tu mensaje con una nota breve en cursiva como esta (puedes variar la redacción):
_Recuerda: soy tu asesora de belleza, no un sustituto de un dermatólogo o médico. Te recomiendo hacer una prueba de parche antes de usar un producto nuevo, y si tienes una condición de piel persistente, alergias o tomas medicamentos, consulta a un profesional de salud._`

async function obtenerPersonalidad(): Promise<string> {
  const ahora = Date.now()
  if (personalidadCache && ahora - personalidadCacheTime < PERSONALIDAD_TTL) {
    return personalidadCache
  }
  try {
    const { data } = await supabase
      .from('lora_config')
      .select('personalidad')
      .eq('id', 1)
      .single()
    if (data?.personalidad) {
      personalidadCache = data.personalidad
      personalidadCacheTime = ahora
      return data.personalidad
    }
  } catch (e) {
    console.error('Error al obtener personalidad de LORA:', e)
  }
  return PERSONALIDAD_DEFAULT
}

// Arma el system prompt final: personalidad (editable) + catalogo (dinamico)
const SISTEMA = (personalidad: string, catalogo: string) => `${personalidad}

CATÁLOGO ACTUAL DE VITALORA (productos reales, ordenados de mayor a menor inventario):
${catalogo}

Recuerda: eres la cara de Vitalora, representa la marca con calidez y profesionalismo. El catálogo de arriba es tu única fuente de verdad sobre qué productos existen.`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, sessionMessageCount = 0 } = body

    if (sessionMessageCount >= LIMITE_MENSAJES) {
      return NextResponse.json({
        respuesta: `Has alcanzado el límite de ${LIMITE_MENSAJES} mensajes por sesión. ¡Espero haberte ayudado! Si tienes más dudas, puedes contactarnos en hola@vitalora.com.mx 💌`,
        limitAlcanzado: true,
      })
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 })
    }

    const catalogo = await obtenerCatalogo()
    const personalidad = await obtenerPersonalidad()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SISTEMA(personalidad, catalogo),
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
