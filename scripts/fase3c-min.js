const fs = require('fs')
const archivo = 'app/api/webhooks/mercadopago/route.ts'
let c = fs.readFileSync(archivo, 'utf8')

const usaCRLF = c.includes('\r\n')
c = c.replace(/\r\n/g, '\n')

const importBuscar = `import { NextRequest, NextResponse } from 'next/server'`
const importNuevo = `import { NextRequest, NextResponse } from 'next/server'
import { generarCorreoInfluencer } from '@/lib/correoInfluencer'`

const bloqueBuscar = `        estado: 'pendiente',
      })

  } catch (e) {
    console.error('Error al procesar comisión de influencer:', e)
  }`

const bloqueNuevo = `        estado: 'pendiente',
      })

    try {
      const { data: inf } = await supabaseAdmin
        .from('influencers')
        .select('nombre, email')
        .eq('id', codigo.influencer_id)
        .maybeSingle()

      if (inf && inf.email) {
        const { data: itemsCorreo } = await supabaseAdmin
          .from('pedido_items')
          .select('nombre, marca, precio, cantidad, variante_nombre')
          .eq('pedido_id', pedido.id)

        const listaItems = itemsCorreo || []
        const totalPiezas = listaItems.reduce((s, it) => s + (it.cantidad || 0), 0)
        const costoEnvioPedido = pedido.costo_envio != null ? Number(pedido.costo_envio) : 0
        const totalPedido = pedido.total != null ? Number(pedido.total) : (subtotalVenta + costoEnvioPedido)

        const correo = generarCorreoInfluencer({
          nombreInfluencer: inf.nombre || 'Embajadora',
          codigo: pedido.codigo_descuento,
          numeroPedido: formatearNumeroPedido(pedido.id),
          items: listaItems,
          totalPiezas,
          subtotal: subtotalVenta,
          costoEnvio: costoEnvioPedido,
          total: totalPedido,
          ciudad: pedido.ciudad || '',
          montoComision,
          tipoComision,
          comisionValor,
        })

        await resend.emails.send({
          from: 'Vitalora <hola@vitalora.com.mx>',
          to: inf.email,
          subject: correo.asunto,
          html: correo.html,
        })
      }
    } catch (correoInfError) {
      console.error('Error enviando correo al influencer:', correoInfError)
    }

  } catch (e) {
    console.error('Error al procesar comisión de influencer:', e)
  }`

if (!c.includes(importBuscar)) {
  console.log('ERROR: no se encontro el import. NO se modifico nada.')
  process.exit(1)
}
if (!c.includes(bloqueBuscar)) {
  console.log('ERROR: no se encontro el bloque de comision. NO se modifico nada.')
  process.exit(1)
}

c = c.replace(importBuscar, importNuevo)
c = c.replace(bloqueBuscar, bloqueNuevo)

if (usaCRLF) c = c.replace(/\n/g, '\r\n')

fs.writeFileSync(archivo, c, 'utf8')
console.log('OK: webhook conectado con el generador de correo.')