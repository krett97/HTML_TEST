// Casa con jardín: jardín (barda con cielo, pasto, árbol, casita de pájaros, sol, mesa), estudio del
// youtuber (paneles oscuros, duela, ventana con persiana y ciudad, botón de play, escritorio gamer, repisa)
// y cochera (ladrillo gris, concreto, ventana de madera, tablero de herramientas).
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, eyes, nose, whiskers } from './lib.mjs';

const C = { ...P, cielo: '#60dfe6', nube: '#ffffff', barda: '#d9a066', bardaS: '#b2733a', pasto: '#7ccb5a', pastoS: '#5fae42', flor: '#fff1a8', hoja: '#5fbf4e', hojaS: '#3f9a36', hojaC: '#8fdc6e', tronco: '#8a5a2b', troncoS: '#6b4220',
  sol: '#ffd54a', solS: '#ffb020', casita: '#c47a3c', casitaS: '#9a5a26', techo: '#e04b3a', estudio: '#3e3354', estudioS: '#2f2642', estudioC: '#55477a', duela: '#6b4b3a', duelaS: '#52382b', duelaC: '#7f5a46',
  neon: '#ff3fb4', neonC: '#ff9ad8', escritorio: '#2d2a3d', escritorioS: '#1f1c2b', escritorioC: '#44405a', noche: '#2a2560', edificio: '#4d3f8a', ventanita: '#ffd166', persiana: '#dcd6f0', persianaS: '#b9b1d6',
  ladrillo: '#b8bcc6', ladrilloS: '#8f949f', ladrilloC: '#d6d9e0', concreto: '#a9adb6', concretoS: '#8a8e98', herramienta: '#ff8a3d', metal: '#c3c7d2', metalS: '#8d93a0', tablero: '#e8d9b8' };

const tile = (body) => svg(256, 256, body);
const bg = (color) => `<rect width="256" height="256" fill="${color}"/>`;

// ---- Jardín ----
{
  // Barda: franja junto al piso; el cielo de arriba lo pinta la escena con el mismo color (GARDEN_SKY).
  let s = bg(C.cielo);
  s += f('M20 70 a18 18 0 0 1 34 -8 a14 14 0 0 1 26 8 a10 10 0 0 1 -4 20 h-54 a10 10 0 0 1 -2 -20 z', C.nube) + f('M170 40 a14 14 0 0 1 26 -6 a10 10 0 0 1 20 6 a8 8 0 0 1 -2 16 h-44 a8 8 0 0 1 0 -16 z', C.nube);
  s += `<rect x="0" y="136" width="256" height="120" fill="${C.bardaS}"/>`;
  for (let x = 0; x < 256; x += 32) s += `<path d="M${x + 3} 150 l13 -14 l13 14 v106 h-26 z" fill="${C.barda}"/>` + `<rect x="${x + 7}" y="152" width="6" height="96" rx="3" fill="${C.bardaS}" opacity=".5"/>`;
  s += `<rect x="0" y="170" width="256" height="10" fill="${C.bardaS}"/><rect x="0" y="220" width="256" height="10" fill="${C.bardaS}"/>`;
  s += `<rect x="0" y="134" width="256" height="4" fill="${K}" opacity=".5"/>`;
  scene('pared_jardin', tile(s));
  s = bg(C.pasto);
  for (let y = 10; y < 256; y += 28) for (let x = (y / 28) % 2 ? 12 : 26; x < 256; x += 28) s += line(`M${x} ${y + 8} l3 -8 M${x + 6} ${y + 8} l2 -6`, C.pastoS, 3);
  for (const [x, y] of [[60, 60], [190, 120], [110, 210], [230, 40], [30, 170]]) s += circ(x, y, 5, C.flor, 0) + circ(x, y, 2, C.solS, 0);
  scene('piso_jardin', tile(s));
  // Árbol parado en el pasto 258 × 246 (el cuervo se sube a la copa)
  s = o('M112 240 c-4 -40 2 -80 8 -110 h20 c6 30 12 70 8 110 z', C.tronco, 5) + line('M126 150 v70', C.troncoS, 5);
  s += o('M60 140 c-50 -10 -50 -70 -6 -80 c-10 -40 50 -60 76 -30 c30 -30 90 -10 80 30 c40 10 40 70 -6 80 c10 30 -30 50 -56 36 c-20 20 -70 20 -88 -36 z', C.hoja, 6);
  s += f('M70 60 c20 -30 70 -36 100 -10 c-30 -6 -70 2 -100 10 z', C.hojaC, 'opacity=".8"') + f('M40 120 c40 30 130 30 170 0 c-30 36 -140 36 -170 0 z', C.hojaS, 'opacity=".6"');
  s += circ(90, 90, 7, C.rojo, 3) + circ(160, 70, 7, C.rojo, 3) + circ(190, 120, 7, C.rojo, 3);
  scene('ventana_jardin', svg(258, 246, s));
  // Casita de pájaros 152 × 164
  s = o('M26 150 v-70 h100 v70 z', C.casita, 5) + f('M34 86 h84 v20 h-84 z', C.casitaS, 'opacity=".4"') + o('M10 84 l66 -70 l66 70 z', C.techo, 5) + f('M30 78 l46 -48 l46 48 z', '#ff8a7a', 'opacity=".5"') + circ(76, 112, 20, K, 5) + rect(56, 134, 40, 10, 5, C.casitaS, 4);
  scene('cuadro_jardin', svg(152, 164, s));
  // Sol 152 × 144
  s = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += o(`M${76 + Math.cos(a) * 46} ${72 + Math.sin(a) * 46} l${Math.cos(a - 0.3) * 24} ${Math.sin(a - 0.3) * 24} l${Math.cos(a + 0.5) * 6} ${Math.sin(a + 0.5) * 6} z`, C.solS, 4); }
  s += circ(76, 72, 46, C.sol, 5) + f('M44 56 c10 -16 36 -22 54 -8 c-16 -4 -36 0 -54 8 z', '#fff6c8', 'opacity=".8"') + eyes(76, 70, 16, 7, false) + line('M62 90 q14 12 28 0', K, 5) + circ(48, 86, 7, C.rosa, 0) + circ(104, 86, 7, C.rosa, 0);
  scene('sol', svg(152, 144, s));
  // Mesa de jardín 896 × 104: blanca con patas de metal
  s = rect(4, 4, 888, 34, 10, C.blanco) + f('M14 28 h868 v8 h-868 z', '#d8d8e0') + rect(40, 40, 22, 60, 6, C.metal, 5) + rect(834, 40, 22, 60, 6, C.metal, 5) + line('M62 60 h772', C.metalS, 8);
  scene('mueble_jardin_mesa', svg(896, 104, s));
}

