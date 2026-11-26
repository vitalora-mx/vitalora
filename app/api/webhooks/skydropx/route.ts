import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { registrarEvento } from '@/lib/rastreo'

// ============================================================
// POST /api/webhooks/skydropx — avisos de rastreo de Skydropx.
// Firma: HMAC-SHA512 del cuerpo exacto con la clave secreta, en hex, en el
// encabezado "Authorization: HMAC <firma>" (como lo manda Skydropx).
// La misma URL sirve para producción y sandbox: la clave que coincide dice de
// qué entorno es el aviso, y solo se tocan pedidos con guía de ese entorno.
// Siempre responde rápido; un aviso que no corresponde a un pedido se ignora con 200.
// ============================================================
export const maxDuration = 30

function firmaValida(cuerpo: string, recibida: string, secreto: string): boolean {
  if (!secreto) return false
  const esperada = createHmac('sha512', secreto).update(cuerpo, 'utf8').digest('hex')
  const a = Buffer.from(esperada, 'utf8')
  const b = Buffer.from(recibida.toLowerCase(), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

function leerFirma(req: NextRequest): string {
  const valor = (req.headers.get('authorization') || '').trim()
  const m = /^hmac\s+([a-f0-9]+)$/i.exec(valor)
  return m ? m[1] : ''
}

export async function POST(req: NextRequest) {
  const cuerpo = await req.text()
  const firma = leerFirma(req)
  let entorno: 'produccion' | 'sandbox' | null = null
  if (firma && firmaValida(cuerpo, firma, (process.env.SKYDROPX_WEBHOOK_SECRET || '').trim())) entorno = 'produccion'
  else if (firma && firmaValida(cuerpo, firma, (process.env.SKYDROPX_SANDBOX_WEBHOOK_SECRET || '').trim())) entorno = 'sandbox'
  if (!entorno) {
    console.warn('Webhook Skydropx: firma no válida')
    return NextResponse.json({ error: 'Firma no válida' }, { status: 401 })
  }

  let json: any
  try { json = JSON.parse(cuerpo) } catch { return NextResponse.json({ ok: true, ignorado: 'cuerpo no es JSON' }) }

  // Formato JSON:API: data.attributes.{status, tracking_number}; el envío en relationships.shipment
  const d = json?.data || {}
  const a = d.attributes || {}
  const estado = String(a.status || a.tracking_status || a.event || '').toLowerCase()
  const numeroGuia = String(a.tracking_number || a.master_tracking_number || '').trim()
  // El envío puede venir como id suelto o solo como enlace (relationships.shipment.links.related = …/shipments/<id>)
  const enlaceEnvio = String(d.relationships?.shipment?.links?.related || d.relationships?.shipment?.links?.self || '')
  const idDelEnlace = /\/shipments\/([0-9a-f-]{36})/i.exec(enlaceEnvio)?.[1] || ''
  const shipmentId = String(d.relationships?.shipment?.data?.id || a.shipment_id || idDelEnlace || (d.type === 'shipment' ? d.id : '') || '').trim()
  if (!estado || (!numeroGuia && !shipmentId)) {
    console.log('Webhook Skydropx: aviso sin estado o sin guía', JSON.stringify(json).slice(0, 500))
    return NextResponse.json({ ok: true, ignorado: 'sin estado o guía' })
  }

  const db = createServiceClient()
  let consulta = db.from('pedidos').select('id, guia_entorno').eq('guia_entorno', entorno)
  consulta = numeroGuia ? consulta.eq('numero_guia', numeroGuia) : consulta.eq('skydropx_shipment_id', shipmentId)
  let { data: pedido } = await consulta.maybeSingle()
  if (!pedido && numeroGuia && shipmentId) {
    ({ data: pedido } = await db.from('pedidos').select('id, guia_entorno').eq('guia_entorno', entorno).eq('skydropx_shipment_id', shipmentId).maybeSingle())
  }
  if (!pedido) {
    console.log(`Webhook Skydropx (${entorno}): guía ${numeroGuia || '(sin número)'} / envío ${shipmentId || '(sin id)'} no corresponde a ningún pedido`)
    return NextResponse.json({ ok: true, ignorado: 'guía desconocida' })
  }

  const fecha = a.updated_at || a.event_date || a.date || null
  const f = fecha ? new Date(fecha) : null
  try {
    await registrarEvento(pedido.id, {
      estado,
      descripcion: a.tracking_status_display_name || a.description || a.event_description || null,
      ubicacion: a.location ? String(a.location).slice(0, 200) : null,
      fecha: f && !isNaN(f.getTime()) ? f.toISOString() : null,
      fuente: 'webhook',
      payload: json,
    })
  } catch (e) {
    console.error('Webhook Skydropx: error al registrar', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
