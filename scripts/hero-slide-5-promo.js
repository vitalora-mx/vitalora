const fs = require('fs');

const ruta = 'components/store/Hero.tsx';
let c = fs.readFileSync(ruta, 'utf8');
let pasos = 0;

// =====================================================
// PASO 1 - Agregar el slide 5 al array
// =====================================================
const anclaArray = `    boton: null,
  },
]`;

const nuevoArray = `    boton: null,
  },
  {
    id: 5,
    desktop: '/images/hero/slide-5-desktop.png',
    mobile: '/images/hero/slide-5-mobile.png',
    width: 1942, height: 809,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora - Descuentos todo el ano y 5% adicional en tu primera compra',
    boton: null,
    promo: true,
  },
]`;

if (c.indexOf(anclaArray) === -1) {
  console.log('ERROR: no se encontro el final del array de slides');
  process.exit(1);
}
c = c.split(anclaArray).join(nuevoArray);
pasos++;
console.log('OK 1/3 - slide 5 agregado al array');

// =====================================================
// PASO 2 - Insertar el bloque promocional animado
// =====================================================
const anclaBoton = `      {slide.boton && (`;

const bloquePromo = `      {/* Simbolos flotantes slide 5 */}
      {(slide as any).promo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>

          <svg className="sim sim-a" viewBox="0 0 100 100" style={{ position: 'absolute', top: isMobile ? '6%' : '16%', left: isMobile ? '8%' : '9%', width: isMobile ? '40px' : '62px', height: 'auto' }}>
            <g transform="rotate(-18 50 50)">
              <path d="M30 20 L62 20 L78 36 L78 82 L30 82 Z" fill="#C9A961" />
              <circle cx="68" cy="30" r="5" fill="#F5F0E8" />
              <path d="M68 26 Q 74 12 82 8" stroke="#C9A961" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
          </svg>

          <svg className="sim sim-b" viewBox="0 0 100 100" style={{ position: 'absolute', top: isMobile ? '4%' : '10%', right: isMobile ? '10%' : '44%', width: isMobile ? '46px' : '72px', height: 'auto' }}>
            <circle cx="50" cy="50" r="42" fill="#E8C9C0" stroke="#C9A961" strokeWidth="5" />
            <text x="50" y="66" textAnchor="middle" fontSize="42" fontWeight="700" fill="#0E0E0E" fontFamily="system-ui, sans-serif">%</text>
          </svg>

          <svg className="sim sim-c" viewBox="0 0 100 100" style={{ position: 'absolute', bottom: isMobile ? '32%' : '22%', left: isMobile ? '12%' : '6%', width: isMobile ? '26px' : '38px', height: 'auto' }}>
            <path d="M50 4 Q 56 42 96 50 Q 56 58 50 96 Q 44 58 4 50 Q 44 42 50 4 Z" fill="#C9A961" />
          </svg>

          <svg className="sim sim-d" viewBox="0 0 100 100" style={{ position: 'absolute', bottom: isMobile ? '38%' : '18%', right: isMobile ? '12%' : '40%', width: isMobile ? '34px' : '52px', height: 'auto' }}>
            <g transform="rotate(12 50 50)">
              <path d="M22 38 L78 38 L72 90 L28 90 Z" fill="#F5F0E8" stroke="#C9A961" strokeWidth="3" />
              <path d="M38 38 Q 38 18 50 18 Q 62 18 62 38" stroke="#C9A961" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M34 38 Q 42 26 50 34 Q 58 26 66 38 Z" fill="#E8C9C0" />
            </g>
          </svg>

        </div>
      )}

      {/* Contenido promocional slide 5 */}
      {(slide as any).promo && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '20%' : '50%',
          left: isMobile ? '50%' : '25%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '84%' : '36%',
          maxWidth: isMobile ? '360px' : '480px',
          textAlign: 'center',
          zIndex: 10,
        }}>
          <img
            src="/images/logo/logo-footer.png"
            alt="Vitalora"
            className="promo-anim promo-d1"
            style={{
              height: isMobile ? '34px' : '50px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: isMobile ? '12px' : '18px',
              display: 'inline-block',
            }}
          />
          <div
            className="promo-anim promo-d2"
            style={{
              fontFamily: 'var(--font-italiana), serif',
              fontSize: isMobile ? '28px' : '48px',
              lineHeight: 1.12,
              color: '#0E0E0E',
              letterSpacing: '0.02em',
              marginBottom: isMobile ? '10px' : '14px',
            }}
          >
            Descuentos<br />todo el a&ntilde;o
          </div>
          <div
            className="promo-anim promo-d3"
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: isMobile ? '14px' : '19px',
              lineHeight: 1.6,
              color: '#4A4A4A',
              marginBottom: isMobile ? '16px' : '24px',
            }}
          >
            Y en tu primera compra, <strong style={{ color: 'var(--gold)', fontWeight: 600 }}>5% adicional</strong> sobre todo el carrito
          </div>
          <Link
            href="/cosmeticos"
            className="promo-anim promo-d4"
            style={{
              display: 'inline-block',
              background: 'var(--gold)',
              color: 'var(--black)',
              border: '1px solid var(--gold)',
              padding: isMobile ? '10px 24px' : '13px 32px',
              fontSize: isMobile ? '11px' : '13px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '100px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--black)'
              e.currentTarget.style.color = 'var(--gold)'
              e.currentTarget.style.borderColor = 'var(--black)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--gold)'
              e.currentTarget.style.color = 'var(--black)'
              e.currentTarget.style.borderColor = 'var(--gold)'
            }}
          >
            &#10022; Ver ofertas
          </Link>
        </div>
      )}

      {/* Destello slide 5 */}
      {(slide as any).promo && (
        <div className="promo-shine" style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          overflow: 'hidden',
        }} />
      )}

      <style>{\`
        @keyframes promoEntrada {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes promoBarrido {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(320%) skewX(-18deg); }
        }
        @keyframes simFlota {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(5deg); }
        }
        @keyframes simFlotaB {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(-6deg); }
        }
        @keyframes simAparece {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }
        .promo-anim { opacity: 0; animation: promoEntrada 0.85s ease forwards; }
        .promo-d1 { animation-delay: 0.15s; }
        .promo-d2 { animation-delay: 0.35s; }
        .promo-d3 { animation-delay: 0.55s; }
        .promo-d4 { animation-delay: 0.75s; }
        .sim { opacity: 0; animation: simAparece 0.6s ease forwards; }
        .sim-a { animation-delay: 0.9s; }
        .sim-b { animation-delay: 1.05s; }
        .sim-c { animation-delay: 1.2s; }
        .sim-d { animation-delay: 1.35s; }
        .sim-a > g { animation: simFlota 4.2s ease-in-out 1.6s infinite; transform-origin: 50% 50%; }
        .sim-b > circle, .sim-b > text { animation: simFlotaB 5s ease-in-out 1.8s infinite; transform-origin: 50% 50%; }
        .sim-c > path { animation: simFlota 3.6s ease-in-out 1.4s infinite; transform-origin: 50% 50%; }
        .sim-d > g { animation: simFlotaB 4.6s ease-in-out 2s infinite; transform-origin: 50% 50%; }
        .promo-shine::before {
          content: '';
          position: absolute;
          top: -40%;
          left: 0;
          width: 22%;
          height: 180%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%);
          animation: promoBarrido 3.8s ease-in-out 1.3s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .promo-anim, .sim { animation: none; opacity: 1; }
          .sim-a > g, .sim-b > circle, .sim-b > text, .sim-c > path, .sim-d > g { animation: none; }
          .promo-shine::before { animation: none; opacity: 0; }
        }
      \`}</style>

      {slide.boton && (`;

if (c.indexOf(anclaBoton) === -1) {
  console.log('ERROR: no se encontro el ancla del boton por slide');
  process.exit(1);
}
c = c.split(anclaBoton).join(bloquePromo);
pasos++;
console.log('OK 2/3 - bloque promocional y simbolos insertados');

// =====================================================
// PASO 3 - Verificar que Link este importado
// =====================================================
if (c.indexOf("from 'next/link'") === -1) {
  c = c.replace("import { useState, useEffect } from 'react'", "import Link from 'next/link'\nimport { useState, useEffect } from 'react'");
  console.log('OK 3/3 - import de Link agregado');
} else {
  console.log('OK 3/3 - Link ya estaba importado');
}
pasos++;

fs.writeFileSync(ruta, c, 'utf8');
console.log('');
console.log('Listo. Pasos completados: ' + pasos + '/3');
