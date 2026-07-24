const fs = require('fs')

const archivo = 'components/store/CategoriasCarrusel.tsx'

const viejo = `          Explora
        </div>`

const nuevo = `          Cosméticos
        </div>`

let contenido = fs.readFileSync(archivo, 'utf8')

if (!contenido.includes(viejo)) {
  console.log('ERROR: no se encontro el texto original. No se hizo ningun cambio.')
  process.exit(1)
}

contenido = contenido.replace(viejo, nuevo)
fs.writeFileSync(archivo, contenido, 'utf8')
console.log('OK: titulo del carrusel de cosmeticos actualizado.')