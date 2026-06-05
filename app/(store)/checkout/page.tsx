'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'

const ENVIO_GRATIS = 1000
const COSTO_ENVIO = 99

interface Direccion {
  id: number; nombre_etiqueta: string; calle: string; numero: string; interior: string
  colonia: string; ciudad: string; estado: string; cp: string; referencia: string; es_principal: boolean
}

export default function CheckoutPage() {
  const { items, total } = useCartStore()
  const { user, isLoggedIn } = useAuthStore()
  const isMobile = useIsMobile()
  const [intentoPaso1, setIntentoPaso1] = useState(false)
  const [intentoPaso2, setIntentoPaso2] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [datosConfirmados, setDatosConfirmados] = useState(false)
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<number | null>(null)
  const [usarNuevaDireccion, setUsarNuevaDireccion] = useState(false)
  const [perfilCargado, setPerfilCargado] = useState(false)
  const [descuentoPrimeraCompra, setDescuentoPrimeraCompra] = useState(false)
  const [codigoInput, setCodigoInput] = useState('')
  const [codigoAplicado, setCodigoAplicado] = useState<{ codigo: string; tipo: string; valor: number; montoDescuento: number; descripcion: string } | null>(null)
  const [codigoError, setCodigoError] = useState('')
  const [validandoCodigo, setValidandoCodigo] = useState(false)

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    calle: '', numero: '', interior: '', colonia: '',
    ciudad: '', estado: '', cp: '', referencia: '',
  })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && isLoggedIn() && user && !perfilCargado) {
      cargarDatosUsuario()
    }
  }, [mounted, user])

  async function cargarDatosUsuario() {
    if (!user) return
    try {
      const perfilRes = await fetch('/api/cuenta/perfil', { headers: { 'x-user-id': user.id } })
      if (perfilRes.ok) {
        const perfil = await perfilRes.json()
        setForm(prev => ({
          ...prev,
          nombre: perfil.nombre || '', apellido: perfil.apellido || '',
          email: user.email || '', telefono: perfil.telefono || '',
        }))
        // Verificar si tiene descuento de primera compra
        if (!perfil.primera_compra_usada) {
          setDescuentoPrimeraCompra(true)
        }
      }

      const dirRes = await fetch('/api/cuenta/direcciones', { headers: { 'x-user-id': user.id } })
      if (dirRes.ok) {
        const dirs = await dirRes.json()
        if (Array.isArray(dirs) && dirs.length > 0) {
          setDirecciones(dirs)
          const principal = dirs.find((d: Direccion) => d.es_principal) || dirs[0]
          setDireccionSeleccionada(principal.id)
          aplicarDireccion(principal)
        } else {
          setUsarNuevaDireccion(true)
        }
      }
      setPerfilCargado(true)
    } catch (e) { console.error(e) }
  }

  function aplicarDireccion(d: Direccion) {
    setForm(prev => ({
      ...prev,
      calle: d.calle, numero: d.numero, interior: d.interior || '',
      colonia: d.colonia || '', ciudad: d.ciudad || '', estado: d.estado || '',
      cp: d.cp, referencia: d.referencia || '',
    }))
  }

  function seleccionarDireccion(id: number) {
    const dir = direcciones.find(d => d.id === id)
    if (dir) {
      setDireccionSeleccionada(id)
      setUsarNuevaDireccion(false)
      aplicarDireccion(dir)
    }
  }

  function activarNuevaDireccion() {
    setUsarNuevaDireccion(true)
    setDireccionSeleccionada(null)
    setForm(prev => ({ ...prev, calle: '', numero: '', interior: '', colonia: '', ciudad: '', estado: '', cp: '', referencia: '' }))
  }

  async function validarCodigo() {
    if (!codigoInput.trim()) return
    setValidandoCodigo(true); setCodigoError('')
    try {
      const res = await fetch('/api/validar-codigo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoInput, subtotal: total(), email: form.email }),
      })
      const data = await res.json()
      if (data.error) { setCodigoError(data.error) }
      else { setCodigoAplicado(data); setDescuentoPrimeraCompra(false) }
    } catch { setCodigoError('Error validando código') }
    setValidandoCodigo(false)
  }

  function quitarCodigo() {
    setCodigoAplicado(null); setCodigoInput('')
    // Restaurar descuento primera compra si aplica
    if (isLoggedIn() && user) {
      fetch('/api/cuenta/perfil', { headers: { 'x-user-id': user.id } })
        .then(r => r.json())
        .then(p => { if (!p.primera_compra_usada) setDescuentoPrimeraCompra(true) })
    }
  }

  if (!mounted) return null

  const subtotal = total()
  const costoEnvio = subtotal >= ENVIO_GRATIS ? 0 : COSTO_ENVIO
  const montoDescuento = codigoAplicado ? codigoAplicado.montoDescuento : (descuentoPrimeraCompra ? Math.round(subtotal * 0.05) : 0)
  const totalFinal = subtotal - montoDescuento + costoEnvio
  const logueado = isLoggedIn()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function estiloCampo(nombre: string, intento: boolean) {
    const vacio = !(form as any)[nombre] || String((form as any)[nombre]).trim() === ''
    if (intento && vacio) return { ...inputStyle, border: '1px solid #D33', background: '#FFF5F5' }
    return inputStyle
  }
  function validarPaso1() { return form.nombre && form.apellido && form.email && form.telefono }
  function validarPaso2() { return form.calle && form.numero && form.colonia && form.ciudad && form.estado && form.cp.length === 5 }
  function validarPaso3() { return datosConfirmados }

  async function handlePagar() {
    setEnviando(true)
    try {
      const res = await fetch('/api/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          comprador: { nombre: form.nombre, apellido: form.apellido, email: form.email, telefono: form.telefono },
          direccion: { cp: form.cp, calle: form.calle, numero: form.numero, interior: form.interior, colonia: form.colonia, ciudad: form.ciudad, estado: form.estado, referencia: form.referencia },
          costoEnvio,
          userId: user?.id || null,
          descuento: montoDescuento,
          descuentoTipo: codigoAplicado ? 'codigo' : (descuentoPrimeraCompra ? 'primera_compra' : null),
          codigoDescuento: codigoAplicado?.codigo || null,
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

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid var(--line)', borderRadius: '2px', fontSize: '14px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '8px' }

  if (items.length === 0) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '48px', color: 'var(--gold)', marginBottom: '16px' }}>✦</div>
          <h1 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', marginBottom: '16px' }}>Tu carrito está vacío</h1>
          <Link href="/" style={{ padding: '14px 32px', background: 'var(--black)', color: 'var(--bg-cream)', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Seguir comprando</Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: 'var(--bg-cream)', minHeight: '100vh', padding: isMobile ? '32px 16px' : '60px 40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '32px', letterSpacing: '0.15em', color: 'var(--black)' }}>VITALORA</div>
          </Link>
          {logueado && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Comprando como <strong style={{ color: 'var(--black)' }}>{user?.email}</strong>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          {['Datos personales', 'Dirección de envío', 'Confirmar pedido'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: paso > i + 1 ? 'var(--sage-deep)' : paso === i + 1 ? 'var(--black)' : 'var(--line)', color: paso >= i + 1 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>
                  {paso > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ display: isMobile ? 'none' : 'inline', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: paso === i + 1 ? 'var(--black)' : 'var(--text-muted)', fontWeight: paso === i + 1 ? 600 : 400 }}>{label}</span>
              </div>
              {i < 2 && <div style={{ width: isMobile ? '20px' : '60px', height: '1px', background: 'var(--line)', margin: isMobile ? '0 6px' : '0 16px' }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: isMobile ? '24px' : '40px', alignItems: 'start' }}>

          <div style={{ background: 'white', padding: isMobile ? '24px 20px' : '40px', borderRadius: '4px', border: '1px solid var(--line)' }}>

            {/* Paso 1 */}
            {paso === 1 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', marginBottom: '8px', color: 'var(--black)' }}>Datos personales</h2>

                {logueado && perfilCargado && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: '#F0F7F0', border: '1px solid #A8C5A0', borderRadius: '4px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: '12px', color: '#3A5A3A', lineHeight: 1.6, margin: 0 }}>
                      Datos auto-llenados desde tu cuenta. Puedes modificarlos si necesitas.
                    </p>
                  </div>
                )}

                {!logueado && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: '#F5F0FF', border: '1px solid #D5C8F0', borderRadius: '4px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                    <p style={{ fontSize: '12px', color: '#5A3A8A', lineHeight: 1.6, margin: 0 }}>
                      <Link href="/cuenta" style={{ color: '#5A3A8A', fontWeight: 600 }}>Inicia sesión</Link> para auto-llenar tus datos y obtener <strong>5% de descuento</strong> en tu primera compra.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: '#FFF8E7', border: '1px solid #F0D080', borderRadius: '4px', marginBottom: '28px' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                  <p style={{ fontSize: '12px', color: '#7A6000', lineHeight: 1.6, margin: 0 }}>
                    <strong>Importante:</strong> El nombre debe ser exactamente como aparece en tu identificación oficial (INE, pasaporte o licencia). La paquetería solo entregará el pedido al titular con identificación que coincida con los datos del envío.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                  {[
                    { name: 'nombre', label: 'Nombre (como en tu ID)', placeholder: 'Tu nombre' },
                    { name: 'apellido', label: 'Apellido (como en tu ID)', placeholder: 'Tu apellido' },
                    { name: 'email', label: 'Correo electrónico', placeholder: 'correo@ejemplo.com' },
                    { name: 'telefono', label: 'Teléfono', placeholder: '10 dígitos' },
                  ].map((field) => (
                    <div key={field.name}>
                      <label style={labelStyle}>{field.label}</label>
                      <input name={field.name} value={(form as any)[field.name]} onChange={handleChange} placeholder={field.placeholder} style={estiloCampo(field.name, intentoPaso1)} />
                    </div>
                  ))}
                </div>
                <button onClick={() => { if (validarPaso1()) { setPaso(2); setIntentoPaso1(false) } else { setIntentoPaso1(true) } }} style={{ marginTop: '32px', width: '100%', padding: '18px', background: validarPaso1() ? 'var(--black)' : 'var(--line)', color: validarPaso1() ? 'var(--bg-cream)' : 'var(--text-muted)', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: validarPaso1() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', borderRadius: '2px' }}>
                  Continuar →
                </button>
              </div>
            )}

            {/* Paso 2 */}
            {paso === 2 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', marginBottom: '32px', color: 'var(--black)' }}>Dirección de envío</h2>

                {logueado && direcciones.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ ...labelStyle, marginBottom: '12px' }}>Selecciona una dirección guardada</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {direcciones.map(d => (
                        <button key={d.id} onClick={() => seleccionarDireccion(d.id)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 16px', border: '2px solid', textAlign: 'left', cursor: 'pointer',
                            borderColor: direccionSeleccionada === d.id && !usarNuevaDireccion ? 'var(--black)' : 'var(--line)',
                            background: direccionSeleccionada === d.id && !usarNuevaDireccion ? 'rgba(14,14,14,0.02)' : 'white',
                            borderRadius: '4px', fontFamily: 'inherit', width: '100%',
                          }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--black)' }}>{d.nombre_etiqueta}</span>
                              {d.es_principal && <span style={{ fontSize: '9px', padding: '2px 8px', background: 'var(--black)', color: 'white', borderRadius: '100px' }}>PRINCIPAL</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {d.calle} {d.numero}{d.interior ? `, Int. ${d.interior}` : ''}, {d.colonia}, {d.ciudad}, {d.estado} CP {d.cp}
                            </div>
                          </div>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: direccionSeleccionada === d.id && !usarNuevaDireccion ? 'var(--black)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {direccionSeleccionada === d.id && !usarNuevaDireccion && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--black)' }} />}
                          </div>
                        </button>
                      ))}
                      <button onClick={activarNuevaDireccion}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '14px 16px', border: '2px solid', textAlign: 'left', cursor: 'pointer',
                          borderColor: usarNuevaDireccion ? 'var(--black)' : 'var(--line)',
                          background: usarNuevaDireccion ? 'rgba(14,14,14,0.02)' : 'white',
                          borderRadius: '4px', fontFamily: 'inherit', width: '100%',
                        }}>
                        <span style={{ fontSize: '13px', color: 'var(--black)' }}>+ Usar una dirección diferente</span>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: usarNuevaDireccion ? 'var(--black)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {usarNuevaDireccion && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--black)' }} />}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {(!logueado || direcciones.length === 0 || usarNuevaDireccion) && (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                    {[
                      { name: 'calle', label: 'Calle', placeholder: 'Nombre de la calle', span: 2 },
                      { name: 'numero', label: 'Número exterior', placeholder: 'Ej: 123 (o SN si no tiene)', span: 1 },
                      { name: 'interior', label: 'Interior / Depto (opcional)', placeholder: 'Ej: A', span: 1 },
                      { name: 'colonia', label: 'Colonia', placeholder: 'Tu colonia', span: 2 },
                      { name: 'ciudad', label: 'Ciudad / Municipio', placeholder: 'Tu ciudad', span: 1 },
                      { name: 'estado', label: 'Estado', placeholder: 'Tu estado', span: 1 },
                      { name: 'cp', label: 'Código Postal', placeholder: '5 dígitos', span: 1 },
                      { name: 'referencia', label: 'Referencia (opcional)', placeholder: 'Ej: Casa azul, entre calles Juárez y Morelos', span: 2 },
                    ].map((field) => (
                      <div key={field.name} style={{ gridColumn: `span ${field.span}` }}>
                        <label style={labelStyle}>{field.label}</label>
                        <input name={field.name} value={(form as any)[field.name]} onChange={handleChange} placeholder={field.placeholder} maxLength={field.name === 'cp' ? 5 : undefined} style={(field.name === 'interior' || field.name === 'referencia') ? inputStyle : estiloCampo(field.name, intentoPaso2)} />
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button onClick={() => setPaso(1)} style={{ flex: 1, padding: '18px', background: 'none', border: '1px solid var(--line)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '2px', color: 'var(--text-muted)' }}>← Regresar</button>
                  <button onClick={() => { if (validarPaso2()) { setPaso(3); setIntentoPaso2(false) } else { setIntentoPaso2(true) } }} style={{ flex: 2, padding: '18px', background: validarPaso2() ? 'var(--black)' : 'var(--line)', color: validarPaso2() ? 'var(--bg-cream)' : 'var(--text-muted)', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: validarPaso2() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', borderRadius: '2px' }}>Continuar →</button>
                </div>
              </div>
            )}

            {/* Paso 3 */}
            {paso === 3 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '28px', marginBottom: '32px', color: 'var(--black)' }}>Confirmar pedido</h2>

                <div style={{ marginBottom: '16px', padding: '20px', background: 'var(--bg-cream-deep)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Datos personales</div>
                    <button onClick={() => setPaso(1)} style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>Editar</button>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.8 }}>
                    <div>{form.nombre} {form.apellido}</div>
                    <div>{form.email}</div>
                    <div>{form.telefono}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-cream-deep)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dirección de envío</div>
                    <button onClick={() => setPaso(2)} style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>Cambiar</button>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.8 }}>
                    <div>{form.calle} {form.numero}{form.interior ? `, Int. ${form.interior}` : ''}</div>
                    <div>{form.colonia}</div>
                    <div>{form.ciudad}, {form.estado} CP {form.cp}</div>
                    {form.referencia && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Ref: {form.referencia}</div>}
                  </div>
                </div>

                {/* Descuento aplicado */}
                {descuentoPrimeraCompra && !codigoAplicado && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#F0F7F0', border: '1px solid #A8C5A0', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🎉</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#3A5A3A' }}>Descuento de primera compra aplicado</div>
                          <div style={{ fontSize: '11px', color: '#6B8F6B' }}>5% de descuento por ser tu primera compra como usuario registrado</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: '#3A5A3A' }}>-${montoDescuento.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {codigoAplicado && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#F0F7F0', border: '1px solid #A8C5A0', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🏷️</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#3A5A3A' }}>Código {codigoAplicado.codigo} aplicado</div>
                          <div style={{ fontSize: '11px', color: '#6B8F6B' }}>{codigoAplicado.descripcion}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: '#3A5A3A' }}>-${codigoAplicado.montoDescuento.toLocaleString()}</div>
                        <button onClick={quitarCodigo} style={{ background: 'none', border: 'none', fontSize: '14px', color: '#A33', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '24px', padding: '16px', background: costoEnvio === 0 ? '#F0F7F0' : 'white', border: `1px solid ${costoEnvio === 0 ? '#A8C5A0' : 'var(--line)'}`, borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--black)', marginBottom: '4px' }}>Envío — Mercado Envíos</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Entrega estimada: 2-5 días hábiles</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: costoEnvio === 0 ? '#6B8F6B' : 'var(--black)' }}>
                      {costoEnvio === 0 ? 'GRATIS' : '$99 MXN'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid', borderColor: datosConfirmados ? '#A8C5A0' : 'var(--line)', borderRadius: '4px', background: datosConfirmados ? '#F0F7F0' : 'white', transition: 'all 0.2s' }}>
                  <label style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <div onClick={() => setDatosConfirmados(!datosConfirmados)} style={{ width: '22px', height: '22px', borderRadius: '4px', flexShrink: 0, border: '2px solid', borderColor: datosConfirmados ? 'var(--sage-deep)' : 'var(--line)', background: datosConfirmados ? 'var(--sage-deep)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: 'pointer', marginTop: '2px' }}>
                      {datosConfirmados && <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--black)', lineHeight: 1.6, margin: '0 0 8px 0', fontWeight: 500 }}>Confirmo que todos mis datos son correctos y completos.</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                        Entiendo que en caso de que la paquetería no pueda entregar mi pedido por información incorrecta o incompleta, <strong style={{ color: 'var(--black)' }}>el costo de envío no será reembolsable.</strong>
                      </p>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setPaso(2)} style={{ flex: 1, padding: '18px', background: 'none', border: '1px solid var(--line)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '2px', color: 'var(--text-muted)' }}>← Regresar</button>
                  <button onClick={handlePagar} disabled={!validarPaso3() || enviando} style={{ flex: 2, padding: '18px', background: validarPaso3() ? 'var(--gold)' : 'var(--line)', color: validarPaso3() ? 'var(--black)' : 'var(--text-muted)', border: 'none', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, cursor: validarPaso3() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', borderRadius: '2px', opacity: enviando ? 0.7 : 1 }}>
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
                    <div style={{ width: '56px', height: '56px', background: 'var(--bg-cream-deep)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {item.imagen ? <img src={item.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontFamily: 'var(--font-italiana), serif', fontSize: '20px', color: 'var(--text-muted)' }}>V</span>}
                    </div>
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
                  <span>Subtotal</span><span>${subtotal.toLocaleString()} MXN</span>
                </div>
                {montoDescuento > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#3A8A3A', fontWeight: 500 }}>
                    <span>{codigoAplicado ? '🏷️ ' + codigoAplicado.codigo : '🎉 Descuento 5%'}</span><span>-${montoDescuento.toLocaleString()} MXN</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: costoEnvio === 0 ? '#6B8F6B' : 'var(--text-muted)' }}>
                  <span>Envío</span>
                  <span>{costoEnvio === 0 ? 'Gratis' : '$99 MXN'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600, color: 'var(--black)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', fontWeight: 600, color: 'var(--black)' }}>${totalFinal.toLocaleString()} MXN</span>
                </div>
              </div>
            </div>

            {/* Campo de código de descuento */}
            <div style={{ marginTop: '16px', background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Código de descuento</div>
              {codigoAplicado ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '4px 10px', background: '#111', color: 'white', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em' }}>{codigoAplicado.codigo}</span>
                    <span style={{ fontSize: '12px', color: '#3A8A3A' }}>✓</span>
                  </div>
                  <button onClick={quitarCodigo} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#A33', cursor: 'pointer', fontFamily: 'inherit' }}>Quitar</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={codigoInput} onChange={e => { setCodigoInput(e.target.value.toUpperCase()); setCodigoError('') }} placeholder="Ej: BIENVENIDO10" onKeyDown={e => e.key === 'Enter' && validarCodigo()} style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '2px', fontSize: '13px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', outline: 'none' }} />
                    <button onClick={validarCodigo} disabled={validandoCodigo || !codigoInput.trim()} style={{ padding: '10px 16px', background: codigoInput.trim() ? 'var(--black)' : 'var(--line)', color: codigoInput.trim() ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '2px', fontSize: '12px', cursor: codigoInput.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600 }}>{validandoCodigo ? '...' : 'Aplicar'}</button>
                  </div>
                  {codigoError && <p style={{ fontSize: '11px', color: '#D33', marginTop: '6px', marginBottom: 0 }}>{codigoError}</p>}
                  {descuentoPrimeraCompra && <p style={{ fontSize: '11px', color: '#888', marginTop: '6px', marginBottom: 0 }}>Nota: los códigos no son acumulables con el descuento de primera compra</p>}
                </div>
              )}
            </div>

            {!logueado && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#F5F0FF', border: '1px solid #D5C8F0', borderRadius: '4px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#5A3A8A', margin: '0 0 8px', lineHeight: 1.6 }}>
                  <strong>¿Sabías que?</strong> Al crear una cuenta obtienes 5% de descuento en tu primera compra.
                </p>
                <Link href="/cuenta" style={{ fontSize: '12px', color: '#5A3A8A', fontWeight: 600, textDecoration: 'underline' }}>Crear cuenta</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
