const fs = require('fs')
const archivo = 'app/(admin)/admin/codigos/page.tsx'
let c = fs.readFileSync(archivo, 'utf8')

const usaCRLF = c.includes('\r\n')
c = c.replace(/\r\n/g, '\n')

const cambios = [
  {
    nombre: '1. Estado para lista de influencers',
    buscar: `  const [codigos, setCodigos] = useState<Codigo[]>([])`,
    reemplazar: `  const [codigos, setCodigos] = useState<Codigo[]>([])
  const [influencersLista, setInfluencersLista] = useState<{ id: number; nombre: string; codigo: string }[]>([])`,
  },
  {
    nombre: '2. Campo influencer_id en el form inicial',
    buscar: `    codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '',`,
    reemplazar: `    codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '', influencer_id: '',`,
  },
  {
    nombre: '3. Cargar influencers en useEffect',
    buscar: `  useEffect(() => { cargar() }, [])`,
    reemplazar: `  useEffect(() => { cargar(); cargarInfluencers() }, [])

  async function cargarInfluencers() {
    try {
      const res = await fetch('/api/admin/influencers')
      const data = await res.json()
      const lista = (data.influencers || []).filter((i: any) => i.estado === 'aprobado')
      setInfluencersLista(lista.map((i: any) => ({ id: i.id, nombre: i.nombre, codigo: i.codigo })))
    } catch {}
  }`,
  },
  {
    nombre: '4. Incluir es_influencer y influencer_id al enviar',
    buscar: `        ciudad_restringida: form.ciudad_restringida ? form.ciudad_restringida.trim() : null,
      }),`,
    reemplazar: `        ciudad_restringida: form.ciudad_restringida ? form.ciudad_restringida.trim() : null,
        influencer_id: form.influencer_id ? parseInt(form.influencer_id) : null,
        es_influencer: form.influencer_id ? true : false,
      }),`,
  },
]

let ok = true
for (const cambio of cambios) {
  if (!c.includes(cambio.buscar)) {
    console.log('ERROR en: ' + cambio.nombre + ' — no se encontro el texto. NO se modifico nada.')
    ok = false
    break
  }
}

if (ok) {
  for (const cambio of cambios) {
    c = c.replace(cambio.buscar, cambio.reemplazar)
  }
  // Tambien limpiar el influencer_id en el reset del form
  c = c.replace(
    `setForm({ codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '' });`,
    `setForm({ codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '', influencer_id: '' });`
  )
  if (usaCRLF) c = c.replace(/\n/g, '\r\n')
  fs.writeFileSync(archivo, c, 'utf8')
  console.log('OK: logica de influencer agregada al form de codigos.')
} else {
  console.log('No se guardo ningun cambio.')
}