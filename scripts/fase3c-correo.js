const fs = require('fs')
const archivo = 'app/api/webhooks/mercadopago/route.ts'
let c = fs.readFileSync(archivo, 'utf8')

// Insertamos el correo justo despues del insert de la comision, antes del catch de la funcion
const buscar = `    await supabaseAdmin
      .from('influencer_comisiones')
      .insert({
        influencer_id: codigo.influencer_id,
        pedido_id: pedido.id,
        subtotal_venta: subtotalVenta,
        monto_comision: montoComision,
        estado: 'pendiente',
      })

  } catch (e) {
    console.error('Error al procesar comisión de influencer:', e)
  }
}`

const reemplazar = `    await supabaseAdmin
      .from('influencer_comisiones')
      .insert({
        influencer_id: codigo.influencer_id,
        pedido_id: pedido.id,
        subtotal_venta: subtotalVenta,
        monto_comision: montoComision,
        estado: 'pendiente',
      })

    // ─── Correo de notificación al influencer ───
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
        const costoEnvioPedido = pedido.costo_envio != null ? pedido.costo_envio : 0
        const totalPedido = pedido.total != null ? pedido.total : (subtotalVenta + costoEnvioPedido)

        const filasProductos = listaItems.map((it) => \`
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#333;border-bottom:1px solid #EEE;">\${it.marca ? it.marca + ' - ' : ''}\${it.nombre}\${it.variante_nombre ? ' (' + it.variante_nombre + ')' : ''}</td>
            <td style="padding:10px 14px;font-size:13px;color:#333;text-align:center;border-bottom:1px solid #EEE;">\${it.cantidad}</td>
            <td style="padding:10px 14px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #EEE;">$\${(it.precio * it.cantidad).toLocaleString()} MXN</td>
          </tr>\`).join('')

        const desgloseComision = tipoComision === 'monto_fijo'
          ? \`\${totalPiezas} pieza(s) × $\${comisionValor} = <strong>$\${montoComision.toLocaleString()} MXN</strong>\`
          : \`\${comisionValor}% de $\${subtotalVenta.toLocaleString()} (subtotal sin envío) = <strong>$\${montoComision.toLocaleString()} MXN</strong>\`

        const htmlInfluencer = \`<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:white;">
            <div style="background:#0E0E0E;padding:28px;text-align:center;">
              <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="130" style="display:block;margin:0 auto;max-width:130px;height:auto;" />
              <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:6px;">NUEVA VENTA CON TU CÓDIGO</div>
            </div>
            <div style="padding:32px;">
              <h2 style="font-size:22px;color:#0E0E0E;margin:0 0 8px;">¡Felicidades, \${inf.nombre}! 🎉</h2>
              <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">Se realizó una venta usando tu código <strong>\${pedido.codigo_descuento}</strong>.</p>
              <div style="background:#F0F7F0;border:1px solid #A8C5A0;border-radius:6px;padding:20px;margin-bottom:28px;text-align:center;">
                <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6B8F6B;margin-bottom:6px;">Tu comisión por esta venta</div>
                <div style="font-size:32px;font-weight:700;color:#3A5A3A;">$\${montoComision.toLocaleString()} MXN</div>
              </div>
              <h3 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Pedido \${formatearNumeroPedido(pedido.id)}</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead><tr>
                  <th style="padding:10px 14px;text-align:left;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Producto</th>
                  <th style="padding:10px 14px;text-align:center;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Cant.</th>
                  <th style="padding:10px 14px;text-align:right;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Precio</th>
                </tr></thead>
                <tbody>\${filasProductos}</tbody>
              </table>
              <table style="width:100%;">
                <tr><td style="font-size:13px;color:#888;padding:4px 0;">Piezas totales</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">\${totalPiezas}</td></tr>
                <tr><td style="font-size:13px;color:#888;padding:4px 0;">Subtotal</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">$\${subtotalVenta.toLocaleString()} MXN</td></tr>
                <tr><td style="font-size:13px;color:\${costoEnvioPedido === 0 ? '#6B8F6B' : '#888'};padding:4px 0;">Envío</td><td style="font-size:13px;color:\${costoEnvioPedido === 0 ? '#6B8F6B' : '#333'};text-align:right;padding:4px 0;">\${costoEnvioPedido === 0 ? 'Gratis' : '$' + costoEnvioPedido + ' MXN'}</td></tr>
                <tr><td style="font-size:15px;font-weight:600;color:#0E0E0E;padding:8px 0 4px;border-top:2px solid #0E0E0E;">Total pagado</td><td style="font-size:15px;font-weight:600;color:#0E0E0E;text-align:right;padding:8px 0 4px;border-top:2px solid #0E0E0E;">$\${totalPedido.toLocaleString()} MXN</td></tr>
                <tr><td style="font-size:13px;color:#888;padding:4px 0;">Ciudad de entrega</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">\${pedido.ciudad || 'No especificada'}</td></tr>
              </table>
              <div style="margin-top:24px;padding:16px;background:#FAFAF5;border-radius:6px;">
                <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin-bottom:8px;">Cómo se calculó tu comisión</div>
                <p style="font-size:13px;color:#555;line-height:1.6;margin:0;">\${desgloseComision}</p>
              </div>
            </div>
            <div style="background:#0E0E0E;padding:28px;text-align:center;">
              <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0 0 8px;">Consulta tu portal de embajadora en</p>
              <a href="https://vitalora.com.mx/influencer/portal" style="font-size:13px;color:#C9A961;text-decoration:none;">vitalora.com.mx/influencer/portal</a>
            </div>
          </div>
        </body></html>\`

        await resend.emails.send({
          from: 'Vitalora <hola@vitalora.com.mx>',
          to: inf.email,
          subject: \`¡Nueva venta con tu código! 🎉 - $\${montoComision.toLocaleString()} MXN de comisión\`,
          html: htmlInfluencer,
        })
      }
    } catch (correoInfError) {
      console.error('Error enviando correo al influencer:', correoInfError)
    }

  } catch (e) {
    console.error('Error al procesar comisión de influencer:', e)
  }
}`

if (!c.includes(buscar)) {
  console.log('ERROR: no se encontro el bloque de insert de comision. NO se modifico nada.')
  process.exit(1)
}

c = c.replace(buscar, reemplazar)
fs.writeFileSync(archivo, c, 'utf8')
console.log('OK: correo al influencer agregado correctamente.')