'use client'

// ============================================================
// Tarjeta "Envío Skydropx" del detalle de pedido.
// Cotizar (origen, bolsa/caja, peso) → ver saldo y tarifas → generar guía →
// imprimir guía + hoja de pedido → cancelar guía (dueño/gerente).
// ============================================================
import { useEffect, useState } from 'react'
import { ESTADOS_CON_GUIA } from '@/lib/estados-pedido'
import { formatearNumeroPedido } from '@/lib/utils'

const slug = (s: string | null | undefined) => (s || 'paqueteria').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Abre el PDF en una pestaña (para imprimir) y además lo guarda en Descargas con un nombre claro.
// La pestaña se abre antes de pedir el PDF para que el navegador no la bloquee.
async function abrirYDescargar(url: string, nombreArchivo: string): Promise<string | null> {
  const pestana = window.open('', '_blank')
  try {
    const res = await fetch(url)
    if (!res.ok) {
      pestana?.close()
      const data = await res.json().catch(() => ({}))
      return data.error || 'No se pudo generar el PDF.'
    }
    const blobUrl = URL.createObjectURL(await res.blob())
    if (pestana) pestana.location.href = blobUrl
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
    return null
  } catch {
    pestana?.close()
    return 'Error de conexión al generar el PDF.'
  }
}

export interface PedidoEnvio {
  id: number | string
  estado: string
  numero_guia: string | null
  paqueteria: string | null
  skydropx_shipment_id?: string | null
  guia_entorno?: string | null
  costo_guia?: number | null
  cobro_real_guia?: number | null
  guia_creada_at?: string | null
  guia_url_rastreo?: string | null
  envio_estado?: string | null
  zona_verificada?: boolean | null
  guias_anteriores?: { numeroGuia: string | null; paqueteria: string | null; cancelada: string; por: string; motivo: string; entorno?: string | null }[] | null
}

interface Origen { id: number; alias: string; cp: string; municipio: string; predeterminado: boolean }
interface Tarifa {
  rateId: string; paqueteria: string; servicio: string; total: number; dias: number | null
  zonaExtendida: boolean; recargoZona: number; soloSucursal: boolean; cupon: unknown
}
interface Cotizacion {
  cotizacionId: number
  entorno: 'produccion' | 'sandbox'
  origen: { id: number; alias: string; cp: string }
  paquete: { empaque: string; largoCm: number; anchoCm: number; altoCm: number; pesoKg: number; pesoVolumetricoKg: number; avisos: { tipo: string; productos?: string[] }[] }
  saldo: number | null
  tarifas: Tarifa[]
  zona: { extendida: boolean; motivo: string | null; masBarata: number | null }
  avisoZonaSinVerificar: boolean
}

const fmt = (n: number | null | undefined) => n == null ? '—' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))
const fecha = (s?: string | null) => s ? new Date(s).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

