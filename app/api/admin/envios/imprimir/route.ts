import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { leerEtiqueta, BUCKET_GUIAS } from '@/lib/guias'
import { consultarEnvio, descargarEtiqueta, entornoSkydropx } from '@/lib/skydropx'
import { pdfGuiaYHoja, type PedidoHoja } from '@/lib/hoja-pedido'
import { formatearNumeroPedido } from '@/lib/utils'

// GET /api/admin/envios/imprimir?pedidoId=123            → etiqueta + hoja de pedido (un PDF)
// GET /api/admin/envios/imprimir?pedidoId=123&solo=guia  → solo la etiqueta
// GET /api/admin/envios/imprimir?pedidoId=123&solo=hoja  → solo la hoja de pedido
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdmin(req, '/admin/pedidos')
  if (!adminAuth.ok) return adminAuth.response

  const url = new URL(req.url)
  const pedidoId = Number(url.searchParams.get('pedidoId'))
  const solo = url.searchParams.get('solo')
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 })

  const db = createServiceClient()
  const { data: p } = await db
    .from('pedidos')
    .select('id, created_at, nombre, apellido, subtotal, descuento, descuento_tipo, codigo_descuento, costo_envio, cargo_zona_extendida, total, paqueteria, skydropx_shipment_id, guia_label_path, guia_entorno, pedido_items ( nombre, variante_nombre, cantidad, precio )')
    .eq('id', pedidoId)
    .maybeSingle()
  if (!p) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })

  let etiqueta: Buffer | null = null
  if (solo !== 'hoja') {
    if (p.guia_label_path) etiqueta = await leerEtiqueta(p.guia_label_path)
    // Si no se guardó al crear la guía, se intenta descargar otra vez de Skydropx
    if (!etiqueta && p.skydropx_shipment_id && (!p.guia_entorno || p.guia_entorno === entornoSkydropx())) {
      try {
        const envio = await consultarEnvio(p.skydropx_shipment_id)
        if (envio.etiquetaUrl) {
          etiqueta = await descargarEtiqueta(envio.etiquetaUrl)
          const ruta = `${p.id}/${p.skydropx_shipment_id}.pdf`
          const { error } = await db.storage.from(BUCKET_GUIAS).upload(ruta, etiqueta, { contentType: 'application/pdf', upsert: true })
          if (!error) await db.from('pedidos').update({ guia_label_path: ruta }).eq('id', p.id)
        }
      } catch (e) {
        console.error('Imprimir: no se pudo recuperar la etiqueta', e)
      }
    }
    if (!etiqueta) return NextResponse.json({ error: 'No se encontró la etiqueta de este pedido.' }, { status: 404 })
  }

  // Guía + hoja o solo guía: queda registrado quién y cuándo la imprimió (lo ve cualquier admin)
  if (solo !== 'hoja') {
    await db.from('pedidos').update({ guia_impresa_at: new Date().toISOString(), guia_impresa_por: adminAuth.admin.email }).eq('id', p.id)
  }

  const pdf = solo === 'guia'
    ? new Uint8Array(etiqueta!)
    : await pdfGuiaYHoja(solo === 'hoja' ? null : etiqueta, p as unknown as PedidoHoja, url.origin)
  const paq = String(p.paqueteria || 'paqueteria').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
  const sufijo = solo === 'guia' ? '-solo-guia' : solo === 'hoja' ? '-hoja-pedido' : `-guia-${paq}`
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${formatearNumeroPedido(p.id)}${sufijo}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
