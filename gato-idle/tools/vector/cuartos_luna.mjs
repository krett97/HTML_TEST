// La Luna: cohete (placas metálicas, rejilla, ojo de buey con la Tierra, foto del gato astronauta,
// consola de mandos), laboratorio lunar (paneles blancos, piso a cuadros, ojo de buey con la Luna,
// póster del ovni, mesa blanca) y superficie (cielo estrellado, regolito, la Tierra, un platillo).
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, eyes, nose, whiskers } from './lib.mjs';

const C = { ...P, placa: '#9aa0b4', placaS: '#767c92', placaC: '#c3c8d8', rejilla: '#5c6276', rejillaS: '#454a5c', bronce: '#c98a44', bronceS: '#9a6428', espacio: '#1b1a3e', tierra: '#3f8fe0', tierraS: '#2a6fb8', continente: '#5fc46a', nube: '#ffffff',
  lab: '#eef1f6', labS: '#cfd5e0', labC: '#ffffff', consola: '#4a4f6a', consolaS: '#353a52', pantalla: '#8fe3ff', boton: ['#ff5f6d', '#ffd54a', '#5ec47a', '#6cc8f5'], mesa: '#f6f7fa', mesaS: '#d3d7e2', pata: '#9aa0b4',
  regolito: '#b8bcc6', regolitoS: '#8e929d', crater: '#9fa3ad', luna: '#e8e9ee', lunaS: '#c4c6cf', ovni: '#b9bfcf', ovniS: '#8a90a4', cupula: '#9fe3ff', verdeA: '#7ee36a', traje: '#ffffff', visor: '#2d2a4a' };

const tile = (body) => svg(256, 256, body);
const bg = (color) => `<rect width="256" height="256" fill="${color}"/>`;
const bolt = (x, y) => circ(x, y, 4, C.placaS, 0) + line(`M${x - 2} ${y} h4`, C.placaC, 2);
const earth = (cx, cy, r) => circ(cx, cy, r, C.tierra, 0) + f(`M${cx - r * 0.5} ${cy - r * 0.6} c${r * 0.3} -${r * 0.2} ${r * 0.5} 0 ${r * 0.4} ${r * 0.3} c-${r * 0.1} ${r * 0.3} -${r * 0.5} ${r * 0.3} -${r * 0.6} ${r * 0.1} c-${r * 0.1} -${r * 0.2} 0 -${r * 0.3} ${r * 0.2} -${r * 0.4} z M${cx + r * 0.1} ${cy + r * 0.1} c${r * 0.3} -${r * 0.1} ${r * 0.5} ${r * 0.2} ${r * 0.3} ${r * 0.5} c-${r * 0.2} ${r * 0.2} -${r * 0.5} ${r * 0.1} -${r * 0.4} -${r * 0.2} z`, C.continente) + f(`M${cx - r * 0.7} ${cy + r * 0.2} c${r * 0.2} -${r * 0.1} ${r * 0.4} 0 ${r * 0.5} ${r * 0.1} c-${r * 0.1} ${r * 0.1} -${r * 0.4} ${r * 0.1} -${r * 0.5} -${r * 0.1} z`, C.nube, 'opacity=".9"') + f(`M${cx - r * 0.75} ${cy - r * 0.35} a${r} ${r} 0 0 1 ${r * 0.6} -${r * 0.55} c-${r * 0.25} ${r * 0.15} -${r * 0.45} ${r * 0.35} -${r * 0.6} ${r * 0.55} z`, '#ffffff', 'opacity=".55"');

