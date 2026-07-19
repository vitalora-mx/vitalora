const fs = require('fs');

const ruta = 'components/store/Hero.tsx';
let c = fs.readFileSync(ruta, 'utf8');

// Encontrar el bloque de simbolos y reemplazarlo completo
const ini = c.indexOf('      {/* Simbolos flotantes slide 5 */}');
const fin = c.indexOf('      {/* Contenido promocional slide 5 */}');

if (ini === -1 || fin === -1) {
  console.log('ERROR: no se encontro el bloque de simbolos');
  process.exit(1);
}

const nuevo = `      {/* Etiquetas de descuento slide 5 */}
      {(slide as any).promo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>

          <div className="etq etq-a" style={{ position: 'absolute', top: isMobile ? '5%' : '11%', left: isMobile ? '4%' : '7%' }}>
            <svg viewBox="0 0 120 150" style={{ width: isMobile ? '62px' : '96px', height: 'auto', overflow: 'visible' }}>
              <path d="M60 2 Q 48 14 44 30" stroke="#C9A961" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M22 30 L98 30 L98 130 Q 98 142 86 142 L34 142 Q 22 142 22 130 Z" fill="#C9A961" />
              <circle cx="44" cy="44" r="7" fill="#F5F0E8" />
              <text x="62" y="102" textAnchor="middle" fontSize="34" fontWeight="700" fill="#FFFFFF" fontFamily="system-ui, sans-serif">-10%</text>
            </svg>
          </div>

          <div className="etq etq-b" style={{ position: 'absolute', top: isMobile ? '3%' : '7%', right: isMobile ? '5%' : '43%' }}>
            <svg viewBox="0 0 120 150" style={{ width: isMobile ? '68px' : '106px', height: 'auto', overflow: 'visible' }}>
              <path d="M60 2 Q 72 14 76 30" stroke="#C9A961" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M22 30 L98 30 L98 130 Q 98 142 86 142 L34 142 Q 22 142 22 130 Z" fill="#0E0E0E" />
              <circle cx="76" cy="44" r="7" fill="#F5F0E8" />
              <text x="60" y="102" textAnchor="middle" fontSize="34" fontWeight="700" fill="#C9A961" fontFamily="system-ui, sans-serif">-20%</text>
            </svg>
          </div>

          <div className="etq etq-c" style={{ position: 'absolute', bottom: isMobile ? '30%' : '17%', left: isMobile ? '5%' : '5%' }}>
            <svg viewBox="0 0 120 150" style={{ width: isMobile ? '60px' : '92px', height: 'auto', overflow: 'visible' }}>
              <path d="M60 2 Q 48 14 44 30" stroke="#C9A961" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M22 30 L98 30 L98 130 Q 98 142 86 142 L34 142 Q 22 142 22 130 Z" fill="#C9A961" />
              <circle cx="44" cy="44" r="7" fill="#F5F0E8" />
              <text x="62" y="102" textAnchor="middle" fontSize="34" fontWeight="700" fill="#FFFFFF" fontFamily="system-ui, sans-serif">-30%</text>
            </svg>
          </div>

          <div className="etq etq-d" style={{ position: 'absolute', bottom: isMobile ? '36%' : '13%', right: isMobile ? '6%' : '39%' }}>
            <svg viewBox="0 0 150 150" style={{ width: isMobile ? '84px' : '128px', height: 'auto', overflow: 'visible' }}>
              <path d="M75 2 Q 88 14 92 30" stroke="#C9A961" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M14 30 L136 30 L136 130 Q 136 142 124 142 L26 142 Q 14 142 14 130 Z" fill="#E8C9C0" stroke="#C9A961" strokeWidth="4" />
              <circle cx="92" cy="44" r="7" fill="#F5F0E8" />
              <text x="75" y="94" textAnchor="middle" fontSize="32" fontWeight="700" fill="#0E0E0E" fontFamily="system-ui, sans-serif">+5%</text>
              <text x="75" y="120" textAnchor="middle" fontSize="15" fontWeight="700" fill="#8A6D3B" letterSpacing="1.5" fontFamily="system-ui, sans-serif">EXTRA</text>
            </svg>
          </div>

        </div>
      )}

`;

c = c.substring(0, ini) + nuevo + c.substring(fin);

// Reemplazar las animaciones de simbolos por las de etiquetas
const animViejo = `        .sim { opacity: 0; animation: simAparece 0.6s ease forwards; }
        .sim-a { animation-delay: 0.9s; }
        .sim-b { animation-delay: 1.05s; }
        .sim-c { animation-delay: 1.2s; }
        .sim-d { animation-delay: 1.35s; }
        .sim-a > g { animation: simFlota 4.2s ease-in-out 1.6s infinite; transform-origin: 50% 50%; }
        .sim-b > circle, .sim-b > text { animation: simFlotaB 5s ease-in-out 1.8s infinite; transform-origin: 50% 50%; }
        .sim-c > path { animation: simFlota 3.6s ease-in-out 1.4s infinite; transform-origin: 50% 50%; }
        .sim-d > g { animation: simFlotaB 4.6s ease-in-out 2s infinite; transform-origin: 50% 50%; }`;

const animNuevo = `        .etq { opacity: 0; animation: simAparece 0.55s ease forwards, etqBalanceo 4.4s ease-in-out infinite; transform-origin: 50% 0%; }
        .etq-a { animation-delay: 0.85s, 1.5s; }
        .etq-b { animation-delay: 1s, 1.8s; animation-duration: 0.55s, 5.2s; }
        .etq-c { animation-delay: 1.15s, 1.3s; animation-duration: 0.55s, 3.9s; }
        .etq-d { animation-delay: 1.3s, 2s; animation-duration: 0.55s, 4.8s; }`;

if (c.indexOf(animViejo) === -1) {
  console.log('ERROR: no se encontraron las animaciones de simbolos');
  process.exit(1);
}
c = c.split(animViejo).join(animNuevo);

// Agregar keyframe de balanceo
const kfViejo = `        @keyframes simAparece {`;
const kfNuevo = `        @keyframes etqBalanceo {
          0%, 100% { transform: rotate(-4deg) translateY(0); }
          50% { transform: rotate(4deg) translateY(-8px); }
        }
        @keyframes simAparece {`;
c = c.split(kfViejo).join(kfNuevo);

// Actualizar el reduced-motion
const rmViejo = `          .promo-anim, .sim { animation: none; opacity: 1; }
          .sim-a > g, .sim-b > circle, .sim-b > text, .sim-c > path, .sim-d > g { animation: none; }`;
const rmNuevo = `          .promo-anim, .etq { animation: none; opacity: 1; }`;
c = c.split(rmViejo).join(rmNuevo);

fs.writeFileSync(ruta, c, 'utf8');
console.log('OK - etiquetas con porcentajes aplicadas');
