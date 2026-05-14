// Trigger de emails transaccionales con Resend
export async function POST() {
  return Response.json({ message: "Resend no configurado aún" }, { status: 501 });
}
