const fs = require('fs');

const ruta = 'components/store/Hero.tsx';
let c = fs.readFileSync(ruta, 'utf8');

// =====================================================
// PASO 1 - Cambiar duracion del carrusel a 10 segundos
// =====================================================
if (c.indexOf('}, 5000)') !== -1) {
  c = c.split('}, 5000)').join('}, 10000)');
  console.log('OK 1/2 - carrusel cambiado a 10 segundos');
} else {
  console.log('AVISO 1/2 - no se encontro el intervalo de 5000, revisar manualmente');
}

// =====================================================
// PASO 2 - Reemplazar etiquetas SVG por la imagen real
// =====================================================
const ini = c.indexOf('      {/* Etiquetas de descuento slide 5 */}');
const fin = c.indexOf('      {/* Contenido promocional slide 5 */}');

if (ini === -1 || fin === -1) {
  console.log('ERROR: no se encontro el bloque de etiquetas');
  process.exit(1);
}

const nuevo = `      {/* Etiquetas de descuento slide 5 */}
      {(slide as any).promo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>

          <div className="etq etq-a" style={{ position: 'absolute', top: isMobile ? '4%' : '9%', left: isMobile ? '2%' : '5%', width: isMobile ? '96px' : '168px' }}>
            <img src="/images/hero/etiqueta.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <span style={{ position: 'absolute', top: '54%', left: '46%', transform: 'translate(-50%, -50%) rotate(-21deg)', fontSize: isMobile ? '20px' : '34px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>-10%</span>
          </div>

          <div className="etq etq-b" style={{ position: 'absolute', top: isMobile ? '2%' : '5%', right: isMobile ? '3%' : '41%', width: isMobile ? '104px' : '186px' }}>
            <img src="/images/hero/etiqueta.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <span style={{ position: 'absolute', top: '54%', left: '46%', transform: 'translate(-50%, -50%) rotate(-21deg)', fontSize: isMobile ? '22px' : '38px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>-20%</span>
          </div>

          <div className="etq etq-c" style={{ position: 'absolute', bottom: isMobile ? '28%' : '12%', left: isMobile ? '3%' : '3%', width: isMobile ? '92px' : '162px' }}>
            <img src="/images/hero/etiqueta.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <span style={{ position: 'absolute', top: '54%', left: '46%', transform: 'translate(-50%, -50%) rotate(-21deg)', fontSize: isMobile ? '19px' : '33px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>-30%</span>
          </div>

          <div className="etq etq-d" style={{ position: 'absolute', bottom: isMobile ? '34%' : '9%', right: isMobile ? '4%' : '37%', width: isMobile ? '110px' : '196px' }}>
            <img src="/images/hero/etiqueta.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <span style={{ position: 'absolute', top: '50%', left: '46%', transform: 'translate(-50%, -50%) rotate(-21deg)', fontSize: isMobile ? '21px' : '36px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>+5%</span>
            <span style={{ position: 'absolute', top: '64%', left: '46%', transform: 'translate(-50%, -50%) rotate(-21deg)', fontSize: isMobile ? '10px' : '16px', fontWeight: 700, letterSpacing: '0.12em', color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>EXTRA</span>
          </div>

        </div>
      )}

`;

c = c.substring(0, ini) + nuevo + c.substring(fin);
console.log('OK 2/2 - etiquetas reemplazadas por imagen real');

fs.writeFileSync(ruta, c, 'utf8');
console.log('');
console.log('Listo.');
