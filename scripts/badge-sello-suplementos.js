const fs = require('fs');

const ruta = 'components/store/suplementos/SuplementosProductos.tsx';
let c = fs.readFileSync(ruta, 'utf8');

const viejo = `                      {producto.precio_original && producto.precio_original > producto.precio && producto.stock !== 0 && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '5px 12px', background: '#6B8F6B', color: 'white', fontSize: '11px', letterSpacing: '0.04em', borderRadius: '100px', zIndex: 3, fontWeight: 700 }}>
                          -{Math.round(((producto.precio_original - producto.precio) / producto.precio_original) * 100)}%
                        </div>
                      )}`;

const nuevo = `                      {producto.precio_original && producto.precio_original > producto.precio && producto.stock !== 0 && (
                        <div style={{ position: 'absolute', top: isMobile ? '10px' : '12px', right: isMobile ? '10px' : '12px', width: isMobile ? '46px' : '54px', height: isMobile ? '46px' : '54px', borderRadius: '50%', background: '#6B8F6B', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1, zIndex: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                          <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600 }}>-{Math.round(((producto.precio_original - producto.precio) / producto.precio_original) * 100)}%</div>
                          <div style={{ fontSize: '7px', letterSpacing: '0.14em', marginTop: '3px', fontWeight: 600 }}>DESC</div>
                        </div>
                      )}`;

if (c.indexOf(viejo) === -1) {
  console.log('ERROR: no se encontro el badge anterior. Verifica que corriste el script previo.');
  process.exit(1);
}

c = c.split(viejo).join(nuevo);
fs.writeFileSync(ruta, c, 'utf8');
console.log('OK - sello circular aplicado en suplementos');