// ---- Estudio ----
{
  let s = bg(C.estudioS);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) s += `<rect x="${x + 4}" y="${y + 4}" width="56" height="56" rx="6" fill="${C.estudio}"/>` + `<rect x="${x + 10}" y="${y + 10}" width="40" height="8" rx="4" fill="${C.estudioC}" opacity=".6"/>`;
  scene('pared_estudio', tile(s));
  s = bg(C.duelaS);
  for (let i = 0; i < 4; i++) s += `<rect x="0" y="${i * 64 + 3}" width="256" height="58" rx="4" fill="${C.duela}"/>` + `<rect x="${(i % 2) * 128 + 4}" y="${i * 64 + 3}" width="4" height="58" fill="${C.duelaS}"/>` + `<rect x="14" y="${i * 64 + 12}" width="${80 + (i % 2) * 50}" height="6" rx="3" fill="${C.duelaC}"/>`;
  scene('piso_estudio', tile(s));
  // Ventana con persiana a medio bajar y ciudad de noche 292 × 256
  s = rect(8, 8, 276, 232, 8, C.estudioC) + rect(26, 26, 240, 196, 4, C.noche, 5);
  for (const [x, w, h] of [[40, 40, 110], [90, 30, 150], [130, 50, 90], [190, 36, 130], [236, 26, 100]]) { s += `<rect x="${x}" y="${222 - h}" width="${w}" height="${h}" fill="${C.edificio}"/>`; for (let yy = 230 - h; yy < 212; yy += 18) for (let xx = x + 6; xx < x + w - 6; xx += 12) s += `<rect x="${xx}" y="${yy}" width="6" height="8" fill="${C.ventanita}"/>`; }
  s += circ(220, 60, 14, C.ventanita, 0);
  s += line('M146 26 v196', K, 4);
  s += rect(26, 26, 240, 84, 2, C.persiana, 5);
  for (let y = 38; y < 104; y += 14) s += line(`M30 ${y} h232`, C.persianaS, 4);
  s += rect(0, 236, 292, 20, 6, C.estudioC);
  scene('ventana_estudio', svg(292, 256, s));
  // Botón de play 84 × 88
  s = o('M14 10 l60 34 l-60 34 z', C.blanco, 5) + f('M22 24 l34 20 l-34 20 z', '#e6e6f0', 'opacity=".7"');
  scene('cuadro_estudio', svg(84, 88, s));
  // Escritorio gamer 984 × 214: negro con tira de neón rosa y cajonera a la derecha
  s = rect(4, 4, 976, 40, 10, C.escritorio) + rect(10, 30, 964, 10, 5, C.neon, 0) + rect(10, 32, 964, 4, 2, C.neonC, 0) + f('M16 10 h300 v8 h-300 z', C.escritorioC, 'opacity=".9"');
  s += rect(14, 44, 36, 166, 8, C.escritorio, 5);
  s += rect(730, 44, 240, 166, 10, C.escritorio, 5);
  for (const y of [58, 108, 158]) s += rect(748, y, 204, 40, 8, C.escritorioC, 5) + rect(830, y + 14, 40, 10, 5, C.neon, 3);
  s += f('M50 44 h680 v150 h-680 z', C.escritorioS, 'opacity=".5"') + f('M50 180 h680 v30 h-680 z', '#4a3a6a', 'opacity=".35"');
  scene('mueble_estudio_escritorio', svg(984, 214, s));
  // Repisa negra con luz rosa debajo 872 × 24 (la cubierta es el borde de arriba)
  s = rect(4, 2, 864, 14, 5, C.escritorio, 4) + f('M20 18 h832 v6 h-832 z', C.neon, 'opacity=".7"');
  scene('mueble_estudio_repisa', svg(872, 24, s));
}

