'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const slides = [
  {
    id: 1,
    desktop: '/images/hero/slide-1-desktop.png',
    mobile: '/images/hero/slide-1-mobile.png',
    width: 1942, height: 809,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Tu rutina perfecta con ayuda de Lora',
    boton: {
      texto: '✦ Descubre tu rutina con Lora',
      tipo: 'lora',
      // Posicion y tamano por separado para desktop y movil.
      // top/left son % de la altura/ancho del hero. Ajusta a tu gusto.
      posicion: { top: '72%', left: '50%' },
      posicionMobile: { top: '85%', left: '50%' },
      tamano: 'normal',        // 'normal' | 'grande' | 'pequeno'
      tamanoMobile: 'pequeno',
    },
  },
  {
    id: 2,
    desktop: '/images/hero/slide-2-desktop.png',
    mobile: '/images/hero/slide-2-mobile.png',
    width: 1942, height: 809,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Cosméticos Coreanos Auténticos',
    boton: {
      texto: '✦ Ver Cosméticos Coreanos',
      tipo: 'link',
      href: '/cosmeticos',
      posicion: { top: '72%', left: '50%' },
      posicionMobile: { top: '85%', left: '50%' },
      tamano: 'normal',
      tamanoMobile: 'pequeno',
    },
  },
  {
    id: 3,
    desktop: '/images/hero/slide-3-desktop.png',
    mobile: '/images/hero/slide-3-mobile.png',
    width: 1717, height: 916,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Suplementos de Alta Pureza',
    boton: {
      texto: '✦ Ver Suplementos',
      tipo: 'link',
      href: '/suplementos',
      posicion: { top: '72%', left: '50%' },
      posicionMobile: { top: '85%', left: '50%' },
      tamano: 'normal',
      tamanoMobile: 'pequeno',
    },
  },
  {
    id: 4,
    desktop: '/images/hero/slide-4-desktop.png',
    mobile: '/images/hero/slide-4-mobile.png',
    width: 1774, height: 887,
    widthMobile: 936, heightMobile: 1681,
    alt: 'Vitalora — Belleza sin fronteras, sin complicaciones',
    boton: null,
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
]

const botonBase: React.CSSProperties = {
  background: 'var(--gold)',
  color: 'var(--black)',
  border: '1px solid var(--gold)',
  textTransform: 'uppercase',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  borderRadius: '100px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  textDecoration: 'none',
  transition: 'all 0.3s',
  whiteSpace: 'nowrap' as const,
}

