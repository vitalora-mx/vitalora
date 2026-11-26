'use client'

// ============================================================
// "Editar dirección" del detalle de pedido (solo dueño y gerente, solo sin guía).
// Incluye nombre y teléfono de quien recibe. Muestra el aviso de zona del último
// cambio y el historial de cambios.
// ============================================================
import { useState } from 'react'

const ESTADOS_EDITABLES = ['pendiente', 'esperando_comprobante', 'comprobante_en_revision', 'comprobante_rechazado', 'revision_monto', 'pagado', 'preparando']

type Datos = { nombre: string; apellido: string; telefono: string; calle: string; numero: string; interior: string; colonia: string; ciudad: string; estado: string; cp: string; referencia: string }
type Aviso = 'cobrar' | 'devolver' | 'sin_verificar' | null
interface Cambio { fecha: string; por: string; antes: Datos; despues: Datos; zona?: { estado: string; extendida: boolean; aviso: Aviso } }

export interface PedidoDireccion {
  id: number | string
  estado: string
  nombre: string; apellido: string; telefono: string
  calle: string; numero: string; interior: string | null; colonia: string; ciudad: string; estado_dir: string; cp: string; referencia: string | null
  numero_guia: string | null
  skydropx_shipment_id?: string | null
  direccion_editada_at?: string | null
  direccion_editada_por?: string | null
  direccion_anterior?: Cambio[] | null
}

const TEXTO_AVISO: Record<string, { texto: string; color: string; fondo: string; borde: string }> = {
  cobrar: { texto: 'La nueva dirección es zona extendida y el cliente no pagó el cargo de $200. Contáctalo para cobrarlo; si no paga o no responde en 2 días hábiles, cancela con reembolso completo.', color: '#A33', fondo: '#FFF5F5', borde: '#E8B4B4' },
  devolver: { texto: 'El cliente pagó $200 de zona extendida, pero la nueva dirección ya no es zona extendida. Si corresponde, devuélvelos con el botón Reembolsar (no se devuelve nada automáticamente).', color: '#8B6914', fondo: '#FFF9F0', borde: '#E8D5B0' },
  sin_verificar: { texto: 'Skydropx no respondió: la zona de la nueva dirección quedó sin verificar. Revísala al cotizar la guía.', color: '#8B6914', fondo: '#FFF9F0', borde: '#E8D5B0' },
}

const fecha = (s?: string | null) => s ? new Date(s).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const resumen = (d: Datos) => `${d.nombre} ${d.apellido} · ${d.telefono} · ${d.calle} ${d.numero}${d.interior ? ' Int. ' + d.interior : ''}, ${d.colonia}, ${d.ciudad}, ${d.estado}, C.P. ${d.cp}${d.referencia ? ' · Ref: ' + d.referencia : ''}`

