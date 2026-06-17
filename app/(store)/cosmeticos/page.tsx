'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CosmeticosHeader from '@/components/store/cosmeticos/CosmeticosHeader'
import CosmeticosBanner from '@/components/store/cosmeticos/CosmeticosBanner'
import CosmeticosRutinas from '@/components/store/cosmeticos/CosmeticosRutinas'
import CosmeticosProductos from '@/components/store/cosmeticos/CosmeticosProductos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

function CosmeticosContenido() {
  const searchParams = useSearchParams()
  const categoriaURL = searchParams.get('categoria')

  const [rutinaActiva, setRutinaActiva] = useState(categoriaURL || 'Todas')
  const [marcaActiva, setMarcaActiva] = useState('Todas')

  // Si cambia el parámetro de la URL (ej. al venir del carrusel), actualizar el filtro
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
      <CosmeticosProductos rutinaActiva={rutinaActiva} marcaActiva={marcaActiva} setMarcaActiva={setMarcaActiva} />
      <Footer />
      <LoraChat />
    </main>
  )
}

export default function CosmeticosPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '60vh', background: 'var(--bg-cream)' }} />}>
      <CosmeticosContenido />
    </Suspense>
  )
}
