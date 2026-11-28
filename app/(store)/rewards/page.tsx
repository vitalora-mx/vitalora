'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import InscripcionRewards from '@/components/store/rewards/InscripcionRewards'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuthStore, fetchCliente } from '@/store/authStore'

const ITALIANA = 'var(--font-italiana), serif'
const CORMORANT = 'var(--font-cormorant), serif'
const ORO = '#C9A961'
const NEGRO = '#0E0E0E'
const CREMA = '#F5F0E8'
const GRIS = '#6B6B6B'
const LINEA = '#E8E4DA'
const IMG = '/images/rewards'

const PASOS = [
  { n: '01', t: 'Inscríbete', d: 'Es gratis, solo necesitas tu cuenta Vitalora. Recibes tu código personal al instante.' },
  { n: '02', t: 'Comparte tu código', d: 'Quien compre con él obtiene 5% de descuento en productos.' },
  { n: '03', t: 'Gana puntos', d: 'Recibes el 10% de lo que se pague en productos, en puntos. También ganas cuando usas tu código en tus propias compras.' },
]

const MONEDERO = [
  { t: '1 punto = $1', d: 'de descuento en productos. Úsalos en el checkout para pagar hasta el total de tus productos; el envío, cuando aplique, se paga aparte.' },
  { t: 'Tus puntos no vencen', d: 'Se quedan en tu Monedero hasta que decidas usarlos.' },
  { t: 'Pendientes y disponibles', d: 'Tus puntos aparecen como pendientes en cuanto se paga el pedido y pasan a disponibles 15 días después de que se entrega.' },
]

// ------------------------------------------------------------
// Íconos genéricos (trazo dorado, sin logos de marcas)
// ------------------------------------------------------------
type NombreIcono = 'mensajes' | 'camara' | 'video' | 'comunidad' | 'brillo' | 'bolsa' | 'regalo' | 'tienda'

const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  mensajes: <><path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><path d="M19 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-4-3h-3" /></>,
  camara: <><path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></>,
  video: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10.5 22 7v10l-6-3.5" /></>,
  comunidad: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2A5 5 0 0 1 21 19" /></>,
  brillo: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></>,
  bolsa: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  regalo: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12" /><path d="M12 8S10.5 4 8.5 4a2 2 0 0 0 0 4M12 8s1.5-4 3.5-4a2 2 0 0 1 0 4" /></>,
  tienda: <><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5 11v9h14v-9M10 20v-5h4v5" /></>,
}

function Icono({ nombre }: { nombre: NombreIcono }) {
  return (
    <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: '#F6EEDC', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8873F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{TRAZOS[nombre]}</svg>
    </span>
  )
}

const IDEAS: { t: string; d: string; icono: NombreIcono }[] = [
  { t: 'Amigas y familia', icono: 'mensajes', d: 'Mándalo por WhatsApp a tus amigas, a tu familia o a tus grupos de la oficina o la escuela.' },
  { t: 'Instagram', icono: 'camara', d: 'Comparte tus favoritos en historias y publicaciones, y deja tu código en tu bio.' },
  { t: 'TikTok', icono: 'video', d: 'Graba tu rutina, un unboxing, una reseña o tu antes y después.' },
  { t: 'Facebook', icono: 'comunidad', d: 'Publícalo en tu perfil o en grupos de belleza y K-beauty.' },
  { t: 'Cuando te pregunten por tu piel', icono: 'brillo', d: 'Si alguien te pregunta qué usas, recomiéndale tu rutina y pásale tu código.' },
  { t: 'Regalos para toda ocasión', icono: 'regalo', d: 'Cuando regales skincare, compra con tu código o compártelo con quien también quiera regalar.' },
  { t: 'Tu negocio de belleza', icono: 'tienda', d: 'Si tienes un negocio de belleza o te gusta vender productos, úsalo en cada compra.' },
]
const IDEA_GRUPO = { t: 'Compras en grupo', d: 'Junten un pedido entre amigas para llegar a $1,000 en productos y tener envío gratis: pagan 5% menos y tú ganas 10% en puntos.' }