const campo: React.CSSProperties = { padding: '8px 10px', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', color: '#2C2C2C', background: '#fff', width: '100%', boxSizing: 'border-box' }
const etiqueta: React.CSSProperties = { fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8A8A', marginBottom: '3px', display: 'block' }

export default function EditarDireccion({ pedido, puedeEditar, onCambio, mostrarMsg }: {
  pedido: PedidoDireccion
  puedeEditar: boolean
  onCambio: () => Promise<void> | void
  mostrarMsg: (m: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState<Datos | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const historial = Array.isArray(pedido.direccion_anterior) ? pedido.direccion_anterior : []
  const ultimo = historial[historial.length - 1]
  const tieneGuia = !!pedido.numero_guia || !!pedido.skydropx_shipment_id
  const estadoPermite = ESTADOS_EDITABLES.includes(pedido.estado)

  function abrir() {
    setForm({
      nombre: pedido.nombre || '', apellido: pedido.apellido || '', telefono: pedido.telefono || '',
      calle: pedido.calle || '', numero: pedido.numero || '', interior: pedido.interior || '', colonia: pedido.colonia || '',
      ciudad: pedido.ciudad || '', estado: pedido.estado_dir || '', cp: pedido.cp || '', referencia: pedido.referencia || '',
    })
    setError(''); setAbierto(true)
  }

  async function guardar() {
    if (!form) return
    if (!window.confirm('¿Guardar la nueva dirección? Se le enviará un correo al cliente con la dirección actualizada.')) return
    setGuardando(true); setError('')
    try {
      const res = await fetch(`/api/admin/pedidos/${pedido.id}/direccion`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'No se pudo guardar la dirección.'); setGuardando(false); return }
      mostrarMsg(data.sinCambios ? 'No hubo cambios en la dirección.' : `Dirección actualizada${data.correo ? ' y correo enviado al cliente' : ' (el correo no se pudo enviar)'}.`)
      setAbierto(false)
      await onCambio()
    } catch { setError('Error de conexión.') }
    setGuardando(false)
  }

  const set = (k: keyof Datos) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => f ? { ...f, [k]: k === 'cp' ? e.target.value.replace(/\D/g, '').slice(0, 5) : e.target.value } : f)
  const input = (k: keyof Datos, label: string, opciones: { max?: number; span?: number } = {}) => (
    <div style={{ gridColumn: `span ${opciones.span ?? 1}` }}>
      <label style={etiqueta}>{label}</label>
      <input value={form?.[k] ?? ''} onChange={set(k)} maxLength={opciones.max ?? 200} style={campo} />
    </div>
  )

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {ultimo && (
        <div style={{ fontSize: '11px', color: '#6B6B6B', lineHeight: 1.5 }}>
          Dirección editada por {pedido.direccion_editada_por || ultimo.por} el {fecha(pedido.direccion_editada_at || ultimo.fecha)}.
        </div>
      )}
      {ultimo?.zona?.aviso && TEXTO_AVISO[ultimo.zona.aviso] && (
        <div style={{ padding: '10px 12px', background: TEXTO_AVISO[ultimo.zona.aviso].fondo, border: `1px solid ${TEXTO_AVISO[ultimo.zona.aviso].borde}`, borderRadius: '6px', fontSize: '12px', color: TEXTO_AVISO[ultimo.zona.aviso].color, lineHeight: 1.5 }}>
          {TEXTO_AVISO[ultimo.zona.aviso].texto}
        </div>
      )}

      {puedeEditar && estadoPermite && !abierto && (
        tieneGuia
          ? <p style={{ fontSize: '11px', color: '#A8A8A8' }}>Para cambiar la dirección, primero cancela la guía (dueño o gerente).</p>
          : <button onClick={abrir} style={{ alignSelf: 'flex-start', padding: '6px 14px', border: '1px solid #C9A961', borderRadius: '6px', background: '#fff', color: '#8B6914', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>✎ Editar dirección</button>
      )}

      {abierto && form && (
        <div style={{ padding: '12px', border: '1px solid #E8E4DA', borderRadius: '8px', background: '#FAFAF7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            {input('nombre', 'Nombre de quien recibe', { max: 100 })}
            {input('apellido', 'Apellido', { max: 100 })}
            {input('telefono', 'Teléfono', { max: 30, span: 2 })}
            {input('calle', 'Calle', { span: 2 })}
            {input('numero', 'Número', { max: 30 })}
            {input('interior', 'Interior (opcional)', { max: 30 })}
            {input('colonia', 'Colonia', { span: 2 })}
            {input('ciudad', 'Ciudad o municipio', { max: 100 })}
            {input('estado', 'Estado', { max: 100 })}
            {input('cp', 'Código postal', { max: 5 })}
            {input('referencia', 'Referencia (opcional)', { max: 300, span: 2 })}
          </div>
          {error && <p style={{ fontSize: '12px', color: '#A33', lineHeight: 1.5 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setAbierto(false)} disabled={guardando} style={{ flex: 1, padding: '8px', border: '1px solid #E8E4DA', borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#6B6B6B' }}>Cancelar</button>
            <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: '8px', border: 'none', borderRadius: '6px', background: '#0E0E0E', color: '#C9A961', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{guardando ? 'Revisando zona y guardando…' : 'Guardar dirección'}</button>
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <details style={{ fontSize: '11px', color: '#6B6B6B' }}>
          <summary style={{ cursor: 'pointer' }}>Historial de cambios de dirección ({historial.length})</summary>
          {[...historial].reverse().map((c, i) => (
            <div key={i} style={{ marginTop: '8px', lineHeight: 1.5, paddingTop: '6px', borderTop: '1px solid #F0EDE5' }}>
              <div><strong>{fecha(c.fecha)}</strong> · {c.por}</div>
              <div><span style={{ color: '#A8A8A8' }}>Antes:</span> {resumen(c.antes)}</div>
              <div><span style={{ color: '#A8A8A8' }}>Después:</span> {resumen(c.despues)}</div>
              {c.zona && <div style={{ color: '#8A8A8A' }}>Zona: {c.zona.estado === 'ok' ? (c.zona.extendida ? 'extendida' : 'normal') : 'sin verificar'}</div>}
            </div>
          ))}
        </details>
      )}
    </div>
  )
}
