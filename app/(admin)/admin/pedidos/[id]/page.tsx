'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatearNumeroPedido } from '@/lib/utils'
import { TRANSICIONES_MANUALES, ESTADOS_REEMBOLSABLES, ESTADOS_CON_GUIA, PAQUETERIAS, puedeCancelarse } from '@/lib/estados-pedido'
import EnvioSkydropx, { type PedidoEnvio } from '@/components/admin/EnvioSkydropx'
import EditarDireccion from '@/components/admin/EditarDireccion'

interface PedidoItem {
  id: number
  nombre: string
  marca: string
  precio: number
  cantidad: number
  cantidad_reembolsada: number | null
  variante_nombre: string | null
}

interface Reembolso {
  id: number
  tipo: 'total' | 'parcial' | 'cancelacion'
  origen: 'admin' | 'webhook' | 'sincronizacion'
  metodo: 'mercadopago' | 'transferencia' | 'ninguno'
  estado: 'procesando' | 'completado' | 'fallido'
  monto: number
  monto_calculado: number | null
  ajustado_a_mano: boolean
  incluye_envio: boolean
  items: { pedido_item_id: number; cantidad: number }[]
  mp_refund_id: string | null
  motivo: string | null
  admin_email: string | null
  error: string | null
  created_at: string
}

interface ResumenSync {
  mp: { estado: string; detalle: string; pagado: number; reembolsado: number; refunds: { id: string; monto: number; estado: string; fecha: string; registrado: boolean }[] }
  base: { estado: string; montoReembolsado: number; total: number }
  diferencias: string[]
  hayQueAplicar: boolean
}

interface Pedido extends Omit<PedidoEnvio, 'id' | 'estado' | 'numero_guia' | 'paqueteria'> {
  id: string
  estado: string
  mp_payment_id: string | null
  nombre: string
  apellido: string
  email: string
  telefono: string
  calle: string
  numero: string
  interior: string
  colonia: string
  ciudad: string
  estado_dir: string
  cp: string
  referencia: string
  subtotal: number
  descuento: number | null
  costo_envio: number
  cargo_zona_extendida?: number | null
  zona_extendida?: boolean | null
  zona_verificada?: boolean | null
  envio_cotizacion?: {
    motivo: 'recargo' | 'precio' | null
    masBarata: { paqueteria: string; servicio: string; total: number; zonaExtendida: boolean } | null
    paqueteriasSinRecargo: string[]
    paquete?: { empaque: string; largoCm: number; anchoCm: number; altoCm: number; pesoKg: number }
  } | null
  total: number
  monto_reembolsado: number | null
  cancelado_at: string | null
  cancelado_por: string | null
  motivo_cancelacion: string | null
  stock_descontado_at: string | null
  stock_devuelto_at: string | null
  abandonado_at: string | null
  reembolsos: Reembolso[]
  numero_guia: string | null
  paqueteria: string | null
  metodo_pago: string | null
  factura_url: string | null
  requiere_factura: boolean | null
  factura_rfc: string | null
  factura_razon_social: string | null
  factura_uso_cfdi: string | null
  factura_regimen: string | null
  factura_cp: string | null
  factura_pdf_path: string | null
  factura_xml_path: string | null
  factura_enviada_at: string | null
  factura_estado: string | null
  forma_pago: string | null
  created_at: string
  pedido_items: PedidoItem[]
}

interface ClienteStats {
  totalCompras: number
  totalGastado: number
}

const ESTADOS = [
  { value: 'pendiente',   label: 'Pendiente',   color: '#F59E0B' },
  { value: 'pagado',      label: 'Pagado',       color: '#5B7C99' },
  { value: 'revision_monto', label: 'Revisar monto', color: '#B91C1C' },
  { value: 'preparando',  label: 'Preparando',   color: '#8060C0' },
  { value: 'enviado',     label: 'Enviado',      color: '#6A8A62' },
  { value: 'entregado',   label: 'Entregado',    color: '#3A8A3A' },
  { value: 'cancelado',   label: 'Cancelado',    color: '#EF4444' },
  { value: 'reembolso_parcial', label: 'Reembolso parcial', color: '#E08A2B' },
  { value: 'reembolsado', label: 'Reembolsado',  color: '#A8A8A8' },
  { value: 'abandonado',  label: 'Abandonado',   color: '#B8B4AA' },
]

function estadoInfo(estado: string) {
  return ESTADOS.find(e => e.value === estado) ?? { label: estado, color: '#888' }
}

const fmtMx = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

const TIPO_REEMBOLSO: Record<string, string> = { total: 'Reembolso total', parcial: 'Reembolso parcial', cancelacion: 'Cancelación' }
const ORIGEN_REEMBOLSO: Record<string, string> = { admin: 'Admin', webhook: 'Panel de Mercado Pago', sincronizacion: 'Sincronización' }

function formaPagoLabel(fp: string | null) {
  const mapa: Record<string, string> = {
    credit_card: 'Tarjeta de crédito', debit_card: 'Tarjeta de débito',
    account_money: 'Saldo Mercado Pago', ticket: 'OXXO Pay',
    bank_transfer: 'SPEI / Transferencia',
  }
  return fp ? (mapa[fp] ?? fp) : 'No especificado'
}

function botonGuia(pedido: Pedido) {
  const { estado, numero_guia } = pedido
  if (estado === 'entregado')   return { label: '✓ Pedido entregado', color: '#3A8A3A', bg: 'rgba(58,138,58,0.1)',    border: 'rgba(58,138,58,0.3)'    }
  if (estado === 'reembolsado') return { label: '↩ Devolución solicitada', color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)'   }
  if (numero_guia)              return { label: '✎ Editar guía manual', color: '#5B7C99', bg: 'rgba(91,124,153,0.1)',  border: 'rgba(91,124,153,0.3)'  }
  if (estado === 'enviado')     return { label: '✎ Registrar guía manual', color: '#6A8A62', bg: 'rgba(106,138,98,0.1)',  border: 'rgba(106,138,98,0.3)'  }
  return                               { label: '✎ Registrar guía manual', color: '#C9A961', bg: 'rgba(201,169,97,0.1)',  border: 'rgba(201,169,97,0.4)'  }
}

