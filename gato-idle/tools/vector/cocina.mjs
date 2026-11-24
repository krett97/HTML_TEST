// Cocina: gato (6 cuadros), sombrero, gatito, barra, azulejo, piso, ventana, reloj y sus objetos.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, icon, eyes, nose, whiskers, grape } from './lib.mjs';

// ---- Gato (16 × 20.75 unidades → 128 × 166 px) ----
function gato({ golpe = false, saco = false, garra = false } = {}) {
  const W = golpe ? 206 : 128;
  const H = golpe ? 140 : 166;
  // En el golpe el gato se inclina hacia la derecha y estira la pata.
  const bx = golpe ? 70 : 64; // centro del cuerpo
  const by = golpe ? 112 : 128;
  const hx = golpe ? 92 : 64; // centro de la cabeza
  const hy = golpe ? 52 : 62;
  let s = '';
  // cola
  s += o(golpe ? `M${bx - 44} ${by + 10} c-26 -4 -36 -30 -20 -46 c6 -6 16 -4 16 4 c0 8 -8 10 -6 20 c2 10 10 14 18 14 z` : `M${bx - 46} ${by + 14} c-26 -4 -34 -34 -16 -50 c6 -6 16 -2 14 6 c-2 8 -8 10 -6 20 c2 10 10 14 18 14 z`, P.naranja);
  // cuerpo
  s += o(`M${bx - 48} ${by} c-4 -34 20 -52 48 -52 c28 0 52 18 48 52 c-3 22 -16 40 -48 40 c-32 0 -45 -18 -48 -40 z`, P.naranja);
  s += f(`M${bx - 44} ${by + 14} c8 18 24 26 44 26 c20 0 36 -8 44 -26 c-8 12 -24 18 -44 18 c-20 0 -36 -6 -44 -18 z`, P.naranjaS, 'opacity=".6"');
  s += f(`M${bx - 26} ${by + 2} c0 -18 12 -28 26 -28 c14 0 26 10 26 28 c0 18 -10 32 -26 32 c-16 0 -26 -14 -26 -32 z`, P.crema);
  if (saco) {
    // Saco de jefe: solapas negras, camisa y corbata roja.
    s += o(`M${bx - 46} ${by - 6} c2 -30 20 -44 46 -44 l-18 48 l-10 30 c-12 -6 -18 -18 -18 -34 z`, '#2b2a3a', 5);
    s += o(`M${bx + 46} ${by - 6} c-2 -30 -20 -44 -46 -44 l18 48 l10 30 c12 -6 18 -18 18 -34 z`, '#2b2a3a', 5);
    s += f(`M${bx - 12} ${by - 46} h24 l-12 30 z`, P.blanco);
    s += o(`M${bx - 5} ${by - 40} h10 l-2 10 l4 22 l-7 8 l-7 -8 l4 -22 z`, P.rojo, 4);
  }
  // patas
  if (golpe) {
    s += ell(bx - 18, by + 36, 18, 10, P.naranja);
    // brazo estirado con la pata abierta
    s += o(`M${bx + 20} ${by - 10} c30 -14 60 -22 92 -26 c10 -1 12 12 2 14 c-30 6 -58 16 -86 30 z`, P.naranja);
    s += ell(bx + 116, by - 30, 17, 13, P.naranja);
    s += f(`M${bx + 104} ${by - 36} a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0 M${bx + 114} ${by - 40} a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0 M${bx + 124} ${by - 36} a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0`, P.rosa);
    if (garra) s += o(`M${bx + 128} ${by - 38} l18 -12 l-10 16 z M${bx + 130} ${by - 30} l20 -4 l-16 10 z M${bx + 128} ${by - 22} l16 6 l-18 2 z`, '#f3f0ff', 3);
    s += line(`M${bx + 128} ${by - 54} l10 -10 M${bx + 136} ${by - 40} l14 -4 M${bx + 134} ${by - 22} l12 6`, '#fff6cc', 5);
  } else {
    s += ell(bx - 24, by + 36, 18, 10, P.naranja);
    s += ell(bx + 24, by + 36, 18, 10, P.naranja);
    s += line(`M${bx - 32} ${by + 36} v4 M${bx - 24} ${by + 37} v4 M${bx - 16} ${by + 36} v4 M${bx + 16} ${by + 36} v4 M${bx + 24} ${by + 37} v4 M${bx + 32} ${by + 36} v4`, K, 3);
  }
  // orejas
  s += o(`M${hx - 40} ${hy - 26} l6 -36 l30 24 z`, P.naranja);
  s += o(`M${hx + 40} ${hy - 26} l-6 -36 l-30 24 z`, P.naranja);
  s += f(`M${hx - 32} ${hy - 30} l4 -20 l16 14 z`, P.rosa);
  s += f(`M${hx + 32} ${hy - 30} l-4 -20 l-16 14 z`, P.rosa);
  // cabeza
  s += o(`M${hx - 48} ${hy} c0 -30 22 -44 48 -44 c26 0 48 14 48 44 c0 28 -20 42 -48 42 c-28 0 -48 -14 -48 -42 z`, P.naranja);
  s += line(`M${hx - 14} ${hy - 32} l-3 12 M${hx} ${hy - 36} v13 M${hx + 14} ${hy - 32} l3 12`, P.naranjaS, 6);
  s += f(`M${hx - 36} ${hy + 14} c0 -12 10 -18 22 -14 c10 3 14 12 12 20 c-2 8 -10 12 -18 10 c-10 -2 -16 -8 -16 -16 z`, P.crema);
  s += f(`M${hx + 36} ${hy + 14} c0 -12 -10 -18 -22 -14 c-10 3 -14 12 -12 20 c2 8 10 12 18 10 c10 -2 16 -8 16 -16 z`, P.crema);
  // brillo de la frente, rayas de la cola y del lomo, chapitas
  s += f(`M${hx - 30} ${hy - 22} c6 -10 20 -14 34 -10 c-12 0 -24 4 -32 14 z`, '#ffd59a', 'opacity=".8"');
  s += line(`M${bx - 58} ${by - 10} l8 -4 M${bx - 60} ${by - 22} l8 -2`, P.naranjaS, 5);
  s += line(`M${bx + 28} ${by - 34} l10 6 M${bx + 34} ${by - 22} l10 6`, P.naranjaS, 5);
  s += circ(hx - 34, hy + 22, 6, P.rosa, 0);
  s += circ(hx + 34, hy + 22, 6, P.rosa, 0);
  s += eyes(hx, hy + 2, 19, 11, true);
  s += nose(hx, hy + 16, 9);
  s += ell(hx, hy + 27, 6, 4.5, P.vino, 4);
  s += whiskers(hx, hy + 16, 22);
  s += grape(hx + 6, hy - 44);
  return svg(W, H, s);
}
scene('gato', gato());
scene('gato_golpe', gato({ golpe: true }));
scene('gato_garra_golpe', gato({ golpe: true, garra: true }));
scene('gato_saco', gato({ saco: true }));
scene('gato_saco_golpe', gato({ golpe: true, saco: true }));
scene('gato_saco_garra_golpe', gato({ golpe: true, saco: true, garra: true }));
// Sombrero ridículo (copa morada), 12.25 × 10 → 98 × 80, apoyado por el centro de abajo.
scene('sombrero', svg(98, 80, o('M22 70 c-2 -30 0 -50 4 -62 h46 c4 12 6 32 4 62 z', P.morado, 5) + f('M30 16 h34 c3 10 4 26 4 46 h-10 c0 -16 -2 -32 -6 -46 z', P.moradoC, 'opacity=".5"') + rect(22, 50, 54, 14, 4, P.oro, 4) + ell(49, 70, 44, 8, P.morado, 5) + f('M14 70 a35 5 0 0 0 70 0 a35 3 0 0 1 -70 0 z', '#6a3fb0')));

