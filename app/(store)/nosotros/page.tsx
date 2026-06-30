'use client'

import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'

const valores = [
  {
    titulo: 'Autenticidad',
    texto: 'Todos nuestros productos son 100% originales, importados de marcas coreanas reconocidas. Nunca imitaciones: lo que recibes es exactamente lo que la marca creó.',
  },
  {
    titulo: 'Curaduría',
    texto: 'Cada producto en Vitalora fue seleccionado con cuidado. No llenamos el catálogo por llenar: elegimos fórmulas e ingredientes que de verdad valen la pena para tu piel.',
  },
  {
    titulo: 'Acompañamiento',
    texto: 'No solo vendemos productos; te ayudamos a construir el ritual ideal para ti. Estamos para resolver tus dudas y guiarte en cada paso de tu rutina de cuidado.',
  },
]

export default function NosotrosPage() {
  const isMobile = useIsMobile()

  return (
    <main style={{ background: 'var(--bg-cream)' }}>
      <Header />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: isMobile ? '40px 16px 60px' : '80px 40px 100px' }}>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '48px' : '72px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Nuestra historia</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: isMobile ? '36px' : '52px', color: 'var(--black)', lineHeight: 1.1, marginBottom: '24px' }}>
            Belleza coreana,<br />ritual mexicano
          </h1>
          <p style={{ fontSize: isMobile ? '15px' : '17px', color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: '620px', margin: '0 auto' }}>
            Vitalora nació de la pasión por el K-Beauty y el bienestar. Creemos que el cuidado de la piel es un ritual, no una rutina: un momento para reconectar contigo.
          </p>
        </div>

        {/* Historia */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--line)', padding: isMobile ? '32px 24px' : '48px', marginBottom: isMobile ? '32px' : '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '24px' : '30px', color: 'var(--black)', marginBottom: '20px', fontWeight: 600 }}>
            Por qué existimos
          </h2>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '18px' }}>
            La belleza coreana revolucionó el mundo del skincare con fórmulas innovadoras, ingredientes icónicos y una filosofía de cuidado constante y amable. Pero en México, conseguir productos originales, de marcas confiables y con buena información, no siempre es fácil.
          </p>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
            Creamos Vitalora para cambiar eso: traer a México lo mejor del K-Beauty y los suplementos de bienestar, con la garantía de que cada producto es auténtico, está bien cuidado y llega acompañado de la información que necesitas para usarlo con confianza.
          </p>
        </div>

        {/* Valores */}
        <div style={{ marginBottom: isMobile ? '32px' : '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '24px' : '30px', color: 'var(--black)', marginBottom: '28px', fontWeight: 600, textAlign: 'center' }}>
            Lo que nos distingue
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '16px' : '24px' }}>
            {valores.map((v) => (
              <div key={v.titulo} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--line)', padding: isMobile ? '24px' : '28px' }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', color: 'var(--gold)', marginBottom: '12px', fontWeight: 600 }}>{v.titulo}</div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{v.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quienes somos - empresa */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--line)', padding: isMobile ? '32px 24px' : '48px', marginBottom: isMobile ? '32px' : '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '24px' : '30px', color: 'var(--black)', marginBottom: '20px', fontWeight: 600 }}>
            Quiénes somos
          </h2>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '18px' }}>
            Vitalora es una marca de <strong style={{ color: 'var(--black)' }}>VANGUARDIA IMPORTACIONES Y LOGÍSTICA DE MÉXICO S.A. DE C.V.</strong>, una empresa mexicana legalmente constituida, con domicilio en San Miguel de Allende, Guanajuato.
          </p>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
            Operamos como un negocio formal: emitimos facturas (CFDI), cumplimos con nuestras obligaciones fiscales y respaldamos cada compra con políticas claras de envío, devoluciones y privacidad. Cuando compras en Vitalora, compras con la tranquilidad de una empresa real y responsable.
          </p>
        </div>

        {/* Contacto */}
        <div style={{ background: '#0E0E0E', borderRadius: '16px', padding: isMobile ? '32px 24px' : '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Estamos para ti</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: isMobile ? '22px' : '28px', color: 'white', marginBottom: '24px', fontWeight: 600 }}>
            ¿Tienes alguna duda?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px', margin: '0 auto 28px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>📍</span>
              <span style={{ fontSize: '14px', color: 'rgba(245,240,232,0.8)', lineHeight: 1.6 }}>Circuito Luna 103, Zirándaro, San Miguel de Allende, Guanajuato, C.P. 37749, México</span>
            </div>
            <a href="https://wa.me/524622341282" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>💬</span>
              <span style={{ fontSize: '14px', color: 'rgba(245,240,232,0.8)' }}>WhatsApp: 462 234 1282</span>
            </a>
            <a href="mailto:hola@vitalora.com.mx" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>✉️</span>
              <span style={{ fontSize: '14px', color: 'rgba(245,240,232,0.8)' }}>hola@vitalora.com.mx</span>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>🕐</span>
              <span style={{ fontSize: '14px', color: 'rgba(245,240,232,0.8)' }}>Lunes a Viernes, 9:00 - 18:00 hrs</span>
            </div>
          </div>
          <Link href="/contacto" style={{ display: 'inline-block', background: 'var(--gold)', color: '#0E0E0E', textDecoration: 'none', padding: '14px 32px', borderRadius: '4px', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em' }}>
            Escríbenos
          </Link>
        </div>

      </div>

      <Footer />
    </main>
  )
}
