'use client'

import { useState } from 'react'
import SuplementosHeader from '@/components/store/suplementos/SuplementosHeader'
import SuplementosBanner from '@/components/store/suplementos/SuplementosBanner'
import SuplementosCategorias from '@/components/store/suplementos/SuplementosCategorias'
import SuplementosProductos from '@/components/store/suplementos/SuplementosProductos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

interface Producto {
  id: number; slug: string; marca: string; categoria: string; nombre: string
  precio: number; precio_original: number | null; tag: string; descripcion: string; stock: number
  producto_imagenes: { url: string; posicion: number }[]
}

export default function SuplementosCliente({ productosIniciales }: { productosIniciales: Producto[] }) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')

  return (
    <main>
      <SuplementosHeader />
      <SuplementosBanner />
      <SuplementosCategorias categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva} />
      <SuplementosProductos categoriaActiva={categoriaActiva} productosIniciales={productosIniciales} />
      <Footer />
      <LoraChat />
    </main>
  )
}