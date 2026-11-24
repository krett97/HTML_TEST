// Cuartos del departamento (menos la cocina, en cocina.mjs): pared y piso (256 × 256, se repiten),
// ventana, cuadro y muebles con las mismas medidas en unidades que el pixel art (places.ts FURNITURE).
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, eyes, nose, whiskers } from './lib.mjs';

const C = { ...P, moradoP: '#5a4470', moradoPS: '#4a3660', duela: '#b98050', duelaS: '#946034', duelaC: '#d49a66', bano: '#bfe7dc', banoS: '#93cbbd', banoC: '#e6f8f3',
  loseta: '#d9d3cc', losetaS: '#b8b0a6', rosaP: '#e9c3cc', rosaPS: '#d8a3b1', corazon: '#ff6f9c', alfombra: '#9a4a5e', alfombraS: '#7d3a4b', lavado: '#6f7580', lavadoS: '#555a66', lavadoC: '#8d94a1',
  cemento: '#9ea3ad', cementoS: '#80858f', tela: '#e8554e', telaS: '#c43b36', cortina: '#e86a9a', cortinaS: '#c9477a', noche: '#2d2a63', estrella: '#fff1a8' };

const tile = (body) => svg(256, 256, body);
const bg = (color) => `<rect width="256" height="256" fill="${color}"/>`;

// ---- Sala: papel tapiz morado con rombos, duela, ventana de madera, retrato del gato gordo ----
{
  let s = bg(C.moradoP);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) s += f(`M${x + 32} ${y + 8} l16 24 l-16 24 l-16 -24 z`, C.moradoPS) + circ(x + 32, y + 32, 4, '#7a6392', 0);
  scene('pared_sala', tile(s));
  s = bg(C.duelaS);
  for (let i = 0; i < 4; i++) {
    s += `<rect x="0" y="${i * 64 + 3}" width="256" height="58" rx="4" fill="${C.duela}"/>`;
    s += `<rect x="${(i % 2) * 128 + 4}" y="${i * 64 + 3}" width="4" height="58" fill="${C.duelaS}"/>`;
    s += `<rect x="12" y="${i * 64 + 12}" width="${90 + (i % 2) * 40}" height="6" rx="3" fill="${C.duelaC}" opacity=".8"/>`;
  }
  scene('piso_sala', tile(s));
  // ventana 304 × 272
  s = rect(8, 8, 288, 240, 8, C.madera) + rect(28, 28, 248, 200, 4, C.azul, 5) + f('M28 28 h248 v90 h-248 z', C.azulC, 'opacity=".5"') + line('M152 28 v200 M28 128 h248', C.madera, 14) + line('M152 28 v200 M28 128 h248', K, 4) + rect(0, 244, 304, 24, 6, C.maderaS) + f('M40 40 h60 v6 h-60 z M40 140 h40 v6 h-40 z', C.blanco, 'opacity=".7"');
  scene('ventana_sala', svg(304, 272, s));
  // cuadro 176 × 172: retrato del gato gordo con marco dorado
  s = rect(6, 6, 164, 160, 8, C.oro) + rect(22, 22, 132, 128, 4, '#f6e6c8', 5) + o('M46 136 c-6 -40 18 -60 42 -60 c24 0 48 20 42 60 z', C.naranja, 5) + f('M66 136 c0 -22 10 -34 22 -34 c12 0 22 12 22 34 z', C.crema) + o('M58 66 l6 -22 l20 16 z M118 66 l-6 -22 l-20 16 z', C.naranja, 4) + circ(88, 70, 30, C.naranja, 5) + eyes(88, 70, 11, 6, false) + nose(88, 80, 6) + f('M10 10 h20 v20 h-20 z M146 10 h20 v20 h-20 z M10 142 h20 v20 h-20 z M146 142 h20 v20 h-20 z', C.oroS);
  scene('cuadro_sala', svg(176, 172, s));
  // mesa de centro 1060 × 94 y mueble de tele 1004 × 106
  s = rect(4, 4, 1052, 36, 10, C.madera) + f('M14 30 h1032 v8 h-1032 z', C.maderaS) + f('M30 12 h300 v6 h-300 z M600 12 h200 v6 h-200 z', C.maderaC, 'opacity=".9"') + rect(40, 40, 40, 50, 8, C.maderaS, 5) + rect(980, 40, 40, 50, 8, C.maderaS, 5);
  scene('mueble_sala_mesa', svg(1060, 94, s));
  s = rect(4, 4, 996, 90, 10, C.madera) + f('M12 10 h980 v10 h-980 z', C.maderaC, 'opacity=".8"');
  for (let i = 0; i < 3; i++) { const x = 24 + i * 324; s += rect(x, 26, 300, 54, 8, C.maderaC, 5) + rect(x + 16, 38, 268, 30, 6, C.madera, 4) + circ(x + 150, 53, 11, C.oro, 4); }
  s += rect(30, 90, 50, 12, 4, C.maderaS, 4) + rect(924, 90, 50, 12, 4, C.maderaS, 4);
  scene('mueble_sala_mueble', svg(1004, 106, s));
}

