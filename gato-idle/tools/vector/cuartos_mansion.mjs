// Mansión: salón (tapiz vino con flores de lis, mármol a cuadros, ventanal con cortinas doradas, retrato
// del gato rey, mesa de mármol con patas doradas, aparador), cine (pared acolchada, alfombra roja con
// palomitas, letrero EXIT, póster del gato con lentes, consola negra con luz azul) y alberca (azulejo
// celeste, loseta blanca, ventanal con palmeras, salvavidas, mesa de plástico).
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, eyes, nose, whiskers } from './lib.mjs';

const C = { ...P, vino: '#8e3a3f', vinoS: '#742c31', lis: '#e3b64e', marmol: '#f0ebe2', marmolS: '#d8d1c4', negro: '#2b2630', negroC: '#4a4352', cortina: '#f0b94a', cortinaS: '#c98f22', atardecer: '#f7a6c6', atardecerS: '#9a6fd1', cielo: '#5b4fb0',
  dorado: '#f2c14e', doradoS: '#c6922a', capa: '#d84a4a', caoba: '#9a5a30', caobaS: '#733f1f', caobaC: '#b87647',
  cine: '#7a2d38', cineS: '#5e2029', cineC: '#95404c', alfombra: '#b5322f', alfombraS: '#8e2423', palomita: '#ffe8a8', exit: '#5ef08a', exitS: '#1d3a2a', consola: '#1e2238', consolaS: '#13162a', consolaC: '#2f3556', azulN: '#4fd6ff',
  alberca: '#9fe1f2', albercaS: '#6fc7df', albercaC: '#d7f4fb', losetaB: '#f4f6f8', losetaBS: '#d4dbe1', palma: '#4fae57', palmaS: '#2f7d3a', tronco: '#b07a3e', arena: '#f3dca3', salva: '#ff7a3d', plastico: '#fbfbf5', plasticoS: '#d9d8cf' };

const tile = (body) => svg(256, 256, body);
const bg = (color) => `<rect width="256" height="256" fill="${color}"/>`;
const lis = (x, y, s) => f(`M${x} ${y - 14 * s} c${4 * s} ${6 * s} ${4 * s} ${12 * s} 0 ${18 * s} c-${4 * s} -${6 * s} -${4 * s} -${12 * s} 0 -${18 * s} z M${x - 9 * s} ${y - 2 * s} c${6 * s} -${4 * s} ${8 * s} ${2 * s} ${6 * s} ${6 * s} c-${2 * s} ${4 * s} -${8 * s} ${4 * s} -${6 * s} -${6 * s} z M${x + 9 * s} ${y - 2 * s} c-${6 * s} -${4 * s} -${8 * s} ${2 * s} -${6 * s} ${6 * s} c${2 * s} ${4 * s} ${8 * s} ${4 * s} ${6 * s} -${6 * s} z M${x - 5 * s} ${y + 6 * s} h${10 * s} v${3 * s} h-${10 * s} z`, C.lis);

