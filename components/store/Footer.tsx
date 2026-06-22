'use client'

import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import MetodosPago from '@/components/store/MetodosPago'

export default function Footer() {
  const isMobile = useIsMobile()

  return (
    <footer style={{
      background: 'var(--black)',
      color: 'var(--bg-cream)',
      padding: isMobile ? '56px 20px 32px' : '80px 40px 40px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Top */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr',
          gap: isMobile ? '32px 24px' : '60px',
          paddingBottom: isMobile ? '40px' : '60px',
          borderBottom: '1px solid rgba(245,240,232,0.1)',
        }}>
          {/* Marca */}
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{
              fontFamily: 'var(--font-italiana), serif',
              fontSize: isMobile ? '30px' : '36px',
              letterSpacing: '0.15em',
              marginBottom: '20px',
            }}><img src="/images/logo/logo-footer.png" alt="Vitalora" style={{ height: isMobile ? '40px' : '48px', width: 'auto', display: 'block' }} /></div>
            <p style={{
              fontSize: '14px',
              color: 'rgba(245,240,232,0.6)',
              lineHeight: 1.7,
              maxWidth: '320px',
              marginBottom: '24px',
            }}>
              K-Beauty auténtica y suplementos de alta pureza, curados con cuidado para tu ritual de bienestar.
            </p>
            {/* Redes */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {[{ label: 'IG', url: 'https://www.instagram.com/vitalora_mx/' }, { label: 'TK', url: 'https://www.tiktok.com/@vitaloramx' }, { label: 'FB', url: 'https://www.facebook.com/profile.php?id=61586734633198' }].map((red) => (
                <a key={red.label} href={red.url} target="_blank" rel="noopener noreferrer" style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid rgba(245,240,232,0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bg-cream)',
                  textDecoration: 'none',
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s',
                }}>{red.label}</a>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: isMobile ? '16px' : '24px',
              color: 'var(--gold)',
            }}>Tienda</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
              {[
                { label: 'Cosméticos', href: '/cosmeticos' },
                { label: 'Suplementos', href: '/suplementos' },
                { label: 'Programa de embajadoras', href: '/programa-embajadoras' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} style={{ color: 'rgba(245,240,232,0.6)', textDecoration: 'none', fontSize: '13px' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: isMobile ? '16px' : '24px',
              color: 'var(--gold)',
            }}>Ayuda</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
              {[
                { label: 'Envíos', href: '/envios-devoluciones' },
                { label: 'Devoluciones', href: '/envios-devoluciones' },
                { label: 'Preguntas frecuentes', href: '/faq' },
                { label: 'Contacto', href: '/contacto' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} style={{ color: 'rgba(245,240,232,0.6)', textDecoration: 'none', fontSize: '13px' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: isMobile ? '16px' : '24px',
              color: 'var(--gold)',
            }}>Legal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
              {[
                { label: 'Aviso de Privacidad', href: '/privacidad' },
                { label: 'Términos y Condiciones', href: '/terminos' },
                { label: 'Facturación', href: '/facturacion' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} style={{ color: 'rgba(245,240,232,0.6)', textDecoration: 'none', fontSize: '13px' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          paddingTop: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'rgba(245,240,232,0.4)',
          flexWrap: 'wrap',
          gap: '16px',
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <span>© 2026 Vitalora. Todos los derechos reservados.</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <MetodosPago variante="oscuro" titulo="" />
          </div>
        </div>

      </div>
    </footer>
  )
}