// ---- Baño: azulejo menta, loseta gris, ventana esmerilada, espejo redondo, repisa, inodoro ----
{
  let s = bg(C.banoS);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) s += `<rect x="${x + 4}" y="${y + 4}" width="56" height="56" rx="8" fill="${C.bano}"/>` + `<rect x="${x + 10}" y="${y + 10}" width="44" height="12" rx="6" fill="${C.banoC}" opacity=".8"/>`;
  scene('pared_bano', tile(s));
  s = bg(C.losetaS);
  for (let y = 0; y < 256; y += 128) for (let x = 0; x < 256; x += 128) s += `<rect x="${x + 4}" y="${y + 4}" width="120" height="120" rx="10" fill="${C.loseta}"/>` + `<rect x="${x + 14}" y="${y + 12}" width="60" height="10" rx="5" fill="#ffffff" opacity=".6"/>`;
  scene('piso_bano', tile(s));
  s = rect(8, 8, 240, 228, 10, C.blanco) + rect(26, 26, 204, 192, 6, C.azulC, 5) + f('M26 26 h204 v192 h-204 z', '#ffffff', 'opacity=".35"') + line('M60 60 l-20 120 M100 50 l-30 150', '#ffffff', 10) + line('M128 26 v192', K, 4) + rect(0, 232, 256, 24, 6, '#e6e6ea');
  scene('ventana_bano', svg(256, 260, s));
  s = circ(88, 80, 74, C.piedraS) + circ(88, 80, 60, C.azulC, 5) + f('M60 40 c20 -18 50 -14 66 8 c-20 -8 -44 -4 -62 10 z', '#ffffff', 'opacity=".9"') + line('M50 110 l50 -56', '#ffffff', 8);
  scene('cuadro_bano', svg(176, 160, s));
  s = rect(4, 4, 812, 30, 8, C.blanco) + f('M12 24 h796 v6 h-796 z', '#d0d0d8') + o('M120 34 l-30 18 h60 z', C.grisS, 5) + o('M700 34 l-30 18 h60 z', C.grisS, 5);
  scene('mueble_bano_repisa', svg(820, 54, s));
  // inodoro 164 × 208
  s = rect(94, 10, 64, 110, 10, C.blanco) + rect(104, 18, 44, 14, 6, C.piedraS, 4) + circ(126, 46, 8, C.gris, 4) + o('M14 120 c0 -20 20 -32 60 -32 h70 c10 0 14 8 14 20 v30 c0 20 -30 34 -72 34 c-44 0 -72 -14 -72 -34 z', C.blanco, 5) + ell(78, 118, 56, 16, C.azulC, 5) + rect(56, 170, 60, 36, 8, C.blanco, 5) + f('M30 130 c0 10 20 18 48 18 c-14 -2 -34 -8 -48 -18 z', '#d0d0d8');
  scene('mueble_inodoro', svg(164, 208, s));
}