// ---- Salón ----
{
  let s = bg(C.vino);
  for (const [x, y] of [[48, 60], [176, 60], [112, 180], [240, 180], [-16, 180]]) s += lis(x, y, 1.6);
  for (const [x, y] of [[112, 60], [240, 60], [48, 180], [176, 180]]) s += circ(x, y, 4, C.vinoS, 0);
  scene('pared_salon', tile(s));
  s = bg(C.marmolS);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const dark = (x + y) % 2 === 1; s += `<rect x="${x * 128 + 3}" y="${y * 128 + 3}" width="122" height="122" rx="4" fill="${dark ? C.negro : C.marmol}"/>` + line(`M${x * 128 + 20} ${y * 128 + 40} l30 20 l20 -10`, dark ? C.negroC : C.marmolS, 3); }
  scene('piso_salon', tile(s));
  // Ventanal de arco con cortinas doradas y atardecer 296 × 312
  s = o('M60 300 v-170 a88 88 0 0 1 176 0 v170 z', C.blanco, 6) + o('M76 290 v-160 a72 72 0 0 1 144 0 v160 z', C.cielo, 5);
  s += f('M76 200 h144 v90 h-144 z', C.atardecerS) + f('M76 240 h144 v50 h-144 z', C.atardecer) + circ(148, 236, 22, '#ffd27a', 0) + f('M76 236 h144 v6 h-144 z', '#ffd27a', 'opacity=".5"') + circ(188, 100, 10, '#fff1a8', 0) + circ(110, 86, 3, '#fff1a8', 0) + circ(136, 70, 3, '#fff1a8', 0);
  s += line('M148 58 v232 M76 160 h144 M76 220 h144', C.blanco, 10) + line('M148 58 v232 M76 160 h144 M76 220 h144', K, 4);
  s += rect(40, 290, 216, 20, 6, C.marmol);
  s += rect(16, 18, 264, 14, 7, C.doradoS, 5) + circ(14, 25, 11, C.dorado, 5) + circ(282, 25, 11, C.dorado, 5);
  s += o('M30 30 h50 c6 60 12 110 -4 160 c-4 16 2 46 -2 96 c-20 10 -46 10 -54 0 c6 -46 -2 -80 2 -120 c4 -50 6 -90 8 -136 z', C.cortina, 5);
  s += o('M266 30 h-50 c-6 60 -12 110 4 160 c4 16 -2 46 2 96 c20 10 46 10 54 0 c-6 -46 2 -80 -2 -120 c-4 -50 -6 -90 -8 -136 z', C.cortina, 5);
  s += f('M44 40 c4 60 8 100 -2 150 c8 4 14 4 20 0 c-10 -50 -6 -90 0 -150 z M252 40 c-4 60 -8 100 2 150 c-8 4 -14 4 -20 0 c10 -50 6 -90 0 -150 z', C.cortinaS, 'opacity=".55"');
  s += rect(18, 186, 54, 20, 10, C.doradoS, 5) + rect(224, 186, 54, 20, 10, C.doradoS, 5);
  scene('ventana_salon', svg(296, 312, s));
  // Retrato del gato rey con capa 204 × 192
  s = rect(6, 6, 192, 180, 8, C.dorado) + f('M14 14 h176 v164 h-176 z', C.doradoS, 'opacity=".35"') + rect(24, 24, 156, 144, 4, '#3b2e5e', 5);
  s += o('M52 168 c-4 -44 20 -64 50 -64 c30 0 54 20 50 64 z', C.capa, 5) + o('M70 168 c-4 -34 10 -50 32 -50 c22 0 36 16 32 50 z', P.naranja, 5) + f('M84 168 c0 -24 8 -36 18 -36 c10 0 18 12 18 36 z', P.crema);
  s += o('M64 78 l8 -26 l22 18 z M140 78 l-8 -26 l-22 18 z', P.naranja, 4) + circ(102, 84, 34, P.naranja, 5) + eyes(102, 84, 12, 6, false) + nose(102, 95, 6) + whiskers(102, 95, 12);
  s += o('M74 50 l10 -20 l10 12 l8 -16 l8 16 l10 -12 l10 20 z', C.dorado, 4) + circ(102, 44, 4, P.rojo, 0);
  for (const [x, y] of [[16, 16], [188, 16], [16, 176], [188, 176]]) s += circ(x, y, 7, C.doradoS, 3);
  scene('cuadro_salon', svg(204, 192, s));
  // Mesa de mármol con patas doradas curvas 792 × 158
  s = rect(4, 4, 784, 40, 10, C.marmol) + f('M12 32 h768 v10 h-768 z', C.marmolS) + line('M60 16 l60 10 l40 -6 M500 14 l70 12 M300 30 l50 -8', C.marmolS, 3);
  s += o('M70 44 c-30 30 -50 60 -40 100 c4 14 20 14 22 0 c2 -30 8 -56 36 -82 z', C.dorado, 5) + o('M722 44 c30 30 50 60 40 100 c-4 14 -20 14 -22 0 c-2 -30 -8 -56 -36 -82 z', C.dorado, 5);
  s += ell(36, 148, 18, 8, C.doradoS, 4) + ell(756, 148, 18, 8, C.doradoS, 4);
  scene('mueble_salon_mesa', svg(792, 158, s));
  // Aparador de caoba 1024 × 160
  s = rect(4, 4, 1016, 28, 8, C.caobaC) + f('M12 22 h1000 v8 h-1000 z', C.caobaS) + rect(10, 32, 1004, 110, 10, C.caoba, 5);
  for (let i = 0; i < 5; i++) { const x = 30 + i * 196; s += rect(x, 46, 176, 84, 8, C.caobaC, 5) + rect(x + 16, 58, 144, 60, 6, C.caoba, 4) + rect(x + 70, 82, 36, 10, 5, C.dorado, 4); }
  s += rect(30, 142, 40, 14, 4, C.caobaS, 4) + rect(954, 142, 40, 14, 4, C.caobaS, 4);
  scene('mueble_salon_mueble', svg(1024, 160, s));
}

