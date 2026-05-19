'use client'

import { useState } from 'react'
import SuplementosHeader from '@/components/store/suplementos/SuplementosHeader'
import SuplementosBanner from '@/components/store/suplementos/SuplementosBanner'
import SuplementosCategorias from '@/components/store/suplementos/SuplementosCategorias'
import SuplementosProductos from '@/components/store/suplementos/SuplementosProductos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

export default function SuplementosPage() {
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')

  return (
    <main>
      <SuplementosHeader />
      <SuplementosBanner />
      <SuplementosCategorias categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva} />
      <SuplementosProductos categoriaActiva={categoriaActiva} />
      <Footer />
      <LoraChat />
    </main>
  )
}