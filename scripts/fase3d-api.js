const fs = require('fs')
const archivo = 'app/api/admin/influencers/route.ts'
let c = fs.readFileSync(archivo, 'utf8')

const usaCRLF = c.includes('\r\n')
c = c.replace(/\r\n/g, '\n')

const buscar = `    // ─── APROBAR ───
    if (accion === 'aprobar') {`

const nuevo = `    // ─── EDITAR COMISION (normal / VIP) ───
    if (accion === 'editar_comision') {
      const tipoComision = body.tipo_comision === 'monto_fijo' ? 'monto_fijo' : 'porcentaje'
      const comisionValor = Number(body.comision_valor)

      if (isNaN(comisionValor) || comisionValor < 0) {
        return NextResponse.json({ error: 'El valor de comision debe ser un numero valido mayor o igual a 0' }, { status: 400 })
      }
      if (tipoComision === 'porcentaje' && comisionValor > 100) {
        return NextResponse.json({ error: 'El porcentaje no puede ser mayor a 100' }, { status: 400 })
      }

      const { error: errComision } = await supabase
        .from('influencers')
        .update({ tipo_comision: tipoComision, comision_valor: comisionValor })
        .eq('id', id)

      if (errComision) {
        return NextResponse.json({ error: errComision.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, tipo_comision: tipoComision, comision_valor: comisionValor })
    }

    // ─── APROBAR ───
    if (accion === 'aprobar') {`

if (!c.includes(buscar)) {
  console.log('ERROR: no se encontro el punto de insercion. NO se modifico nada.')
  process.exit(1)
}

c = c.replace(buscar, nuevo)

if (usaCRLF) c = c.replace(/\n/g, '\r\n')

fs.writeFileSync(archivo, c, 'utf8')
console.log('OK: accion editar_comision agregada a la API.')