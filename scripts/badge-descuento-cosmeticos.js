const fs = require('fs');

const ruta = 'components/store/cosmeticos/CosmeticosProductos.tsx';
let c = fs.readFileSync(ruta, 'utf8');
let cambios = 0;

// ---------------------------------------------------------------
// 1) Badge flotante sobre la imagen (esquina superior derecha)
// ---------------------------------------------------------------
const anclaImg = "justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>";

const badgeFlotante = anclaImg + `
                      {producto.precio_original && producto.precio_original > producto.precio && producto.stock !== 0 && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '5px 11px', background: '#0E0E0E', color: 'var(--gold)', fontSize: '11px', letterSpacing: '0.06em', borderRadius: '2px', zIndex: 3, fontWeight: 700 }}>
                          -{Math.round(((producto.precio_original - producto.precio) / producto.precio_original) * 100)}%
                        </div>
                      )}`;

if (c.indexOf(anclaImg) === -1) {
  console.log('ERROR: no se encontro el ancla de la imagen');
  process.exit(1);
}
c = c.split(anclaImg).join(badgeFlotante);
cambios++;
console.log('OK - badge flotante insertado');

// ---------------------------------------------------------------
// 2) Badge junto al precio
// ---------------------------------------------------------------
const anclaPrecio = "fontWeight: 600, color: '#0E0E0E' }}>${producto.precio.toLocaleString()} MXN</span>";

const badgePrecio = anclaPrecio + `
                          {producto.precio_original && producto.precio_original > producto.precio && (
                            <span style={{ marginLeft: '8px', padding: '3px 8px', background: 'rgba(201,169,97,0.15)', color: 'var(--gold)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', borderRadius: '2px', whiteSpace: 'nowrap' }}>
                              -{Math.round(((producto.precio_original - producto.precio) / producto.precio_original) * 100)}%
                            </span>
                          )}`;

if (c.indexOf(anclaPrecio) === -1) {
  console.log('ERROR: no se encontro el ancla del precio');
  process.exit(1);
}
c = c.split(anclaPrecio).join(badgePrecio);
cambios++;
console.log('OK - badge junto al precio insertado');

fs.writeFileSync(ruta, c, 'utf8');
console.log('Listo. Cambios aplicados: ' + cambios);