// ---- Recámara: papel rosa con corazones, alfombra vino, ventana con cortinas y noche, retrato del dueño, cama, escritorio ----
{
  let s = bg(C.rosaP);
  const heart = (x, y, r) => f(`M${x} ${y + r} c-${r * 1.2} -${r * 0.9} -${r * 1.2} -${r * 2} 0 -${r * 1.4} c${r * 1.2} -${r * 0.6} ${r * 1.2} ${r * 0.5} 0 ${r * 1.4} z`, C.corazon);
  for (const [x, y] of [[40, 40], [140, 24], [216, 90], [80, 130], [180, 170], [30, 210], [120, 230]]) s += heart(x, y, 10);
  for (const [x, y] of [[200, 30], [100, 80], [20, 150], [160, 120], [230, 220]]) s += circ(x, y, 4, C.rosaPS, 0);
  scene('pared_recamara', tile(s));
  s = bg(C.alfombra);
  for (let y = 8; y < 256; y += 24) for (let x = (y / 24) % 2 ? 8 : 20; x < 256; x += 24) s += circ(x, y, 3, C.alfombraS, 0);
  scene('piso_recamara', tile(s));
  // ventana 376 × 320 con cortinas rosas y cielo de noche
  s = rect(70, 30, 236, 250, 8, C.blanco) + rect(88, 48, 200, 214, 4, C.noche, 5);
  for (const [x, y, r] of [[120, 90, 4], [180, 70, 3], [240, 110, 4], [150, 150, 3], [250, 180, 3], [110, 200, 4], [200, 220, 3]]) s += circ(x, y, r, C.estrella, 0);
  s += circ(230, 90, 18, C.estrella, 0) + circ(222, 84, 15, C.noche, 0);
  s += line('M188 48 v214 M88 156 h200', C.blanco, 10) + line('M188 48 v214 M88 156 h200', K, 4);
  s += rect(60, 284, 256, 20, 6, '#e6e6ea');
  s += rect(30, 10, 316, 14, 7, C.maderaS, 5) + circ(28, 17, 11, C.madera, 5) + circ(348, 17, 11, C.madera, 5);
  s += o('M50 24 h54 c4 60 10 120 -8 170 c-4 14 4 40 0 80 c-20 10 -50 10 -60 0 c6 -40 -2 -70 2 -110 c4 -44 8 -90 12 -140 z', C.cortina, 5);
  s += o('M326 24 h-54 c-4 60 -10 120 8 170 c4 14 -4 40 0 80 c20 10 50 10 60 0 c-6 -40 2 -70 -2 -110 c-4 -44 -8 -90 -12 -140 z', C.cortina, 5);
  s += f('M62 34 c2 60 6 110 -2 160 c8 4 16 4 22 0 c-8 -50 -6 -100 0 -160 z M314 34 c-2 60 -6 110 2 160 c-8 4 -16 4 -22 0 c8 -50 6 -100 0 -160 z', C.cortinaS, 'opacity=".5"');
  s += rect(40, 190, 56, 20, 10, C.cortinaS, 5) + rect(280, 190, 56, 20, 10, C.cortinaS, 5);
  scene('ventana_recamara', svg(376, 320, s));
  // cuadro 184 × 192: retrato del dueño
  s = rect(6, 6, 172, 180, 8, C.maderaS) + rect(22, 22, 140, 148, 4, '#dfe8f5', 5) + o('M44 170 c0 -30 16 -46 48 -46 c32 0 48 16 48 46 z', '#e04b3a', 5) + rect(80, 100, 24, 26, 6, '#dba379', 4) + circ(92, 84, 32, '#f6c9a2', 5) + o('M60 78 c0 -26 14 -40 32 -40 c20 0 34 14 32 38 c-8 -12 -18 -16 -28 -14 c-8 6 -18 6 -24 2 c-6 2 -10 6 -12 14 z', '#6b3b1e', 5) + eyes(92, 88, 12, 6, false) + ell(92, 106, 6, 4, '#8a2f3e', 3);
  scene('cuadro_recamara', svg(184, 192, s));
  // cama 904 × 268 (cabecera a la izquierda; la cubierta (colchón) empieza 96 px abajo del borde superior)
  s = rect(6, 6, 70, 256, 10, C.madera) + f('M14 14 h54 v240 h-54 z', C.maderaC, 'opacity=".5"') + rect(22, 30, 38, 90, 8, C.maderaS, 4);
  s += rect(60, 150, 838, 60, 10, C.madera) + f('M70 190 h820 v14 h-820 z', C.maderaS) + rect(820, 200, 40, 64, 8, C.maderaS, 5) + rect(80, 200, 40, 64, 8, C.maderaS, 5);
  s += rect(60, 100, 838, 56, 14, C.blanco) + f('M70 130 h820 v20 h-820 z', '#dcdce6');
  s += o('M300 96 h600 v50 c-40 14 -80 22 -120 22 h-480 c-20 0 -30 -10 -30 -26 z', C.azul, 5) + f('M320 108 h560 v8 h-560 z', C.azulC, 'opacity=".6"') + o('M320 150 c20 40 10 70 -10 90 c-10 -30 -16 -60 -10 -90 z', C.azul, 5);
  s += o('M90 112 c0 -14 10 -22 30 -22 h110 c20 0 30 8 30 22 v14 c0 10 -8 16 -24 16 h-122 c-16 0 -24 -6 -24 -16 z', C.blanco, 5) + f('M110 100 h130 v8 h-130 z', '#eeeef4');
  scene('mueble_recamara_cama', svg(904, 268, s));
  // escritorio 760 × 216 con cajones a los lados
  s = rect(4, 4, 752, 34, 10, C.gris) + f('M12 28 h736 v8 h-736 z', C.grisS) + f('M24 10 h200 v8 h-200 z', '#ffffff', 'opacity=".6"');
  for (const x of [14, 566]) { s += rect(x, 40, 180, 170, 10, C.gris, 5); for (const y of [56, 134]) s += rect(x + 16, y, 148, 62, 8, '#d6dae6', 5) + rect(x + 70, y + 24, 40, 12, 6, C.grisS, 4); }
  s += f('M200 40 h360 v160 h-360 z', C.grisS, 'opacity=".6"');
  scene('mueble_recamara_escritorio', svg(760, 216, s));
}

