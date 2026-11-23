import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { permitirIp } from '@/lib/limites'
import { origenValido } from '@/lib/cliente-auth'
import { SUPLEMENTOS_ACTIVO, productoVisible } from '@/lib/tienda'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIMITE_MENSAJES = 10
// Límite real (en el servidor) por IP: cada llamada gasta créditos de la API de Anthropic
const MAX_POR_HORA = 20
const MAX_POR_DIA = 60
const MAX_HISTORIAL = 20          // mensajes enviados al modelo
const MAX_CHARS_USUARIO = 1000
const MAX_CHARS_LORA = 6000        // respuestas previas de Lora (hasta 1024 tokens)

type MensajeApi = { role: 'user' | 'assistant'; content: string }

// Valida el historial: solo user/assistant, alternados, empieza y termina en user, con largos máximos.
function limpiarHistorial(messages: unknown): MensajeApi[] | null {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 60) return null
  const lista: MensajeApi[] = []
  for (const m of messages) {
    const role = (m as { role?: unknown })?.role
    const content = (m as { content?: unknown })?.content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const max = role === 'user' ? MAX_CHARS_USUARIO : MAX_CHARS_LORA
    if (role === 'user' && content.length > MAX_CHARS_USUARIO) return null
    lista.push({ role, content: content.slice(0, max) })
  }
  // Quedarse con los últimos MAX_HISTORIAL, empezando en un mensaje del usuario
  let recorte = lista.slice(-MAX_HISTORIAL)
  while (recorte.length && recorte[0].role !== 'user') recorte = recorte.slice(1)
  if (!recorte.length || recorte[recorte.length - 1].role !== 'user') return null
  for (let i = 1; i < recorte.length; i++) {
    if (recorte[i].role === recorte[i - 1].role) return null
  }
  return recorte
}

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

  // Con los suplementos pausados (lib/tienda.ts) Lora no los ve en el catálogo
  const conStock = productos.filter(productoVisible).map(p => {
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
    const url = `https://vitalora.com.mx/${ruta}/producto/${p.slug}`

    return `- ${p.nombre} [${disponibilidad}] | Tipo: ${p.tipo} | Precio: ${precio}${descripcion}${beneficios}${ingredientes}${paraQuien}${comoUsar}${comoTomar}${variantes} | URL: ${url}`
  })

  catalogoCache = lineas.join('\n')
  catalogoCacheTime = ahora
  return catalogoCache
}

// Personalidad por defecto (respaldo si la tabla lora_config falla o esta vacia)
const PERSONALIDAD_DEFAULT = `Eres Lora, la asesora de belleza y bienestar de Vitalora, una tienda mexicana especializada en ${SUPLEMENTOS_ACTIVO ? "cosméticos K-Beauty y suplementos naturales de alta calidad" : "cosméticos K-Beauty auténticos"}.

Tu personalidad:
- Cálida, experta y cercana — como una amiga que sabe mucho de skincare
- Hablas en español mexicano natural, sin ser demasiado formal
- Eres entusiasta pero honesta: no recomiendas algo que no sea adecuado para el cliente
- Usas emojis con moderación para dar calidez ✨

Tu misión:
- Ayudar a encontrar el producto perfecto según el tipo de piel, objetivos o preocupaciones del cliente
- Crear rutinas de skincare personalizadas con los productos de Vitalora
- Responder dudas sobre ingredientes, beneficios y modo de uso
${SUPLEMENTOS_ACTIVO ? "- Orientar sobre suplementos según objetivos de bienestar" : "- Explicar cómo cuidar la piel paso a paso"}

FLUJO DE DIAGNÓSTICO PARA RUTINA PERSONALIZADA:
Cuando el cliente pida una rutina para atacar un problema, una rutina personalizada o algo similar, NO recomiendes productos de inmediato. Primero haz un breve diagnóstico haciendo estas preguntas DE UNA EN UNA (haz una pregunta, espera la respuesta, y luego la siguiente — nunca todas juntas):

1. PROBLEMA A ATACAR: Pregunta primero qué problema principal le gustaría resolver y dale una lista de entre 5 y 10 opciones concretas que tus productos (${SUPLEMENTOS_ACTIVO ? "cosméticos y suplementos" : "cosméticos"}) puedan ayudar a tratar. Por ejemplo: acné y granitos, poros dilatados, exceso de grasa, manchas oscuras o hiperpigmentación, líneas de expresión y arrugas, piel deshidratada o reseca, opacidad y falta de luminosidad, rojeces o irritación, textura desigual, falta de firmeza${SUPLEMENTOS_ACTIVO ? ", o energía y bienestar desde adentro" : ""}. Siempre incluye una opción de "Otro (cuéntame cuál)". Ajusta las opciones según lo que realmente puedas tratar con tu catálogo.

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
Siempre que hagas una recomendación de producto${SUPLEMENTOS_ACTIVO ? ", rutina o suplemento" : " o rutina"}, termina tu mensaje con una nota breve en cursiva como esta (puedes variar la redacción):
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
${SUPLEMENTOS_ACTIVO ? '' : `
AVISO TEMPORAL: por ahora Vitalora solo vende cosméticos. Si el cliente pregunta por suplementos, vitaminas o productos de bienestar para tomar, dile con amabilidad que no están disponibles temporalmente y ofrécele ayuda con su rutina de cuidado de la piel. No recomiendes suplementos aunque se mencionen arriba.
`}
Recuerda: eres la cara de Vitalora, representa la marca con calidez y profesionalismo. El catálogo de arriba es tu única fuente de verdad sobre qué productos existen.`

export async function POST(request: Request) {
  try {
    if (!origenValido(request)) {
      return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const historial = limpiarHistorial(body?.messages)
    if (!historial) {
      return NextResponse.json({ error: 'Mensaje no válido. Escribe máximo 1000 caracteres.' }, { status: 400 })
    }

    // Límite por sesión: se cuenta en el servidor con los mensajes del usuario en el historial
    const enviadosAntes = Math.max(
      Number.isFinite(Number(body?.sessionMessageCount)) ? Number(body.sessionMessageCount) : 0,
      (Array.isArray(body?.messages) ? body.messages : []).filter((m: { role?: string }) => m?.role === 'user').length - 1,
    )
    const sessionMessageCount = Math.max(0, enviadosAntes)

    if (sessionMessageCount >= LIMITE_MENSAJES) {
      return NextResponse.json({
        respuesta: `Has alcanzado el límite de ${LIMITE_MENSAJES} mensajes por sesión. ¡Espero haberte ayudado! Si tienes más dudas, puedes contactarnos en hola@vitalora.com.mx 💌`,
        limitAlcanzado: true,
      })
    }

    // Límite por IP (el que de verdad protege los créditos)
    if (!(await permitirIp(request, 'lora', MAX_POR_HORA, MAX_POR_DIA))) {
      return NextResponse.json({
        respuesta: 'Recibimos muchos mensajes desde tu conexión. Intenta más tarde o escríbenos a hola@vitalora.com.mx 💌',
        limitAlcanzado: true,
      }, { status: 429 })
    }

    const catalogo = await obtenerCatalogo()
    const personalidad = await obtenerPersonalidad()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SISTEMA(personalidad, catalogo),
      messages: historial,
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
