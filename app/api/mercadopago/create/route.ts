// Crear preferencia de pago en Mercado Pago
export async function POST() {
  return Response.json({ message: "Mercado Pago no configurado aún" }, { status: 501 });
}
