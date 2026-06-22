'use client'

import { useState } from 'react'

const REGIMENES = [
  { codigo: '605', desc: 'Sueldos y Salarios e Ingresos Asimilados' },
  { codigo: '606', desc: 'Arrendamiento' },
  { codigo: '608', desc: 'Demás ingresos' },
  { codigo: '612', desc: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { codigo: '621', desc: 'Incorporación Fiscal' },
  { codigo: '625', desc: 'Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { codigo: '626', desc: 'Régimen Simplificado de Confianza (RESICO)' },
  { codigo: '601', desc: 'General de Ley Personas Morales' },
  { codigo: '603', desc: 'Personas Morales con Fines no Lucrativos' },
]

export default function RegistroInfluencerPage() {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '',
    instagram: '', tiktok: '', youtube: '', facebook: '', otra_red: '', seguidores: '',
    fiscal_rfc: '', fiscal_razon_social: '', fiscal_regimen: '', fiscal_cp: '',
    banco: '', clabe: '', titular_cuenta: '',
  })
  const [puedeFacturar, setPuedeFacturar] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [constanciaPath, setConstanciaPath] = useState('')
  const [constanciaNombre, setConstanciaNombre] = useState('')
  const [subiendoDoc, setSubiendoDoc] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const set = (campo: string, valor: string) => setForm(f => ({ ...f, [campo]: valor }))

  async function subirConstancia(file: File) {
    setError('')
    if (file.type !== 'application/pdf') { setError('La constancia debe ser un archivo PDF.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('El archivo no debe superar 5 MB.'); return }

    setSubiendoDoc(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/influencer/constancia', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al subir el archivo.')
      } else {
        setConstanciaPath(data.path)
        setConstanciaNombre(file.name)
      }
    } catch {
      setError('Error al subir el archivo. Intenta de nuevo.')
    } finally {
      setSubiendoDoc(false)
    }
  }

  async function enviar() {
    setError('')
    if (!form.nombre || !form.email) { setError('Tu nombre y correo son obligatorios.'); return }
    if (!puedeFacturar) { setError('Para participar necesitas poder emitir facturas CFDI.'); return }
    if (!form.fiscal_rfc || !form.fiscal_razon_social || !form.fiscal_regimen) { setError('Completa tus datos fiscales.'); return }
    if (!constanciaPath) { setError('Debes subir tu Constancia de Situación Fiscal.'); return }
    if (!/^\d{18}$/.test(form.clabe)) { setError('La CLABE debe tener exactamente 18 dígitos.'); return }
    if (!form.banco || !form.titular_cuenta) { setError('Completa tus datos bancarios.'); return }
    if (!aceptaTerminos) { setError('Debes aceptar los términos del programa.'); return }

    setEnviando(true)
    try {
      const res = await fetch('/api/influencer/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, puede_facturar: puedeFacturar, constancia_url: constanciaPath }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar el registro.')
      } else {
        setExito(true)
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (exito) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'white', maxWidth: '480px', width: '100%', padding: '48px 40px', borderRadius: '4px', border: '1px solid #E8E4DA', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✦</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 600, color: '#0E0E0E', marginBottom: '12px' }}>¡Solicitud recibida!</h1>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7 }}>
            Gracias por tu interés en ser parte del programa de embajadoras de Vitalora. Revisaremos tu solicitud y te contactaremos por correo en los próximos días.
          </p>
          <a href="/" style={{ display: 'inline-block', marginTop: '24px', fontSize: '13px', color: '#C9A961', textDecoration: 'none', letterSpacing: '0.05em' }}>← Volver a la tienda</a>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid #E8E4DA', borderRadius: '3px',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'white', color: '#2C2C2C',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500,
  }
  const seccionStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif", fontSize: '19px', fontWeight: 600, color: '#0E0E0E', marginBottom: '4px',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Italiana&display=swap');
        .inf-input:focus { border-color: #C9A961 !important; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto' }}>

          {/* Encabezado */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A961', marginBottom: '12px' }}>Programa de Embajadoras</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '38px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1.1, marginBottom: '16px' }}>
              Únete a <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>Vitalora</em>
            </h1>
            <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto' }}>
              Comparte tu código personal, regala 5% de descuento a tu comunidad y gana 5% de comisión por cada venta. Completa tu registro y te contactaremos.
            </p>
          </div>

          <div style={{ background: 'white', padding: '40px', borderRadius: '4px', border: '1px solid #E8E4DA' }}>

            {/* Sección: Datos personales */}
            <div style={{ marginBottom: '32px' }}>
              <p style={seccionStyle}>Datos personales</p>
              <div style={{ height: '1px', background: '#F0EDE5', marginBottom: '20px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nombre completo *</label>
                  <input className="inf-input" style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Correo electrónico *</label>
                    <input className="inf-input" style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Teléfono</label>
                    <input className="inf-input" style={inputStyle} value={form.telefono} onChange={e => set('telefono', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Redes sociales */}
            <div style={{ marginBottom: '32px' }}>
              <p style={seccionStyle}>Tus redes sociales</p>
              <div style={{ height: '1px', background: '#F0EDE5', marginBottom: '12px' }} />
              <p style={{ fontSize: '12px', color: '#A8A8A8', marginBottom: '20px' }}>Llena las que utilices. Al menos una es recomendable.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Instagram</label>
                    <input className="inf-input" style={inputStyle} placeholder="@usuario" value={form.instagram} onChange={e => set('instagram', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>TikTok</label>
                    <input className="inf-input" style={inputStyle} placeholder="@usuario" value={form.tiktok} onChange={e => set('tiktok', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>YouTube</label>
                    <input className="inf-input" style={inputStyle} placeholder="Canal o @usuario" value={form.youtube} onChange={e => set('youtube', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Facebook</label>
                    <input className="inf-input" style={inputStyle} placeholder="Página o perfil" value={form.facebook} onChange={e => set('facebook', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Otra plataforma</label>
                  <input className="inf-input" style={inputStyle} placeholder="Ej. Twitch, X, blog, etc." value={form.otra_red} onChange={e => set('otra_red', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>¿Cuántos seguidores tienes aprox.?</label>
                  <input className="inf-input" style={inputStyle} placeholder="Ej. 15,000 en Instagram" value={form.seguidores} onChange={e => set('seguidores', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Sección: Datos fiscales */}
            <div style={{ marginBottom: '32px' }}>
              <p style={seccionStyle}>Datos fiscales</p>
              <div style={{ height: '1px', background: '#F0EDE5', marginBottom: '12px' }} />
              <div style={{ padding: '12px 14px', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.25)', borderRadius: '4px', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#8B7530', lineHeight: 1.6 }}>
                  📋 Para recibir tus comisiones necesitas poder emitir facturas CFDI por "servicios de publicidad" o "comisiones por ventas". Tus datos fiscales nos permiten procesarte el pago correctamente.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>RFC *</label>
                    <input className="inf-input" style={inputStyle} value={form.fiscal_rfc} onChange={e => set('fiscal_rfc', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label style={labelStyle}>Código postal fiscal</label>
                    <input className="inf-input" style={inputStyle} value={form.fiscal_cp} onChange={e => set('fiscal_cp', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Razón social / Nombre fiscal *</label>
                  <input className="inf-input" style={inputStyle} value={form.fiscal_razon_social} onChange={e => set('fiscal_razon_social', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Régimen fiscal *</label>
                  <select className="inf-input" style={inputStyle} value={form.fiscal_regimen} onChange={e => set('fiscal_regimen', e.target.value)}>
                    <option value="">Selecciona tu régimen</option>
                    {REGIMENES.map(r => <option key={r.codigo} value={r.codigo}>{r.codigo} — {r.desc}</option>)}
                  </select>
                </div>

                {/* Subida de Constancia */}
                <div>
                  <label style={labelStyle}>Constancia de Situación Fiscal (PDF) *</label>
                  <p style={{ fontSize: '11px', color: '#A8A8A8', marginBottom: '8px' }}>No mayor a 3 meses de antigüedad. Máximo 5 MB.</p>
                  {constanciaPath ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(168,181,160,0.12)', border: '1px solid rgba(168,181,160,0.4)', borderRadius: '3px' }}>
                      <span style={{ fontSize: '13px', color: '#6A8A62', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✓ {constanciaNombre}
                      </span>
                      <button onClick={() => { setConstanciaPath(''); setConstanciaNombre('') }}
                        style={{ background: 'none', border: 'none', color: '#A8A8A8', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                        cambiar
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'block', padding: '20px', background: '#FAFAF7', border: '1px dashed #C9A961', borderRadius: '3px', textAlign: 'center', cursor: subiendoDoc ? 'wait' : 'pointer' }}>
                      <span style={{ fontSize: '13px', color: subiendoDoc ? '#A8A8A8' : '#8B7530' }}>
                        {subiendoDoc ? 'Subiendo…' : '📎 Haz clic para subir tu PDF'}
                      </span>
                      <input type="file" accept="application/pdf" style={{ display: 'none' }} disabled={subiendoDoc}
                        onChange={e => { if (e.target.files?.[0]) subirConstancia(e.target.files[0]) }} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Datos bancarios */}
            <div style={{ marginBottom: '32px' }}>
              <p style={seccionStyle}>Datos bancarios (SPEI)</p>
              <div style={{ height: '1px', background: '#F0EDE5', marginBottom: '20px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Banco *</label>
                    <input className="inf-input" style={inputStyle} placeholder="Ej. BBVA" value={form.banco} onChange={e => set('banco', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Titular de la cuenta *</label>
                    <input className="inf-input" style={inputStyle} value={form.titular_cuenta} onChange={e => set('titular_cuenta', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>CLABE interbancaria (18 dígitos) *</label>
                  <input className="inf-input" style={inputStyle} maxLength={18} placeholder="000000000000000000" value={form.clabe} onChange={e => set('clabe', e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={puedeFacturar} onChange={e => setPuedeFacturar(e.target.checked)} style={{ marginTop: '3px', accentColor: '#C9A961', width: '16px', height: '16px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#2C2C2C', lineHeight: 1.6 }}>Confirmo que <strong>puedo emitir facturas CFDI</strong> a nombre de Vitalora por mis comisiones. *</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} style={{ marginTop: '3px', accentColor: '#C9A961', width: '16px', height: '16px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#2C2C2C', lineHeight: 1.6 }}>Acepto los términos del programa de embajadoras: 5% de comisión sobre el subtotal de ventas (sin envío), pagos los días 1 y 15 cuando el acumulado supere $500 MXN. *</span>
              </label>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', marginBottom: '20px', fontSize: '13px', color: '#EF4444' }}>{error}</div>
            )}

            <button onClick={enviar} disabled={enviando || subiendoDoc}
              style={{ width: '100%', padding: '15px', background: (enviando || subiendoDoc) ? '#A8A8A8' : '#0E0E0E', color: '#C9A961', border: 'none', borderRadius: '3px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: (enviando || subiendoDoc) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#A8A8A8', marginTop: '24px' }}>
            ¿Dudas? Escríbenos a <a href="mailto:hola@vitalora.com.mx" style={{ color: '#C9A961' }}>hola@vitalora.com.mx</a>
          </p>
        </div>
      </div>
    </>
  )
}