const CONDICIONES = [
  'Para mayores de 18 años con cuenta Vitalora. Un registro por persona y por número de teléfono.',
  'El 5% del código aplica solo en productos y no se combina con el descuento de primera compra ni con otros códigos. Usar un código Rewards no gasta tu descuento de primera compra.',
  'Los puntos se calculan sobre lo pagado en productos, sin contar el envío.',
  'Si más de la mitad de los productos de un pedido se paga con puntos, ese pedido no genera puntos.',
  'Puedes pagar con puntos el total de tus productos; el envío, cuando aplique, se paga aparte.',
  'Puedes usar tus puntos junto con el descuento de primera compra o un cupón.',
  'Si un pedido se cancela o se reembolsa, los puntos que generó se ajustan, y los puntos usados en él regresan a tu Monedero en proporción a lo reembolsado.',
  'Los puntos no son dinero: no se cambian por efectivo ni se transfieren a otra persona.',
  'Si eliminas tu cuenta, tu Monedero se cierra y los puntos se pierden.',
]

// Foto con carga diferida y dos tamaños (WebP en public/images/rewards).
function Foto({ nombre, chico, ancho, alto, alt, sizes, radio = '8px' }: {
  nombre: string; chico: number; ancho: number; alto: number; alt: string; sizes: string; radio?: string
}) {
  return (
    <img
      src={`${IMG}/${nombre}.webp`}
      srcSet={`${IMG}/${nombre}-${chico}.webp ${chico}w, ${IMG}/${nombre}.webp ${ancho}w`}
      sizes={sizes} width={ancho} height={alto} alt={alt}
      loading="lazy" decoding="async"
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: radio, background: '#EDE6D8' }}
    />
  )
}

// Tarjeta visual del Monedero (ejemplo, hecha con código)
function TarjetaMonedero() {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{
        position: 'relative', overflow: 'hidden', aspectRatio: '1.6 / 1', borderRadius: '16px', padding: 'clamp(18px, 5%, 28px)',
        background: 'radial-gradient(120% 140% at 100% 0%, #2A2418 0%, #141210 45%, #0E0E0E 100%)',
        border: '1px solid rgba(201,169,97,0.35)', boxShadow: '0 24px 48px -20px rgba(14,14,14,0.45)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: CREMA, boxSizing: 'border-box',
      }}>
        <div aria-hidden style={{ position: 'absolute', right: '-18%', top: '-40%', width: '70%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(201,169,97,0.18)' }} />
        <div aria-hidden style={{ position: 'absolute', right: '-30%', top: '-55%', width: '95%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(201,169,97,0.10)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <span style={{ fontFamily: ITALIANA, fontSize: 'clamp(16px, 4vw, 20px)', letterSpacing: '0.22em' }}>VITALORA</span>
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: ORO }}>✦ Monedero Rewards</span>
        </div>
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.55)', margin: '0 0 4px' }}>Puntos disponibles</p>
          <div style={{ fontFamily: ITALIANA, fontSize: 'clamp(40px, 11vw, 58px)', color: ORO, lineHeight: 1 }}>1,250</div>
          <p style={{ fontSize: '12px', color: 'rgba(245,240,232,0.7)', margin: '6px 0 0' }}>= $1,250 de descuento en productos</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', position: 'relative' }}>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.55)', margin: '0 0 2px' }}>Pendientes</p>
            <span style={{ fontSize: '15px', color: CREMA }}>+180</span>
          </div>
          <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '100px', border: '1px solid rgba(201,169,97,0.5)', color: ORO, whiteSpace: 'nowrap' }}>No vencen</span>
        </div>
      </div>
      <figcaption style={{ fontSize: '11px', color: '#A8A8A8', textAlign: 'center', marginTop: '10px' }}>Ejemplo ilustrativo</figcaption>
    </figure>
  )
}

// izquierda = a la izquierda en computadora y centrado en celular (.rw-izq)
function Encabezado({ eyebrow, titulo, claro = false, izquierda = false }: { eyebrow: string; titulo: React.ReactNode; claro?: boolean; izquierda?: boolean }) {
  return (
    <div className={izquierda ? 'rw-izq' : undefined} style={{ textAlign: izquierda ? undefined : 'center', marginBottom: '32px' }}>
      <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: ORO, margin: '0 0 12px' }}>{eyebrow}</p>
      <h2 style={{ fontFamily: ITALIANA, fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 400, color: claro ? CREMA : NEGRO, lineHeight: 1.2, margin: 0 }}>{titulo}</h2>
    </div>
  )
}

