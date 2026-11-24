// Objetos de la mansión (jarrón, busto, placa, armadura, piano, palomitas, proyector, sillón, flotador,
// sombrilla, dron, jetski). Cada uno se apoya en el borde de abajo del lienzo y ocupa casi todo el lienzo;
// los tamaños son los que el juego usa para colocarlos: no cambiarlos. Mismo estilo que objetos.mjs.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, icon, eyes, nose, whiskers, grape } from './lib.mjs';

// ---- Colores extra (planos y vivos) ----
const C = {
  negro: '#3b3b4a', negroS: '#2b2a3a', negroC: '#565670', pink: '#e87a95', rojoS: '#c23b30', amarilloS: '#e6c24a',
  azulO: '#2a6fa8', vinoS: '#6a2230', ciruela: '#5a3d6e', ciruelaS: '#3f2a50', ciruelaC: '#7a5a90', lila: '#b9a6d6',
  acero: '#d7dbe6', aceroS: '#aab1c4', humo: '#e7eef2', humoS: '#c3cfd8', marmol: '#f4f0e8', marmolS: '#d9d1c4',
  oroC: '#ffe9a0', hule: '#4a4a5a', cuerno: '#ffd15c',
};
const BL = P.blanco;
/** Contorno solo (para repintar el borde encima de los rellenos interiores). */
const borde = (x, y, w, h, r, sw = 5) => rect(x, y, w, h, r, 'none', sw);
const clipR = (id, x, y, w, h, r) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>`;
const clipP = (id, d) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
const clipped = (id, body) => `<g clip-path="url(#${id})">${body}</g>`;
const brillo = (x, y, w, h, op = 0.5) => rect(x, y, w, h, Math.min(w, h) / 2, BL, 0).replace('/>', ` opacity="${op}"/>`);
function star(cx, cy, r, fill = P.oro, sw = 3) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return o(d + 'z', fill, sw);
}
const RAINBOW = ['#ef5a4c', '#f6a44c', '#ffe27a', '#5ec47a', '#6cc8f5', '#8e5bd1'];

// ---- jarron 104 × 208: jarrón chino azul y blanco con etiqueta de precio ----
{
  let s = '';
  const cuerpo = 'M36 58 C0 72 -2 150 30 188 h44 C106 150 104 72 68 58 z';
  // pie
  s += rect(26, 186, 52, 19, 7, P.azulS, 5);
  s += f('M32 194 h40 v4 a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 z', C.azulO);
  // cuello
  s += o('M36 16 h32 v44 c0 8 -32 8 -32 0 z', BL, 5);
  // cuerpo
  s += o(cuerpo, BL, 5);
  s += clipP('jar', cuerpo);
  let dec = '';
  dec += f('M66 60 c30 20 30 90 4 128 h6 c30 -40 28 -110 -4 -130 z', P.piedraS, 'opacity=".9"');
  // olas azules abajo
  dec += f('M0 160 c10 -10 16 -10 26 0 c10 -10 16 -10 26 0 c10 -10 16 -10 26 0 c10 -10 16 -10 26 0 v40 h-104 z', P.azulS);
  dec += f('M0 172 c10 -8 16 -8 26 0 c10 -8 16 -8 26 0 c10 -8 16 -8 26 0 c10 -8 16 -8 26 0 v30 h-104 z', C.azulO);
  // banda alta
  dec += f('M0 64 h104 v10 h-104 z', P.azulS);
  // medallón con flor
  dec += circ(50, 118, 26, P.azulS, 4) + circ(50, 118, 19, BL, 0);
  for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; dec += circ(50 + Math.cos(a) * 10, 118 + Math.sin(a) * 10, 5.5, P.azulS, 0); }
  dec += circ(50, 118, 5, C.azulO, 0);
  dec += line('M14 92 c6 -4 10 -2 14 2 M74 96 c6 -4 10 -2 14 2', P.azulS, 3.5);
  s += clipped('jar', dec);
  s += brillo(14, 92, 8, 52, 0.7);
  s += o(cuerpo, 'none', 5);
  // anillos del cuello
  s += f('M38 24 h28 v6 h-28 z M38 40 h28 v5 h-28 z', P.azulS);
  s += line('M44 32 c3 -3 6 -3 9 0 c3 -3 6 -3 9 0', P.azulS, 2.5);
  // boca
  s += rect(29, 5, 46, 14, 6, BL, 5);
  s += f('M34 14 h36 v2 a3 3 0 0 1 -3 3 h-30 a3 3 0 0 1 -3 -3 z', P.azulS);
  // etiqueta de precio colgando del cuello
  s += line('M70 36 c8 14 10 30 14 44', K, 3.5);
  s += g('translate(84 98) rotate(10)', o('M-12 -18 h18 l6 6 v30 h-24 z', P.rojo, 4) + f('M2 -18 l4 4 h-6 v-4 z M-8 12 h16 v4 h-16 z', C.rojoS) + circ(-4, -10, 2.5, BL, 0) + line('M-6 0 h8 M-6 6 h6', BL, 2.5));
  scene('obj_jarron', svg(104, 208, s));
}

// ---- busto 104 × 200: busto de mármol con lentes oscuros ----
{
  let s = '';
  // pedestal
  s += rect(20, 168, 64, 29, 6, P.gris, 5);
  s += f('M26 186 h52 v4 a4 4 0 0 1 -4 4 h-44 a4 4 0 0 1 -4 -4 z', P.grisS);
  s += rect(14, 160, 76, 14, 5, P.gris, 5);
  s += brillo(22, 164, 20, 4, 0.6);
  // hombros y cuello
  s += o('M12 162 c0 -26 18 -40 40 -42 c22 2 40 16 40 42 z', C.marmol, 5);
  s += f('M62 124 c14 4 24 16 26 36 h-10 c-2 -16 -8 -28 -16 -36 z', C.marmolS);
  // toga doblada al hombro izquierdo
  s += o('M12 162 c2 -20 12 -34 30 -40 c-2 14 -2 28 4 40 z', C.marmolS, 4);
  s += line('M22 150 c4 -12 8 -20 14 -26', BL, 3);
  s += o('M38 104 h28 v26 c-8 4 -20 4 -28 0 z', C.marmol, 5);
  s += f('M56 106 h8 v24 c-3 1 -5 1 -8 1 z', C.marmolS);
  // cabeza
  s += ell(52, 72, 35, 40, C.marmol, 5);
  s += f('M70 40 c14 14 16 44 2 62 c-4 6 -10 8 -16 8 c16 -10 22 -38 8 -62 z', C.marmolS, 'opacity=".8"');
  // orejas
  s += ell(17, 76, 6, 9, C.marmol, 4) + ell(87, 76, 6, 9, C.marmol, 4);
  // pelo esculpido con copete
  s += o('M16 70 c-4 -36 14 -62 42 -62 c26 0 42 22 40 62 c-4 -16 -10 -26 -22 -30 c-6 8 -14 10 -22 6 c-8 -4 -10 -10 -8 -16 c-16 4 -26 20 -30 40 z', C.marmolS, 5);
  s += f('M22 66 c0 -22 12 -40 28 -46 c-10 10 -14 24 -14 36 c-6 2 -10 6 -14 10 z', BL, 'opacity=".55"');
  s += line('M58 20 c10 2 18 10 22 22 M44 24 c-8 6 -12 14 -14 22', BL, 3);
  // lentes oscuros
  s += line('M18 68 h20 M66 68 h20', K, 4);
  s += rect(24, 60, 26, 20, 8, C.negro, 4) + rect(54, 60, 26, 20, 8, C.negro, 4);
  s += line('M50 66 h4', K, 4);
  s += f('M28 64 h8 v3 h-8 z M58 64 h8 v3 h-8 z', BL, 'opacity=".6"');
  // nariz y boca sonriente
  s += line('M52 82 c4 4 4 8 -2 10', K, 3.5);
  s += line('M42 100 q10 7 20 0', K, 3.5);
  scene('obj_busto', svg(104, 200, s));
}

// ---- placaoro 140 × 176: placa dorada de 1M suscriptores (botón de play) ----
{
  let s = '';
  s += rect(4, 4, 132, 169, 10, P.oroS, 5);
  s += f('M10 150 h120 v12 a6 6 0 0 1 -6 6 h-108 a6 6 0 0 1 -6 -6 z', '#b8780e');
  s += rect(16, 16, 108, 146, 6, P.oro, 5);
  s += f('M22 22 h96 v10 h-96 z', C.oroC, 'opacity=".8"');
  // botón de play
  s += rect(40, 34, 60, 60, 14, P.oroS, 5);
  s += f('M46 76 h48 v6 a8 8 0 0 1 -8 8 h-32 a8 8 0 0 1 -8 -8 z', '#b8780e');
  s += o('M60 48 l26 16 l-26 16 z', C.oroC, 4);
  s += brillo(46, 40, 20, 5, 0.6);
  // placa de nombre (sin texto) con una estrella
  s += rect(32, 106, 76, 40, 6, P.oroS, 5);
  s += f('M38 136 h64 v4 a4 4 0 0 1 -4 4 h-56 a4 4 0 0 1 -4 -4 z', '#b8780e');
  s += star(50, 126, 9, C.oroC, 3);
  s += line('M66 120 h30 M66 130 h22', '#b8780e', 4);
  // tornillos
  for (const [x, y] of [[26, 26], [114, 26], [26, 152], [114, 152]]) s += circ(x, y, 4.5, P.gris, 3) + line(`M${x - 2} ${y} h4`, K, 2);
  s += brillo(10, 12, 6, 70, 0.5);
  scene('obj_placaoro', svg(140, 176, s));
}

// ---- armadura 184 × 368: armadura medieval con un gatito en el brazo ----
{
  let s = '';
  const AC = C.acero, ACS = C.aceroS;
  // capa roja detrás
  s += o('M52 96 c-20 60 -26 160 -14 236 h108 c12 -76 6 -176 -14 -236 z', P.rojo, 5);
  s += f('M118 100 c18 60 22 150 12 230 h-20 c12 -80 10 -170 -8 -230 z', C.rojoS);
  // botas
  s += rect(50, 320, 44, 44, 12, ACS, 5) + rect(90, 320, 44, 44, 12, ACS, 5);
  s += f('M56 348 h32 v6 a6 6 0 0 1 -6 6 h-20 a6 6 0 0 1 -6 -6 z M96 348 h32 v6 a6 6 0 0 1 -6 6 h-20 a6 6 0 0 1 -6 -6 z', C.negroC);
  // piernas
  s += rect(56, 214, 34, 112, 14, AC, 5) + rect(94, 214, 34, 112, 14, AC, 5);
  s += f('M76 220 h8 v100 h-8 z M114 220 h8 v100 h-8 z', ACS);
  s += circ(73, 272, 14, AC, 4) + circ(111, 272, 14, AC, 4);
  s += f('M64 266 a9 9 0 0 1 9 -6 v4 a5 5 0 0 0 -5 4 z M102 266 a9 9 0 0 1 9 -6 v4 a5 5 0 0 0 -5 4 z', BL, 'opacity=".7"');
  // faldón y cinturón
  s += o('M52 200 h80 l6 30 c-18 8 -74 8 -92 0 z', ACS, 5);
  s += line('M72 206 l-2 22 M92 206 v22 M112 206 l2 22', K, 3);
  s += rect(50, 192, 84, 16, 5, P.cafe, 5);
  s += rect(82, 190, 20, 20, 4, P.oro, 4);
  // pecho
  s += o('M52 100 h80 c8 36 6 70 -6 100 h-68 c-12 -30 -14 -64 -6 -100 z', AC, 5);
  s += f('M106 104 h26 c6 34 4 66 -6 94 h-20 c10 -28 12 -60 0 -94 z', ACS);
  s += line('M92 110 v84', K, 3);
  s += brillo(60, 110, 8, 60, 0.55);
  // brazo derecho (del lado del espectador derecho) colgando
  s += rect(128, 120, 30, 76, 14, AC, 5);
  s += f('M146 126 h7 v64 h-7 z', ACS);
  s += circ(146, 206, 16, ACS, 5) + line('M140 206 h12', K, 3);
  // brazo izquierdo doblado hacia adelante, sosteniendo al gatito
  s += rect(26, 120, 30, 60, 14, AC, 5);
  s += f('M30 126 h7 v50 h-7 z', ACS);
  s += rect(24, 170, 70, 26, 13, AC, 5);
  s += f('M30 184 h56 v2 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 z', ACS);
  s += circ(90, 184, 15, ACS, 5) + line('M84 182 h10', K, 3);
  // gatito
  let gato = '';
  gato += o('M-22 -10 l6 -26 l20 14 z', P.naranja, 4) + o('M22 -10 l-6 -26 l-20 14 z', P.naranja, 4);
  gato += f('M-16 -14 l3 -12 l10 8 z M16 -14 l-3 -12 l-10 8 z', P.rosa);
  gato += o('M-26 0 c0 -18 12 -26 26 -26 c14 0 26 8 26 26 c0 16 -12 24 -26 24 c-14 0 -26 -8 -26 -24 z', P.naranja, 4);
  gato += f('M-18 8 c0 -6 6 -10 12 -8 c4 2 6 6 6 10 c-2 4 -6 6 -10 4 c-4 -2 -8 -3 -8 -6 z M18 8 c0 -6 -6 -10 -12 -8 c-4 2 -6 6 -6 10 c2 4 6 6 10 4 c4 -2 8 -3 8 -6 z', P.crema);
  gato += line('M-10 -16 l-2 8 M0 -18 v8 M10 -16 l2 8', P.naranjaS, 4);
  gato += eyes(0, 2, 10, 5.5, false) + nose(0, 9, 5) + line('M-4 15 q4 4 8 0', K, 3) + whiskers(0, 10, 11);
  s += g('translate(44 150)', gato);
  // hombreras
  s += ell(44, 110, 26, 18, AC, 5) + ell(140, 110, 26, 18, AC, 5);
  s += f('M140 96 c14 0 22 8 22 16 c-2 6 -8 10 -16 10 c6 -10 4 -20 -6 -26 z', ACS);
  s += brillo(26, 104, 16, 6, 0.6) + brillo(122, 104, 16, 6, 0.6);
  // bufanda roja
  s += o('M54 84 c20 -10 56 -10 76 0 c4 6 4 14 0 20 c-20 8 -56 8 -76 0 c-4 -6 -4 -14 0 -20 z', P.rojo, 5);
  s += o('M54 96 c-4 20 -10 36 -22 56 c8 2 14 2 20 -2 c10 -18 12 -34 12 -52 z', P.rojo, 5);
  s += f('M108 90 c8 1 16 2 22 4 c2 4 2 8 0 12 c-6 2 -14 3 -22 4 c6 -6 6 -14 0 -20 z M58 104 c-4 16 -8 28 -16 44 h-4 c8 -16 12 -30 14 -46 z', C.rojoS);
  // yelmo
  s += o('M54 46 c0 -24 16 -40 38 -40 c22 0 38 16 38 40 v38 c-24 6 -52 6 -76 0 z', AC, 5);
  s += f('M106 10 c14 6 24 20 24 36 v36 c-6 2 -12 3 -18 4 c4 -26 6 -50 -6 -76 z', ACS);
  s += o('M64 50 c0 -16 12 -26 28 -26 c16 0 28 10 28 26 v14 h-56 z', C.negroS, 4);
  s += line('M70 72 h44 M70 80 h44', K, 3.5);
  s += f('M70 44 c2 -8 10 -14 18 -14 v6 c-6 0 -12 4 -14 10 z', BL, 'opacity=".35"');
  s += brillo(60, 20, 8, 30, 0.55);
  s += rect(84, 4, 16, 20, 6, P.rojo, 4);
  scene('obj_armadura', svg(184, 368, s));
}

// ---- piano 296 × 332: piano de cola negro con la tapa abierta ----
{
  let s = '';
  const N = C.negro, NS = C.negroS;
  // patas y ruedas
  for (const [x, y] of [[36, 236], [146, 250], [238, 236]]) {
    s += rect(x, y, 24, 84, 6, N, 5);
    s += f(`M${x + 14} ${y + 4} h5 v76 h-5 z`, NS);
    s += circ(x + 12, 318, 10, P.grisS, 4) + circ(x + 12, 318, 3, N, 0);
  }
  // lira y pedales
  s += rect(126, 256, 44, 46, 6, N, 5);
  s += line('M148 262 v30', NS, 5);
  s += rect(114, 296, 20, 10, 4, P.oro, 4) + rect(138, 298, 20, 10, 4, P.oro, 4) + rect(162, 296, 20, 10, 4, P.oro, 4);
  // tapa abierta (vista por debajo) y su interior
  const tapa = 'M70 150 L230 24 L288 70 L288 150 z';
  s += o(tapa, N, 5);
  s += f('M86 146 L226 38 L278 78 L278 146 z', P.vino);
  s += f('M240 76 L278 106 L278 146 h-10 L240 110 z', C.vinoS);
  s += line('M112 134 L220 50 M140 142 L250 60', P.oro, 3.5);
  s += line('M112 134 L220 50 M140 142 L250 60', C.oroC, 1.5);
  s += f('M232 36 L252 52 L246 58 L228 44 z', BL, 'opacity=".3"');
  s += o(tapa, 'none', 5);
  // bastón de la tapa
  s += line('M200 150 L246 62', K, 10) + line('M200 150 L246 62', P.maderaS, 5);
  // cuerpo
  const cuerpo = 'M20 150 h186 c48 0 82 22 82 54 v44 c0 6 -4 10 -10 10 h-258 c-6 0 -10 -4 -10 -10 v-88 c0 -6 4 -10 10 -10 z';
  s += o(cuerpo, N, 5);
  s += f('M30 236 h248 c2 8 -2 16 -10 18 h-230 c-8 -2 -10 -10 -8 -18 z', NS);
  s += f('M230 156 c36 4 54 22 54 50 v40 h-12 v-40 c0 -22 -14 -40 -42 -50 z', NS);
  s += brillo(28, 158, 170, 8, 0.25);
  s += f('M26 180 h14 v60 h-14 z', BL, 'opacity=".12"');
  // atril
  s += rect(96, 128, 72, 24, 4, NS, 5) + line('M104 136 h56 M104 144 h40', C.negroC, 3);
  // teclado
  s += rect(20, 192, 190, 16, 4, NS, 4);
  s += rect(14, 200, 202, 38, 6, BL, 5);
  s += f('M20 226 h190 v4 a4 4 0 0 1 -4 4 h-182 a4 4 0 0 1 -4 -4 z', P.piedraS);
  for (let x = 32; x < 208; x += 12) s += line(`M${x} 206 v28`, P.piedraS, 2);
  for (let i = 0; i < 15; i++) { if (i % 7 === 2 || i % 7 === 6) continue; s += rect(29 + i * 12, 203, 7, 18, 2, N, 0); }
  s += borde(14, 200, 202, 38, 6);
  s += rect(14, 232, 202, 12, 4, N, 4);
  scene('obj_piano', svg(296, 332, s));
}

// ---- palomitas 204 × 328: carrito de palomitas rojo ----
{
  let s = '';
  // ruedas
  s += circ(56, 282, 40, P.rojo, 5);
  for (let i = 0; i < 4; i++) s += g(`rotate(${i * 45} 56 282)`, line('M56 248 v68', K, 4));
  s += circ(56, 282, 9, P.oro, 4);
  s += circ(160, 296, 26, P.rojo, 5);
  for (let i = 0; i < 4; i++) s += g(`rotate(${i * 45} 160 296)`, line('M160 274 v44', K, 4));
  s += circ(160, 296, 6, P.oro, 4);
  // eje
  s += rect(50, 266, 116, 12, 5, C.negro, 5);
  // asa
  s += line('M172 236 c16 -6 22 -20 24 -36', K, 11) + line('M172 236 c16 -6 22 -20 24 -36', P.maderaS, 5);
  // base del carrito
  s += rect(18, 184, 168, 92, 12, P.rojo, 5);
  s += f('M24 250 h156 v12 a8 8 0 0 1 -8 8 h-140 a8 8 0 0 1 -8 -8 z', C.rojoS);
  s += f('M140 190 h40 v70 h-40 z', C.rojoS, 'opacity=".5"');
  s += rect(44, 204, 72, 36, 6, C.rojoS, 4);
  s += rect(66, 218, 28, 8, 4, P.oro, 3);
  s += brillo(26, 190, 60, 7, 0.4);
  s += rect(18, 176, 168, 18, 6, P.maderaS, 5);
  // vitrina de cristal con palomitas
  s += rect(26, 72, 152, 110, 6, P.azulC, 5);
  s += clipR('vit', 28, 74, 148, 106, 4);
  let pal = '';
  pal += f('M20 180 c24 -60 48 -78 82 -78 c34 0 54 22 76 78 z', P.oro);
  pal += f('M120 108 c30 6 42 30 56 72 h-50 c0 -30 -2 -52 -6 -72 z', P.oroS, 'opacity=".7"');
  const pops = [[60, 150], [84, 128], [108, 112], [132, 132], [150, 158], [72, 170], [118, 160], [96, 146], [52, 174], [140, 176]];
  for (const [x, y] of pops) pal += circ(x, y, 9, P.amarillo, 3) + circ(x - 5, y + 3, 6, P.crema, 0) + circ(x + 5, y + 3, 6, P.crema, 0) + circ(x, y - 4, 6, P.crema, 0);
  s += clipped('vit', pal);
  s += f('M34 80 h22 v60 h-14 z', BL, 'opacity=".45"');
  s += borde(26, 72, 152, 110, 6);
  s += rect(26, 64, 152, 14, 5, P.rojo, 5);
  // postes
  s += rect(24, 64, 12, 118, 4, C.rojoS, 4) + rect(168, 64, 12, 118, 4, C.rojoS, 4);
  // techo con festón
  s += o('M10 70 c0 -34 42 -52 92 -52 c50 0 92 18 92 52 z', P.rojo, 5);
  s += f('M140 26 c30 6 50 22 52 44 h-20 c-2 -20 -14 -36 -32 -44 z', C.rojoS);
  s += brillo(30, 36, 40, 7, 0.45);
  for (let i = 0; i < 8; i++) s += ell(21 + i * 23, 70, 11.5, 8, i % 2 ? BL : P.rojo, 4);
  s += circ(102, 12, 7, P.oro, 4);
  scene('obj_palomitas', svg(204, 328, s));
}

// ---- proyector 224 × 120: proyector de cine con haz de luz ----
{
  let s = '';
  // haz de luz
  s += f('M56 72 L4 34 L4 110 z', P.amarillo, 'opacity=".55"');
  s += f('M56 72 L4 52 L4 92 z', BL, 'opacity=".5"');
  // patas
  s += rect(82, 106, 22, 10, 4, C.ciruelaS, 4) + rect(186, 106, 22, 10, 4, C.ciruelaS, 4);
  // cuerpo
  s += rect(60, 30, 158, 82, 14, C.ciruela, 5);
  s += f('M66 92 h146 v8 a8 8 0 0 1 -8 8 h-130 a8 8 0 0 1 -8 -8 z', C.ciruelaS);
  s += f('M160 34 h54 v70 h-54 z', C.ciruelaS, 'opacity=".5"');
  s += brillo(70, 36, 80, 8, 0.3);
  // rejillas y botones
  s += line('M172 48 h32 M172 58 h32 M172 68 h32 M172 78 h32', C.ciruelaS, 4);
  s += circ(140, 44, 5, P.rojo, 3) + circ(154, 44, 5, P.pasto, 3);
  s += rect(120, 60, 34, 26, 6, C.ciruelaS, 4) + line('M128 68 h18 M128 76 h12', C.lila, 3);
  // asa arriba
  s += rect(100, 14, 70, 22, 10, C.ciruela, 5);
  s += f('M106 18 h58 v5 h-58 z', C.lila, 'opacity=".5"');
  // lente
  s += circ(62, 72, 30, C.ciruelaC, 5);
  s += circ(62, 72, 22, C.negro, 4);
  s += circ(62, 72, 15, P.azulS, 0) + circ(62, 72, 9, P.azul, 0);
  s += f('M50 62 a14 14 0 0 1 12 -6 v6 a8 8 0 0 0 -7 4 z', BL, 'opacity=".8"');
  s += circ(66, 76, 3, BL, 0);
  scene('obj_proyector', svg(224, 120, s));
}

// ---- sillon 272 × 272: sillón de cine rojo con portavasos ----
{
  let s = '';
  const R = P.rojo, RS = C.rojoS;
  // respaldo
  s += rect(46, 6, 180, 180, 28, R, 5);
  s += f('M52 20 h40 c10 0 10 10 0 10 h-40 c-10 0 -10 -10 0 -10 z', BL, 'opacity=".25"');
  s += rect(66, 24, 140, 60, 16, RS, 4);
  s += line('M88 44 h32 M152 44 h32 M118 60 q18 10 36 0', R, 5);
  s += rect(66, 96, 140, 60, 16, RS, 4);
  s += line('M136 102 v48', R, 5);
  // asiento
  s += rect(36, 150, 200, 56, 18, R, 5);
  s += f('M44 186 h184 v6 a8 8 0 0 1 -8 8 h-168 a8 8 0 0 1 -8 -8 z', RS);
  s += line('M136 156 v40', RS, 5);
  s += brillo(50, 158, 60, 8, 0.3);
  // base
  s += rect(22, 200, 228, 66, 16, R, 5);
  s += f('M30 244 h212 v8 a8 8 0 0 1 -8 8 h-196 a8 8 0 0 1 -8 -8 z', RS);
  s += line('M40 224 h190', RS, 5);
  // brazos
  s += rect(4, 116, 60, 110, 24, R, 5) + rect(208, 116, 60, 110, 24, R, 5);
  s += f('M12 196 h44 c0 10 -8 16 -16 16 h-12 c-8 0 -16 -6 -16 -16 z M216 196 h44 c0 10 -8 16 -16 16 h-12 c-8 0 -16 -6 -16 -16 z', RS);
  s += brillo(12, 122, 14, 36, 0.3);
  // portavasos con refresco
  s += ell(238, 124, 18, 8, RS, 4);
  s += rect(226, 76, 24, 48, 5, P.oro, 4);
  s += f('M240 80 h6 v40 h-6 z', P.oroS);
  s += rect(226, 86, 24, 14, 2, P.rojo, 0);
  s += ell(238, 76, 12, 5, P.gris, 4);
  s += line('M242 72 l6 -22', K, 7) + line('M242 72 l6 -22', P.rojo, 3);
  s += brillo(14, 122, 12, 36, 0.3);
  scene('obj_sillon', svg(272, 272, s));
}

// ---- flotador 396 × 296: flotador de unicornio rosa ----
{
  let s = '';
  const R = P.rosa, RS = C.pink;
  // cola arcoíris (detrás)
  const cola = 'M300 206 c40 -20 60 -70 50 -130 c-4 -30 10 -46 36 -40';
  s += line(cola, K, 46);
  RAINBOW.forEach((c, i) => s += line(cola, c, 36 - i * 6.5));
  // aro
  s += ell(198, 226, 192, 64, R, 5);
  s += f('M30 250 c40 30 300 30 340 0 c-20 22 -70 36 -170 36 c-100 0 -150 -14 -170 -36 z', RS);
  s += ell(198, 214, 126, 34, RS, 5);
  s += f('M80 214 c20 -16 216 -16 236 0 c-20 -8 -216 -8 -236 0 z', P.vino, 'opacity=".25"');
  s += line('M70 198 c-20 10 -30 22 -24 36 M326 198 c20 10 30 22 24 36', P.vino, 4);
  s += brillo(40, 190, 70, 14, 0.5) + brillo(300, 190, 50, 12, 0.4);
  // cuello
  s += o('M62 236 c-26 -60 -14 -130 30 -160 l56 24 c-18 44 -14 84 12 136 z', R, 5);
  s += f('M120 108 c-10 40 -8 80 18 128 h-26 c-18 -44 -20 -84 -8 -128 z', RS);
  // crin arcoíris sobre el cuello
  const crin = 'M104 78 c30 10 40 50 36 100 c-2 18 10 40 20 58';
  s += line(crin, K, 30);
  RAINBOW.forEach((c, i) => s += line(crin, c, 22 - i * 4));
  // cabeza
  const cab = 'M26 92 c-10 -30 4 -58 36 -64 c30 -6 56 10 60 40 c2 18 -4 34 -18 40 c-6 10 -18 14 -32 10 l-36 -6 c-8 -2 -10 -10 -10 -20 z';
  s += o(cab, R, 5);
  s += f('M96 50 c14 12 20 36 8 56 c-6 10 -18 14 -32 10 c14 -4 24 -14 26 -30 c2 -14 0 -26 -2 -36 z', RS);
  s += brillo(40, 44, 24, 8, 0.5);
  // hocico
  s += o('M10 110 c-6 -14 2 -26 18 -28 l26 2 c10 2 12 14 6 22 c-6 10 -20 12 -34 10 c-8 -1 -14 -3 -16 -6 z', R, 5);
  s += circ(22, 102, 3.5, P.vino, 0) + line('M20 112 q8 6 16 0', K, 3);
  // oreja
  s += o('M86 36 l-6 -28 l22 20 z', R, 4) + f('M86 32 l-2 -14 l10 10 z', RS);
  // cuerno dorado
  s += o('M60 32 l12 -28 l12 28 z', C.cuerno, 4);
  s += line('M64 24 l14 -4 M68 14 l8 -2', P.oroS, 3);
  // ojo grande con pestañas
  s += ell(50, 76, 11, 13, BL, 4) + circ(51, 78, 7, P.morado, 0) + circ(52, 78, 4, K, 0) + circ(49, 74, 2.5, BL, 0);
  s += line('M38 66 l-8 -4 M40 60 l-6 -6 M46 58 l-2 -8', K, 3.5);
  // mejilla
  s += circ(36, 92, 5, RS, 0);
  scene('obj_flotador', svg(396, 296, s));
}

// ---- sombrilla 288 × 364: sombrilla de playa roja y blanca ----
{
  let s = '';
  // palo
  s += rect(135, 140, 18, 208, 6, P.rosa, 5);
  s += f('M144 144 h6 v200 h-6 z', C.pink);
  s += o('M135 346 h18 l-9 14 z', P.rosa, 4);
  // forro morado por debajo (festón)
  const dome = 'M6 146 C 30 48 90 16 144 16 C 198 16 258 48 282 146 z';
  s += o('M6 150 c20 -20 40 -20 46 0 c6 -20 36 -20 46 0 c6 -20 36 -20 46 0 c6 -20 36 -20 46 0 c6 -20 36 -20 46 0 c6 -20 26 -20 46 0 v4 h-276 z', P.morado, 5);
  for (let i = 0; i < 6; i++) s += ell(29 + i * 46, 150, 23, 11, i % 2 ? C.ciruela : P.morado, 5);
  // copa rayada
  s += o(dome, BL, 5);
  s += clipP('dome', dome);
  let gaj = '';
  const pts = [[6, 150], [52, 150], [98, 150], [144, 150], [190, 150], [236, 150], [282, 150]];
  for (let i = 0; i < 6; i += 2) gaj += f(`M144 16 C ${144 + (pts[i][0] - 144) * 0.3} 40 ${144 + (pts[i][0] - 144) * 0.75} 90 ${pts[i][0]} 150 L ${pts[i + 1][0]} 150 C ${144 + (pts[i + 1][0] - 144) * 0.75} 90 ${144 + (pts[i + 1][0] - 144) * 0.3} 40 144 16 z`, P.rojo);
  gaj += f('M144 16 C 150 40 180 90 190 150 L 236 150 C 220 90 160 40 144 16 z', P.rojo);
  gaj += f('M180 20 c50 20 86 60 102 120 h-20 c-14 -56 -40 -96 -82 -120 z', C.rojoS, 'opacity=".55"');
  gaj += f('M232 60 c30 20 44 60 50 90 h-16 c-6 -30 -16 -60 -34 -90 z', P.piedraS, 'opacity=".5"');
  s += clipped('dome', gaj);
  for (const [x] of pts.slice(1, 6)) s += line(`M144 16 C ${144 + (x - 144) * 0.3} 40 ${144 + (x - 144) * 0.75} 90 ${x} 150`, K, 3);
  s += o(dome, 'none', 5);
  s += brillo(60, 70, 14, 40, 0.6);
  // remate
  s += circ(144, 12, 8, P.rosa, 4);
  scene('obj_sombrilla', svg(288, 364, s));
}

// ---- dron 240 × 88: dron blanco de 4 hélices ----
{
  let s = '';
  const helice = (cx, cy, rx) => ell(cx, cy, rx, 8, C.lila, 4) + f(`M${cx - rx + 6} ${cy} a${rx - 6} 4 0 0 1 ${(rx - 6) * 2} 0 a${rx - 6} 4 0 0 1 -${(rx - 6) * 2} 0 z`, BL, 'opacity=".45"') + circ(cx, cy, 5, C.negro, 3);
  // brazos traseros y hélices de atrás
  s += line('M50 20 L100 48 M190 20 L140 48', K, 12) + line('M50 20 L100 48 M190 20 L140 48', C.negroC, 6);
  s += helice(48, 18, 42) + helice(192, 18, 42);
  // patas
  s += rect(86, 66, 10, 18, 4, C.negro, 4) + rect(144, 66, 10, 18, 4, C.negro, 4);
  // cuerpo
  s += ell(120, 54, 48, 24, BL, 5);
  s += f('M80 64 c20 10 60 10 80 0 c-10 12 -70 12 -80 0 z', P.piedraS);
  s += rect(92, 36, 56, 14, 7, P.piedra, 0);
  s += brillo(84, 44, 30, 6, 0.8);
  s += circ(100, 60, 3.5, P.rojo, 0) + circ(140, 60, 3.5, P.pasto, 0);
  // brazos delanteros y hélices de adelante
  s += line('M70 48 L96 60 M170 48 L144 60', K, 12) + line('M70 48 L96 60 M170 48 L144 60', C.negroC, 6);
  s += helice(70, 46, 36) + helice(170, 46, 36);
  // cámara
  s += circ(120, 72, 10, C.negro, 4) + circ(120, 72, 5, P.azul, 0) + circ(118, 70, 2, BL, 0);
  scene('obj_dron', svg(240, 88, s));
}

// ---- jetski 548 × 272: moto acuática amarilla en remolque ----
{
  let s = '';
  // remolque
  s += rect(30, 196, 500, 18, 7, P.grisS, 5);
  s += f('M36 206 h488 v2 a6 6 0 0 1 -6 6 h-476 a6 6 0 0 1 -6 -6 z', C.negroC);
  s += rect(500, 206, 42, 12, 6, P.grisS, 5) + circ(540, 212, 7, C.negro, 4);
  s += rect(70, 206, 16, 44, 4, P.grisS, 5);
  s += circ(78, 250, 16, C.negro, 5) + circ(78, 250, 5, P.gris, 3);
  s += o('M352 214 c0 -32 24 -46 50 -46 c26 0 50 14 50 46 h-16 c0 -22 -14 -34 -34 -34 c-20 0 -34 12 -34 34 z', P.grisS, 5);
  s += circ(402, 234, 34, C.negro, 5);
  s += circ(402, 234, 16, P.gris, 4) + circ(402, 234, 5, C.negro, 0);
  for (let i = 0; i < 4; i++) s += g(`rotate(${i * 45} 402 234)`, line('M402 222 v24', P.grisS, 3));
  // casco
  const casco = 'M8 150 c0 -30 30 -46 76 -52 l330 -16 c56 -2 100 16 126 46 c10 12 6 26 -8 30 l-40 36 h-466 c-16 0 -22 -8 -22 -20 z';
  s += o(casco, P.amarillo, 5);
  s += clipP('casco', casco);
  s += clipped('casco', f('M0 160 h560 v40 h-560 z', P.azulS) + f('M0 172 h560 v30 h-560 z', C.azulO) + f('M0 152 h560 v9 h-560 z', BL) + f('M330 86 c50 -2 110 12 150 40 l-14 20 c-30 -24 -80 -34 -130 -40 z', C.amarilloS) + f('M30 150 c-6 -20 20 -36 40 -38 l-8 36 z', C.amarilloS, 'opacity=".6"'));
  s += o(casco, 'none', 5);
  s += brillo(60, 110, 120, 8, 0.45);
  // raya decorativa
  s += line('M80 128 c90 -4 240 -6 380 -8', C.rojoS, 5);
  // capó / cubierta delantera gris
  s += o('M130 100 c20 -16 60 -22 90 -18 l10 36 h-100 z', C.negroC, 5);
  s += circ(148, 112, 8, P.azul, 4) + brillo(140, 90, 40, 6, 0.4);
  // asiento rojo
  s += o('M230 100 c40 -30 160 -40 230 -24 c10 4 10 22 -2 26 l-228 6 c-10 0 -12 -6 0 -8 z', P.rojo, 5);
  s += f('M300 78 c60 -14 120 -14 158 -2 c8 4 6 14 -2 16 l-80 4 c20 -10 -20 -16 -76 -18 z', C.rojoS);
  s += line('M296 92 c40 -8 80 -10 120 -8', C.rojoS, 4);
  s += brillo(250, 84, 50, 6, 0.4);
  // manubrio
  s += line('M196 100 c-6 -30 2 -56 24 -76', K, 22) + line('M196 100 c-6 -30 2 -56 24 -76', C.negro, 12);
  s += rect(150, 10, 130, 22, 11, C.negro, 5);
  s += f('M158 15 h40 v6 h-40 z M232 15 h40 v6 h-40 z', C.negroC);
  s += rect(198, 6, 34, 30, 10, C.negroC, 5) + brillo(204, 12, 12, 5, 0.5);
  scene('obj_jetski', svg(548, 272, s));
}
