// Cocina: gato (6 cuadros), sombrero, gatito, barra, azulejo, piso, ventana, reloj y sus objetos.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, icon, eyes, nose, whiskers, grape } from './lib.mjs';

// ---- Gato (16 × 20.75 unidades → 128 × 166 px) ----
// El gato vive en gato.mjs (es el protagonista y lleva más detalle).
// Sombrero ridículo (copa morada), 12.25 × 10 → 98 × 80, apoyado por el centro de abajo.
scene('sombrero', svg(98, 80, o('M22 70 c-2 -30 0 -50 4 -62 h46 c4 12 6 32 4 62 z', P.morado, 5) + f('M30 16 h34 c3 10 4 26 4 46 h-10 c0 -16 -2 -32 -6 -46 z', P.moradoC, 'opacity=".5"') + rect(22, 50, 54, 14, 4, P.oro, 4) + ell(49, 70, 44, 8, P.morado, 5) + f('M14 70 a35 5 0 0 0 70 0 a35 3 0 0 1 -70 0 z', '#6a3fb0')));

// ---- Gatito bebé (15.5 × 21.75 → 124 × 174; en el juego se dibuja al 60 %) ----
// El gatito bebé también vive en gato.mjs (misma cara que el gato).

// ---- Cocina ----
// Barra: 136.25 × 23.25 unidades → 1090 × 186 px. La cubierta es el borde de arriba (ahí se paran).
{
  const W = 1090, H = 186;
  let s = '';
  s += rect(3, 44, W - 6, H - 47, 6, P.madera);
  s += f(`M6 ${H - 22} h${W - 12} v16 h-${W - 12} z`, P.maderaS);
  // puertas y cajones
  const doorW = 136;
  for (let x = 14; x + doorW <= W - 10; x += doorW + 10) {
    s += rect(x, 86, doorW, 78, 8, P.maderaC, 5);
    s += rect(x + 14, 98, doorW - 28, 54, 6, P.madera, 4);
    s += rect(x + doorW / 2 - 14, 118, 28, 8, 4, P.piedraS, 4);
    s += rect(x, 54, doorW, 24, 6, P.maderaC, 5);
    s += rect(x + doorW / 2 - 18, 62, 36, 8, 4, P.piedraS, 4);
  }
  for (let x = 14; x + doorW <= W - 10; x += doorW + 10) s += line(`M${x + 24} 108 h${doorW - 48} M${x + 24} 136 h${doorW - 48}`, P.maderaS, 3);
  s += f(`M3 44 h${W - 6} v10 h-${W - 6} z`, K, 'opacity=".25"');
  // cubierta de piedra
  s += rect(3, 3, W - 6, 40, 8, P.piedra);
  s += f(`M10 30 h${W - 20} v8 h-${W - 20} z`, P.piedraS);
  s += f(`M24 12 h120 v6 h-120 z M300 12 h60 v6 h-60 z M700 12 h160 v6 h-160 z`, P.blanco, 'opacity=".8"');
  scene('mueble_cocina_barra', svg(W, H, s));
}
// Pared: azulejo tipo metro (se repite), 32 × 32 → 256 × 256.
{
  let s = `<rect width="256" height="256" fill="${P.verdeS}"/>`;
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? -64 : 0;
    for (let x = off; x < 256; x += 128) {
      s += `<rect x="${x + 4}" y="${row * 64 + 4}" width="120" height="56" rx="8" fill="${P.verde}"/>`;
      s += `<rect x="${x + 12}" y="${row * 64 + 10}" width="104" height="14" rx="6" fill="${P.verdeL}" opacity=".7"/>`;
    }
  }
  scene('pared_cocina', svg(256, 256, s));
}
// Piso: losetas a cuadros 32 × 32 → 256 × 256.
{
  let s = `<rect width="256" height="256" fill="${P.piedraS}"/>`;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const light = (x + y) % 2 === 0;
    s += `<rect x="${x * 64 + 3}" y="${y * 64 + 3}" width="58" height="58" rx="6" fill="${light ? P.piedra : '#b4a898'}"/>`;
    if (light) s += `<rect x="${x * 64 + 10}" y="${y * 64 + 8}" width="30" height="8" rx="4" fill="${P.blanco}" opacity=".6"/>`;
  }
  scene('piso_cocina', svg(256, 256, s));
}
// Ventana con cortinas amarillas 41.25² → 330 × 330.
{
  let s = '';
  s += rect(60, 24, 210, 250, 10, P.blanco);
  s += rect(76, 40, 178, 218, 6, P.azul, 5);
  s += f('M76 40 h178 v120 h-178 z', P.azulC, 'opacity=".55"');
  s += f('M100 90 a16 16 0 0 1 30 -6 a14 14 0 0 1 24 8 a10 10 0 0 1 -4 18 h-50 a10 10 0 0 1 0 -20 z M170 150 a12 12 0 0 1 22 -4 a10 10 0 0 1 18 6 a8 8 0 0 1 -2 14 h-40 a8 8 0 0 1 2 -16 z', P.blanco);
  s += line('M165 40 v218 M76 150 h178', P.blanco, 10);
  s += line('M165 40 v218 M76 150 h178', K, 4);
  s += rect(44, 266, 242, 22, 6, P.piedra);
  // barra de cortina y cortinas
  s += rect(20, 8, 290, 12, 6, P.maderaS, 5);
  s += circ(18, 14, 10, P.madera, 5); s += circ(312, 14, 10, P.madera, 5);
  s += o('M40 20 h58 c0 60 10 110 -6 160 c-4 12 6 30 2 60 c0 10 -46 10 -54 0 c6 -40 -6 -70 0 -110 c4 -40 0 -70 0 -110 z', P.oro);
  s += o('M290 20 h-58 c0 60 -10 110 6 160 c4 12 -6 30 -2 60 c0 10 46 10 54 0 c-6 -40 6 -70 0 -110 c-4 -40 0 -70 0 -110 z', P.oro);
  s += f('M52 30 c0 60 8 100 -2 150 c8 4 16 4 24 0 c-10 -50 -4 -90 -2 -150 z', P.amarillo, 'opacity=".7"');
  s += f('M278 30 c0 60 -8 100 2 150 c-8 4 -16 4 -24 0 c10 -50 4 -90 2 -150 z', P.amarillo, 'opacity=".7"');
  s += rect(32, 172, 54, 20, 10, P.oroS, 5);
  s += rect(244, 172, 54, 20, 10, P.oroS, 5);
  scene('ventana_cocina', svg(330, 330, s));
}
// Reloj de pared 25² → 200 × 200.
{
  let s = circ(100, 100, 90, P.maderaS) + circ(100, 100, 74, P.blanco, 5);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const big = i % 3 === 0;
    s += line(`M${100 + Math.sin(a) * 62} ${100 - Math.cos(a) * 62} L${100 + Math.sin(a) * (big ? 48 : 54)} ${100 - Math.cos(a) * (big ? 48 : 54)}`, K, big ? 7 : 4);
  }
  s += line('M100 100 L100 56', K, 9) + line('M100 100 L132 118', K, 9) + circ(100, 100, 7, P.rojo, 4);
  s += f('M60 56 a56 56 0 0 1 40 -16 v10 a46 46 0 0 0 -32 12 z', '#ffffff', 'opacity=".9"');
  scene('cuadro_cocina', svg(200, 200, s));
}
// Objetos de la barra.
scene('obj_vaso', svg(64, 108, o('M10 8 h44 l-6 92 h-32 z', P.azulC, 5) + f('M16 50 h32 l-4 46 h-24 z', P.azul) + f('M36 50 h12 l-4 46 h-10 z', P.azulS) + f('M17 16 h7 l-3 70 h-7 z', P.blanco, 'opacity=".8"') + ell(32, 50, 17, 4, P.azulC, 4)));
scene('obj_taza', svg(84, 112, o('M52 44 c20 -4 26 10 24 26 c-2 14 -12 20 -26 18', P.rojo, 5) + o('M8 36 h56 c0 32 -4 70 -28 70 c-24 0 -28 -38 -28 -70 z', P.rojo, 5) + f('M14 42 h44 c0 26 -4 58 -22 58 c-18 0 -22 -32 -22 -58 z', '#ffb3a7', 'opacity=".35"') + ell(36, 36, 28, 8, '#6b3b2a', 5) + ell(36, 36, 20, 4, '#b06a4a', 0) + line('M26 24 q6 -8 0 -16 M40 22 q6 -8 0 -16', '#cfd6e6', 4)));
scene('obj_plato', svg(128, 96, ell(64, 70, 60, 20, P.blanco) + ell(64, 68, 44, 12, P.azulC, 0) + o('M30 60 l40 -48 l30 50 z', P.pizza, 5) + f('M38 58 l32 -38 l24 40 z', '#f08a3c') + circ(60, 42, 6, P.rojo, 3) + circ(76, 52, 6, P.rojo, 3) + circ(54, 56, 5, P.rojo, 3) + o('M30 60 l40 -48 c8 2 10 8 4 12 l-36 40 z', '#e9a94a', 4)));
scene('obj_tostadora', svg(120, 116, rect(28, 20, 24, 50, 6, P.madera, 5) + rect(66, 14, 24, 56, 6, P.madera, 5) + f('M34 30 h12 v30 h-12 z M72 24 h12 v36 h-12 z', P.cafe, 'opacity=".35"') + o('M8 60 h104 c4 0 6 2 6 6 v40 c0 4 -2 6 -6 6 h-104 c-4 0 -6 -2 -6 -6 v-40 c0 -4 2 -6 6 -6 z', P.gris, 5) + f('M12 64 h96 v10 h-96 z', P.blanco, 'opacity=".7"') + rect(22, 54, 30, 12, 4, K, 0) + rect(66, 54, 30, 12, 4, K, 0) + rect(96, 80, 14, 8, 3, K, 0) + circ(22, 94, 7, P.rojo, 4) + rect(10, 106, 100, 8, 3, P.grisS, 4)));
