const fs = require('fs');

const ruta = 'components/store/suplementos/SuplementosProductos.tsx';
let c = fs.readFileSync(ruta, 'utf8');
let cambios = 0;

// ---------------------------------------------------------------
// 1) Badge flotante sobre la imagen (esquina superior derecha)
// ---------------------------------------------------------------
const anclaImg = "justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>";

const badgeFlotante = anclaImg + `
                      {producto.precio_original && producto.precio_original > producto.precio && producto.stock !== 0 && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '5px 12px', background: '#6B8F6B', color: 'white', fontSize: '11px', letterSpacing: '0.04em', borderRadius: '100px', zIndex: 3, fontWeight: 700 }}>
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
const anclaPrecio = "fontWeight: 600, color: '#111' }}>${producto.precio.toLocaleString()} MXN</span>";

const badgePrecio = anclaPrecio + `
                          {producto.precio_original && producto.precio_original > producto.precio && (
                            <span style={{ marginLeft: '8px', padding: '3px 9px', background: 'rgba(107,143,107,0.14)', color: '#4F7A4F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em', borderRadius: '100px', whiteSpace: 'nowrap' }}>
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
