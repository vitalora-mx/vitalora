const fs = require('fs');

const ruta = 'components/store/Hero.tsx';
let c = fs.readFileSync(ruta, 'utf8');
let n = 0;

// Pares: [viejo, nuevo]
const cambios = [
  // 30% - numero y arco
  ["fontSize: isMobile ? '38px' : '78px', fontWeight: 500, color: '#C9A961'", "fontSize: isMobile ? '54px' : '132px', fontWeight: 500, color: '#C9A961'"],
  ["width: isMobile ? '58px' : '112px', height: isMobile ? '8px' : '14px'", "width: isMobile ? '82px' : '186px', height: isMobile ? '10px' : '20px'"],
  ["top: isMobile ? '-6px' : '-10px', right: isMobile ? '-10px' : '-18px', fontSize: isMobile ? '13px' : '22px'", "top: isMobile ? '-8px' : '-16px', right: isMobile ? '-14px' : '-30px', fontSize: isMobile ? '18px' : '34px'"],

  // 20%
  ["fontSize: isMobile ? '32px' : '64px', fontWeight: 500, color: '#C9A961'", "fontSize: isMobile ? '45px' : '108px', fontWeight: 500, color: '#C9A961'"],
  ["width: isMobile ? '50px' : '94px', height: isMobile ? '7px' : '12px'", "width: isMobile ? '70px' : '156px', height: isMobile ? '9px' : '17px'"],
  ["top: isMobile ? '-5px' : '-8px', right: isMobile ? '-9px' : '-15px', fontSize: isMobile ? '11px' : '18px'", "top: isMobile ? '-7px' : '-13px', right: isMobile ? '-12px' : '-25px', fontSize: isMobile ? '15px' : '28px'"],

  // 10%
  ["fontSize: isMobile ? '27px' : '52px', fontWeight: 500, color: '#C9A961'", "fontSize: isMobile ? '38px' : '88px', fontWeight: 500, color: '#C9A961'"],
  ["width: isMobile ? '42px' : '78px', height: isMobile ? '6px' : '10px'", "width: isMobile ? '60px' : '130px', height: isMobile ? '8px' : '15px'"],
  ["top: isMobile ? '-4px' : '-7px', right: isMobile ? '-8px' : '-13px', fontSize: isMobile ? '10px' : '15px'", "top: isMobile ? '-6px' : '-11px', right: isMobile ? '-11px' : '-22px', fontSize: isMobile ? '13px' : '24px'"],

  // +5% EXTRA
  ["fontSize: isMobile ? '24px' : '46px', fontWeight: 500, color: '#D9A3A0'", "fontSize: isMobile ? '34px' : '78px', fontWeight: 500, color: '#D9A3A0'"],
  ["width: isMobile ? '38px' : '70px', height: isMobile ? '6px' : '9px'", "width: isMobile ? '56px' : '118px', height: isMobile ? '7px' : '14px'"],
  ["top: isMobile ? '-4px' : '-6px', right: isMobile ? '-8px' : '-12px', fontSize: isMobile ? '9px' : '14px'", "top: isMobile ? '-6px' : '-10px', right: isMobile ? '-11px' : '-20px', fontSize: isMobile ? '12px' : '22px'"],
  ["fontSize: isMobile ? '8px' : '11px', letterSpacing: '0.24em', color: '#B08A87'", "fontSize: isMobile ? '11px' : '17px', letterSpacing: '0.24em', color: '#B08A87'"],

  // Separacion entre numeros
  ["gap: isMobile ? '10px' : '4px',", "gap: isMobile ? '14px' : '10px',"],

  // Mover el bloque de numeros mas a la izquierda para que quepan
  ["left: isMobile ? '50%' : '9%',", "left: isMobile ? '50%' : '11%',"],

  // Mover el texto un poco mas a la derecha
  ["left: isMobile ? '50%' : '38%',", "left: isMobile ? '50%' : '42%',"],
];

cambios.forEach(function (par) {
  if (c.indexOf(par[0]) !== -1) {
    c = c.split(par[0]).join(par[1]);
    n++;
  } else {
    console.log('AVISO: no se encontro -> ' + par[0].substring(0, 55));
  }
});

fs.writeFileSync(ruta, c, 'utf8');
console.log('');
console.log('Listo. Cambios aplicados: ' + n + ' de ' + cambios.length);