const tamanos: Record<string, React.CSSProperties> = {
  normal: { padding: '16px 32px', fontSize: '12px', letterSpacing: '0.2em' },
  grande: { padding: '20px 44px', fontSize: '14px', letterSpacing: '0.2em' },
  pequeno: { padding: '10px 18px', fontSize: '10px', letterSpacing: '0.12em' },
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  function handleLoraClick() {
    const loraBtn = document.getElementById('loraFab')
    if (loraBtn) loraBtn.click()
  }

  function irAtras() {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  function irAdelante() {
    setCurrent((prev) => (prev + 1) % slides.length)
  }

  const slide = slides[current]

  const botonStyle: React.CSSProperties = slide.boton
    ? { ...botonBase, ...tamanos[(isMobile ? slide.boton.tamanoMobile : slide.boton.tamano) || 'normal'] }
    : {}

  const botonPos = slide.boton
    ? (isMobile ? slide.boton.posicionMobile : slide.boton.posicion)
    : { top: '72%', left: '50%' }

  const flechaSize = isMobile ? 36 : 48

  return (
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>

      {/* Slides */}
      {slides.map((s, i) => (
        <div key={s.id} style={{ display: i === current ? 'block' : 'none' }}>
          <Image
            src={isMobile ? s.mobile : s.desktop}
            alt={s.alt}
            width={isMobile ? s.widthMobile : s.width}
            height={isMobile ? s.heightMobile : s.height}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            priority={i === 0}
          />
        </div>
      ))}

      {/* Flecha izquierda */}
      <button
        onClick={irAtras}
        style={{
          position: 'absolute',
          top: '50%',
          left: isMobile ? '12px' : '20px',
          transform: 'translateY(-50%)',
          width: `${flechaSize}px`,
          height: `${flechaSize}px`,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.35)',
          cursor: 'pointer',
          fontSize: isMobile ? '16px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
      >←</button>

      {/* Flecha derecha */}
      <button
        onClick={irAdelante}
        style={{
          position: 'absolute',
          top: '50%',
          right: isMobile ? '12px' : '20px',
          transform: 'translateY(-50%)',
          width: `${flechaSize}px`,
          height: `${flechaSize}px`,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.35)',
          cursor: 'pointer',
          fontSize: isMobile ? '16px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
      >→</button>

      {/* Puntos de navegación */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '14px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        zIndex: 10,
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? '32px' : '10px',
              height: '10px',
              borderRadius: '100px',
              background: i === current ? 'var(--gold)' : 'rgba(255,255,255,0.6)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.4s ease',
            }}
          />
        ))}
      </div>

      {/* Botón por slide */}
      {/* Numeros de descuento slide 5 */}
      {(slide as any).promo && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '4%' : '50%',
          left: isMobile ? '50%' : '11%',
          transform: isMobile ? 'translateX(-50%)' : 'translateY(-50%)',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '14px' : '10px',
          zIndex: 8,
          pointerEvents: 'none',
        }}>

          <div className="num num-1" style={{ position: 'relative', textAlign: 'center' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '54px' : '132px', fontWeight: 500, color: '#C9A961', lineHeight: 1, letterSpacing: '-0.01em' }}>
              30<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-8px' : '-16px', right: isMobile ? '-14px' : '-30px', fontSize: isMobile ? '18px' : '34px', color: '#C9A961' }}>&#10022;</span>
            </span>
            <div className="arco" style={{ width: isMobile ? '82px' : '186px', height: isMobile ? '10px' : '20px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(201,169,97,0) 0%, rgba(201,169,97,0.85) 50%, rgba(201,169,97,0) 100%)' }} />
          </div>

          <div className="num num-2" style={{ position: 'relative', textAlign: 'center' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '45px' : '108px', fontWeight: 500, color: '#C9A961', lineHeight: 1, letterSpacing: '-0.01em' }}>
              20<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-7px' : '-13px', right: isMobile ? '-12px' : '-25px', fontSize: isMobile ? '15px' : '28px', color: '#C9A961' }}>&#10022;</span>
            </span>
            <div className="arco" style={{ width: isMobile ? '70px' : '156px', height: isMobile ? '9px' : '17px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(201,169,97,0) 0%, rgba(201,169,97,0.85) 50%, rgba(201,169,97,0) 100%)' }} />
          </div>

          <div className="num num-3" style={{ position: 'relative', textAlign: 'center' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '38px' : '88px', fontWeight: 500, color: '#C9A961', lineHeight: 1, letterSpacing: '-0.01em' }}>
              10<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-6px' : '-11px', right: isMobile ? '-11px' : '-22px', fontSize: isMobile ? '13px' : '24px', color: '#C9A961' }}>&#10022;</span>
            </span>
            <div className="arco" style={{ width: isMobile ? '60px' : '130px', height: isMobile ? '8px' : '15px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(201,169,97,0) 0%, rgba(201,169,97,0.85) 50%, rgba(201,169,97,0) 100%)' }} />
          </div>

          <div className="num num-4" style={{ position: 'relative', textAlign: 'center', marginTop: isMobile ? '0' : '8px' }}>
            <span style={{ position: 'relative', fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '34px' : '78px', fontWeight: 500, color: '#D9A3A0', lineHeight: 1, letterSpacing: '-0.01em' }}>
              +5<span style={{ fontSize: '0.62em' }}>%</span>
              <span className="chispa" style={{ position: 'absolute', top: isMobile ? '-6px' : '-10px', right: isMobile ? '-11px' : '-20px', fontSize: isMobile ? '12px' : '22px', color: '#D9A3A0' }}>&#10022;</span>
            </span>
            <div style={{ fontSize: isMobile ? '11px' : '17px', letterSpacing: '0.24em', color: '#B08A87', fontWeight: 600, marginTop: '3px', fontFamily: 'system-ui, sans-serif' }}>EXTRA</div>
            <div className="arco" style={{ width: isMobile ? '56px' : '118px', height: isMobile ? '7px' : '14px', margin: '2px auto 0', borderRadius: '50%', background: 'linear-gradient(90deg, rgba(217,163,160,0) 0%, rgba(217,163,160,0.85) 50%, rgba(217,163,160,0) 100%)' }} />
          </div>

        </div>
      )}

      {/* Contenido promocional slide 5 */}
      {(slide as any).promo && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '30%' : '50%',
          left: isMobile ? '50%' : '42%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '84%' : '36%',
          maxWidth: isMobile ? '360px' : '480px',
          textAlign: 'center',
          zIndex: 20,
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

      <style>{`
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
        @keyframes numEntra {
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
        .num { opacity: 0; animation: numEntra 0.7s cubic-bezier(0.2, 0.8, 0.3, 1) forwards; }
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
        .num-4 .chispa { animation-delay: 2.8s; }
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
          .promo-anim, .num { animation: none; opacity: 1; }
          .num .arco, .num .chispa { animation: none; }
          .promo-shine::before { animation: none; opacity: 0; }
        }
      `}</style>

      {slide.boton && (
        <div style={{
          position: 'absolute',
          top: botonPos.top,
          left: botonPos.left,
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}>
          {slide.boton.tipo === 'lora' ? (
            <button
              onClick={handleLoraClick}
              style={botonStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--black)'
                e.currentTarget.style.color = 'var(--gold)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--gold)'
                e.currentTarget.style.color = 'var(--black)'
              }}
            >
              {slide.boton.texto}
            </button>
          ) : (
            <Link
              href={(slide.boton as any).href || '/'}
              style={botonStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--black)'
                e.currentTarget.style.color = 'var(--gold)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--gold)'
                e.currentTarget.style.color = 'var(--black)'
              }}
            >
              {slide.boton.texto}
            </Link>
          )}
        </div>
      )}

    </section>
  )
}
