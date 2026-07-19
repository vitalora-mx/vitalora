const fs = require('fs');

const ruta = 'components/store/Hero.tsx';
let c = fs.readFileSync(ruta, 'utf8');

const viejo = "          textAlign: 'center',\n          zIndex: 10,";
const nuevo = "          textAlign: 'center',\n          zIndex: 20,";

if (c.indexOf(viejo) === -1) {
  console.log('ERROR: no se encontro el bloque promocional');
  process.exit(1);
}

c = c.split(viejo).join(nuevo);
fs.writeFileSync(ruta, c, 'utf8');
console.log('OK - zIndex del bloque promocional subido a 20');
