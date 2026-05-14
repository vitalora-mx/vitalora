// Webhook de notificaciones de Mercado Pago
export async function POST() {
  return Response.json({ received: true });
}