export default function RewardsPage() {
  const isMobile = useIsMobile()
  const user = useAuthStore(s => s.user)
  const [montado, setMontado] = useState(false)
  // undefined = cargando, null = no es miembro, string = su código
  const [codigo, setCodigo] = useState<string | null | undefined>(undefined)

  useEffect(() => { setMontado(true) }, [])
  useEffect(() => {
    if (!user) { setCodigo(undefined); return }
    let vigente = true
    setCodigo(undefined)
    fetchCliente('/api/rewards/mi-cuenta')
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (vigente && res.ok) setCodigo(data.miembro?.codigo ?? null)
        else if (vigente && res.status !== 401) setCodigo(null)
      })
      .catch(() => { if (vigente) setCodigo(null) })
    return () => { vigente = false }
  }, [user?.id])

  const esMiembro = montado && !!user && !!codigo
  const ancho = (max: number): React.CSSProperties => ({ maxWidth: `${max}px`, margin: '0 auto' })
  // Dos columnas en computadora (proporciones izq/der), una en celular (.rw-2col)
  const columnas = (izq: string, der: string) => ({ '--izq': `minmax(0,${izq})`, '--der': `minmax(0,${der})` }) as React.CSSProperties

  return (
    <main style={{ background: CREMA, color: NEGRO }}>
      {/* El hero usa media queries (no useIsMobile) para que el celular pida
          desde el principio la foto vertical y no se vea el diseño de escritorio. */}
      <style>{`
        .rw-hero { position: relative; background: ${CREMA}; overflow: hidden; }
        .rw-hero-texto { position: absolute; inset: 0; z-index: 1; display: flex; align-items: center;
          padding: 0 clamp(24px, 6vw, 96px);
          background: linear-gradient(90deg, rgba(245,240,232,0.94) 0%, rgba(245,240,232,0.8) 30%, rgba(245,240,232,0) 58%); }
        .rw-hero-caja { max-width: min(560px, 44vw); }
        .rw-hero-img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; max-height: 86svh; min-height: 520px;
          object-fit: cover; object-position: 75% center; background: #EDE6D8; }
        .rw-hero-nota { color: #8A8A8A; }
        /* Dorado oscuro (#8A6D2B) para contraste ~4.6:1 sobre crema; mismo espaciado entre letras */
        /* 42 px en computadoras anchas; baja con el ancho para no tapar a las chicas de la foto */
        .rw-hero-etiqueta { font-family: var(--font-cormorant), serif; font-size: clamp(28px, 2.95vw, 42px); line-height: 1.1; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase; color: ${NEGRO}; margin: 0 0 14px; white-space: nowrap; }
        .rw-hero-etiqueta span { color: #A8873F; }
        .rw-hero-titulo { font-size: clamp(34px, 3.9vw, 52px); }
        @media (max-width: 768px) {
          /* ~27 px en 390 px; nunca más ancho que la pantalla */
          .rw-hero-etiqueta { font-size: clamp(20px, 7.2vw, 28px); letter-spacing: 0.08em; margin-bottom: 12px; }
          .rw-hero-titulo { font-size: clamp(32px, 9vw, 40px); }
        }
        /* Columnas y espacios: CSS (no useIsMobile) para que el celular tenga su diseño desde el primer pintado */
        .rw-sec { padding: 88px 24px; }
        .rw-2col { display: grid; grid-template-columns: var(--izq) var(--der); gap: 56px; align-items: center; }
        .rw-orden-1 { order: 1; }
        .rw-izq { text-align: left; }
        .rw-ideas { display: grid; grid-template-columns: minmax(0,0.8fr) minmax(0,1.4fr); gap: 40px; align-items: start; }
        .rw-ideas-foto { position: sticky; top: 100px; }
        .rw-ideas-lista { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
        .rw-grupo { margin-top: 40px; display: grid; grid-template-columns: minmax(0,1.3fr) minmax(0,1fr); }
        .rw-grupo-texto { padding: 36px; }
        @media (max-width: 768px) {
          .rw-sec { padding: 56px 16px; }
          .rw-2col { grid-template-columns: minmax(0,1fr); gap: 32px; }
          .rw-orden-1 { order: 0; }
          .rw-izq { text-align: center; }
          .rw-foto { max-width: 420px; width: 100%; margin: 0 auto; }
          .rw-ideas { grid-template-columns: minmax(0,1fr); gap: 24px; }
          .rw-ideas-foto { position: static; max-width: 420px; width: 100%; margin: 0 auto; }
          .rw-ideas-lista { grid-template-columns: minmax(0,1fr); }
          .rw-grupo { margin-top: 24px; grid-template-columns: minmax(0,1fr); }
          .rw-grupo-texto { padding: 24px 20px 28px; }
          .rw-hero-texto { position: static; background: none; padding: 40px 16px 4px; justify-content: center; text-align: center; }
          .rw-hero-caja { max-width: 560px; }
          .rw-hero-foto { position: relative; }
          .rw-hero-foto::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 22%;
            background: linear-gradient(${CREMA}, rgba(245,240,232,0)); pointer-events: none; }
          .rw-hero-img { aspect-ratio: 4 / 5; max-height: none; min-height: 0; object-position: center; }
        }
      `}</style>

      <Header />

      {/* HERO */}
      <section className="rw-hero">
        <div className="rw-hero-texto">
          <div className="rw-hero-caja">
            <p className="rw-hero-etiqueta">Vitalora <span>Rewards</span></p>
            <h1 className="rw-hero-titulo" style={{ fontFamily: ITALIANA, fontWeight: 400, letterSpacing: '0.01em', color: NEGRO, lineHeight: 1.1, margin: '0 0 20px' }}>
              Comparte lo que amas.<br /><em style={{ fontFamily: CORMORANT, fontStyle: 'italic', color: ORO }}>Gana</em> con cada compra.
            </h1>
            <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 30px' }}>
              Con tu código personal, quien compre obtiene 5% de descuento en productos y tú recibes 10% en puntos en tu Monedero Rewards. Cada punto vale $1 de descuento en tus próximas compras.
            </p>
            <a href={esMiembro ? '/cuenta?tab=rewards' : '#unirme'} style={{ display: 'inline-block', background: NEGRO, color: ORO, padding: '16px 36px', borderRadius: '4px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {esMiembro ? 'Ver mi Monedero' : 'Unirme a Rewards'}
            </a>
            {!esMiembro && <p className="rw-hero-nota" style={{ fontSize: '12px', marginTop: '14px' }}>Es gratis y tu código está listo al instante.</p>}
          </div>
        </div>
        <div className="rw-hero-foto">
          <picture>
            <source media="(max-width: 768px)" srcSet={`${IMG}/rewards-hero-movil-750.webp 750w, ${IMG}/rewards-hero-movil.webp 1122w`} sizes="100vw" width={1122} height={1402} />
            <img
              className="rw-hero-img"
              src={`${IMG}/rewards-hero.webp`}
              srcSet={`${IMG}/rewards-hero-836.webp 836w, ${IMG}/rewards-hero.webp 1672w`}
              sizes="100vw" width={1672} height={941}
              alt="Dos amigas sonríen mientras miran un celular junto a sus productos de skincare coreano"
              fetchPriority="high" decoding="async"
            />
          </picture>
        </div>
      </section>

      {/* 5% + 10% */}
      <section className="rw-sec">
        <div className="rw-2col" style={{ ...ancho(1040), ...columnas('0.9fr', '1fr') }}>
          <div className="rw-foto">
            <Foto nombre="rewards-todos-ganan" chico={600} ancho={1122} alto={1402} sizes="(max-width: 768px) 92vw, 460px"
              alt="Productos de skincare coreano sobre mármol junto a una tarjeta de Vitalora" />
          </div>
          <div>
            <Encabezado eyebrow="Así de simple" titulo="Todos ganan" izquierda />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '28px', border: `1px solid ${LINEA}`, display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ fontFamily: ITALIANA, fontSize: '52px', color: ORO, lineHeight: 1, width: '96px', flexShrink: 0, textAlign: 'center' }}>5%</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: CORMORANT, fontSize: '22px', fontWeight: 600, margin: '0 0 6px' }}>Para quien compra</p>
                  <p style={{ fontSize: '14px', color: GRIS, lineHeight: 1.7, margin: 0 }}>Cada persona que use tu código obtiene 5% de descuento en productos al pagar.</p>
                </div>
              </div>
              <div style={{ background: NEGRO, borderRadius: '8px', padding: '28px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ fontFamily: ITALIANA, fontSize: '52px', color: ORO, lineHeight: 1, width: '96px', flexShrink: 0, textAlign: 'center' }}>10%</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: CORMORANT, fontSize: '22px', fontWeight: 600, color: CREMA, margin: '0 0 6px' }}>Para ti, en puntos</p>
                  <p style={{ fontSize: '14px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.7, margin: 0 }}>Recibes el 10% de lo que se pague en productos, directo a tu Monedero Rewards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="rw-sec" style={{ paddingTop: 0 }}>
        <div style={ancho(760)}>
          <Encabezado eyebrow="Paso a paso" titulo="Cómo funciona" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PASOS.map(p => (
              <div key={p.n} style={{ display: 'flex', gap: isMobile ? '16px' : '24px', alignItems: 'flex-start', padding: isMobile ? '20px' : '24px', background: '#fff', borderRadius: '8px', border: `1px solid ${LINEA}` }}>
                <div style={{ fontFamily: ITALIANA, fontSize: '28px', color: ORO, lineHeight: 1, flexShrink: 0, width: '40px' }}>{p.n}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: CORMORANT, fontSize: '20px', fontWeight: 600, margin: '0 0 6px' }}>{p.t}</p>
                  <p style={{ fontSize: '14px', color: GRIS, lineHeight: 1.7, margin: 0 }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ejemplo */}
          <div style={{ marginTop: '24px', padding: isMobile ? '24px 20px' : '28px 32px', borderRadius: '8px', borderLeft: `3px solid ${ORO}`, background: '#FAFAF7' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: ORO, margin: '0 0 8px' }}>Un ejemplo</p>
            <p style={{ fontSize: '15px', color: '#333', lineHeight: 1.8, margin: 0 }}>
              Alguien compra $1,000 en productos con tu código: paga $950 y tú ganas <strong>95 puntos</strong>, es decir, $95 de descuento en tu siguiente compra.
            </p>
          </div>
        </div>
      </section>

      {/* ÚSALO TÚ TAMBIÉN */}
      <section className="rw-sec" style={{ background: NEGRO }}>
        <div className="rw-2col" style={{ ...ancho(1040), ...columnas('0.9fr', '1fr') }}>
          <div className="rw-orden-1 rw-izq">
            <Encabezado claro izquierda eyebrow="Para ti también" titulo={<>Úsalo <em style={{ fontFamily: CORMORANT, fontStyle: 'italic', color: ORO }}>tú</em> también</>} />
            <p style={{ fontSize: '17px', color: 'rgba(245,240,232,0.78)', lineHeight: 1.8, margin: 0 }}>
              Tu código funciona en tus propias compras, cuantas veces quieras: pagas 5% menos y recibes 10% en puntos para la siguiente.
            </p>
          </div>
          <div className="rw-foto">
            <Foto nombre="rewards-usalo" chico={600} ancho={1122} alto={1402} sizes="(max-width: 768px) 92vw, 460px"
              alt="Mujer aplicándose un sérum frente a su tocador con productos de skincare coreano" />
          </div>
        </div>
      </section>

      {/* MONEDERO */}
      <section className="rw-sec">
        <div className="rw-2col" style={{ ...ancho(1040), ...columnas('1fr', '1fr') }}>
          <div className="rw-foto">
            <TarjetaMonedero />
          </div>
          <div>
            <Encabezado eyebrow="Tus puntos" titulo="Tu Monedero Rewards" izquierda />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {MONEDERO.map(m => (
                <div key={m.t} style={{ background: '#fff', borderRadius: '8px', padding: '20px 24px', border: `1px solid ${LINEA}` }}>
                  <p style={{ fontFamily: CORMORANT, fontSize: '21px', fontWeight: 600, margin: '0 0 6px' }}>{m.t}</p>
                  <p style={{ fontSize: '14px', color: GRIS, lineHeight: 1.7, margin: 0 }}>{m.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IDEAS PARA COMPARTIR */}
      <section className="rw-sec" style={{ background: '#fff', borderTop: `1px solid ${LINEA}`, borderBottom: `1px solid ${LINEA}` }}>
        <div style={ancho(1100)}>
          <Encabezado eyebrow="Inspiración" titulo="Ideas para compartir tu código" />
          <p style={{ fontSize: '15px', color: GRIS, lineHeight: 1.8, textAlign: 'center', maxWidth: '560px', margin: '-12px auto 40px' }}>
            Lo mejor es compartirlo donde ya hablas de lo que te gusta.
          </p>

          <div className="rw-ideas">
            <div className="rw-ideas-foto">
              <Foto nombre="rewards-compartir" chico={600} ancho={1122} alto={1402} sizes="(max-width: 768px) 92vw, 400px"
                alt="Mujer grabando un video para redes sociales mientras muestra una crema coreana" />
            </div>
            <div className="rw-ideas-lista">
              {IDEAS.map(i => (
                <div key={i.t} style={{ padding: '22px', background: '#FAFAF7', borderRadius: '8px', border: `1px solid ${LINEA}`, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <Icono nombre={i.icono} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: CORMORANT, fontSize: '19px', fontWeight: 600, margin: '0 0 6px', lineHeight: 1.25 }}>{i.t}</p>
                    <p style={{ fontSize: '14px', color: GRIS, lineHeight: 1.65, margin: 0 }}>{i.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compras en grupo: destacada con su foto */}
          <div className="rw-grupo" style={{ borderRadius: '8px', overflow: 'hidden', background: CREMA, border: `1px solid ${LINEA}` }}>
            <Foto nombre="rewards-grupo" chico={836} ancho={1672} alto={941} sizes="(max-width: 768px) 92vw, 620px" radio="0"
              alt="Tres amigas abren juntas una caja de Vitalora llena de productos de skincare coreano" />
            <div className="rw-grupo-texto" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <Icono nombre="bolsa" />
                <p style={{ fontFamily: CORMORANT, fontSize: '24px', fontWeight: 600, margin: 0 }}>{IDEA_GRUPO.t}</p>
              </div>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>{IDEA_GRUPO.d}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONDICIONES */}
      <section className="rw-sec">
        <div style={ancho(760)}>
          <Encabezado eyebrow="Claro desde el inicio" titulo="Condiciones principales" />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CONDICIONES.map(c => (
              <li key={c} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: '#444', lineHeight: 1.7 }}>
                <span aria-hidden style={{ color: ORO, flexShrink: 0, lineHeight: 1.7 }}>✦</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <p style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/rewards/terminos" style={{ fontSize: '14px', color: ORO, textDecoration: 'none', fontWeight: 600, letterSpacing: '0.03em' }}>
              Lee los términos completos de Vitalora Rewards →
            </Link>
          </p>
        </div>
      </section>

      {/* UNIRME */}
      <section id="unirme" className="rw-sec" style={{ background: '#EDE6D8', textAlign: 'center', scrollMarginTop: '80px' }}>
        <div style={ancho(640)}>
          <h2 style={{ fontFamily: ITALIANA, fontSize: 'clamp(30px, 6vw, 38px)', fontWeight: 400, lineHeight: 1.2, margin: '0 0 12px' }}>
            Únete a Vitalora <em style={{ fontFamily: CORMORANT, fontStyle: 'italic', color: ORO }}>Rewards</em>
          </h2>
          <p style={{ fontSize: '15px', color: GRIS, lineHeight: 1.8, margin: '0 0 32px' }}>Tu código personal está a un paso.</p>
          {montado
            ? <InscripcionRewards codigo={user ? codigo : undefined} onInscrito={setCodigo} isMobile={isMobile} />
            : <div style={{ minHeight: '200px' }} />}
          <p style={{ fontSize: '12px', color: '#999', marginTop: '32px' }}>
            ¿Tienes dudas? Escríbenos a <a href="mailto:hola@vitalora.com.mx" style={{ color: ORO, textDecoration: 'none' }}>hola@vitalora.com.mx</a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
