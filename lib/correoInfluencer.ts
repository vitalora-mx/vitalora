// lib/correoInfluencer.ts
// Genera el asunto y el HTML del correo de notificación de venta al influencer.

interface ItemPedido {
  nombre: string
  marca: string | null
  precio: number
  cantidad: number
  variante_nombre: string | null
}

interface DatosCorreo {
  nombreInfluencer: string
  codigo: string
  numeroPedido: string
  items: ItemPedido[]
  totalPiezas: number
  subtotal: number
  costoEnvio: number
  total: number
  ciudad: string
  montoComision: number
  tipoComision: string
  comisionValor: number
}

export function generarCorreoInfluencer(d: DatosCorreo): { asunto: string; html: string } {
  const asunto = 'Nueva venta con tu código - $' + d.montoComision.toLocaleString() + ' MXN de comisión'

  const filasProductos = d.items.map(it => {
    const nombreProd = (it.marca ? it.marca + ' - ' : '') + it.nombre + (it.variante_nombre ? ' (' + it.variante_nombre + ')' : '')
    const precioLinea = '$' + (it.precio * it.cantidad).toLocaleString() + ' MXN'
    return '<tr>'
      + '<td style="padding:10px 14px;font-size:13px;color:#333;border-bottom:1px solid #EEE;">' + nombreProd + '</td>'
      + '<td style="padding:10px 14px;font-size:13px;color:#333;text-align:center;border-bottom:1px solid #EEE;">' + it.cantidad + '</td>'
      + '<td style="padding:10px 14px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #EEE;">' + precioLinea + '</td>'
      + '</tr>'
  }).join('')

  const desgloseComision = d.tipoComision === 'monto_fijo'
    ? d.totalPiezas + ' pieza(s) &times; $' + d.comisionValor + ' = <strong>$' + d.montoComision.toLocaleString() + ' MXN</strong>'
    : d.comisionValor + '% de $' + d.subtotal.toLocaleString() + ' (subtotal sin env&iacute;o) = <strong>$' + d.montoComision.toLocaleString() + ' MXN</strong>'

  const envioTexto = d.costoEnvio === 0 ? 'Gratis' : '$' + d.costoEnvio + ' MXN'
  const envioColor = d.costoEnvio === 0 ? '#6B8F6B' : '#333'
  const envioColorLabel = d.costoEnvio === 0 ? '#6B8F6B' : '#888'

  const html = '<html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">'
    + '<div style="max-width:600px;margin:0 auto;background:white;">'
    + '<div style="background:#0E0E0E;padding:28px;text-align:center;">'
    + '<img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="130" style="display:block;margin:0 auto;max-width:130px;height:auto;" />'
    + '<div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:6px;">NUEVA VENTA CON TU C&Oacute;DIGO</div>'
    + '</div>'
    + '<div style="padding:32px;">'
    + '<h2 style="font-size:22px;color:#0E0E0E;margin:0 0 8px;">&iexcl;Felicidades, ' + d.nombreInfluencer + '! &#127881;</h2>'
    + '<p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">Se realiz&oacute; una venta usando tu c&oacute;digo <strong>' + d.codigo + '</strong>.</p>'
    + '<div style="background:#F0F7F0;border:1px solid #A8C5A0;border-radius:6px;padding:20px;margin-bottom:28px;text-align:center;">'
    + '<div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6B8F6B;margin-bottom:6px;">Tu comisi&oacute;n por esta venta</div>'
    + '<div style="font-size:32px;font-weight:700;color:#3A5A3A;">$' + d.montoComision.toLocaleString() + ' MXN</div>'
    + '</div>'
    + '<h3 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A961;margin:0 0 12px;">Pedido ' + d.numeroPedido + '</h3>'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">'
    + '<thead><tr>'
    + '<th style="padding:10px 14px;text-align:left;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Producto</th>'
    + '<th style="padding:10px 14px;text-align:center;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Cant.</th>'
    + '<th style="padding:10px 14px;text-align:right;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;border-bottom:2px solid #E8E0D5;">Precio</th>'
    + '</tr></thead>'
    + '<tbody>' + filasProductos + '</tbody>'
    + '</table>'
    + '<table style="width:100%;">'
    + '<tr><td style="font-size:13px;color:#888;padding:4px 0;">Piezas totales</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">' + d.totalPiezas + '</td></tr>'
    + '<tr><td style="font-size:13px;color:#888;padding:4px 0;">Subtotal</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">$' + d.subtotal.toLocaleString() + ' MXN</td></tr>'
    + '<tr><td style="font-size:13px;color:' + envioColorLabel + ';padding:4px 0;">Env&iacute;o</td><td style="font-size:13px;color:' + envioColor + ';text-align:right;padding:4px 0;">' + envioTexto + '</td></tr>'
    + '<tr><td style="font-size:15px;font-weight:600;color:#0E0E0E;padding:8px 0 4px;border-top:2px solid #0E0E0E;">Total pagado</td><td style="font-size:15px;font-weight:600;color:#0E0E0E;text-align:right;padding:8px 0 4px;border-top:2px solid #0E0E0E;">$' + d.total.toLocaleString() + ' MXN</td></tr>'
    + '<tr><td style="font-size:13px;color:#888;padding:4px 0;">Ciudad de entrega</td><td style="font-size:13px;color:#333;text-align:right;padding:4px 0;">' + (d.ciudad || 'No especificada') + '</td></tr>'
    + '</table>'
    + '<div style="margin-top:24px;padding:16px;background:#FAFAF5;border-radius:6px;">'
    + '<div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A961;margin-bottom:8px;">C&oacute;mo se calcul&oacute; tu comisi&oacute;n</div>'
    + '<p style="font-size:13px;color:#555;line-height:1.6;margin:0;">' + desgloseComision + '</p>'
    + '</div>'
    + '</div>'
    + '<div style="background:#0E0E0E;padding:28px;text-align:center;">'
    + '<p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0 0 8px;">Consulta tu portal de embajadora en</p>'
    + '<a href="https://vitalora.com.mx/influencer/portal" style="font-size:13px;color:#C9A961;text-decoration:none;">vitalora.com.mx/influencer/portal</a>'
    + '</div>'
    + '</div>'
    + '</body></html>'

  return { asunto, html }
}