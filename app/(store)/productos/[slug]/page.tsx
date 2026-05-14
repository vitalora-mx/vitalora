export default function ProductoPage({ params }: { params: { slug: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Producto: {params.slug}</h1>
    </main>
  );
}
