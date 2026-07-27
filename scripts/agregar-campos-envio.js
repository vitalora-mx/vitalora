const fs = require('fs')
const archivo = 'app/(admin)/admin/codigos/page.tsx'
let c = fs.readFileSync(archivo, 'utf8')

const cambios = [
  {
    nombre: 'inicializar form (linea 18)',
    buscar: `    codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '',`,
    reemplazar: `    codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '',`,
  },
  {
    nombre: 'objeto enviado (linea 41)',
    buscar: `        fecha_fin: form.fecha_fin || null,`,
    reemplazar: `        fecha_fin: form.fecha_fin || null,
        descuento_envio: form.descuento_envio || 'ninguno',
        envio_precio_fijo: form.descuento_envio === 'fijo' && form.envio_precio_fijo ? parseFloat(form.envio_precio_fijo) : 0,
        ciudad_restringida: form.ciudad_restringida ? form.ciudad_restringida.trim() : null,`,
  },
  {
    nombre: 'reset form (linea 46)',
    buscar: `setForm({ codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '' });`,
    reemplazar: `setForm({ codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', max_usos: '', fecha_fin: '', descuento_envio: 'ninguno', envio_precio_fijo: '', ciudad_restringida: '' });`,
  },
  {
    nombre: 'campos visuales del formulario (despues de compra minima)',
    buscar: `              <input type="number" value={form.minimo_compra} onChange={e => setForm({ ...form, minimo_compra: e.target.value })} placeholder="0 = sin mínimo" style={S} />
            </div>`,
    reemplazar: `              <input type="number" value={form.minimo_compra} onChange={e => setForm({ ...form, minimo_compra: e.target.value })} placeholder="0 = sin mínimo" style={S} />
            </div>
            <div>
              <label style={L}>Descuento de envío</label>
              <select value={form.descuento_envio} onChange={e => setForm({ ...form, descuento_envio: e.target.value })} style={S}>
                <option value="ninguno">Ninguno (envío normal)</option>
                <option value="gratis">Envío gratis</option>
                <option value="fijo">Precio fijo</option>
              </select>
            </div>
            {form.descuento_envio === 'fijo' && (
              <div>
                <label style={L}>Precio fijo de envío (MXN)</label>
                <input type="number" value={form.envio_precio_fijo} onChange={e => setForm({ ...form, envio_precio_fijo: e.target.value })} placeholder="Ej: 49" style={S} />
              </div>
            )}
            <div>
              <label style={L}>Restringir a ciudad (opcional)</label>
              <input type="text" value={form.ciudad_restringida} onChange={e => setForm({ ...form, ciudad_restringida: e.target.value })} placeholder="Ej: Irapuato — vacío = todo México" style={S} />
            </div>`,
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
  fs.writeFileSync(archivo, c, 'utf8')
  console.log('OK: los 4 cambios se aplicaron correctamente.')
} else {
  console.log('No se guardo ningun cambio. El archivo quedo intacto.')
}