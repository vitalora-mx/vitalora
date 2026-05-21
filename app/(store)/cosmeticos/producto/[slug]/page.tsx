'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import CosmeticosHeader from '@/components/store/cosmeticos/CosmeticosHeader'
import ProductoGaleria from '@/components/store/producto/ProductoGaleria'
import ProductoInfo from '@/components/store/producto/ProductoInfo'
import ProductoTabs from '@/components/store/producto/ProductoTabs'
import ProductoRelacionados from '@/components/store/producto/ProductoRelacionados'
import ProductoVideos from '@/components/store/producto/ProductoVideos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

// Base de datos temporal de productos
const productos: Record<string, any> = {
  'hydra-glow-essence': {
    id: 1,
    nombre: 'Hydra Glow Essence',
    marca: 'COSRX',
    categoria: 'Sérum',
    precio: 649,
    tag: 'Best Seller',
    color: 'linear-gradient(135deg, #F5E8E0, #E8C9C0)',
    descripcion: 'Una esencia hidratante ligera formulada con 92% de filtrado de baba de caracol y ácido hialurónico de triple peso molecular. Ideal para todo tipo de piel, especialmente piel deshidratada y con signos de envejecimiento.',
    ingredientes: 'Snail Secretion Filtrate (92%), Niacinamide, Sodium Hyaluronate, Panthenol, Allantoin, Centella Asiatica Extract, Glycerin',
    comoUsar: '1. Limpia tu rostro con un limpiador suave.\n2. Aplica tónico si usas uno.\n3. Vierte unas gotas de la esencia en la palma.\n4. Da pequeños toquecitos sobre el rostro hasta absorber.\n5. Continúa con tu sérum y crema hidratante.',
    tablanutrimental: null,
    videos: [
  { id: 'dQw4w9WgXcQ', titulo: 'Cómo usar Hydra Glow Essence correctamente', duracion: '8:24' },
  { id: 'jNQXAC9IVRw', titulo: 'Review completo: ¿Vale la pena?', duracion: '12:10' },
],
    relacionados: [2, 3, 4, 5],
  },
  'royal-snail-cream': {
    id: 2,
    nombre: 'Royal Snail Cream',
    marca: 'COSRX',
    categoria: 'Crema',
    precio: 890,
    tag: 'Nuevo',
    color: 'linear-gradient(135deg, #EDE6D8, #D9D2C4)',
    descripcion: 'Crema regeneradora nocturna con 92% de filtrado de baba de caracol. Reduce líneas finas, desvanece manchas y proporciona hidratación profunda durante la noche.',
    ingredientes: 'Snail Secretion Filtrate (92%), Shea Butter, Ceramide NP, Adenosine, Niacinamide, Peptides Complex',
    comoUsar: '1. Usa como último paso de tu rutina nocturna.\n2. Aplica una cantidad del tamaño de un chícharo.\n3. Distribuye uniformemente por rostro y cuello.\n4. Deja actuar toda la noche.',
    tablanutrimental: null,
    videos: [],
    relacionados: [1, 3, 4],
  },
}

export default function ProductoCosmeticoPage() {
  const params = useParams()
  const slug = params.slug as string
  const producto = productos[slug] || productos['hydra-glow-essence']

  return (
    <main style={{ background: 'white' }}>
      <CosmeticosHeader />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '80px' }}>
          <ProductoGaleria producto={producto} />
          <ProductoInfo producto={producto} />
        </div>
        <ProductoTabs producto={producto} />
      </div>
      <ProductoRelacionados productoIds={producto.relacionados} tipo="cosmeticos" />
      <ProductoVideos videos={producto.videos} />
      <Footer />
      <LoraChat />
    </main>
  )
}