// ---- Cine ----
{
  let s = bg(C.cineS);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) s += `<rect x="${x + 4}" y="${y + 4}" width="56" height="56" rx="14" fill="${C.cine}"/>` + circ(x + 32, y + 32, 5, C.cineS, 0) + `<rect x="${x + 12}" y="${y + 10}" width="30" height="10" rx="5" fill="${C.cineC}" opacity=".7"/>`;
  scene('pared_cine', tile(s));
  s = bg(C.alfombra);
  for (let y = 12; y < 256; y += 32) for (let x = (y / 32) % 2 ? 12 : 28; x < 256; x += 32) s += circ(x, y, 3, C.alfombraS, 0);
  for (const [x, y] of [[60, 70], [190, 180]]) s += circ(x, y, 10, C.palomita, 3) + circ(x - 6, y - 6, 4, '#ffffff', 0);
  scene('piso_cine', tile(s));
  // Letrero EXIT 148 × 64 (texto como formas)
  s = rect(4, 4, 140, 56, 8, C.exitS) + line('M20 18 h18 M20 32 h14 M20 46 h18 M20 18 v28', C.exit, 6) + line('M50 18 l16 28 M66 18 l-16 28', C.exit, 6) + line('M80 18 v28', C.exit, 6) + line('M94 18 h26 M107 18 v28', C.exit, 6) + f('M10 10 h128 v6 h-128 z', '#ffffff', 'opacity=".2"');
  scene('ventana_cine', svg(148, 64, s));
  // Póster: gato con lentes y fuego 240 × 176
  s = rect(6, 6, 228, 164, 8, '#1a1424') + f('M20 170 c10 -60 30 -90 50 -100 c-6 30 0 50 10 70 c6 -20 20 -30 30 -40 c0 30 14 50 30 60 c4 -24 14 -40 26 -50 c6 30 26 50 54 60 z', '#ff7a2a') + f('M60 170 c8 -40 20 -56 34 -62 c-4 20 2 34 10 46 c8 -12 14 -22 20 -30 c4 20 12 32 24 42 z', '#ffd166');
  s += o('M86 150 c-4 -36 16 -54 36 -54 c20 0 40 18 36 54 z', P.naranja, 5) + o('M92 76 l8 -24 l20 16 z M152 76 l-8 -24 l-20 16 z', P.naranja, 4) + circ(122, 86, 30, P.naranja, 5) + rect(94, 78, 26, 14, 5, K, 0) + rect(124, 78, 26, 14, 5, K, 0) + line('M120 84 h4', K, 4) + nose(122, 98, 6) + line('M116 108 q6 4 12 0', K, 4);
  scene('cuadro_cine', svg(240, 176, s));
  // Consola negra con luz azul 1000 × 134
  s = rect(4, 4, 992, 118, 10, C.consola) + rect(14, 10, 972, 8, 4, C.azulN, 0) + f('M14 10 h972 v4 h-972 z', '#c8f3ff', 'opacity=".7"');
  for (let i = 0; i < 3; i++) { const x = 28 + i * 322; s += rect(x, 32, 300, 76, 8, C.consolaC, 5) + circ(x + 150, 70, 5, C.azulN, 0); }
  s += rect(20, 122, 60, 10, 4, C.consolaS, 4) + rect(920, 122, 60, 10, 4, C.consolaS, 4);
  scene('mueble_cine_mueble', svg(1000, 134, s));
}

// ---- Alberca ----
{
  let s = bg(C.albercaS);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) s += `<rect x="${x + 4}" y="${y + 4}" width="56" height="56" rx="6" fill="${C.alberca}"/>` + `<rect x="${x + 10}" y="${y + 10}" width="40" height="10" rx="5" fill="${C.albercaC}" opacity=".8"/>`;
  scene('pared_alberca', tile(s));
  s = bg(C.losetaBS);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) s += `<rect x="${x + 3}" y="${y + 3}" width="58" height="58" rx="6" fill="${C.losetaB}"/>`;
  s += circ(80, 90, 6, C.albercaC, 0) + circ(190, 200, 4, C.albercaC, 0);
  scene('piso_alberca', tile(s));
  // Ventanal con palmeras 232 × 220
  s = rect(6, 6, 220, 196, 8, C.blanco) + rect(22, 22, 188, 164, 4, '#8fd8f8', 5) + f('M22 140 h188 v46 h-188 z', '#3ba9e0') + f('M22 160 h188 v26 h-188 z', C.arena) + rect(40, 130, 16, 60, 4, C.tronco, 4) + rect(170, 136, 14, 54, 4, C.tronco, 4);
  for (const [x, y] of [[48, 128], [176, 134]]) s += o(`M${x} ${y} c-30 -30 -60 -20 -70 0 c20 -4 40 4 70 0 z M${x} ${y} c30 -30 60 -20 70 0 c-20 -4 -40 4 -70 0 z M${x} ${y} c-10 -40 10 -60 30 -60 c-20 10 -24 40 -30 60 z M${x} ${y} c10 -40 -10 -60 -30 -60 c20 10 24 40 30 60 z`, C.palma, 4);
  s += line('M116 22 v164', K, 4) + rect(0, 202, 232, 18, 6, C.losetaBS);
  scene('ventana_alberca', svg(232, 220, s));
  // Salvavidas colgado 136 × 168
  s = rect(60, 4, 16, 30, 6, P.grisS, 4) + circ(68, 96, 60, C.salva, 6) + circ(68, 96, 30, '#8fd8f8', 5);
  for (const a of [0, 90, 180, 270]) s += g(`rotate(${a} 68 96)`, f('M50 40 h36 v22 h-36 z', '#ffffff'));
  s += circ(68, 96, 60, 'none', 6) + f('M30 60 c10 -14 26 -22 44 -20 c-14 2 -26 8 -36 20 z', '#ffffff', 'opacity=".6"');
  scene('cuadro_alberca', svg(136, 168, s));
  // Mesa de plástico 756 × 136
  s = rect(4, 4, 748, 34, 12, C.plastico) + f('M14 28 h728 v8 h-728 z', C.plasticoS) + rect(40, 40, 22, 92, 6, C.plastico, 5) + rect(694, 40, 22, 92, 6, C.plastico, 5) + line('M62 70 h632', C.plasticoS, 8);
  scene('mueble_alberca_mesa', svg(756, 136, s));
}