// ---- Cohete ----
{
  let s = bg(C.placaS);
  for (let y = 0; y < 256; y += 128) for (let x = 0; x < 256; x += 128) s += `<rect x="${x + 4}" y="${y + 4}" width="120" height="120" rx="8" fill="${C.placa}"/>` + `<rect x="${x + 14}" y="${y + 12}" width="70" height="10" rx="5" fill="${C.placaC}" opacity=".7"/>` + bolt(x + 16, y + 112) + bolt(x + 112, y + 112) + bolt(x + 112, y + 16);
  scene('pared_cohete', tile(s));
  s = bg(C.rejillaS);
  for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) s += `<rect x="${x + 3}" y="${y + 3}" width="26" height="26" rx="4" fill="${C.rejilla}"/>`;
  scene('piso_cohete', tile(s));
  // Ojo de buey con la Tierra 304 × 304
  s = circ(152, 152, 144, C.bronce, 6) + circ(152, 152, 112, C.espacio, 5);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += circ(152 + Math.cos(a) * 128, 152 + Math.sin(a) * 128, 7, C.bronceS, 3); }
  for (const [x, y] of [[90, 90], [210, 80], [220, 200], [100, 220], [150, 60]]) s += circ(x, y, 3, '#fff1a8', 0);
  s += earth(160, 160, 62);
  s += f('M70 110 a100 100 0 0 1 60 -58 c-20 20 -40 38 -52 62 z', '#ffffff', 'opacity=".35"');
  scene('ventana_cohete', svg(304, 304, s));
  // Foto del gato astronauta 180 × 164
  s = rect(6, 6, 168, 152, 8, C.placaC) + rect(20, 20, 140, 124, 4, C.espacio, 5) + circ(50, 40, 3, '#fff1a8', 0) + circ(130, 50, 3, '#fff1a8', 0) + circ(110, 120, 2, '#fff1a8', 0);
  s += o('M60 144 c-2 -30 12 -46 30 -46 c18 0 32 16 30 46 z', C.traje, 5) + circ(90, 70, 34, C.traje, 5) + circ(90, 72, 24, C.visor, 4) + circ(90, 74, 18, P.naranja, 0) + eyes(90, 72, 7, 4, false) + nose(90, 80, 4) + f('M72 60 c6 -10 20 -12 30 -6 c-10 -2 -20 0 -30 6 z', '#ffffff', 'opacity=".7"');
  s += o('M118 112 l14 -16 c6 -6 14 2 8 8 l-14 16 z', C.traje, 4);
  scene('cuadro_cohete', svg(180, 164, s));
  // Consola de mandos 1072 × 152 (la cubierta es el borde de arriba)
  s = rect(4, 4, 1064, 36, 10, C.consola) + f('M12 10 h1048 v8 h-1048 z', '#6a7090', 'opacity=".8"') + rect(10, 40, 1052, 106, 10, C.consola, 5);
  for (let i = 0; i < 4; i++) { const x = 40 + i * 262; s += rect(x, 52, 120, 60, 8, C.consolaS, 4) + rect(x + 8, 60, 104, 44, 6, C.pantalla, 0) + line(`M${x + 16} 90 l20 -14 l16 8 l20 -16 l20 10`, '#1c7fa6', 4); for (let b = 0; b < 4; b++) s += circ(x + 150 + b * 24, 66, 8, C.boton[b], 3) + rect(x + 142 + b * 24, 86, 16, 22, 4, C.consolaS, 3); }
  s += rect(10, 120, 1052, 12, 4, C.consolaS, 0);
  scene('mueble_cohete_mueble', svg(1072, 152, s));
}

