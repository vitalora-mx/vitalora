const fs = require('fs')
const archivo = 'app/(admin)/admin/influencers/page.tsx'
let c = fs.readFileSync(archivo, 'utf8')

const usaCRLF = c.includes('\r\n')
c = c.replace(/\r\n/g, '\n')

// 1) Agregar funcion editarComision despues de la funcion ejecutar
const buscarFn = `  async function ejecutar(accion: string) {
    setProcesando(true)
    await onAccion(inf.id, accion)
    setProcesando(false)
    onClose()
  }`

const nuevoFn = `  async function ejecutar(accion: string) {
    setProcesando(true)
    await onAccion(inf.id, accion)
    setProcesando(false)
    onClose()
  }

  async function editarComision() {
    const tipoRaw = window.prompt('Tipo de comision para ' + inf.nombre + ':\\n\\nEscribe "porcentaje" o "fijo"', 'porcentaje')
    if (tipoRaw === null) return
    const tipo = tipoRaw.trim().toLowerCase()
    if (tipo !== 'porcentaje' && tipo !== 'fijo') {
      window.alert('Debes escribir exactamente "porcentaje" o "fijo".')
      return
    }
    const tipo_comision = tipo === 'fijo' ? 'monto_fijo' : 'porcentaje'
    const mensajeValor = tipo === 'fijo'
      ? 'Monto fijo por cada pieza vendida (ej. 30):'
      : 'Porcentaje de comision (ej. 5, 8, 10):'
    const valorRaw = window.prompt(mensajeValor, '5')
    if (valorRaw === null) return
    const comision_valor = Number(valorRaw)
    if (isNaN(comision_valor) || comision_valor < 0) {
      window.alert('El valor debe ser un numero mayor o igual a 0.')
      return
    }
    if (tipo_comision === 'porcentaje' && comision_valor > 100) {
      window.alert('El porcentaje no puede ser mayor a 100.')
      return
    }
    setProcesando(true)
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inf.id, accion: 'editar_comision', tipo_comision, comision_valor }),
      })
      const data = await res.json()
      if (!res.ok) {
        window.alert(data.error || 'No se pudo actualizar la comision.')
      } else {
        const resumen = tipo_comision === 'monto_fijo'
          ? '$' + comision_valor + ' por pieza'
          : comision_valor + '%'
        window.alert('Comision actualizada: ' + resumen)
        await onAccion(inf.id, 'recargar')
        onClose()
      }
    } catch {
      window.alert('Error al actualizar la comision.')
    }
    setProcesando(false)
  }`

// 2) Agregar el boton antes del boton Eliminar
const buscarBtn = `              {/* Botón eliminar disponible para todos los estados */}`

const nuevoBtn = `              {/* Editar comision (normal / VIP) */}
              <button onClick={editarComision} disabled={procesando}
                style={{ flex: '0 0 auto', padding: '11px 14px', border: '1px solid rgba(201,169,97,0.4)', borderRadius: '6px', background: 'rgba(201,169,97,0.08)', fontSize: '13px', cursor: 'pointer', color: '#B8912F', fontFamily: 'inherit', fontWeight: 500 }}>
                💰 Comisión{inf.tipo_comision === 'monto_fijo' ? ' ($' + inf.comision_valor + '/pza)' : ' (' + (inf.comision_valor ?? 5) + '%)'}
              </button>

              {/* Botón eliminar disponible para todos los estados */}`

let ok = true
if (!c.includes(buscarFn)) { console.log('ERROR: no se encontro la funcion ejecutar.'); ok = false }
if (ok && !c.includes(buscarBtn)) { console.log('ERROR: no se encontro el boton eliminar.'); ok = false }

if (ok) {
  c = c.replace(buscarFn, nuevoFn)
  c = c.replace(buscarBtn, nuevoBtn)
  if (usaCRLF) c = c.replace(/\n/g, '\r\n')
  fs.writeFileSync(archivo, c, 'utf8')
  console.log('OK: boton de comision agregado al admin.')
} else {
  console.log('No se guardo ningun cambio.')
}