const fs = require('fs');
const path = 'C:/Users/gmgli/vitalora/app/api/admin/pedidos/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');

let cambios = [];

// 1. Usar alias: la columna real es rfc/razon_social/uso_cfdi, pero el front espera factura_rfc etc.
// Sintaxis de alias en supabase-js: nombre_que_devuelve:columna_real
const selBuscar = "        factura_rfc, factura_razon_social, factura_uso_cfdi, factura_estado,";
const selReempl = "        factura_rfc:rfc, factura_razon_social:razon_social, factura_uso_cfdi:uso_cfdi, factura_estado,";
if (c.includes(selBuscar)) {
  c = c.split(selBuscar).join(selReempl);
  cambios.push('columnas facturacion con alias');
}

// 2. Quitar el debug, volver al catch limpio
const dbgBuscar = "return NextResponse.json({ error: 'Error al cargar pedido', detalle: JSON.stringify(err, Object.getOwnPropertyNames(err)) }, { status: 500 })";
const dbgReempl = "return NextResponse.json({ error: 'Error al cargar pedido' }, { status: 500 })";
if (c.includes(dbgBuscar)) {
  c = c.split(dbgBuscar).join(dbgReempl);
  cambios.push('debug removido');
}

if (cambios.length > 0) {
  fs.writeFileSync(path, c, 'utf8');
  console.log('OK - ' + cambios.join(' | '));
} else {
  console.log('NO ENCONTRADO - revisar manualmente');
}