export default function PedidoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [clienteStats, setClienteStats] = useState<ClienteStats | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [guiaInput, setGuiaInput] = useState('')
  const [paqueteriaInput, setPaqueteriaInput] = useState('')
  const [mostrarGuiaInput, setMostrarGuiaInput] = useState(false)
  const [puedeGestionarDinero, setPuedeGestionarDinero] = useState(false)

  // Reembolso
  const [reembolsando, setReembolsando] = useState(false)
  const [mostrarReembolso, setMostrarReembolso] = useState(false)
  const [tipoReembolso, setTipoReembolso] = useState<'total' | 'parcial'>('parcial')
  const [seleccion, setSeleccion] = useState<Record<number, number>>({})
  const [incluirEnvio, setIncluirEnvio] = useState(false)
  const [montoManual, setMontoManual] = useState('')
  const [motivoReembolso, setMotivoReembolso] = useState('')

  // Cancelación
  const [mostrarCancelar, setMostrarCancelar] = useState(false)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [cancelando, setCancelando] = useState(false)

  // Sincronizar con Mercado Pago
  const [sync, setSync] = useState<ResumenSync | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}`)
      const data = await res.json()
      setPedido(data.pedido)
      setClienteStats(data.clienteStats)
      setPuedeGestionarDinero(!!data.puedeGestionarDinero)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [params.id])

  useEffect(() => { cargar() }, [cargar])

  // Enlaces de la lista (#envio, #reembolsos): ir a la sección cuando ya cargó el pedido
  const pedidoCargado = !!pedido
  useEffect(() => {
    if (!pedidoCargado) return
    const id = window.location.hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [pedidoCargado])

  function mostrarMsg(msg: string) {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 4000)
  }

  async function actualizarEstado(estado: string) {
    setGuardando(true)
    const res = await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, estado }),
    })
    const data = await res.json().catch(() => ({}))
    mostrarMsg(res.ok ? `Estado actualizado → ${estado}` : (data.error || 'No se pudo cambiar el estado.'))
    await cargar()
    setGuardando(false)
  }

  async function guardarGuia() {
    if (!guiaInput.trim() || !paqueteriaInput || !pedido) return
    setGuardando(true)
    // Al registrar la guía el pedido pasa a Enviado (si ya estaba enviado o entregado, se deja igual)
    const yaEnviado = pedido.estado === 'enviado' || pedido.estado === 'entregado'
    const res = await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, numero_guia: guiaInput.trim(), paqueteria: paqueteriaInput, ...(yaEnviado ? {} : { estado: 'enviado' }) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      mostrarMsg(data.error || 'No se pudo guardar la guía.')
      setGuardando(false)
      return
    }
    // Correo de envío al cliente con datos de rastreo
    try {
      await fetch('/api/admin/pedidos/notificar-envio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: params.id }),
      })
    } catch (e) { console.error('Error al enviar correo de envio:', e) }
    mostrarMsg(yaEnviado ? 'Número de guía actualizado' : 'Número de guía guardado y estado → Enviado')
    setMostrarGuiaInput(false)
    setGuiaInput('')
    setPaqueteriaInput('')
    await cargar()
    setGuardando(false)
  }

  function imprimirGuia() {
    // Abre el formulario para capturar/editar la paqueteria y el numero de guia.
    // (Las guias se generan en Skydropx; aqui solo registramos el numero y notificamos al cliente.)
    if (pedido?.numero_guia) {
      setGuiaInput(pedido.numero_guia)
      setPaqueteriaInput(pedido.paqueteria || '')
    }
    setMostrarGuiaInput(true)
  }

  // ── Reembolso ──
  function cerrarReembolso() {
    setMostrarReembolso(false); setSeleccion({}); setIncluirEnvio(false); setMontoManual(''); setMotivoReembolso('')
  }

  function envioDisponible(p: Pedido): boolean {
    return Number(p.costo_envio || 0) > 0 && !(p.reembolsos || []).some(r => r.estado === 'completado' && r.incluye_envio)
  }

  // Mismo cálculo que el servidor (lib/reembolsos.ts): piezas menos su parte del descuento, más el envío
  function calcularParcial(p: Pedido): number {
    const subtotalSel = (p.pedido_items || []).reduce((s, it) => s + it.precio * (seleccion[it.id] || 0), 0)
    const subtotal = Number(p.subtotal || 0)
    const descuento = Number(p.descuento || 0)
    const parteDescuento = subtotal > 0 && descuento > 0 ? descuento * (subtotalSel / subtotal) : 0
    const conEnvio = incluirEnvio && envioDisponible(p) ? Number(p.costo_envio || 0) : 0
    const saldo = Math.max(0, p.total - (p.monto_reembolsado ?? 0))
    return Math.max(0, Math.round(Math.min(saldo, subtotalSel - parteDescuento + conEnvio) * 100) / 100)
  }

  async function reembolsar() {
    if (!pedido) return
    const esTransferencia = pedido.metodo_pago === 'transferencia'
    const saldo = Math.max(0, pedido.total - (pedido.monto_reembolsado ?? 0))
    const esTotal = tipoReembolso === 'total'
    const calculado = calcularParcial(pedido)
    const monto = esTotal ? saldo : (montoManual.trim() !== '' ? Number(montoManual) : calculado)
    if (!esTotal) {
      if (!Number.isFinite(monto) || monto <= 0) { mostrarMsg('Elige productos o el envío, o escribe un monto.'); return }
      if (monto > saldo) { mostrarMsg(`El monto no puede ser mayor a ${fmtMx(saldo)}.`); return }
    }
    const como = esTransferencia
      ? 'Esto NO mueve dinero: haz la transferencia de devolución desde tu banco.'
      : 'Se devolverá en Mercado Pago y no se puede deshacer.'
    if (!window.confirm(`Vas a reembolsar ${fmtMx(monto)}${esTotal ? ' (todo lo que falta)' : ''} al cliente. ${como} El inventario NO se ajusta automáticamente. ¿Continuar?`)) return

    setReembolsando(true)
    try {
      const body = esTotal
        ? { total: true, motivo: motivoReembolso }
        : {
            items: Object.entries(seleccion).filter(([, c]) => c > 0).map(([id, cantidad]) => ({ pedido_item_id: Number(id), cantidad })),
            incluirEnvio,
            ...(montoManual.trim() !== '' ? { monto: Number(montoManual) } : {}),
            motivo: motivoReembolso,
          }
      const res = await fetch(`/api/admin/pedidos/${params.id}/reembolsar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        mostrarMsg([data.mensaje, data.recordatorio].filter(Boolean).join(' '))
        cerrarReembolso()
        await cargar()
      } else {
        mostrarMsg(data.error || 'No se pudo procesar el reembolso.')
      }
    } catch {
      mostrarMsg('Error de conexión al procesar el reembolso.')
    }
    setReembolsando(false)
  }

  // ── Cancelación ──
  async function cancelar() {
    if (!pedido) return
    const motivo = motivoCancelacion.trim()
    if (motivo.length < 3) { mostrarMsg('Escribe el motivo de la cancelación.'); return }
    if (!window.confirm(`¿Cancelar el pedido ${formatearNumeroPedido(pedido.id)}? Se avisará al cliente por correo y no se puede deshacer.`)) return
    setCancelando(true)
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        mostrarMsg([data.mensaje, data.recordatorio].filter(Boolean).join(' '))
        setMostrarCancelar(false); setMotivoCancelacion('')
        await cargar()
      } else {
        mostrarMsg(data.error || 'No se pudo cancelar el pedido.')
      }
    } catch {
      mostrarMsg('Error de conexión al cancelar.')
    }
    setCancelando(false)
  }

  // ── Sincronizar con Mercado Pago ──
  async function revisarSync() {
    setSincronizando(true)
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}/sincronizar`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) setSync(data)
      else mostrarMsg(data.error || 'No se pudo consultar Mercado Pago.')
    } catch { mostrarMsg('Error de conexión con Mercado Pago.') }
    setSincronizando(false)
  }

  async function aplicarSync() {
    if (!window.confirm('Se registrarán aquí los reembolsos que tiene Mercado Pago. El inventario no se ajusta. ¿Continuar?')) return
    setSincronizando(true)
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}/sincronizar`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      mostrarMsg(res.ok ? data.mensaje : (data.error || 'No se pudo sincronizar.'))
      if (res.ok) { setSync(null); await cargar() }
    } catch { mostrarMsg('Error de conexión al sincronizar.') }
    setSincronizando(false)
  }

  if (cargando) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#A8A8A8', fontSize: '13px' }}>Cargando pedido…</div>
  )

  if (!pedido) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: '#A8A8A8' }}>Pedido no encontrado.</p>
      <Link href="/admin/pedidos" style={{ color: '#C9A961', fontSize: '13px' }}>← Volver a pedidos</Link>
    </div>
  )

  const info = estadoInfo(pedido.estado)
  const guia = botonGuia(pedido)
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)
  const fmt0 = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

  // Cálculo financiero
  const subtotalProductos = pedido.subtotal ?? (pedido.total - (pedido.costo_envio ?? 0))
  const envioCliente = pedido.costo_envio ?? 0
  const cargoZona = Number(pedido.cargo_zona_extendida || 0)
  const envioSinCargo = Math.max(0, envioCliente - cargoZona)
  const cot = pedido.envio_cotizacion
  const montoReembolsado = pedido.monto_reembolsado ?? 0
  const hayReembolso = montoReembolsado > 0
  const saldoPorDevolver = Math.max(0, Math.round((pedido.total - montoReembolsado) * 100) / 100)
  const nombreItem = (id: number) => {
    const it = pedido.pedido_items?.find(i => i.id === id)
    return it ? `${it.nombre}${it.variante_nombre ? ` · ${it.variante_nombre}` : ''}` : `Producto ${id}`
  }
  const montoNeto = Math.max(0, pedido.total - montoReembolsado)  // lo que realmente quedo cobrado
  // Transferencia: sin comisión de Mercado Pago
  const pagoConMP = pedido.metodo_pago !== 'transferencia'
  const comisionMP = pagoConMP ? montoNeto * 0.0418 : 0  // ~4.18% sobre lo que quedo (MP bonifica lo reembolsado)
  const ivaEstimado = subtotalProductos * 0.16 / 1.16
  const netoRecibido = montoNeto - comisionMP       // neto real despues de reembolso y comision

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Italiana&display=swap');
        .det-estado-select { padding: 8px 12px; border: 1px solid #E8E4DA; border-radius: 6px; font-size: 13px; font-family: inherit; color: #2C2C2C; background: #fff; cursor: pointer; outline: none; width: 100%; }
        .det-estado-select:focus { border-color: #C9A961; }
        .guia-input { padding: 8px 12px; border: 1px solid #E8E4DA; border-radius: 6px; font-size: 13px; font-family: monospace; color: #2C2C2C; background: #fff; outline: none; width: 100%; box-sizing: border-box; }
        .guia-input:focus { border-color: #C9A961; }
        .seccion-titulo { font-size: '10px'; letter-spacing: '0.15em'; text-transform: 'uppercase'; color: '#A8B5A0'; font-weight: 600; margin-bottom: '16px'; }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1100px' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '12px', color: '#A8A8A8' }}>
          <Link href="/admin/pedidos" style={{ color: '#A8A8A8', textDecoration: 'none' }}>← Pedidos</Link>
          <span>/</span>
          <span style={{ color: '#0E0E0E', fontWeight: 500 }}>{formatearNumeroPedido(pedido.id)}</span>
        </div>

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '4px' }}>Operación · Pedidos</p>
            <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '32px', letterSpacing: '0.02em', color: '#0E0E0E', lineHeight: 1 }}>
              Pedido <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C9A961' }}>{formatearNumeroPedido(pedido.id)}</em>
            </h1>
            <p style={{ fontSize: '12px', color: '#A8A8A8', marginTop: '6px' }}>
              {new Date(pedido.created_at).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: `${info.color}18`, color: info.color, border: `1px solid ${info.color}40` }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: info.color }} />
            {info.label}
          </span>
        </div>

        {/* ── Pedido cancelado ── */}
        {pedido.cancelado_at && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#B91C1C', lineHeight: 1.6 }}>
            <strong>Cancelado</strong> el {new Date(pedido.cancelado_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {pedido.cancelado_por ? ` por ${pedido.cancelado_por}` : ''}.
            {pedido.motivo_cancelacion && <><br />Motivo: {pedido.motivo_cancelacion}</>}
            {pedido.stock_devuelto_at && <><br />Stock devuelto al inventario el {new Date(pedido.stock_devuelto_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.</>}
          </div>
        )}

        {/* ── Pedido abandonado ── */}
        {pedido.estado === 'abandonado' && (
          <div style={{ padding: '12px 16px', background: '#FAFAF7', border: '1px solid #E8E4DA', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6 }}>
            <strong>Abandonado</strong>{pedido.abandonado_at ? ` el ${new Date(pedido.abandonado_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}: el cliente no pagó. No se descontó stock ni se le mandó correo. Si llega a pagar, el pedido se procesa normal.
          </div>
        )}

        {/* ── Mensaje ── */}
        {mensaje && (
          <div style={{ padding: '10px 16px', background: 'rgba(168,181,160,0.2)', border: '1px solid rgba(168,181,160,0.4)', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#6A8A62' }}>
            {mensaje}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

          {/* ── Columna izquierda ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Bloque: Cliente */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Cliente</p>
                {clienteStats && (
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: clienteStats.totalCompras >= 2 ? 'rgba(201,169,97,0.12)' : 'rgba(168,181,160,0.15)', color: clienteStats.totalCompras >= 2 ? '#8B7530' : '#6A8A62', fontWeight: 500 }}>
                    {clienteStats.totalCompras >= 2 ? `⭐ Cliente recurrente · ${clienteStats.totalCompras} compras` : 'Primera compra'}
                  </span>
                )}
              </div>
              <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                {[
                  { label: 'Nombre', valor: `${pedido.nombre} ${pedido.apellido}` },
                  { label: 'Email', valor: pedido.email },
                  { label: 'Teléfono', valor: pedido.telefono || '—' },
                  { label: 'Total histórico', valor: clienteStats ? fmt0(clienteStats.totalGastado) : '—' },
                ].map((f, i) => (
                  <div key={i}>
                    <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A8A8', marginBottom: '3px' }}>{f.label}</p>
                    <p style={{ fontSize: '13px', color: '#0E0E0E', fontWeight: 500 }}>{f.valor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloque: Dirección */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Dirección de envío</p>
              </div>
              <div style={{ padding: '18px 20px', fontSize: '13px', color: '#2C2C2C', lineHeight: 1.8 }}>
                {pedido.calle} {pedido.numero}{pedido.interior ? `, Int. ${pedido.interior}` : ''}<br />
                Col. {pedido.colonia}<br />
                {pedido.ciudad}, {pedido.estado_dir} · CP {pedido.cp}
                {pedido.referencia && <><br /><span style={{ color: '#A8A8A8', fontSize: '12px' }}>Ref: {pedido.referencia}</span></>}
                <EditarDireccion pedido={pedido as any} puedeEditar={puedeGestionarDinero} onCambio={cargar} mostrarMsg={mostrarMsg} />
                {pedido.zona_verificada === false && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FFF5F5', border: '1px solid #E8B4B4', borderRadius: '6px', fontSize: '12px', color: '#A33', lineHeight: 1.5 }}>
                    <strong>Zona sin verificar.</strong> Skydropx no respondió en el checkout y se cobró sin cargo de zona extendida. Revísalo al cotizar la guía: si es zona extendida, contacta al cliente por los $200; si no paga o no responde en 2 días hábiles, cancela con reembolso completo.
                  </div>
                )}
                {pedido.zona_verificada === true && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: cargoZona > 0 ? '#FFF9F0' : '#F5F8F3', border: `1px solid ${cargoZona > 0 ? '#E8D5B0' : '#D5E0CF'}`, borderRadius: '6px', fontSize: '12px', color: '#2C2C2C', lineHeight: 1.6 }}>
                    <strong style={{ color: cargoZona > 0 ? '#8B6914' : '#3A5A3A' }}>
                      {cargoZona > 0 ? `Zona extendida (${cot?.motivo === 'recargo' ? 'la paquetería más barata cobra recargo' : 'la tarifa más barata pasa de $150'})` : 'Zona normal'}
                    </strong>
                    {cot?.masBarata && <><br />Más barata en el checkout: {cot.masBarata.paqueteria} {cot.masBarata.servicio} · {fmt(cot.masBarata.total)}</>}
                    {cot && <><br />Sin recargo de zona extendida: {cot.paqueteriasSinRecargo.length ? cot.paqueteriasSinRecargo.join(', ') : 'ninguna'}</>}
                    {cot?.paquete && <><br /><span style={{ color: '#6B6B6B' }}>Paquete: {cot.paquete.empaque} {cot.paquete.largoCm}×{cot.paquete.anchoCm}×{cot.paquete.altoCm} cm · {cot.paquete.pesoKg} kg</span></>}
                  </div>
                )}
              </div>
            </div>

            {/* Bloque: Productos */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Productos comprados</p>
              </div>
              <div style={{ padding: '8px 0' }}>
                {pedido.pedido_items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < (pedido.pedido_items.length - 1) ? '1px solid #F0EDE5' : 'none' }}>
                    <div>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 600, color: '#0E0E0E' }}>{item.nombre}</p>
                      <p style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '2px' }}>
                        {item.marca}{item.variante_nombre ? ` · ${item.variante_nombre}` : ''} · ×{item.cantidad}
                        {(item.cantidad_reembolsada ?? 0) > 0 && (
                          <span style={{ color: '#E08A2B', fontWeight: 600 }}> · {item.cantidad_reembolsada} devuelta{item.cantidad_reembolsada === 1 ? '' : 's'}</span>
                        )}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', fontWeight: 600, color: '#0E0E0E' }}>{fmt0(item.precio * item.cantidad)}</p>
                      <p style={{ fontSize: '11px', color: '#A8A8A8' }}>{fmt0(item.precio)} c/u</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloque: Desglose financiero */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderLeft: '3px solid #C9A961', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Desglose financiero</p>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {[
                  { label: 'Subtotal productos', valor: fmt(subtotalProductos), sub: null, color: '#0E0E0E', bold: false },
                  { label: 'Envío cobrado al cliente', valor: envioSinCargo === 0 ? 'Gratis' : fmt(envioSinCargo), sub: null, color: '#0E0E0E', bold: false },
                  ...(cargoZona > 0 ? [{ label: 'Cargo por zona extendida', valor: fmt(cargoZona), sub: 'Incluido en el envío que se cobró', color: '#8B6914', bold: false }] : []),
                  { label: 'Total pagado por el cliente', valor: fmt(pedido.total), sub: formaPagoLabel(pedido.forma_pago), color: '#0E0E0E', bold: true },
                  null, // separador
                  { label: 'IVA estimado incluido (16%)', valor: fmt(ivaEstimado), sub: 'Incluido en el precio de venta', color: '#6B6B6B', bold: false },
                  ...(!pagoConMP ? [] : [{ label: 'Comisión Mercado Pago (~4.18%)', valor: `−${fmt(comisionMP)}`, sub: hayReembolso ? 'Sobre el monto neto (ya descontado el reembolso)' : 'Sobre el total del pedido', color: '#F59E0B', bold: false }]),
                  ...(hayReembolso ? [
                    null, // separador
                    { label: 'Reembolsado al cliente', valor: `−${fmt(montoReembolsado)}`, sub: montoReembolsado >= pedido.total ? 'Reembolso total' : 'Reembolso parcial', color: '#EF4444', bold: false },
                  ] : []),
                  null, // separador
                  { label: hayReembolso ? 'Neto real recibido' : 'Neto estimado recibido', valor: fmt(netoRecibido), sub: pagoConMP ? (hayReembolso ? 'Después de reembolso y comisión MP' : 'Después de comisión MP') : (hayReembolso ? 'Después de reembolso · transferencia sin comisión' : 'Transferencia: sin comisión'), color: '#6A8A62', bold: true },
                ].map((fila, i) => {
                  if (fila === null) return <div key={i} style={{ height: '1px', background: '#F0EDE5', margin: '8px 0' }} />
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <div>
                        <p style={{ fontSize: '13px', color: fila.bold ? '#0E0E0E' : '#6B6B6B', fontWeight: fila.bold ? 600 : 400 }}>{fila.label}</p>
                        {fila.sub && <p style={{ fontSize: '11px', color: '#A8A8A8', marginTop: '1px' }}>{fila.sub}</p>}
                      </div>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: fila.bold ? '18px' : '15px', fontWeight: 600, color: fila.color }}>{fila.valor}</p>
                    </div>
                  )
                })}
                {pagoConMP && (
                <p style={{ fontSize: '10px', color: '#A8A8A8', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0EDE5' }}>
                  * Comisiones MP estimadas al 4.18%. El costo real puede variar según tu plan de Mercado Pago.
                </p>
                )}
              </div>
            </div>

            {/* Bloque: Historial de reembolsos y cancelaciones */}
            {(pedido.reembolsos?.length ?? 0) > 0 && (
              <div id="reembolsos" style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden', scrollMarginTop: '16px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Reembolsos y cancelaciones</p>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {pedido.reembolsos.map((r, i) => (
                    <div key={r.id} style={{ padding: '12px 20px', borderBottom: i < pedido.reembolsos.length - 1 ? '1px solid #F0EDE5' : 'none', fontSize: '12px', color: '#2C2C2C', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <strong>{TIPO_REEMBOLSO[r.tipo] ?? r.tipo}</strong>
                        <strong style={{ color: r.estado === 'fallido' ? '#A8A8A8' : '#EF4444' }}>{r.estado === 'fallido' ? 'Falló' : `−${fmtMx(Number(r.monto))}`}</strong>
                      </div>
                      <div style={{ color: '#6B6B6B' }}>
                        {new Date(r.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{ORIGEN_REEMBOLSO[r.origen] ?? r.origen}
                        {r.metodo !== 'ninguno' ? ` · ${r.metodo === 'mercadopago' ? 'Mercado Pago' : 'Transferencia'}` : ''}
                        {r.admin_email ? ` · ${r.admin_email}` : ''}
                        {r.estado === 'procesando' ? ' · en proceso' : ''}
                      </div>
                      {(r.items?.length ?? 0) > 0 && (
                        <div style={{ color: '#6B6B6B' }}>
                          {r.items.map(x => `${x.cantidad}× ${nombreItem(x.pedido_item_id)}`).join(', ')}{r.incluye_envio ? ' + envío' : ''}
                        </div>
                      )}
                      {r.items?.length === 0 && r.incluye_envio && <div style={{ color: '#6B6B6B' }}>Envío</div>}
                      {r.ajustado_a_mano && r.monto_calculado != null && (
                        <div style={{ color: '#E08A2B' }}>Ajustado a mano (calculado: {fmtMx(Number(r.monto_calculado))})</div>
                      )}
                      {r.motivo && <div style={{ color: '#6B6B6B' }}>Motivo: {r.motivo}</div>}
                      {r.error && <div style={{ color: '#B91C1C' }}>Error: {r.error}</div>}
                      {r.mp_refund_id && <div style={{ color: '#A8A8A8', fontFamily: 'monospace', fontSize: '11px' }}>MP reembolso {r.mp_refund_id}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloque: Facturación */}
            {pedido.requiere_factura && (
              <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Solicitud de factura CFDI</p>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: pedido.factura_estado === 'emitida' ? 'rgba(168,181,160,0.2)' : 'rgba(245,158,11,0.1)', color: pedido.factura_estado === 'emitida' ? '#6A8A62' : '#D97706', fontWeight: 500 }}>
                    {pedido.factura_estado === 'emitida' ? '✓ Emitida' : '⏳ Pendiente'}
                  </span>
                </div>
                <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                  {[
                    { label: 'RFC', valor: pedido.factura_rfc, mono: true },
                    { label: 'Razón social', valor: pedido.factura_razon_social ?? '—', mono: false },
                    { label: 'Uso CFDI', valor: pedido.factura_uso_cfdi ?? '—', mono: false },
                    { label: 'Régimen fiscal', valor: pedido.factura_regimen ?? '—', mono: false },
                    { label: 'CP fiscal', valor: pedido.factura_cp ?? '—', mono: true },
                  ].map((f, i) => (
                    <div key={i}>
                      <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A8A8', marginBottom: '3px' }}>{f.label}</p>
                      <p style={{ fontSize: '13px', color: '#0E0E0E', fontFamily: f.mono ? 'monospace' : 'inherit', fontWeight: 500 }}>{f.valor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Columna derecha: Acciones ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>

            {/* Estado */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Estado del pedido</p>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Solo el estado actual y a los que se puede pasar a mano */}
                <select value={pedido.estado} onChange={e => actualizarEstado(e.target.value)}
                  disabled={guardando || !(TRANSICIONES_MANUALES[pedido.estado]?.length)}
                  className="det-estado-select" style={{ borderLeft: `3px solid ${info.color}` }}>
                  {ESTADOS.filter(e => e.value === pedido.estado || (TRANSICIONES_MANUALES[pedido.estado] ?? []).includes(e.value))
                    .map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  {!ESTADOS.some(e => e.value === pedido.estado) && <option value={pedido.estado}>{pedido.estado}</option>}
                </select>
                {!(TRANSICIONES_MANUALES[pedido.estado]?.length) && (
                  <p style={{ fontSize: '11px', color: '#A8A8A8', lineHeight: 1.5 }}>Este estado no se cambia a mano.</p>
                )}
                {pedido.mp_payment_id && (
                  <p style={{ fontSize: '11px', color: '#A8A8A8', fontFamily: 'monospace' }}>MP: {pedido.mp_payment_id}</p>
                )}
              </div>
            </div>

            {/* ── Reembolso (dueño y gerente) ── */}
            {puedeGestionarDinero && ESTADOS_REEMBOLSABLES.includes(pedido.estado) && saldoPorDevolver > 0 && (
              <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Reembolso</p>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {montoReembolsado > 0 && (
                    <p style={{ fontSize: '11px', color: '#E08A2B', fontWeight: 600 }}>Reembolsado: {fmtMx(montoReembolsado)} de {fmtMx(pedido.total)}</p>
                  )}
                  {!mostrarReembolso ? (
                    <button onClick={() => setMostrarReembolso(true)}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600 }}>
                      Reembolsar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['parcial', 'total'] as const).map(t => (
                          <button key={t} onClick={() => setTipoReembolso(t)}
                            style={{ flex: 1, padding: '8px', borderRadius: '5px', border: tipoReembolso === t ? '1px solid #EF4444' : '1px solid #E8E4DA', background: tipoReembolso === t ? 'rgba(239,68,68,0.06)' : '#FAFAF7', color: tipoReembolso === t ? '#EF4444' : '#6B6B6B', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            {t === 'parcial' ? 'Elegir productos' : 'Todo lo que falta'}
                          </button>
                        ))}
                      </div>

                      {tipoReembolso === 'total' ? (
                        <p style={{ fontSize: '11px', color: '#6B6B6B', lineHeight: 1.5 }}>Se devolverán <strong>{fmtMx(saldoPorDevolver)}</strong> (todas las piezas pendientes{envioDisponible(pedido) ? ' y el envío' : ''}).</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(pedido.pedido_items || []).map(it => {
                            const disponibles = it.cantidad - (it.cantidad_reembolsada ?? 0)
                            return (
                              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', opacity: disponibles > 0 ? 1 : 0.5 }}>
                                <span style={{ flex: 1, color: '#2C2C2C', lineHeight: 1.3 }}>
                                  {it.nombre}{it.variante_nombre ? ` · ${it.variante_nombre}` : ''}
                                  <span style={{ display: 'block', fontSize: '10px', color: '#A8A8A8' }}>{fmtMx(it.precio)} c/u · {disponibles} de {it.cantidad} por devolver</span>
                                </span>
                                <select value={seleccion[it.id] || 0} disabled={disponibles <= 0}
                                  onChange={e => setSeleccion(s => ({ ...s, [it.id]: Number(e.target.value) }))}
                                  style={{ padding: '4px 6px', border: '1px solid #E8E4DA', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit' }}>
                                  {Array.from({ length: Math.max(0, disponibles) + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                              </div>
                            )
                          })}
                          {envioDisponible(pedido) && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#2C2C2C' }}>
                              <input type="checkbox" checked={incluirEnvio} onChange={e => setIncluirEnvio(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                              Incluir envío ({fmtMx(Number(pedido.costo_envio || 0))})
                            </label>
                          )}
                          <div style={{ padding: '8px 10px', background: '#FAFAF7', borderRadius: '5px', fontSize: '12px', color: '#2C2C2C' }}>
                            Calculado: <strong>{fmtMx(calcularParcial(pedido))}</strong>
                            {Number(pedido.descuento || 0) > 0 && <span style={{ display: 'block', fontSize: '10px', color: '#A8A8A8' }}>Ya descuenta la parte proporcional del descuento del pedido.</span>}
                          </div>
                          <label style={{ fontSize: '11px', color: '#6B6B6B' }}>Ajustar monto a mano (opcional, máx. {fmtMx(saldoPorDevolver)})</label>
                          <input type="number" min="0" step="0.01" placeholder={String(calcularParcial(pedido))} value={montoManual}
                            onChange={e => setMontoManual(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E4DA', borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                          {montoManual.trim() !== '' && Number(montoManual) !== calcularParcial(pedido) && (
                            <p style={{ fontSize: '10px', color: '#E08A2B' }}>Ajustado a mano (se guarda junto al calculado).</p>
                          )}
                        </div>
                      )}

                      <input type="text" placeholder="Motivo (opcional)" value={motivoReembolso} maxLength={500}
                        onChange={e => setMotivoReembolso(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E4DA', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />

                      <div style={{ padding: '8px 10px', background: 'rgba(201,169,97,0.1)', border: '1px solid rgba(201,169,97,0.4)', borderRadius: '5px' }}>
                        <p style={{ fontSize: '11px', color: '#8B7530', lineHeight: 1.5, margin: 0 }}>
                          {pedido.metodo_pago === 'transferencia'
                            ? 'Este registro NO mueve dinero: haz la transferencia de devolución desde tu banco. '
                            : 'Se devuelve en Mercado Pago. '}
                          El inventario NO se ajusta automáticamente.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={cerrarReembolso} disabled={reembolsando}
                          style={{ flex: 1, padding: '9px', border: '1px solid #E8E4DA', borderRadius: '5px', background: '#FAFAF7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#6B6B6B' }}>
                          Cerrar
                        </button>
                        <button onClick={reembolsar} disabled={reembolsando}
                          style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '5px', background: reembolsando ? '#E8E4DA' : '#EF4444', color: reembolsando ? '#A8A8A8' : '#fff', fontSize: '12px', cursor: reembolsando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          {reembolsando ? 'Procesando...' : 'Confirmar reembolso'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Cancelar pedido (dueño y gerente; solo sin guía) ── */}
            {puedeGestionarDinero && puedeCancelarse(pedido) && (
              <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Cancelar pedido</p>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!mostrarCancelar ? (
                    <button onClick={() => setMostrarCancelar(true)}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid #E8E4DA', background: '#FAFAF7', color: '#6B6B6B', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600 }}>
                      Cancelar pedido
                    </button>
                  ) : (
                    <>
                      <p style={{ fontSize: '11px', color: '#6B6B6B', lineHeight: 1.6 }}>
                        {pedido.metodo_pago === 'transferencia'
                          ? (['pagado', 'preparando', 'reembolso_parcial'].includes(pedido.estado)
                              ? <>Se registrará la devolución de <strong>{fmtMx(saldoPorDevolver)}</strong>. <strong>La transferencia de devolución la haces tú desde tu banco.</strong></>
                              : pedido.estado === 'comprobante_en_revision'
                                ? <>El comprobante aún no está aprobado. <strong>Si te llegó la transferencia, devuelve {fmtMx(saldoPorDevolver)} desde tu banco.</strong></>
                                : <>No hay pago que devolver.</>)
                          : (['pagado', 'preparando', 'reembolso_parcial', 'revision_monto'].includes(pedido.estado)
                              ? <>Se devolverá en Mercado Pago <strong>todo lo que queda del pago</strong>{montoReembolsado > 0 ? ` (ya se devolvieron ${fmtMx(montoReembolsado)})` : ''}.</>
                              : <>Se caducará el enlace de pago de Mercado Pago (y una ficha OXXO pendiente, si hay).</>)}
                        {' '}El cliente recibirá el correo &quot;Tu pedido fue cancelado&quot;.
                        {pedido.stock_descontado_at && !pedido.stock_devuelto_at
                          ? ' Las piezas regresarán al inventario.'
                          : ' Este pedido no descontó stock, así que no hay nada que regresar al inventario.'}
                      </p>
                      <textarea placeholder="Motivo de la cancelación (obligatorio)" value={motivoCancelacion} maxLength={500} rows={3}
                        onChange={e => setMotivoCancelacion(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E4DA', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setMostrarCancelar(false); setMotivoCancelacion('') }} disabled={cancelando}
                          style={{ flex: 1, padding: '9px', border: '1px solid #E8E4DA', borderRadius: '5px', background: '#FAFAF7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#6B6B6B' }}>
                          Volver
                        </button>
                        <button onClick={cancelar} disabled={cancelando || motivoCancelacion.trim().length < 3}
                          style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '5px', background: (cancelando || motivoCancelacion.trim().length < 3) ? '#E8E4DA' : '#0E0E0E', color: (cancelando || motivoCancelacion.trim().length < 3) ? '#A8A8A8' : '#fff', fontSize: '12px', cursor: (cancelando || motivoCancelacion.trim().length < 3) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          {cancelando ? 'Cancelando...' : 'Confirmar cancelación'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Sincronizar con Mercado Pago (dueño y gerente) ── */}
            {puedeGestionarDinero && pedido.mp_payment_id && (
              <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Mercado Pago</p>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!sync ? (
                    <button onClick={revisarSync} disabled={sincronizando}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid #E8E4DA', background: '#FAFAF7', color: '#5B7C99', borderRadius: '6px', cursor: sincronizando ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600 }}>
                      {sincronizando ? 'Consultando…' : 'Sincronizar con Mercado Pago'}
                    </button>
                  ) : (
                    <>
                      <div style={{ fontSize: '12px', color: '#2C2C2C', lineHeight: 1.7 }}>
                        <div>En MP: <strong>{sync.mp.estado}</strong> · cobrado {fmtMx(sync.mp.pagado)} · reembolsado <strong>{fmtMx(sync.mp.reembolsado)}</strong></div>
                        <div>Aquí: <strong>{sync.base.estado}</strong> · reembolsado <strong>{fmtMx(sync.base.montoReembolsado)}</strong></div>
                        {sync.mp.refunds.map(r => (
                          <div key={r.id} style={{ fontSize: '11px', color: '#6B6B6B' }}>
                            Reembolso {r.id}: {fmtMx(r.monto)} ({r.estado}) {r.registrado ? '✓ registrado' : '— sin registrar'}
                          </div>
                        ))}
                      </div>
                      {sync.diferencias.length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#6A8A62', fontWeight: 600 }}>✓ Coincide con Mercado Pago.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#B45309', lineHeight: 1.6 }}>
                          {sync.diferencias.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setSync(null)} disabled={sincronizando}
                          style={{ flex: 1, padding: '9px', border: '1px solid #E8E4DA', borderRadius: '5px', background: '#FAFAF7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#6B6B6B' }}>
                          Cerrar
                        </button>
                        {sync.hayQueAplicar && (
                          <button onClick={aplicarSync} disabled={sincronizando}
                            style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '5px', background: sincronizando ? '#E8E4DA' : '#5B7C99', color: '#fff', fontSize: '12px', cursor: sincronizando ? 'wait' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            {sincronizando ? 'Aplicando…' : 'Aplicar'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Envío Skydropx: cotizar, generar guía, imprimir, cancelar */}
            <EnvioSkydropx pedido={pedido} puedeCancelarGuia={puedeGestionarDinero} onCambio={cargar} mostrarMsg={mostrarMsg} />

            {/* Guía manual (respaldo si Skydropx falla) */}
            {!pedido.skydropx_shipment_id && (
            <details open={!!pedido.numero_guia} style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <summary style={{ padding: '14px 18px', background: '#FAFAF7', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>
                Guía manual (si Skydropx falla)
              </summary>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #E8E4DA' }}>
                {ESTADOS_CON_GUIA.includes(pedido.estado) ? (
                  <button onClick={imprimirGuia}
                    style={{ width: '100%', padding: '10px 16px', border: `1px solid ${guia.border}`, background: guia.bg, color: guia.color, borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s' }}>
                    {guia.label}
                  </button>
                ) : (
                  <p style={{ fontSize: '12px', color: '#A8A8A8', textAlign: 'center' }}>
                    {pedido.numero_guia ? 'La guía ya no se puede cambiar en este estado.' : 'No aplica en este estado.'}
                  </p>
                )}

                {mostrarGuiaInput && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '11px', color: '#6B6B6B' }}>Selecciona la paquetería e ingresa el número de guía:</p>
                    {/* paqueteria-selector */}
                      <select value={paqueteriaInput} onChange={e => setPaqueteriaInput(e.target.value)} className="guia-input" style={{ marginBottom: '4px' }}>
                        <option value="">— Elige paquetería —</option>
                        {PAQUETERIAS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="text" placeholder="Número de guía" value={guiaInput}
                      onChange={e => setGuiaInput(e.target.value)}
                      className="guia-input" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setMostrarGuiaInput(false)}
                        style={{ flex: 1, padding: '8px', border: '1px solid #E8E4DA', borderRadius: '5px', background: '#FAFAF7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#6B6B6B' }}>
                        Cancelar
                      </button>
                      <button onClick={guardarGuia} disabled={!guiaInput.trim() || !paqueteriaInput || guardando}
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '5px', background: (guiaInput.trim() && paqueteriaInput) ? '#0E0E0E' : '#E8E4DA', color: (guiaInput.trim() && paqueteriaInput) ? '#C9A961' : '#A8A8A8', fontSize: '12px', cursor: (guiaInput.trim() && paqueteriaInput) ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600 }}>
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {pedido.numero_guia && !mostrarGuiaInput && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FAFAF7', borderRadius: '5px', border: '1px solid #E8E4DA' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#2C2C2C' }}>{pedido.numero_guia}</span>
                    <button onClick={() => { setGuiaInput(pedido.numero_guia ?? ''); setMostrarGuiaInput(true) }}
                      style={{ fontSize: '10px', color: '#A8A8A8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      editar
                    </button>
                  </div>
                )}
              </div>
            </details>
            )}

            {/* Factura: se gestiona en Admin › Facturas (bucket privado) */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Factura</p>
              </div>
              <div style={{ padding: '16px 18px' }}>
                {!pedido.requiere_factura ? (
                  <p style={{ fontSize: '12px', color: '#A8A8A8', textAlign: 'center' }}>El cliente no ha solicitado factura</p>
                ) : (
                  <>
                    <p style={{ fontSize: '13px', fontWeight: 500, textAlign: 'center', marginBottom: '10px', color: pedido.factura_enviada_at ? '#6A8A62' : (pedido.factura_pdf_path && pedido.factura_xml_path) ? '#5B7C99' : '#D97706' }}>
                      {pedido.factura_enviada_at
                        ? `✓ Enviada el ${new Date(pedido.factura_enviada_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : (pedido.factura_pdf_path && pedido.factura_xml_path) ? 'Lista para enviar' : '⏳ Pendiente de emitir'}
                    </p>
                    <a href="/admin/facturas"
                      style={{ display: 'block', padding: '10px 16px', background: '#FAFAF7', border: '1px solid #E8E4DA', borderRadius: '6px', fontSize: '12px', color: '#C9A961', textDecoration: 'none', fontWeight: 500, textAlign: 'center' }}>
                      Gestionar en Facturas →
                    </a>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
