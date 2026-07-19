const fs = require('fs');

const ruta = 'components/store/Hero.tsx';
let c = fs.readFileSync(ruta, 'utf8');

// =====================================================
// PASO 1 - Reemplazar bloque de etiquetas por numeros
// =====================================================
const ini = c.indexOf('      {/* Etiquetas de descuento slide 5 */}');
const fin = c.indexOf('      {/* Contenido promocional slide 5 */}');

if (ini === -1 || fin === -1) {
  console.log('ERROR: no se encontro el bloque de etiquetas');
  process.exit(1);
}

const nuevo = `      {/* Numeros de descuento slide 5 */}
      {(slide as any).promo && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '4%' : '50%',
          left: isMobile ? '50%' : '9%',
          transform: isMobile ? 'translateX(-50%)' : 'translateY(-50%)',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '10px' : '4px',
          zIndex: 8,
          pointerEvents: 'none',
        }}>

          <div className="num num-1" style={{ position: 'relative', textAlign: 'center' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '38px' : '78px', fontWeight: 500, color: '#C9A961', lineHeight: 1, letterSpacing: '-0.01em' }}>
              30<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-6px' : '-10px', right: isMobile ? '-10px' : '-18px', fontSize: isMobile ? '13px' : '22px', color: '#C9A961' }}>&#10022;</span>
            </span>
            <div className="arco" style={{ width: isMobile ? '58px' : '112px', height: isMobile ? '8px' : '14px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(201,169,97,0) 0%, rgba(201,169,97,0.85) 50%, rgba(201,169,97,0) 100%)' }} />
          </div>

          <div className="num num-2" style={{ position: 'relative', textAlign: 'center' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '32px' : '64px', fontWeight: 500, color: '#C9A961', lineHeight: 1, letterSpacing: '-0.01em' }}>
              20<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-5px' : '-8px', right: isMobile ? '-9px' : '-15px', fontSize: isMobile ? '11px' : '18px', color: '#C9A961' }}>&#10022;</span>
            </span>
            <div className="arco" style={{ width: isMobile ? '50px' : '94px', height: isMobile ? '7px' : '12px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(201,169,97,0) 0%, rgba(201,169,97,0.85) 50%, rgba(201,169,97,0) 100%)' }} />
          </div>

          <div className="num num-3" style={{ position: 'relative', textAlign: 'center' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '27px' : '52px', fontWeight: 500, color: '#C9A961', lineHeight: 1, letterSpacing: '-0.01em' }}>
              10<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-4px' : '-7px', right: isMobile ? '-8px' : '-13px', fontSize: isMobile ? '10px' : '15px', color: '#C9A961' }}>&#10022;</span>
            </span>
            <div className="arco" style={{ width: isMobile ? '42px' : '78px', height: isMobile ? '6px' : '10px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(201,169,97,0) 0%, rgba(201,169,97,0.85) 50%, rgba(201,169,97,0) 100%)' }} />
          </div>

          <div className="num num-4" style={{ position: 'relative', textAlign: 'center', marginTop: isMobile ? '0' : '8px' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '24px' : '46px', fontWeight: 500, color: '#D9A3A0', lineHeight: 1, letterSpacing: '-0.01em' }}>
              +5<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-4px' : '-6px', right: isMobile ? '-8px' : '-12px', fontSize: isMobile ? '9px' : '14px', color: '#D9A3A0' }}>&#10022;</span>
            </span>
            <div style={{ fontSize: isMobile ? '8px' : '11px', letterSpacing: '0.24em', color: '#B08A87', fontWeight: 600, marginTop: '3px', fontFamily: 'system-ui, sans-serif' }}>EXTRA</div>
            <div className="arco" style={{ width: isMobile ? '38px' : '70px', height: isMobile ? '6px' : '9px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(217,163,160,0) 0%, rgba(217,163,160,0.85) 50%, rgba(217,163,160,0) 100%)' }} />
          </div>

        </div>
      )}

`;

c = c.substring(0, ini) + nuevo + c.substring(fin);
console.log('OK 1/3 - numeros insertados');