const tarjeta: React.CSSProperties = { background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }
const cabecera: React.CSSProperties = { padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const titulo: React.CSSProperties = { fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }
const campo: React.CSSProperties = { padding: '8px 10px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', color: '#2C2C2C', background: '#fff', width: '100%', boxSizing: 'border-box' }
const etiqueta: React.CSSProperties = { fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8A8A', marginBottom: '4px', display: 'block' }
const botonPrincipal = (activo: boolean): React.CSSProperties => ({ width: '100%', padding: '10px 14px', border: 'none', borderRadius: '6px', background: activo ? '#0E0E0E' : '#E8E4DA', color: activo ? '#C9A961' : '#A8A8A8', fontSize: '12px', fontWeight: 600, cursor: activo ? 'pointer' : 'not-allowed', fontFamily: 'inherit' })
const botonSecundario: React.CSSProperties = { width: '100%', padding: '9px 14px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#FAFAF7', color: '#2C2C2C', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', textDecoration: 'none', display: 'block', boxSizing: 'border-box' }

export default function EnvioSkydropx({ pedido, puedeCancelarGuia, onCambio, mostrarMsg }: {
  pedido: PedidoEnvio
  puedeCancelarGuia: boolean
  onCambio: () => Promise<void> | void
  mostrarMsg: (m: string) => void
}) {
  const [origenes, setOrigenes] = useState<Origen[]>([])
  const [origenId, setOrigenId] = useState<string>('')
  const [empaque, setEmpaque] = useState<'' | 'bolsa' | 'caja'>('')
  const [peso, setPeso] = useState('')
  const [cot, setCot] = useState<Cotizacion | null>(null)
  const [rateId, setRateId] = useState('')
  const [trabajando, setTrabajando] = useState<'' | 'cotizar' | 'crear' | 'actualizar' | 'cancelar'>('')
  const [error, setError] = useState('')
  const [mostrarCancelar, setMostrarCancelar] = useState(false)
  const [motivo, setMotivo] = useState('')

  const aplica = ESTADOS_CON_GUIA.includes(pedido.estado)
  const guiaSkydropx = !!pedido.skydropx_shipment_id
  const generar = aplica && !guiaSkydropx && !pedido.numero_guia

  useEffect(() => {
    if (!generar || origenes.length) return
    fetch('/api/admin/envios/origenes').then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setOrigenes(d)
        const pred = d.find((o: Origen) => o.predeterminado) || d[0]
        if (pred) setOrigenId(String(pred.id))
      }
    }).catch(() => {})
  }, [generar, origenes.length])

  // Si cambian los datos de la cotización, la anterior ya no sirve
  function olvidarCotizacion() { setCot(null); setRateId('') }

  async function llamar(url: string, body: object) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Error de conexión.')
    return data
  }

  async function cotizar() {
    setTrabajando('cotizar'); setError(''); setCot(null); setRateId('')
    try {
      const data: Cotizacion = await llamar('/api/admin/envios/cotizar', { pedidoId: pedido.id, origenId: origenId || null, empaque: empaque || undefined, pesoKg: peso || undefined })
      setCot(data)
      const primera = data.tarifas.find(t => !t.soloSucursal)
      if (primera) setRateId(primera.rateId)
    } catch (e) { setError((e as Error).message) }
    setTrabajando('')
  }

  async function crear() {
    if (!cot) return
    const t = cot.tarifas.find(x => x.rateId === rateId)
    if (!t) return
    const sandbox = cot.entorno === 'sandbox' ? '\n\n(SANDBOX: no se usa saldo real)' : ''
    if (!window.confirm(`Generar guía ${t.paqueteria} · ${t.servicio}\nSe descontarán aprox. ${fmt(t.total)} de tu saldo de ${fmt(cot.saldo)}.${sandbox}\n\n¿Continuar?`)) return
    setTrabajando('crear'); setError('')
    try {
      const r = await llamar('/api/admin/envios/guia', { pedidoId: pedido.id, cotizacionId: cot.cotizacionId, rateId })
      mostrarMsg(r.pendiente
        ? 'Skydropx sigue procesando la guía. Usa "Actualizar estado de la guía" en un momento.'
        : `Guía ${r.numeroGuia} generada${r.correo ? ' y correo enviado al cliente' : ' (el correo no se pudo enviar)'}.`)
      setCot(null)
      await onCambio()
    } catch (e) { setError((e as Error).message); await onCambio() }
    setTrabajando('')
  }

  async function actualizar() {
    setTrabajando('actualizar'); setError('')
    try {
      const r = await llamar('/api/admin/envios/guia/actualizar', { pedidoId: pedido.id })
      mostrarMsg(r.pendiente ? 'Skydropx todavía no termina la guía. Intenta en un momento.' : `Guía ${r.numeroGuia} lista.`)
      await onCambio()
    } catch (e) { setError((e as Error).message); await onCambio() }
    setTrabajando('')
  }

  async function cancelar() {
    if (motivo.trim().length < 3) { setError('Escribe el motivo de la cancelación de la guía.'); return }
    if (!window.confirm('¿Cancelar la guía en Skydropx? El pedido volverá a quedar sin guía.')) return
    setTrabajando('cancelar'); setError('')
    try {
      await llamar('/api/admin/envios/guia/cancelar', { pedidoId: pedido.id, motivo: motivo.trim() })
      mostrarMsg('Guía cancelada en Skydropx.')
      setMostrarCancelar(false); setMotivo('')
      await onCambio()
    } catch (e) { setError((e as Error).message) }
    setTrabajando('')
  }

  const [pdfEnCurso, setPdfEnCurso] = useState<'' | 'completa' | 'guia'>('')
  async function imprimir(soloGuia: boolean) {
    setPdfEnCurso(soloGuia ? 'guia' : 'completa'); setError('')
    const numero = formatearNumeroPedido(pedido.id)
    const err = await abrirYDescargar(
      `/api/admin/envios/imprimir?pedidoId=${pedido.id}${soloGuia ? '&solo=guia' : ''}`,
      soloGuia ? `${numero}-solo-guia.pdf` : `${numero}-guia-${slug(pedido.paqueteria)}.pdf`,
    )
    if (err) setError(err)
    setPdfEnCurso('')
  }

  const tarifaElegida = cot?.tarifas.find(t => t.rateId === rateId)
  const saldoAlcanza = !!cot && !!tarifaElegida && cot.saldo != null && cot.saldo >= tarifaElegida.total
  const recogido = !!pedido.envio_estado && pedido.envio_estado !== 'created'
  const anteriores = pedido.guias_anteriores || []

  return (
    <div style={tarjeta}>
      <div style={cabecera}>
        <p style={titulo}>Envío Skydropx</p>
        {(cot?.entorno === 'sandbox' || pedido.guia_entorno === 'sandbox') && (
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: '#D97706', padding: '2px 8px', borderRadius: '10px' }}>SANDBOX</span>
        )}
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {!aplica && !guiaSkydropx && (
          <p style={{ fontSize: '12px', color: '#A8A8A8', textAlign: 'center' }}>No aplica en este estado.</p>
        )}

        {/* Guía registrada a mano */}
        {aplica && !guiaSkydropx && pedido.numero_guia && (
          <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5 }}>Este pedido tiene una guía registrada a mano ({pedido.paqueteria} · <span style={{ fontFamily: 'monospace' }}>{pedido.numero_guia}</span>).</p>
        )}

        {/* Guía en proceso */}
        {guiaSkydropx && !pedido.numero_guia && (
          <>
            <p style={{ fontSize: '12px', color: '#8B6914', lineHeight: 1.5 }}>Skydropx está procesando la guía.</p>
            <button onClick={actualizar} disabled={!!trabajando} style={botonPrincipal(!trabajando)}>
              {trabajando === 'actualizar' ? 'Consultando…' : 'Actualizar estado de la guía'}
            </button>
          </>
        )}

        {/* Guía lista */}
        {guiaSkydropx && pedido.numero_guia && (
          <>
            <div style={{ fontSize: '12px', color: '#2C2C2C', lineHeight: 1.7 }}>
              <div><strong>{pedido.paqueteria}</strong> · <span style={{ fontFamily: 'monospace' }}>{pedido.numero_guia}</span></div>
              <div style={{ color: '#6B6B6B' }}>Costo según Skydropx: {fmt(pedido.costo_guia)} · Cobro real: {fmt(pedido.cobro_real_guia)}</div>
              <div style={{ color: '#6B6B6B' }}>Generada: {fecha(pedido.guia_creada_at)}{pedido.envio_estado ? ` · Rastreo: ${pedido.envio_estado}` : ''}</div>
              {pedido.guia_url_rastreo && <a href={pedido.guia_url_rastreo} target="_blank" rel="noopener noreferrer" style={{ color: '#C9A961', fontSize: '12px' }}>Ver rastreo en la paquetería ↗</a>}
            </div>
            <button onClick={() => imprimir(false)} disabled={!!pdfEnCurso} style={botonPrincipal(!pdfEnCurso)}>
              {pdfEnCurso === 'completa' ? 'Preparando PDF…' : '🖨 Imprimir guía y hoja de pedido'}
            </button>
            <button onClick={() => imprimir(true)} disabled={!!pdfEnCurso} style={botonSecundario}>
              {pdfEnCurso === 'guia' ? 'Preparando PDF…' : 'Descargar solo la guía'}
            </button>
            {puedeCancelarGuia && !recogido && !['enviado', 'entregado'].includes(pedido.estado) && (
              !mostrarCancelar
                ? <button onClick={() => setMostrarCancelar(true)} style={{ ...botonSecundario, color: '#A33' }}>Cancelar guía</button>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', border: '1px solid #E8B4B4', borderRadius: '6px', background: '#FFF8F8' }}>
                    <label style={etiqueta}>Motivo</label>
                    <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej. dirección corregida" style={campo} maxLength={300} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setMostrarCancelar(false); setMotivo('') }} style={{ ...botonSecundario, flex: 1 }}>Volver</button>
                      <button onClick={cancelar} disabled={!!trabajando} style={{ ...botonSecundario, flex: 1, background: '#A33', color: '#fff', border: 'none' }}>{trabajando === 'cancelar' ? 'Cancelando…' : 'Cancelar guía'}</button>
                    </div>
                  </div>
                )
            )}
          </>
        )}

        {/* Generar guía */}
        {generar && (
          <>
            {pedido.zona_verificada === false && (
              <p style={{ fontSize: '11px', color: '#A33', lineHeight: 1.5 }}>Zona sin verificar en el checkout: revisa abajo si la tarifa más barata es zona extendida.</p>
            )}
            <div>
              <label style={etiqueta}>Origen</label>
              <select value={origenId} onChange={e => { setOrigenId(e.target.value); olvidarCotizacion() }} style={campo}>
                {origenes.map(o => <option key={o.id} value={o.id}>{o.alias} · {o.cp}{o.predeterminado ? ' (predeterminado)' : ''}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={etiqueta}>Empaque</label>
                <select value={empaque} onChange={e => { setEmpaque(e.target.value as '' | 'bolsa' | 'caja'); olvidarCotizacion() }} style={campo}>
                  <option value="">Automático</option>
                  <option value="bolsa">Bolsa 25×20</option>
                  <option value="caja">Caja 28×16×15</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={etiqueta}>Peso (kg)</label>
                <input value={peso} onChange={e => { setPeso(e.target.value.replace(/[^\d.]/g, '')); olvidarCotizacion() }} placeholder="Automático" inputMode="decimal" style={campo} />
              </div>
            </div>
            <button onClick={cotizar} disabled={!!trabajando} style={botonPrincipal(!trabajando)}>
              {trabajando === 'cotizar' ? 'Cotizando…' : cot ? 'Volver a cotizar' : 'Cotizar guía'}
            </button>

            {cot && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', lineHeight: 1.6, padding: '10px', background: '#FAFAF7', border: '1px solid #E8E4DA', borderRadius: '6px' }}>
                  <div><strong>Saldo Skydropx:</strong> {fmt(cot.saldo)}</div>
                  <div style={{ color: '#6B6B6B' }}>Desde {cot.origen.alias} · {cot.paquete.empaque} {cot.paquete.largoCm}×{cot.paquete.anchoCm}×{cot.paquete.altoCm} cm · {cot.paquete.pesoKg} kg (volumétrico {cot.paquete.pesoVolumetricoKg} kg)</div>
                  {cot.paquete.avisos.map((a, i) => (
                    <div key={i} style={{ color: '#A33' }}>
                      {a.tipo === 'no_cabe_en_caja' ? '⚠ Los productos no caben en la caja: revisa el empaque y el peso.'
                        : a.tipo === 'bolsa_forzada_no_cabe' ? '⚠ Los productos no caben en la bolsa.'
                        : `⚠ Faltan peso o medidas de: ${(a.productos || []).join(', ')}`}
                    </div>
                  ))}
                </div>
                {cot.avisoZonaSinVerificar && (
                  <div style={{ fontSize: '12px', color: '#A33', lineHeight: 1.5, padding: '10px', background: '#FFF5F5', border: '1px solid #E8B4B4', borderRadius: '6px' }}>
                    <strong>Es zona extendida</strong> y el cliente pagó sin el cargo (zona sin verificar). Contacta al cliente por los $200; si no paga o no responde en 2 días hábiles, cancela con reembolso completo.
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {cot.tarifas.length === 0 && <p style={{ fontSize: '12px', color: '#A33' }}>Ninguna paquetería dio precio para esta dirección.</p>}
                  {cot.tarifas.map(t => (
                    <label key={t.rateId} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', border: `1px solid ${rateId === t.rateId ? '#C9A961' : '#E8E4DA'}`, borderRadius: '6px', cursor: t.soloSucursal ? 'not-allowed' : 'pointer', opacity: t.soloSucursal ? 0.5 : 1, background: rateId === t.rateId ? '#FFFBF2' : '#fff' }}>
                      <input type="radio" name="tarifa" disabled={t.soloSucursal} checked={rateId === t.rateId} onChange={() => setRateId(t.rateId)} style={{ marginTop: '2px' }} />
                      <span style={{ flex: 1, fontSize: '12px', lineHeight: 1.5 }}>
                        <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <strong style={{ textDecoration: t.soloSucursal ? 'line-through' : 'none' }}>{t.paqueteria} · {t.servicio}</strong>
                          <strong>{fmt(t.total)}</strong>
                        </span>
                        <span style={{ color: '#6B6B6B' }}>
                          {t.dias != null ? `${t.dias} día${t.dias === 1 ? '' : 's'}` : 'días sin dato'}
                          {t.zonaExtendida ? <span style={{ color: '#8B6914' }}> · recargo zona extendida {fmt(t.recargoZona)}</span> : <span style={{ color: '#3A5A3A' }}> · sin recargo</span>}
                          {t.soloSucursal && ' · el cliente recogería en sucursal'}
                          {t.cupon != null && <span style={{ color: '#5B7C99' }}> · cupón: {typeof t.cupon === 'object' ? JSON.stringify(t.cupon) : String(t.cupon)}</span>}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                {tarifaElegida && cot.saldo != null && !saldoAlcanza && (
                  <p style={{ fontSize: '12px', color: '#A33' }}>El saldo no alcanza para esta guía.</p>
                )}
                <button onClick={crear} disabled={!tarifaElegida || !saldoAlcanza || !!trabajando} style={botonPrincipal(!!tarifaElegida && saldoAlcanza && !trabajando)}>
                  {trabajando === 'crear' ? 'Generando guía… (hasta 30 s)' : tarifaElegida ? `Generar guía · ${fmt(tarifaElegida.total)}` : 'Elige una tarifa'}
                </button>
              </div>
            )}
          </>
        )}

        {error && <p style={{ fontSize: '12px', color: '#A33', lineHeight: 1.5 }}>{error}</p>}

        {anteriores.length > 0 && (
          <details style={{ fontSize: '11px', color: '#6B6B6B' }}>
            <summary style={{ cursor: 'pointer' }}>Guías canceladas ({anteriores.length})</summary>
            {anteriores.map((g, i) => (
              <div key={i} style={{ marginTop: '6px', lineHeight: 1.5 }}>
                {g.paqueteria} · <span style={{ fontFamily: 'monospace' }}>{g.numeroGuia || 'sin número'}</span>{g.entorno === 'sandbox' ? ' (sandbox)' : ''}<br />
                Cancelada {fecha(g.cancelada)} por {g.por}: {g.motivo}
              </div>
            ))}
          </details>
        )}
      </div>
    </div>
  )
}