// ---- Gatito bebé (15.5 × 21.75 → 124 × 174; en el juego se dibuja al 60 %) ----
function gatito({ golpe = false } = {}) {
  const W = golpe ? 162 : 124;
  const H = golpe ? 166 : 174;
  const bx = 58, by = golpe ? 118 : 128, hx = 60, hy = golpe ? 56 : 60;
  let s = '';
  s += o(`M${bx - 36} ${by + 6} c-20 -2 -26 -24 -12 -36 c6 -4 12 0 10 6 c-2 6 -6 8 -4 14 c2 8 6 10 6 16 z`, P.gris);
  s += o(`M${bx - 36} ${by} c-2 -26 14 -40 36 -40 c22 0 38 14 36 40 c-2 18 -12 32 -36 32 c-24 0 -34 -14 -36 -32 z`, P.gris);
  s += f(`M${bx - 20} ${by + 2} c0 -14 8 -22 20 -22 c12 0 20 8 20 22 c0 14 -8 26 -20 26 c-12 0 -20 -12 -20 -26 z`, P.blanco);
  s += ell(bx - 18, by + 30, 14, 8, P.gris);
  if (golpe) {
    s += o(`M${bx + 14} ${by - 10} c22 -12 46 -18 72 -20 c8 0 10 10 2 12 c-24 4 -46 12 -68 24 z`, P.gris);
    s += ell(bx + 94, by - 26, 13, 10, P.gris);
  } else {
    s += ell(bx + 18, by + 30, 14, 8, P.gris);
    // biberón
    s += rect(bx + 22, by - 30, 18, 44, 6, P.azulC, 5);
    s += f(`M${bx + 25} ${by - 10} h12 v18 h-12 z`, P.blanco);
    s += rect(bx + 26, by - 42, 10, 14, 4, P.rosa, 4);
  }
  // orejas y cabeza (grandes, de bebé)
  s += o(`M${hx - 44} ${hy - 20} l4 -40 l32 26 z`, P.gris);
  s += o(`M${hx + 44} ${hy - 20} l-4 -40 l-32 26 z`, P.gris);
  s += f(`M${hx - 36} ${hy - 26} l2 -22 l18 16 z`, P.rosa);
  s += f(`M${hx + 36} ${hy - 26} l-2 -22 l-18 16 z`, P.rosa);
  s += o(`M${hx - 52} ${hy + 2} c0 -34 24 -50 52 -50 c28 0 52 16 52 50 c0 30 -22 46 -52 46 c-30 0 -52 -16 -52 -46 z`, P.gris);
  s += f(`M${hx - 30} ${hy + 20} c0 -10 8 -16 18 -14 c8 2 12 8 12 14 c0 10 -8 16 -18 14 c-8 -2 -12 -6 -12 -14 z`, P.blanco);
  s += f(`M${hx + 30} ${hy + 20} c0 -10 -8 -16 -18 -14 c-8 2 -12 8 -12 14 c0 10 8 16 18 14 c8 -2 12 -6 12 -14 z`, P.blanco);
  s += line(`M${hx - 10} ${hy - 40} l-2 12 M${hx + 2} ${hy - 44} v14 M${hx + 14} ${hy - 40} l2 12`, P.grisS, 6);
  s += f(`M${hx - 30} ${hy - 26} c6 -10 20 -14 34 -10 c-12 0 -24 4 -32 14 z`, '#e6eaf5', 'opacity=".9"');
  s += line(`M${bx - 12} ${by - 28} l10 4 M${bx + 2} ${by - 32} l10 4`, P.grisS, 5);
  s += eyes(hx, hy + 4, 20, 13, false);
  s += nose(hx, hy + 22, 8);
  s += line(`M${hx - 6} ${hy + 31} q6 5 12 0`, K, 4);
  s += circ(hx - 34, hy + 24, 6, P.rosa, 0);
  s += circ(hx + 34, hy + 24, 6, P.rosa, 0);
  return svg(W, H, s);
}
scene('aliado_gatito', gatito());
scene('aliado_gatito_golpe', gatito({ golpe: true }));

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
