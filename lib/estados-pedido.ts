// ============================================================
// Estados de pedido que se pueden cambiar a mano desde el admin.
// (Sin servidor: lo usan las páginas del admin y PUT /api/admin/pedidos.)
//
// "Cancelado", "Reembolsado" y "Reembolso parcial" NO se ponen a mano:
// solo se llega a ellos con los botones Cancelar pedido / Reembolsar /
// Sincronizar con Mercado Pago, que además mueven el dinero y ajustan comisiones.
// ============================================================

// Desde cada estado, a cuáles se puede pasar a mano (avanzar, o regresar un paso si fue un error)
export const TRANSICIONES_MANUALES: Record<string, string[]> = {
  revision_monto: ['pagado'],
  pagado: ['preparando', 'enviado'],
  preparando: ['pagado', 'enviado'],
  enviado: ['preparando', 'entregado'],
  entregado: ['enviado'],
  reembolso_parcial: ['preparando', 'enviado', 'entregado'],
}

export function puedeCambiarA(actual: string, nuevo: string): boolean {
  return actual === nuevo || (TRANSICIONES_MANUALES[actual] ?? []).includes(nuevo)
}

// Estados en los que se puede registrar o cambiar la guía de envío
export const ESTADOS_CON_GUIA = ['pagado', 'preparando', 'enviado', 'entregado', 'reembolso_parcial']

// Estados desde los que se puede cancelar (además: sin número de guía)
export const ESTADOS_CANCELABLES = [
  'pendiente', 'pagado', 'preparando', 'revision_monto', 'reembolso_parcial',
  'esperando_comprobante', 'comprobante_en_revision', 'comprobante_rechazado',
]

// Una guía de Skydropx en proceso (aún sin número) también bloquea la cancelación
export function puedeCancelarse(p: { estado: string; numero_guia?: string | null; skydropx_shipment_id?: string | null }): boolean {
  return !p.numero_guia && !p.skydropx_shipment_id && ESTADOS_CANCELABLES.includes(p.estado)
}

// Estados desde los que se puede reembolsar (pagos ya recibidos)
export const ESTADOS_REEMBOLSABLES = ['pagado', 'preparando', 'enviado', 'entregado', 'reembolso_parcial']

export const PAQUETERIAS = ['Estafeta', 'DHL', 'FedEx', 'Paquetexpress']