// ---- Cuarto de lavado: muro de bloques gris azulado, cemento, ventana de aluminio, repisa de detergentes ----
{
  let s = bg(C.lavadoS);
  for (let row = 0; row < 4; row++) { const off = row % 2 ? -64 : 0; for (let x = off; x < 256; x += 128) s += `<rect x="${x + 4}" y="${row * 64 + 4}" width="120" height="56" rx="6" fill="${C.lavado}"/>` + `<rect x="${x + 12}" y="${row * 64 + 10}" width="60" height="8" rx="4" fill="${C.lavadoC}" opacity=".7"/>`; }
  scene('pared_lavado', tile(s));
  s = bg(C.cementoS);
  for (let y = 0; y < 256; y += 128) for (let x = 0; x < 256; x += 128) s += `<rect x="${x + 3}" y="${y + 3}" width="122" height="122" rx="6" fill="${C.cemento}"/>` + circ(x + 40, y + 70, 5, C.cementoS, 0) + circ(x + 90, y + 40, 3, C.cementoS, 0);
  scene('piso_lavado', tile(s));
  s = rect(8, 8, 248, 220, 6, '#d8dbe3') + rect(26, 26, 212, 184, 4, C.azul, 5) + f('M26 26 h212 v80 h-212 z', C.azulC, 'opacity=".5"') + line('M132 26 v184', K, 4) + line('M60 60 l-16 100', '#ffffff', 8) + rect(0, 228, 264, 22, 6, '#c4c8d2');
  scene('ventana_lavado', svg(264, 252, s));
  s = rect(6, 90, 196, 16, 6, C.madera) + rect(6, 150, 196, 16, 6, C.madera) + rect(10, 40, 10, 126, 4, C.maderaS, 4) + rect(188, 40, 10, 126, 4, C.maderaS, 4);
  const bottles = [['#ff8a3d', 20], ['#5fc46a', 48], ['#6cc8f5', 76], ['#ff6f9c', 104], ['#ffd54a', 132], ['#a97cf0', 160]];
  for (const [c, x] of bottles) s += rect(x, 40, 24, 52, 6, c, 4) + rect(x + 6, 32, 12, 12, 3, '#e6e6ea', 3) + rect(x, 110, 24, 42, 6, c, 4) + rect(x + 4, 120, 16, 14, 2, '#ffffff', 0);
  scene('cuadro_lavado', svg(208, 168, s));
}
