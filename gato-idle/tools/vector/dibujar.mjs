// Piloto vectorial: dibuja en SVG (código, sin herramientas de pago) el arte de la cocina y los íconos
// de la interfaz con un solo estilo (contorno grueso café, 2 tonos, colores vivos) y los renderiza a PNG.
// Arte de escena: 8 px por unidad del mundo (el doble que el pixel art), mismas medidas en unidades que
// el PNG de PixelLab al que sustituye, para que el juego no cambie de posiciones.
// Uso: node tools/vector/dibujar.mjs   → src/assets/vector/*.png y src/assets/vector/iconos/*.png
import { mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const OUT = 'src/assets/vector';
mkdirSync(`${OUT}/iconos`, { recursive: true });

// ---- Paleta ----
const K = '#3a2518'; // contorno
const P = {
  naranja: '#f6a44c', naranjaS: '#dc7d2a', crema: '#fff0d6', cremaS: '#f1d3a6', rosa: '#f59ab0', vino: '#8a2f3e',
  gris: '#bfc5d6', grisS: '#8d93aa', blanco: '#ffffff', azul: '#6cc8f5', azulS: '#3f9bd6', azulC: '#dff4ff',
  madera: '#d9a066', maderaS: '#b2733a', maderaC: '#ecc08c', piedra: '#ece6dc', piedraS: '#c9c0b2',
  verde: '#9fd3c1', verdeS: '#7cb8a4', verdeL: '#c7eadf', pasto: '#5ec47a', oro: '#ffc93c', oroS: '#e09a1a',
  rojo: '#ef5a4c', morado: '#8e5bd1', moradoC: '#c9a9f5', amarillo: '#ffe27a', cafe: '#8a5a2b', pizza: '#f4b942',
  uva: '#8e5bd1', uvaC: '#b48af0',
};

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
/** Forma con contorno. */
const o = (d, fill, sw = 6, extra = '') => `<path d="${d}" fill="${fill}" stroke="${K}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
/** Forma sin contorno (sombras, brillos). */
const f = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color = K, sw = 5) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const circ = (cx, cy, r, fill, sw = 6) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${sw ? `stroke="${K}" stroke-width="${sw}"` : ''}/>`;
const ell = (cx, cy, rx, ry, fill, sw = 6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${sw ? `stroke="${K}" stroke-width="${sw}"` : ''}/>`;
const rect = (x, y, w, h, r, fill, sw = 6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${sw ? `stroke="${K}" stroke-width="${sw}"` : ''}/>`;
const g = (transform, body) => `<g transform="${transform}">${body}</g>`;

function render(path, markup) {
  const png = new Resvg(markup, { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } }).render().asPng();
  writeFileSync(path, png);
  console.log(path);
}
const scene = (name, markup) => render(`${OUT}/${name}.png`, markup);
const icon = (name, markup) => render(`${OUT}/iconos/${name}.png`, markup);

// ---- Caras ----
/** Ojos grandes de caricatura: blanco, pupila y brillo. `susto`: pupilas chicas y cejas arriba. */
function eyes(cx, cy, sep, r, susto) {
  const pr = susto ? r * 0.42 : r * 0.58;
  let s = '';
  for (const x of [cx - sep, cx + sep]) {
    s += ell(x, cy, r, r * 1.15, P.blanco, 5);
    s += circ(x + 1, cy + r * 0.15, pr, K, 0);
    s += circ(x + 1 + pr * 0.35, cy + r * 0.15 - pr * 0.4, pr * 0.38, P.blanco, 0);
  }
  if (susto) s += line(`M${cx - sep - r} ${cy - r * 1.6} q${r * 0.9} -${r * 0.6} ${r * 1.9} 0`) + line(`M${cx + sep + r} ${cy - r * 1.6} q-${r * 0.9} -${r * 0.6} -${r * 1.9} 0`);
  return s;
}
const nose = (cx, cy, w) => o(`M${cx - w / 2} ${cy} h${w} l-${w / 2} ${w * 0.7} z`, P.rosa, 4);
const whiskers = (cx, cy, l) => line(`M${cx - l * 0.55} ${cy - 4} l-${l} -4 M${cx - l * 0.55} ${cy + 6} l-${l} 4 M${cx + l * 0.55} ${cy - 4} l${l} -4 M${cx + l * 0.55} ${cy + 6} l${l} 4`, K, 4);
const grape = (x, y) =>
  g(`translate(${x} ${y})`, line('M0 -4 q6 -10 14 -12', K, 4) + circ(-7, 0, 7, P.uva, 5) + circ(7, 0, 7, P.uva, 5) + circ(0, 9, 7, P.uvaC, 5) + circ(-9, -3, 2.2, '#dcc8ff', 0) + circ(5, -3, 2.2, '#dcc8ff', 0));

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

// ---- Íconos de la interfaz (64 × 64) ----
const I = (body) => svg(64, 64, body);
icon('fuerza', I(circ(32, 34, 26, P.naranja) + f('M20 42 a12 12 0 0 1 24 0 a6 6 0 0 1 -12 8 a6 6 0 0 1 -12 -8 z', P.rosa) + circ(18, 24, 6, P.rosa, 0) + circ(28, 17, 6, P.rosa, 0) + circ(40, 17, 6, P.rosa, 0) + circ(49, 25, 6, P.rosa, 0) + line('M4 10 l6 6 M60 10 l-6 6 M32 2 v8', P.oro, 5)));
icon('valor', I(o('M12 24 l10 -14 h20 l10 14 l-20 32 z', P.azul, 5) + f('M16 24 l8 -10 h16 l8 10 z', P.azulC, 'opacity=".8"') + f('M32 56 l-12 -32 h24 z', P.azulS, 'opacity=".6"') + line('M12 24 h40 M22 10 l10 14 l10 -14', K, 4)));
icon('critico', I(o('M12 18 c10 -8 30 -8 40 0 c-8 2 -14 8 -16 16 c-2 -8 -8 -14 -16 -16 c-8 -2 -14 -2 -8 0 z', P.oro, 5) + line('M14 50 l10 -24 M28 54 l6 -26 M44 52 l-6 -24', P.rojo, 7) + line('M14 50 l10 -24 M28 54 l6 -26 M44 52 l-6 -24', '#fff0d6', 2)));
icon('dps', I(o('M32 4 l7 12 l14 -4 l-4 14 l12 7 l-12 7 l4 14 l-14 -4 l-7 12 l-7 -12 l-14 4 l4 -14 l-12 -7 l12 -7 l-4 -14 l14 4 z', P.oro, 5) + circ(32, 32, 12, P.naranja, 4) + circ(32, 32, 5, P.amarillo, 0)));
icon('viral', I(o('M32 4 c4 14 20 20 20 36 a20 20 0 0 1 -40 0 c0 -10 6 -14 8 -22 c4 6 6 8 8 8 c0 -8 2 -16 4 -22 z', P.rojo, 5) + f('M32 30 c2 8 10 10 10 18 a10 10 0 0 1 -20 0 c0 -6 4 -8 6 -12 c2 3 3 3 4 3 z', P.oro)));
icon('gato', I(o('M10 24 l4 -18 l16 12 h4 l16 -12 l4 18 c0 20 -10 32 -22 32 c-12 0 -22 -12 -22 -32 z', P.naranja, 5) + f('M16 22 l2 -8 l8 6 z M48 22 l-2 -8 l-8 6 z', P.rosa) + eyes(32, 32, 9, 5, false) + nose(32, 40, 6) + whiskers(32, 40, 8)));
icon('gatito', I(o('M8 26 l4 -20 l18 14 h4 l18 -14 l4 20 c0 20 -12 30 -24 30 c-12 0 -24 -10 -24 -30 z', P.gris, 5) + f('M14 24 l2 -9 l9 7 z M50 24 l-2 -9 l-9 7 z', P.rosa) + eyes(32, 32, 10, 6, false) + nose(32, 42, 6) + circ(14, 40, 4, P.rosa, 0) + circ(50, 40, 4, P.rosa, 0)));
icon('mejoras', I(circ(32, 44, 14, P.naranja, 5) + circ(14, 30, 7, P.naranja, 5) + circ(26, 18, 7, P.naranja, 5) + circ(40, 18, 7, P.naranja, 5) + circ(52, 30, 7, P.naranja, 5)));
icon('ajustes', I(o('M32 6 l6 2 l2 8 l8 4 l8 -2 l4 6 l-5 6 l0 8 l5 6 l-4 6 l-8 -2 l-8 4 l-2 8 l-6 2 l-6 -2 l-2 -8 l-8 -4 l-8 2 l-4 -6 l5 -6 l0 -8 l-5 -6 l4 -6 l8 2 l8 -4 l2 -8 z', P.grisS, 5) + circ(32, 34, 9, P.piedra, 5)));
icon('pregunta', I(circ(32, 32, 26, P.oro) + line('M22 24 a10 10 0 1 1 14 10 c-3 2 -4 4 -4 8', K, 7) + circ(32, 50, 4.5, K, 0)));
icon('turbo', I(o('M36 4 l-22 32 h14 l-6 24 l24 -34 h-14 z', P.oro, 5) + f('M34 12 l-14 22 h8 z', P.amarillo)));
icon('trofeo', I(o('M18 8 h28 v18 a14 14 0 0 1 -28 0 z', P.oro, 5) + o('M12 12 h6 v12 a8 8 0 0 1 -8 -6 z M52 12 h-6 v12 a8 8 0 0 0 8 -6 z', P.oro, 4) + rect(26, 38, 12, 10, 2, P.oroS, 4) + rect(16, 48, 32, 10, 4, P.maderaS, 4) + f('M22 12 h6 v12 h-6 z', P.amarillo)));
icon('candado', I(o('M18 28 v-8 a14 14 0 0 1 28 0 v8', 'none', 6) + rect(10, 28, 44, 30, 8, P.oro, 5) + circ(32, 41, 5, K, 0) + rect(29, 42, 6, 10, 2, K, 0)));
icon('mano', I(o('M20 60 v-22 l-8 -10 c-2 -4 4 -8 7 -4 l7 8 v-24 a4 4 0 0 1 8 0 v16 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v16 c0 8 -6 12 -14 12 z', P.crema, 5)));
icon('check', I(circ(32, 32, 26, P.pasto) + line('M18 34 l10 10 l18 -22', P.blanco, 8)));
icon('reloj', I(circ(32, 32, 26, P.blanco) + line('M32 32 v-16 M32 32 l12 8', K, 6) + circ(32, 32, 4, P.rojo, 0)));
icon('anuncio', I(rect(6, 12, 52, 40, 10, P.morado) + o('M26 22 l16 10 l-16 10 z', P.blanco, 4)));
icon('canal', I(rect(6, 18, 40, 30, 8, P.rojo) + o('M46 26 l12 -8 v28 l-12 -8 z', P.rojo, 5) + circ(26, 33, 8, P.blanco, 4) + circ(14, 12, 5, P.gris, 4) + circ(28, 10, 6, P.gris, 4)));
icon('laboratorio', I(o('M24 6 h16 v18 l14 26 c2 4 0 8 -4 8 h-36 c-4 0 -6 -4 -4 -8 l14 -26 z', P.azulC, 5) + f('M20 44 h24 l6 10 h-36 z', P.pasto) + circ(30, 40, 3, P.blanco, 0) + rect(20, 4, 24, 6, 3, K, 0)));
icon('trofeo_gris', I(o('M18 8 h28 v18 a14 14 0 0 1 -28 0 z', P.gris, 5) + rect(16, 48, 32, 10, 4, P.grisS, 4) + rect(26, 38, 12, 10, 2, P.grisS, 4)));
icon('susto', I(circ(32, 32, 26, P.amarillo) + eyes(32, 30, 10, 6, true) + ell(32, 46, 6, 7, P.vino, 4)));
icon('mudanza', I(o('M8 30 l24 -20 l24 20 v26 h-48 z', P.rojo, 5) + rect(26, 38, 12, 18, 2, P.maderaS, 4) + f('M12 30 l20 -16 l20 16 v4 h-40 z', '#ff8a7a')));
icon('seguidores', I(circ(22, 24, 10, P.naranja, 5) + o('M6 56 c0 -14 8 -22 16 -22 c8 0 16 8 16 22 z', P.naranja, 5) + circ(44, 22, 8, P.gris, 5) + o('M34 54 c0 -12 6 -18 10 -18 c6 0 14 6 14 18 z', P.gris, 5)));
icon('visualizaciones', I(o('M4 32 c10 -16 46 -16 56 0 c-10 16 -46 16 -56 0 z', P.blanco, 5) + circ(32, 32, 10, P.azul, 4) + circ(32, 32, 4, K, 0)));
console.log('VECTOR-LISTO');
