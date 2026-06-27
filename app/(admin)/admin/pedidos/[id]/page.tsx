'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatearNumeroPedido } from '@/lib/utils'

interface PedidoItem {
  nombre: string
  marca: string
  precio: number
  cantidad: number
  variante_nombre: string | null
}

interface Pedido {
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
  costo_envio: number
  total: number
  monto_reembolsado: number | null
  numero_guia: string | null
  paqueteria: string | null
  metodo_pago: string | null
  factura_url: string | null
  factura_rfc: string | null
  factura_razon_social: string | null
  factura_uso_cfdi: string | null
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
  { value: 'preparando',  label: 'Preparando',   color: '#8060C0' },
  { value: 'enviado',     label: 'Enviado',      color: '#6A8A62' },
  { value: 'entregado',   label: 'Entregado',    color: '#3A8A3A' },
  { value: 'cancelado',   label: 'Cancelado',    color: '#EF4444' },
  { value: 'reembolso_parcial', label: 'Reembolso parcial', color: '#E08A2B' },
  { value: 'reembolsado', label: 'Reembolsado',  color: '#A8A8A8' },
]

function estadoInfo(estado: string) {
  return ESTADOS.find(e => e.value === estado) ?? { label: estado, color: '#888' }
}

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
  if (estado === 'enviado')     return { label: '🚚 En camino · Reimprimir guía', color: '#6A8A62', bg: 'rgba(106,138,98,0.1)',  border: 'rgba(106,138,98,0.3)'  }
  if (numero_guia)              return { label: '✓ Guía impresa · Reimprimir', color: '#5B7C99', bg: 'rgba(91,124,153,0.1)',  border: 'rgba(91,124,153,0.3)'  }
  return                               { label: '🖨 Imprimir guía de envío', color: '#C9A961', bg: 'rgba(201,169,97,0.1)',  border: 'rgba(201,169,97,0.4)'  }
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
  const [reembolsando, setReembolsando] = useState(false)
  const [mostrarReembolso, setMostrarReembolso] = useState(false)
  const [tipoReembolso, setTipoReembolso] = useState<'total' | 'parcial'>('total')
  const [montoReembolso, setMontoReembolso] = useState('')
  const [devolverStockTransfer, setDevolverStockTransfer] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}`)
      const data = await res.json()
      setPedido(data.pedido)
      setClienteStats(data.clienteStats)
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [params.id])

  useEffect(() => { cargar() }, [cargar])

  function mostrarMsg(msg: string) {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 4000)
  }

  async function actualizarEstado(estado: string) {
    setGuardando(true)
    await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, estado }),
    })
    mostrarMsg(`Estado actualizado → ${estado}`)
    await cargar()
    setGuardando(false)
  }

  async function guardarGuia() {
    if (!guiaInput.trim() || !paqueteriaInput) return
    setGuardando(true)
    await fetch('/api/admin/pedidos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, numero_guia: guiaInput.trim(), paqueteria: paqueteriaInput, estado: 'enviado' }),
    })
    // Disparar correo de envio al cliente con datos de rastreo
      try {
        await fetch('/api/admin/pedidos/notificar-envio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedidoId: params.id }),
        })
      } catch (e) { console.error('Error al enviar correo de envio:', e) }
      mostrarMsg('Número de guía guardado y estado → Enviado')
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

  async function subirFactura(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pedido_id', String(params.id))
    const res = await fetch('/api/admin/pedidos/factura', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) {
      mostrarMsg('Factura subida correctamente')
      cargar()
    }
  }

  async function reembolsar() {
    if (!pedido) return
    // Confirmacion doble: el reembolso mueve dinero real y es irreversible.
    const esParcial = tipoReembolso === 'parcial'
    let monto: number | null = null
    if (esParcial) {
      monto = parseFloat(montoReembolso)
      if (!monto || monto <= 0) { mostrarMsg('Ingresa un monto valido para el reembolso parcial.'); return }
      if (monto > pedido.total) { mostrarMsg('El monto no puede ser mayor al total del pedido.'); return }
    }
    const esTransferencia = pedido.metodo_pago === 'transferencia'
    let texto
    if (esTransferencia) {
      texto = esParcial
        ? `Vas a REGISTRAR un reembolso parcial de ${monto}. Esto NO mueve dinero: haz la transferencia de devolucion desde tu banco. ${devolverStockTransfer ? 'El stock SE devolvera.' : 'El stock NO se devolvera.'} Continuar?`
        : `Vas a REGISTRAR el reembolso TOTAL (${pedido.total}). Esto NO mueve dinero: haz la transferencia de devolucion desde tu banco. ${devolverStockTransfer ? 'El stock SE devolvera.' : 'El stock NO se devolvera.'} Continuar?`
    } else {
      texto = esParcial
        ? `Vas a reembolsar ${monto} al cliente. El inventario NO se ajusta solo en parciales: hazlo tu si aplica. Esta accion es irreversible. Continuar?`
        : `Vas a reembolsar el TOTAL (${pedido.total}) al cliente. El inventario se devolvera automaticamente. Esta accion es irreversible. Continuar?`
    }
    if (!window.confirm(texto)) return

    setReembolsando(true)
    try {
      const endpoint = esTransferencia
        ? `/api/admin/pedidos/${params.id}/reembolsar-transferencia`
        : `/api/admin/pedidos/${params.id}/reembolsar`
      const bodyData = esTransferencia
        ? (esParcial ? { monto, devolverStock: devolverStockTransfer } : { devolverStock: devolverStockTransfer })
        : (esParcial ? { monto } : {})
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })
      const data = await res.json()
      if (res.ok && (data.success || data.ok)) {
        mostrarMsg(data.mensaje || 'Reembolso procesado.')
          // Disparar correo de confirmacion de reembolso al cliente
          try {
            await fetch('/api/admin/pedidos/notificar-reembolso', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pedidoId: params.id,
                metodo: esTransferencia ? 'transferencia' : 'mercadopago',
                monto: esParcial ? monto : (pedido.total || 0),
                esParcial,
              }),
            })
          } catch (e) { console.error('Error al enviar correo de reembolso:', e) }
        setMostrarReembolso(false)
        setMontoReembolso('')
        // Esperar un momento a que MP dispare el webhook y refrescar
        setTimeout(() => cargar(), 2500)
      } else {
        mostrarMsg(data.error || 'No se pudo procesar el reembolso.')
      }
    } catch {
      mostrarMsg('Error de conexion al procesar el reembolso.')
    }
    setReembolsando(false)
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
  const montoReembolsado = pedido.monto_reembolsado ?? 0
  const hayReembolso = montoReembolsado > 0
  const montoNeto = Math.max(0, pedido.total - montoReembolsado)  // lo que realmente quedo cobrado
  const comisionMP = montoNeto * 0.0418             // ~4.18% sobre lo que quedo (MP bonifica lo reembolsado)
  const costoEnvioMP = envioCliente > 0 ? envioCliente * 0.85 : 0  // estimado: MP se queda ~15%
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
                  { label: 'Envío cobrado al cliente', valor: envioCliente === 0 ? 'Gratis' : fmt(envioCliente), sub: null, color: '#0E0E0E', bold: false },
                  { label: 'Total pagado por el cliente', valor: fmt(pedido.total), sub: formaPagoLabel(pedido.forma_pago), color: '#0E0E0E', bold: true },
                  null, // separador
                  { label: 'IVA estimado incluido (16%)', valor: fmt(ivaEstimado), sub: 'Incluido en el precio de venta', color: '#6B6B6B', bold: false },
                  { label: 'Comisión Mercado Pago (~4.18%)', valor: `−${fmt(comisionMP)}`, sub: hayReembolso ? 'Sobre el monto neto (ya descontado el reembolso)' : 'Sobre el total del pedido', color: '#F59E0B', bold: false },
                  ...(hayReembolso ? [
                    null, // separador
                    { label: 'Reembolsado al cliente', valor: `−${fmt(montoReembolsado)}`, sub: montoReembolsado >= pedido.total ? 'Reembolso total' : 'Reembolso parcial', color: '#EF4444', bold: false },
                  ] : []),
                  null, // separador
                  { label: hayReembolso ? 'Neto real recibido' : 'Neto estimado recibido', valor: fmt(netoRecibido), sub: hayReembolso ? 'Después de reembolso y comisión MP' : 'Después de comisión MP', color: '#6A8A62', bold: true },
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
                <p style={{ fontSize: '10px', color: '#A8A8A8', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0EDE5' }}>
                  * Comisiones MP estimadas al 4.18%. El costo real puede variar según tu plan de Mercado Pago.
                </p>
              </div>
            </div>

            {/* Bloque: Facturación */}
            {pedido.factura_rfc && (
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
                  ].map((f, i) => (
                    <div key={i}>
                      <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A8A8', marginBottom: '3px' }}>{f.label}</p>
                      <p style={{ fontSize: '13px', color: '#0E0E0E', fontFamily: f.mono ? 'monospace' : 'inherit', fontWeight: 500 }}>{f.valor}</p>
                    </div>
                  ))}
                </div>
                {pedido.factura_url && (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid #F0EDE5' }}>
                    <a href={pedido.factura_url} target="_blank" style={{ fontSize: '13px', color: '#C9A961', textDecoration: 'none', fontWeight: 500 }}>📄 Ver factura →</a>
                  </div>
                )}
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
                <select value={pedido.estado} onChange={e => actualizarEstado(e.target.value)} disabled={guardando}
                  className="det-estado-select" style={{ borderLeft: `3px solid ${info.color}` }}>
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
                {pedido.mp_payment_id && (
                  <p style={{ fontSize: '11px', color: '#A8A8A8', fontFamily: 'monospace' }}>MP: {pedido.mp_payment_id}</p>
                )}
              </div>
            </div>

            {/* Reembolso (si esta pagado o con reembolso parcial) */}
            {(pedido.estado === 'pagado' || pedido.estado === 'reembolso_parcial') && (
              <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Reembolso</p>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(pedido.monto_reembolsado ?? 0) > 0 && (
                    <p style={{ fontSize: '11px', color: '#E08A2B', fontWeight: 600 }}>Reembolsado: ${pedido.monto_reembolsado} de ${pedido.total}</p>
                  )}
                  {!mostrarReembolso ? (
                    <button onClick={() => setMostrarReembolso(true)}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600 }}>
                      Reembolsar pedido
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setTipoReembolso('total')}
                          style={{ flex: 1, padding: '8px', borderRadius: '5px', border: tipoReembolso === 'total' ? '1px solid #EF4444' : '1px solid #E8E4DA', background: tipoReembolso === 'total' ? 'rgba(239,68,68,0.06)' : '#FAFAF7', color: tipoReembolso === 'total' ? '#EF4444' : '#6B6B6B', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          Total
                        </button>
                        <button onClick={() => setTipoReembolso('parcial')}
                          style={{ flex: 1, padding: '8px', borderRadius: '5px', border: tipoReembolso === 'parcial' ? '1px solid #EF4444' : '1px solid #E8E4DA', background: tipoReembolso === 'parcial' ? 'rgba(239,68,68,0.06)' : '#FAFAF7', color: tipoReembolso === 'parcial' ? '#EF4444' : '#6B6B6B', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          Parcial
                        </button>
                      </div>
                      {tipoReembolso === 'total' ? (
                        <p style={{ fontSize: '11px', color: '#6B6B6B', lineHeight: 1.5 }}>Se reembolsaran <strong>${pedido.total}</strong> y el inventario se devolvera automaticamente.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <p style={{ fontSize: '11px', color: '#6B6B6B', lineHeight: 1.5 }}>Monto a reembolsar (max ${pedido.total}). El inventario NO se ajusta solo.</p>
                          <input type="number" placeholder="Ej. 99" value={montoReembolso}
                            onChange={e => setMontoReembolso(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E4DA', borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                      )}

                      {/* devolver-stock-checkbox: solo para transferencias */}
                      {pedido.metodo_pago === 'transferencia' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div style={{ padding: '8px 10px', background: 'rgba(201,169,97,0.1)', border: '1px solid rgba(201,169,97,0.4)', borderRadius: '5px' }}>
                            <p style={{ fontSize: '11px', color: '#8B7530', lineHeight: 1.5, margin: 0 }}>Este registro NO mueve dinero. Haz la transferencia de devolucion al cliente desde tu banco y registra aqui para tu control.</p>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#2C2C2C' }}>
                            <input type="checkbox" checked={devolverStockTransfer} onChange={e => setDevolverStockTransfer(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                            Devolver productos al inventario
                          </label>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setMostrarReembolso(false); setMontoReembolso('') }} disabled={reembolsando}
                          style={{ flex: 1, padding: '9px', border: '1px solid #E8E4DA', borderRadius: '5px', background: '#FAFAF7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#6B6B6B' }}>
                          Cancelar
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

            {/* Guía MP */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Guía Mercado Envíos</p>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={imprimirGuia}
                  style={{ width: '100%', padding: '10px 16px', border: `1px solid ${guia.border}`, background: guia.bg, color: guia.color, borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s' }}>
                  {guia.label}
                </button>

                {mostrarGuiaInput && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '11px', color: '#6B6B6B' }}>Selecciona la paquetería e ingresa el número de guía:</p>
                    {/* paqueteria-selector */}
                      <select value={paqueteriaInput} onChange={e => setPaqueteriaInput(e.target.value)} className="guia-input" style={{ marginBottom: '4px' }}>
                        <option value="">— Elige paquetería —</option>
                        <option value="Estafeta">Estafeta</option>
                        <option value="DHL">DHL</option>
                        <option value="FedEx">FedEx</option>
                        <option value="Paquetexpress">Paquetexpress</option>
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
            </div>

            {/* Factura */}
            <div style={{ background: '#fff', border: '1px solid #E8E4DA', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E4DA', background: '#FAFAF7' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600 }}>Factura</p>
              </div>
              <div style={{ padding: '16px 18px' }}>
                {pedido.factura_url ? (
                  <a href={pedido.factura_url} target="_blank"
                    style={{ display: 'block', padding: '10px 16px', background: 'rgba(168,181,160,0.12)', border: '1px solid rgba(168,181,160,0.3)', borderRadius: '6px', fontSize: '13px', color: '#6A8A62', textDecoration: 'none', fontWeight: 500, textAlign: 'center' }}>
                    📄 Ver factura →
                  </a>
                ) : (
                  <label style={{ display: 'block', padding: '10px 16px', background: '#FAFAF7', border: '1px dashed #E8E4DA', borderRadius: '6px', fontSize: '12px', color: '#A8A8A8', cursor: 'pointer', textAlign: 'center' }}>
                    📄 Subir PDF o XML
                    <input type="file" accept=".pdf,.xml" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) subirFactura(e.target.files[0]) }} />
                  </label>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
