'use client'

import { useState } from 'react'
import CosmeticosHeader from '@/components/store/cosmeticos/CosmeticosHeader'
import CosmeticosBanner from '@/components/store/cosmeticos/CosmeticosBanner'
import CosmeticosRutinas from '@/components/store/cosmeticos/CosmeticosRutinas'
import CosmeticosProductos from '@/components/store/cosmeticos/CosmeticosProductos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

export default function CosmeticosPage() {
  const [rutinaActiva, setRutinaActiva] = useState('Todas')
  const [marcaActiva, setMarcaActiva] = useState('Todas')

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