// ---- Cochera ----
{
  let s = bg(C.ladrilloS);
  for (let row = 0; row < 4; row++) { const off = row % 2 ? -64 : 0; for (let x = off; x < 256; x += 128) s += `<rect x="${x + 4}" y="${row * 64 + 4}" width="120" height="56" rx="6" fill="${C.ladrillo}"/>` + `<rect x="${x + 12}" y="${row * 64 + 10}" width="70" height="8" rx="4" fill="${C.ladrilloC}" opacity=".8"/>`; }
  scene('pared_cochera', tile(s));
  s = bg(C.concretoS);
  for (let y = 0; y < 256; y += 128) for (let x = 0; x < 256; x += 128) s += `<rect x="${x + 3}" y="${y + 3}" width="122" height="122" rx="6" fill="${C.concreto}"/>` + line(`M${x + 30} ${y + 40} l20 14 l10 -6`, C.concretoS, 4);
  s += ell(96, 180, 30, 12, '#5a5d66', 0) + ell(110, 176, 10, 5, '#777b86', 0);
  scene('piso_cochera', tile(s));
  // Ventana de madera con maceta 288 × 264
  s = rect(8, 8, 272, 228, 8, C.madera) + rect(28, 28, 232, 188, 4, C.azul, 5) + f('M28 28 h232 v80 h-232 z', C.azulC, 'opacity=".5"') + line('M144 28 v188 M28 122 h232', C.madera, 14) + line('M144 28 v188 M28 122 h232', K, 4) + rect(0, 236, 288, 22, 6, C.maderaS) + o('M60 236 c0 -16 10 -24 30 -24 c20 0 30 8 30 24 z', C.hoja, 5) + o('M190 236 c0 -16 10 -24 30 -24 c20 0 30 8 30 24 z', C.hoja, 5);
  scene('ventana_cochera', svg(288, 264, s));
  // Tablero de herramientas 196 × 132: martillo, desarmador, llave
  s = rect(4, 4, 188, 124, 8, C.tablero);
  for (let y = 20; y < 124; y += 20) for (let x = 20; x < 190; x += 20) s += circ(x, y, 2.5, '#c9b892', 0);
  s += rect(30, 36, 14, 80, 5, C.madera, 4) + rect(16, 16, 42, 24, 6, C.metal, 5);
  s += rect(90, 16, 12, 54, 4, C.herramienta, 4) + rect(93, 70, 6, 46, 2, C.metal, 3);
  s += rect(146, 40, 14, 76, 5, C.metal, 4) + o('M134 14 h38 v24 l-8 10 h-22 l-8 -10 z', C.metal, 5) + rect(146, 20, 14, 12, 2, C.tablero, 0);
  scene('cuadro_cochera', svg(196, 132, s));
}
