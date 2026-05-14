// Lora AI assistant — se implementará con @anthropic-ai/sdk
export async function POST() {
  return Response.json({ message: "Lora no configurada aún" }, { status: 501 });
}