// ---- Laboratorio lunar ----
{
  let s = bg(C.labS);
  for (let y = 0; y < 256; y += 128) for (let x = 0; x < 256; x += 128) s += `<rect x="${x + 4}" y="${y + 4}" width="120" height="120" rx="10" fill="${C.lab}"/>` + `<rect x="${x + 14}" y="${y + 12}" width="80" height="10" rx="5" fill="${C.labC}"/>`;
  s += `<rect x="0" y="124" width="256" height="8" fill="${P.azul}" opacity=".7"/>`;
  scene('pared_labluna', tile(s));
  s = bg(C.labS);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) s += `<rect x="${x * 64 + 3}" y="${y * 64 + 3}" width="58" height="58" rx="6" fill="${(x + y) % 2 ? C.lab : '#dde3ee'}"/>`;
  scene('piso_labluna', tile(s));
  // Ojo de buey con la Luna 308 × 304
  s = circ(154, 152, 144, C.bronce, 6) + circ(154, 152, 112, C.espacio, 5);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.4; s += circ(154 + Math.cos(a) * 128, 152 + Math.sin(a) * 128, 7, C.bronceS, 3); }
  for (const [x, y] of [[90, 80], [210, 70], [230, 190], [96, 210], [160, 56]]) s += circ(x, y, 3, '#fff1a8', 0);
  s += circ(174, 176, 58, C.luna, 0) + circ(150, 160, 12, C.lunaS, 0) + circ(196, 150, 8, C.lunaS, 0) + circ(186, 200, 14, C.lunaS, 0) + circ(160, 206, 6, C.lunaS, 0);
  s += f('M74 110 a100 100 0 0 1 60 -58 c-20 20 -40 38 -52 62 z', '#ffffff', 'opacity=".35"');
  scene('ventana_labluna', svg(308, 304, s));
  // Póster del ovni "quiero creer" 192 × 132 (sin texto: rayo de luz)
  s = rect(6, 6, 180, 120, 6, C.espacio) + f('M60 116 l36 -60 l36 60 z', '#fff1a8', 'opacity=".35"') + o('M26 70 c20 -16 120 -16 140 0 c-20 16 -120 16 -140 0 z', C.ovni, 5) + o('M66 62 c0 -26 60 -26 60 0 z', C.cupula, 4) + f('M72 60 c2 -16 16 -20 26 -18 c-12 2 -20 8 -26 18 z', '#ffffff', 'opacity=".8"');
  for (const x of [50, 80, 110, 140]) s += circ(x, 74, 4, C.boton[(x / 30) | 0 % 4] ?? '#ffd54a', 0);
  for (const [x, y] of [[20, 20], [160, 24], [40, 100], [170, 104]]) s += circ(x, y, 2.5, '#fff1a8', 0);
  scene('cuadro_labluna', svg(192, 132, s));
  // Mesa blanca de laboratorio 664 × 116
  s = rect(4, 4, 656, 30, 8, C.mesa) + f('M12 24 h640 v8 h-640 z', C.mesaS) + rect(36, 36, 18, 76, 5, C.pata, 5) + rect(610, 36, 18, 76, 5, C.pata, 5) + line('M54 56 h556', C.mesaS, 6);
  scene('mueble_labluna_mesa', svg(664, 116, s));
}

// ---- Superficie lunar ----
{
  let s = bg(C.espacio);
  for (const [x, y, r] of [[20, 30, 3], [70, 90, 2], [120, 40, 3], [180, 120, 2], [230, 60, 3], [40, 180, 2], [150, 200, 3], [210, 230, 2], [90, 240, 2], [250, 160, 2]]) s += circ(x, y, r, '#fff1a8', 0);
  s += circ(200, 20, 1.5, '#ffffff', 0) + circ(60, 140, 1.5, '#ffffff', 0);
  scene('pared_superficie', tile(s));
  s = bg(C.regolito);
  for (const [x, y, r] of [[60, 70, 26], [190, 150, 34], [120, 220, 18], [220, 40, 14]]) s += circ(x, y, r, C.regolitoS, 0) + circ(x, y - 3, r - 6, C.crater, 0) + f(`M${x - r + 6} ${y - 2} a${r - 6} ${r - 6} 0 0 1 ${r} -${r - 8}`, '#ffffff', 'opacity=".3"');
  scene('piso_superficie', tile(s));
  // La Tierra en el cielo 224 × 224
  s = circ(112, 112, 104, K, 0) + earth(112, 112, 98);
  scene('ventana_superficie', svg(224, 224, s));
  // Platillo 208 × 120
  s = f('M70 116 l34 -70 l34 70 z', C.verdeA, 'opacity=".35"') + o('M10 66 c20 -22 168 -22 188 0 c-20 22 -168 22 -188 0 z', C.ovni, 5) + f('M30 72 c40 10 108 10 148 0 c-40 16 -108 16 -148 0 z', C.ovniS) + o('M62 54 c0 -36 84 -36 84 0 z', C.cupula, 4) + circ(104, 38, 14, C.verdeA, 4) + eyes(104, 36, 5, 3, false) + f('M70 50 c4 -20 20 -28 34 -24 c-14 4 -24 12 -34 24 z', '#ffffff', 'opacity=".8"');
  for (const x of [40, 80, 120, 160]) s += circ(x, 70, 5, C.boton[(x / 40 - 1) % 4], 0);
  scene('cuadro_superficie', svg(208, 120, s));
}
