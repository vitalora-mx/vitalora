'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CosmeticosHeader from '@/components/store/cosmeticos/CosmeticosHeader'
import CosmeticosBanner from '@/components/store/cosmeticos/CosmeticosBanner'
import CosmeticosRutinas from '@/components/store/cosmeticos/CosmeticosRutinas'
import CosmeticosProductos from '@/components/store/cosmeticos/CosmeticosProductos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

interface Producto {
  id: number; slug: string; marca: string; categoria: string; nombre: string
  precio: number; precio_original: number | null; tag: string; stock: number
  producto_imagenes: { url: string; posicion: number }[]
}

function CosmeticosContenido({ productosIniciales }: { productosIniciales: Producto[] }) {
  const searchParams = useSearchParams()
  const categoriaURL = searchParams.get('categoria')

  const [rutinaActiva, setRutinaActiva] = useState(categoriaURL || 'Todas')
  const [marcaActiva, setMarcaActiva] = useState('Todas')

  useEffect(() => {
    if (categoriaURL) {
      setRutinaActiva(categoriaURL)
    }
  }, [categoriaURL])

  return (
    <main>
      <CosmeticosHeader />
      <CosmeticosBanner />
      <CosmeticosRutinas rutinaActiva={rutinaActiva} setRutinaActiva={setRutinaActiva} />
      <CosmeticosProductos
        rutinaActiva={rutinaActiva}
        marcaActiva={marcaActiva}
        setMarcaActiva={setMarcaActiva}
        productosIniciales={productosIniciales}
      />
      <Footer />
      <LoraChat />
    </main>
  )
}

export default function CosmeticosCliente({ productosIniciales }: { productosIniciales: Producto[] }) {
  return (
    <Suspense fallback={<main style={{ minHeight: '60vh', background: 'var(--bg-cream)' }} />}>
      <CosmeticosContenido productosIniciales={productosIniciales} />
    </Suspense>
  )
}