'use client'

import { useParams } from 'next/navigation'
import SuplementosHeader from '@/components/store/suplementos/SuplementosHeader'
import ProductoGaleria from '@/components/store/producto/ProductoGaleria'
import SuplementoInfo from '@/components/store/producto/SuplementoInfo'
import SuplementoTabs from '@/components/store/producto/SuplementoTabs'
import ProductoRelacionados from '@/components/store/producto/ProductoRelacionados'
import ProductoVideos from '@/components/store/producto/ProductoVideos'
import Footer from '@/components/store/Footer'
import LoraChat from '@/components/store/LoraChat'

const productos: Record<string, any> = {
  'colageno-marino': {
    id: 1,
    nombre: 'Colágeno Marino Tipo I & III',
    marca: 'B Life',
    categoria: 'Colágeno',
    precio: 520,
    tag: 'Best Seller',
    color: '#F0F7F0',
    descripcion: 'Colágeno marino hidrolizado de alta biodisponibilidad, obtenido de fuentes marinas sostenibles. Formulado con Tipo I y III para máxima efectividad en piel, cabello, uñas y articulaciones.',
    beneficios: [
      'Mejora elasticidad y firmeza de la piel',
      'Fortalece cabello y uñas',
      'Apoya la salud de articulaciones',
      'Alta biodisponibilidad — absorción rápida',
      'Sin saborizantes artificiales',
    ],
    paraQuien: 'Ideal para personas mayores de 25 años que buscan mantener la juventud de su piel, fortalecer cabello y uñas, o apoyar la salud de sus articulaciones.',
    tablanutrimental: [
      { nombre: 'Colágeno Hidrolizado', cantidad: '5,000 mg', vd: '—' },
      { nombre: 'Proteína', cantidad: '4.8 g', vd: '10%' },
      { nombre: 'Sodio', cantidad: '15 mg', vd: '1%' },
      { nombre: 'Vitamina C', cantidad: '60 mg', vd: '100%' },
    ],
    ingredientes: 'Colágeno Marino Hidrolizado (Tipo I & III), Ácido Ascórbico (Vitamina C), Estearato de Magnesio, Dióxido de Silicio.',
    comoTomar: '1. Toma 3 cápsulas al día.\n2. Preferentemente en ayunas o con el desayuno.\n3. Acompañar con un vaso de agua.\n4. Para mejores resultados, combinar con Vitamina C.',
    advertencias: 'Consulta a tu médico antes de consumir si estás embarazada, en periodo de lactancia o tienes alguna condición médica. No exceder la dosis recomendada. Mantener fuera del alcance de los niños.',
    combinaciones: [
      { nombre: 'Omega 3 Platinum', slug: 'omega-3-platinum', motivo: 'Potencia la absorción del colágeno' },
      { nombre: 'Vitamina D3 + K2', slug: 'vitamina-d3-k2', motivo: 'Apoya la salud ósea' },
    ],
    faqs: [
      { pregunta: '¿Cuándo veré resultados?', respuesta: 'Los primeros resultados en piel y uñas se notan a partir de las 4-6 semanas de uso continuo.' },
      { pregunta: '¿Es apto para veganos?', respuesta: 'No, el colágeno marino proviene de pescado. Tenemos opciones vegetales disponibles.' },
      { pregunta: '¿Puedo tomarlo con otros suplementos?', respuesta: 'Sí, se complementa muy bien con Vitamina C, Omega 3 y Biotina.' },
    ],
    certificaciones: ['Sin Gluten', 'Sin GMO', 'GMP Certificado'],
    videos: [
      { id: 'dQw4w9WgXcQ', titulo: 'Colágeno marino: todo lo que necesitas saber', duracion: '10:15' },
    ],
    relacionados: [2, 3, 4],
  },
}

export default function ProductoSuplementoPage() {
  const params = useParams()
  const slug = params.slug as string
  const producto = productos[slug] || productos['colageno-marino']

  return (
    <main style={{ background: 'white' }}>
      <SuplementosHeader />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '80px' }}>
          <ProductoGaleria producto={producto} />
          <SuplementoInfo producto={producto} />
        </div>
        <SuplementoTabs producto={producto} />
      </div>
      <ProductoRelacionados productoIds={producto.relacionados} tipo="suplementos" />
      <ProductoVideos videos={producto.videos} />
      <Footer />
      <LoraChat />
    </main>
  )
}