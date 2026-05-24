'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'

export default function CheckoutPage() {
  const { items, total } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [datosConfirmados, setDatosConfirmados] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    calle: '',
    numero: '',
    interior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    cp: '',
    referencia: '',
  })

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validarPaso1() {
    return form.nombre && form.apellido && form.email && form.telefono
  }

  function validarPaso2() {
    return form.calle && form.numero && form.colonia && form.ciudad && form.estado && form.cp.length === 5
  }

  function validarPaso3() {
    return datosConfirmados
  }

  async function handlePagar() {
    setEnviando(true)
    try {
      const costoEnvio = total() >= 1000 ? 0 : 99
      const res = await fetch('/api/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          comprador: {
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono,
          },
          direccion: {
            cp: form.cp,
            calle: form.calle,
            numero: form.numero,
            interior: form.interior,
            referencia: form.referencia,
          },
          costoEnvio,
        }),
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        alert('Error al conectar con Mercado Pago. Intenta de nuevo.')
        setEnviando(false)
      }
    } catch (error) {
      console.error(error)
      alert('Error al procesar el pago. Intenta de nuevo.')
      setEnviando(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '1px solid var(--line)',
    borderRadius: '2px', fontSize: '14px', color: 'var(--text)',
    fontFamily: 'inherit', outline: 'none', background: 'white',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontSize: '11px', letterSpacing: '0.2em',
    textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '8px',
  }

  if (items.length === 0) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '48px', color: 'var(--gold)', marginBottom: '16px' }}>✦</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', marginBottom: '16px' }}>Tu carrito está vacío</h1>
          <Link href="/" style={{ padding: '14px 32px', background: 'var(--black)', color: 'var(--bg-cream)', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Seguir comprando
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: 'var(--bg-cream)', minHeight: '100vh', padding: '60px 40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', letterSpacing: '0.15em', color: 'var(--black)' }}>VITALORA</div>
          </Link>
        </div>

        {/* Pasos */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          {['Datos personales', 'Dirección de envío', 'Confirmar pedido'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: paso > i + 1 ? 'var(--sage-deep)' : paso === i + 1 ? 'var(--black)' : 'var(--line)',
                  color: paso >= i + 1 ? 'white' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 600,
                }}>
                  {paso > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: paso === i + 1 ? 'var(--black)' : 'var(--text-muted)', fontWeight: paso === i + 1 ? 600 : 400 }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div style={{ width: '60px', height: '1px', background: 'var(--line)', margin: '0 16px' }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px', alignItems: 'start' }}>

          {/* Formulario */}
          <div style={{ background: 'white', padding: '40px', borderRadius: '4px', border: '1px solid var(--line)' }}>

            {/* Paso 1 */}
            {paso === 1 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', marginBottom: '8px', color: 'var(--black)' }}>Datos personales</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: '#FFF8E7', border: '1px solid #F0D080', borderRadius: '4px', marginBottom: '28px' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                  <p style={{ fontSize: '12px', color: '#7A6000', lineHeight: 1.6, margin: 0 }}>
                    <strong>Importante:</strong> El nombre debe ser exactamente como aparece en tu identificación oficial (INE, pasaporte o licencia). La paquetería solo entregará el pedido al titular con identificación que coincida con los datos del envío.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {[
                    { name: 'nombre', label: 'Nombre (como en tu ID)', placeholder: 'Tu nombre' },
                    { name: 'apellido', label: 'Apellido (como en tu ID)', placeholder: 'Tu apellido' },
                    { name: 'email', label: 'Correo electrónico', placeholder: 'correo@ejemplo.com' },
                    { name: 'telefono', label: 'Teléfono', placeholder: '10 dígitos' },
                  ].map((field) => (
                    <div key={field.name}>
                      <label style={labelStyle}>{field.label}</label>
                      <input name={field.name} value={(form as any)[field.name]} onChange={handleChange} placeholder={field.placeholder} style={inputStyle} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => validarPaso1() && setPaso(2)}
                  style={{ marginTop: '32px', width: '100%', padding: '18px', background: validarPaso1() ? 'var(--black)' : 'var(--line)', color: validarPaso1() ? 'var(--bg-cream)' : 'var(--text-muted)', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: validarPaso1() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', borderRadius: '2px' }}
                >
                  Continuar →
                </button>
              </div>
            )}

            {/* Paso 2 */}
            {paso === 2 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', marginBottom: '32px', color: 'var(--black)' }}>Dirección de envío</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {[
                    { name: 'calle', label: 'Calle', placeholder: 'Nombre de la calle', span: 2 },
                    { name: 'numero', label: 'Número exterior', placeholder: 'Ej: 123', span: 1 },
                    { name: 'interior', label: 'Interior / Depto (opcional)', placeholder: 'Ej: A', span: 1 },
                    { name: 'colonia', label: 'Colonia', placeholder: 'Tu colonia', span: 2 },
                    { name: 'ciudad', label: 'Ciudad / Municipio', placeholder: 'Tu ciudad', span: 1 },
                    { name: 'estado', label: 'Estado', placeholder: 'Tu estado', span: 1 },
                    { name: 'cp', label: 'Código Postal', placeholder: '5 dígitos', span: 1 },
                    { name: 'referencia', label: 'Referencia (opcional)', placeholder: 'Ej: Casa azul, entre calles Juárez y Morelos', span: 2 },
                  ].map((field) => (
                    <div key={field.name} style={{ gridColumn: `span ${field.span}` }}>
                      <label style={labelStyle}>{field.label}</label>
                      <input name={field.name} value={(form as any)[field.name]} onChange={handleChange} placeholder={field.placeholder} maxLength={field.name === 'cp' ? 5 : undefined} style={inputStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button onClick={() => setPaso(1)} style={{ flex: 1, padding: '18px', background: 'none', border: '1px solid var(--line)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '2px', color: 'var(--text-muted)' }}>← Regresar</button>
                  <button onClick={() => validarPaso2() && setPaso(3)} style={{ flex: 2, padding: '18px', background: validarPaso2() ? 'var(--black)' : 'var(--line)', color: validarPaso2() ? 'var(--bg-cream)' : 'var(--text-muted)', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: validarPaso2() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', borderRadius: '2px' }}>Continuar →</button>
                </div>
              </div>
            )}

            {/* Paso 3 */}
            {paso === 3 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', marginBottom: '32px', color: 'var(--black)' }}>Confirmar pedido</h2>

                <div style={{ marginBottom: '16px', padding: '20px', background: 'var(--bg-cream-deep)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Datos personales</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.8 }}>
                    <div>{form.nombre} {form.apellido}</div>
                    <div>{form.email}</div>
                    <div>{form.telefono}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-cream-deep)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Dirección de envío</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.8 }}>
                    <div>{form.calle} {form.numero}{form.interior ? `, Int. ${form.interior}` : ''}</div>
                    <div>{form.colonia}</div>
                    <div>{form.ciudad}, {form.estado} CP {form.cp}</div>
                    {form.referencia && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Ref: {form.referencia}</div>}
                  </div>
                </div>

                <div style={{ marginBottom: '24px', padding: '16px', background: total() >= 1000 ? '#F0F7F0' : 'white', border: `1px solid ${total() >= 1000 ? '#A8C5A0' : 'var(--line)'}`, borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--black)', marginBottom: '4px' }}>Envío — Mercado Envíos</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Entrega estimada: 2-5 días hábiles</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 600, color: total() >= 1000 ? '#6B8F6B' : 'var(--black)' }}>
                      {total() >= 1000 ? 'GRATIS' : 'Calculado al pagar'}
                    </div>
                  </div>
                </div>

                {/* Casilla obligatoria */}
                <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid', borderColor: datosConfirmados ? '#A8C5A0' : 'var(--line)', borderRadius: '4px', background: datosConfirmados ? '#F0F7F0' : 'white', transition: 'all 0.2s' }}>
                  <label style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <div
                      onClick={() => setDatosConfirmados(!datosConfirmados)}
                      style={{
                        width: '22px', height: '22px', borderRadius: '4px', flexShrink: 0,
                        border: '2px solid', borderColor: datosConfirmados ? 'var(--sage-deep)' : 'var(--line)',
                        background: datosConfirmados ? 'var(--sage-deep)' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', cursor: 'pointer', marginTop: '2px',
                      }}
                    >
                      {datosConfirmados && <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--black)', lineHeight: 1.6, margin: '0 0 8px 0', fontWeight: 500 }}>
                        Confirmo que todos mis datos son correctos y completos.
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                        Entiendo que en caso de que la paquetería no pueda entregar mi pedido por información incorrecta o incompleta, <strong style={{ color: 'var(--black)' }}>el costo de envío no será reembolsable.</strong>
                      </p>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setPaso(2)} style={{ flex: 1, padding: '18px', background: 'none', border: '1px solid var(--line)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '2px', color: 'var(--text-muted)' }}>← Regresar</button>
                  <button
                    onClick={handlePagar}
                    disabled={!validarPaso3() || enviando}
                    style={{ flex: 2, padding: '18px', background: validarPaso3() ? 'var(--gold)' : 'var(--line)', color: validarPaso3() ? 'var(--black)' : 'var(--text-muted)', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, cursor: validarPaso3() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', borderRadius: '2px', opacity: enviando ? 0.7 : 1 }}
                  >
                    {enviando ? 'Procesando...' : '✦ Pagar con Mercado Pago'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Resumen */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '4px', border: '1px solid var(--line)' }}>
              <h3 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '22px', marginBottom: '24px', color: 'var(--black)' }}>Tu pedido</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', background: 'var(--bg-cream-deep)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-italiana), serif', fontSize: '20px', color: 'var(--text-muted)', flexShrink: 0 }}>V</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--black)', lineHeight: 1.3 }}>{item.nombre}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.marca} · x{item.cantidad}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 600, color: 'var(--black)', flexShrink: 0 }}>${(item.precio * item.cantidad).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span><span>${total().toLocaleString()} MXN</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: total() >= 1000 ? '#6B8F6B' : 'var(--text-muted)' }}>
                  <span>Envío</span><span>{total() >= 1000 ? 'Gratis' : 'Por calcular'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: 'var(--black)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', fontWeight: 600, color: 'var(--black)' }}>${total().toLocaleString()} MXN</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}