// =====================================================
// PASO 2 - Mover el bloque de texto al centro
// =====================================================
const posVieja = `          left: isMobile ? '50%' : '25%',`;
const posNueva = `          left: isMobile ? '50%' : '38%',`;
if (c.indexOf(posVieja) !== -1) {
  c = c.split(posVieja).join(posNueva);
  console.log('OK 2/3 - bloque de texto movido al centro');
} else {
  console.log('AVISO 2/3 - no se movio el texto, revisar posicion');
}

// Bajar el texto en movil para dejar espacio a los numeros
const topVieja = `          top: isMobile ? '20%' : '50%',`;
const topNueva = `          top: isMobile ? '30%' : '50%',`;
c = c.split(topVieja).join(topNueva);

// =====================================================
// PASO 3 - Reemplazar animaciones
// =====================================================
const animVieja = `        .etq { opacity: 0; animation: simAparece 0.55s ease forwards, etqBalanceo 4.4s ease-in-out infinite; transform-origin: 50% 0%; }
        .etq-a { animation-delay: 0.85s, 1.5s; }
        .etq-b { animation-delay: 1s, 1.8s; animation-duration: 0.55s, 5.2s; }
        .etq-c { animation-delay: 1.15s, 1.3s; animation-duration: 0.55s, 3.9s; }
        .etq-d { animation-delay: 1.3s, 2s; animation-duration: 0.55s, 4.8s; }`;

const animNueva = `        .num { opacity: 0; animation: numEntra 0.7s cubic-bezier(0.2, 0.8, 0.3, 1) forwards; }
        .num-1 { animation-delay: 0.5s; }
        .num-2 { animation-delay: 0.68s; }
        .num-3 { animation-delay: 0.86s; }
        .num-4 { animation-delay: 1.04s; }
        .num .arco { animation: arcoDestello 6s ease-in-out infinite; }
        .num-1 .arco { animation-delay: 1.6s; }
        .num-2 .arco { animation-delay: 2s; }
        .num-3 .arco { animation-delay: 2.4s; }
        .num-4 .arco { animation-delay: 2.8s; }
        .num .chispa { animation: chispaBrilla 6s ease-in-out infinite; }
        .num-1 .chispa { animation-delay: 1.6s; }
        .num-2 .chispa { animation-delay: 2s; }
        .num-3 .chispa { animation-delay: 2.4s; }
        .num-4 .chispa { animation-delay: 2.8s; }`;

if (c.indexOf(animVieja) === -1) {
  console.log('ERROR: no se encontraron las animaciones de etiquetas');
  process.exit(1);
}
c = c.split(animVieja).join(animNueva);

// Reemplazar keyframes
const kfVieja = `        @keyframes etqBalanceo {
          0%, 100% { transform: rotate(-4deg) translateY(0); }
          50% { transform: rotate(4deg) translateY(-8px); }
        }`;

const kfNueva = `        @keyframes numEntra {
          from { opacity: 0; transform: translateX(-32px) scale(0.85); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes arcoDestello {
          0%, 70%, 100% { opacity: 0.5; transform: scaleX(1); }
          78% { opacity: 1; transform: scaleX(1.22); }
          86% { opacity: 0.5; transform: scaleX(1); }
        }
        @keyframes chispaBrilla {
          0%, 70%, 100% { opacity: 0.55; transform: scale(1) rotate(0deg); }
          78% { opacity: 1; transform: scale(1.5) rotate(45deg); }
          86% { opacity: 0.55; transform: scale(1) rotate(90deg); }
        }`;

c = c.split(kfVieja).join(kfNueva);

// Actualizar reduced-motion
const rmVieja = `          .promo-anim, .etq { animation: none; opacity: 1; }`;
const rmNueva = `          .promo-anim, .num { animation: none; opacity: 1; }
          .num .arco, .num .chispa { animation: none; }`;
c = c.split(rmVieja).join(rmNueva);

fs.writeFileSync(ruta, c, 'utf8');
console.log('OK 3/3 - animaciones aplicadas');
console.log('');
console.log('Listo.');
