const fs = require('fs');
const path = 'C:/Users/gmgli/vitalora/app/api/admin/pedidos/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');

const buscar = "return NextResponse.json({ error: 'Error al cargar pedido' }, { status: 500 })";
const reemplazo = "return NextResponse.json({ error: 'Error al cargar pedido', detalle: String(err), msg: (err && err.message) || null }, { status: 500 })";

if (c.includes(buscar)) {
  c = c.split(buscar).join(reemplazo);
  fs.writeFileSync(path, c, 'utf8');
  console.log('OK - error expuesto');
} else {
  console.log('NO ENCONTRADO - el texto a buscar no esta en el archivo');
}
