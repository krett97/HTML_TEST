// Arte del juego dibujado en código (SVG → PNG con resvg). Mismo estilo que el juego del gato:
// contorno café K, dos tonos por color, brillos blancos con opacidad, formas redondas.
// Uso: npm run arte   (escribe src/assets/arte/*.png, src/assets/arte/iconos/*.png y el ícono de la app)
import { mkdirSync } from 'node:fs';
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, icon, eyes, render } from './lib.mjs';

const brillo = (cx, cy, rx, ry = rx * 0.6, op = 0.55) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${P.blanco}" opacity="${op}"/>`;

// ---- Slimes (96 × 84): una gota redonda con cara ----
function slime(base, sombra, claro, { enojado = false, casco = false } = {}) {
  const cuerpo = 'M10 70 C4 50 18 14 48 12 C78 14 92 50 86 70 C84 78 74 80 48 80 C22 80 12 78 10 70 Z';
  let s = o(cuerpo, base, 6);
  s += f('M14 66 C14 74 26 76 48 76 C70 76 82 74 82 66 C76 72 64 72 48 72 C32 72 20 72 14 66 Z', sombra);
  s += f('M20 40 C24 26 34 18 46 17 C34 22 26 32 24 44 Z', claro, 'opacity=".9"');
  s += brillo(32, 30, 8, 5, 0.75) + brillo(24, 42, 3, 3, 0.6);
  s += eyes(48, 48, 13, 8, false);
  if (enojado) s += line('M28 34 l14 6 M68 34 l-14 6', K, 5);
  s += line(enojado ? 'M40 64 q8 -5 16 0' : 'M40 61 q8 7 16 0', K, 4.5);
  if (casco) s += o('M26 22 C30 6 66 6 70 22 Z', P.grisS, 5) + f('M32 18 C36 10 52 9 58 12 C50 12 40 14 34 20 Z', P.blanco, 'opacity=".5"');
  return svg(96, 84, s);
}
scene('slime_verde', slime(P.limo, P.limoS, P.limoC));
scene('slime_azul', slime(P.agua, P.aguaS, P.aguaC, { enojado: true, casco: true }));
// El rojo, con resortera: la sostiene en alto con una patita de baba y mira con picardía (ceja levantada).
{
  const base = slime('#ff6b5e', '#d8443a', '#ffb3a8', { enojado: true }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const resortera = line('M84 46 L84 30', K, 8) + line('M84 46 L84 30', P.maderaS, 4)
    + line('M84 30 L76 14 M84 30 L92 14', K, 8) + line('M84 30 L76 14 M84 30 L92 14', P.maderaS, 4)
    + line('M76 14 Q84 28 92 14', '#8a2f3e', 3) + circ(84, 23, 4.5, P.piedraS, 3);
  const pata = o('M70 58 C78 56 84 52 86 46 l6 2 C90 58 80 64 70 64 Z', '#ff6b5e', 4);
  // Lienzo más alto: arriba cabe la resortera (el cuerpo queda en la misma posición respecto al piso).
  scene('slime_rojo', svg(104, 98, g('translate(0 14)', base + pata + resortera)));
}

// ---- El Rey Slime (200 × 214): el primer jefe. Un slime naranja enorme con corona de oro, capa roja,
// cejas de enojo y bigote. Se dibuja con el slime de siempre, más grande.
{
  const cuerpo = slime('#ffa53a', '#e07b1a', '#ffd59a', { enojado: true }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  let s = '';
  // Capa por detrás.
  s += o('M28 120 C14 150 16 186 24 200 H176 C184 186 186 150 172 120 Z', '#c8323f', 6) + f('M40 132 C30 156 32 178 36 186 H52 C46 170 46 150 52 132 Z', '#a52633');
  s += g('translate(18 52) scale(1.72)', cuerpo);
  // Bigote.
  s += o('M100 150 C88 140 72 142 66 152 C76 150 86 154 100 158 C114 154 124 150 134 152 C128 142 112 140 100 150 Z', K, 3);
  // Corona con picos y joyas.
  s += o('M54 66 L60 22 L80 46 L100 12 L120 46 L140 22 L146 66 Z', P.oro, 6);
  s += f('M60 58 H140 V66 H60 Z', P.oroS);
  s += circ(60, 22, 7, P.oro, 5) + circ(100, 12, 8, P.oro, 5) + circ(140, 22, 7, P.oro, 5);
  s += circ(100, 46, 8, P.rojo, 4) + circ(76, 52, 5.5, P.azul, 4) + circ(124, 52, 5.5, P.azul, 4);
  s += brillo(70, 40, 5, 9, 0.6);
  scene('jefe_rey', svg(200, 214, s));
}

// ---- Segunda zona: el campo de batalla ----
const GOB = { piel: '#7cc35a', pielS: '#5a9b3e', ropa: '#9b6a3c', ropaS: '#7a4f2a' };
const ORC = { piel: '#8aa070', pielS: '#677d52', metal: '#b9bfcc', metalS: '#8d93a6', cuero: '#8a5a34' };
const LOBO = { pelo: '#9aa0ad', peloS: '#6d7383', peloC: '#d5d9e2' };
const BLANCO = { pelo: '#f4f6fb', peloS: '#c5cbd8', peloC: '#ffffff' };
const lanzaVertical = (x, y0, y1) => line(`M${x} ${y0} V${y1}`, K, 7) + line(`M${x} ${y0} V${y1}`, P.maderaS, 3.5) + o(`M${x - 6} ${y0 + 2} L${x} ${y0 - 14} L${x + 6} ${y0 + 2} Z`, '#dfe5ee', 4);
const cejas = (cx, cy, sep) => line(`M${cx - sep - 8} ${cy - 9} l10 5 M${cx + sep + 8} ${cy - 9} l-10 5`, K, 4);

// Goblin verde con lanza (96 × 104): orejas puntiagudas, ojos amarillos y sonrisa con dientes.
{
  let s = lanzaVertical(80, 18, 100);
  s += o('M28 70 C26 82 24 94 24 100 H70 C70 94 68 82 66 70 Z', GOB.ropa, 5) + f('M47 72 V100 H56 C55 90 54 80 53 72 Z', GOB.ropaS);
  s += o('M64 74 C72 72 76 70 80 66 l4 6 C80 78 72 82 66 84 Z', GOB.piel, 4);
  s += o('M10 34 L28 40 L24 50 Z', GOB.piel, 4) + o('M86 34 L68 40 L72 50 Z', GOB.piel, 4);
  s += circ(48, 46, 24, GOB.piel, 6) + f('M30 58 C36 68 60 68 66 58 C60 64 36 64 30 58 Z', GOB.pielS);
  for (const x of [38, 58]) s += ell(x, 44, 6.5, 6, P.amarillo, 3.5) + circ(x + 1, 45, 2.6, K, 0);
  s += cejas(48, 44, 10);
  s += o('M36 56 Q48 64 60 56 Q48 60 36 56 Z', '#4a2a2a', 3) + f('M42 57 l2 3 l2 -3 Z M50 57 l2 3 l2 -3 Z', P.blanco);
  s += brillo(38, 30, 7, 4, 0.5);
  scene('goblin', svg(96, 104, s));
}
// Lobo gris (112 × 84), de lado mirando a la derecha.
function lobo(c, { hoz = false, enojado = false } = {}) {
  let s = '';
  s += o('M16 42 C4 34 2 20 8 12 C14 24 20 30 30 34 Z', c.pelo, 5);
  for (const [x, y] of [[30, 58], [42, 60], [62, 60], [74, 58]]) s += rect(x, y, 9, 20, 4, c.peloS, 4);
  s += ell(52, 48, 31, 18, c.pelo, 6) + f('M30 54 C40 64 66 64 78 52 C70 60 42 62 30 54 Z', c.peloS) + ell(70, 50, 10, 9, c.peloC, 0);
  s += o('M74 22 L78 6 L86 20 Z M86 20 L94 6 L96 24 Z', c.pelo, 4);
  s += circ(84, 34, 16, c.pelo, 6);
  s += o('M92 30 C100 32 108 36 110 42 C106 48 98 48 90 46 Z', c.peloC, 5) + circ(108, 40, 3.4, K, 0);
  s += line('M96 46 Q102 48 108 45', K, 3);
  s += circ(86, 30, 3.4, enojado ? '#d8443a' : K, 0) + circ(87, 29, 1.2, P.blanco, 0);
  if (enojado) s += line('M80 24 l10 3', K, 4);
  if (hoz) {
    // La hoz atravesada en el hocico: mango de madera y hoja curva plateada.
    s += line('M70 46 L116 40', K, 8) + line('M70 46 L116 40', P.maderaS, 4);
    s += o('M112 41 C128 46 136 62 128 80 C124 66 118 56 106 50 Z', '#dfe5ee', 4) + line('M127 74 C124 62 118 54 110 50', P.blanco, 2);
  }
  return s;
}
scene('lobo', svg(112, 84, lobo(LOBO)));
scene('loboBlanco', svg(140, 96, g('translate(0 6)', lobo(BLANCO, { hoz: true, enojado: true }))));
// Orco (112 × 112): verde grisáceo, colmillos, casco con cuernitos, peto de metal y garrote.
function orco({ arco = false } = {}) {
  let s = '';
  if (arco) s += line('M90 22 C110 44 110 82 90 104', K, 9) + line('M90 22 C110 44 110 82 90 104', P.madera, 5) + line('M90 22 L90 104', P.blanco, 2);
  else s += o('M84 40 C96 34 104 40 100 52 L84 92 L76 88 Z', P.maderaS, 5) + circ(96, 44, 3, K, 0) + circ(90, 54, 2.5, K, 0);
  s += o('M24 66 C20 84 18 100 18 110 H92 C92 100 90 84 86 66 Z', arco ? ORC.cuero : ORC.metal, 6);
  if (!arco) s += line('M24 80 H88 M28 94 H86', ORC.metalS, 3);
  s += o('M78 70 C84 70 88 74 88 80 l-4 4 C84 78 82 76 76 76 Z', ORC.piel, 4);
  s += circ(55, 44, 26, ORC.piel, 6) + f('M32 54 C40 70 70 70 78 54 C70 64 40 64 32 54 Z', ORC.pielS);
  s += circ(45, 42, 3.4, '#d8443a', 0) + circ(65, 42, 3.4, '#d8443a', 0) + cejas(55, 42, 9);
  s += o('M42 58 Q55 54 68 58', 'none', 4) + o('M44 58 l3 -9 l3 9 Z M62 58 l3 -9 l3 9 Z', P.blanco, 3);
  if (arco) s += o('M28 36 C30 14 48 6 56 6 C66 6 82 14 82 36 C74 24 66 20 55 20 C44 20 36 24 28 36 Z', ORC.cuero, 5);
  else s += o('M28 32 C30 16 42 10 55 10 C68 10 80 16 82 32 Z', ORC.metal, 5) + o('M30 24 L18 12 L30 18 Z M80 24 L92 12 L80 18 Z', P.crema, 4);
  return s;
}
scene('orco', svg(112, 112, orco()));
scene('orcoArquero', svg(112, 112, orco({ arco: true })));
// ---- Pradera amarilla (niveles 21–30) ----
// Lobo negro: el mismo lobo, oscuro y con ojos rojos.
scene('loboNegro', svg(112, 84, lobo({ pelo: '#4a4a58', peloS: '#2c2c36', peloC: '#7a7a8c' }, { enojado: true })));
// Araña gigante (112 × 84): abdomen grande con marca roja, ocho patas dobladas y un racimo de ojos rojos.
{
  const ARA = { cuerpo: '#4a3550', sombra: '#33243a', claro: '#7a5a86' };
  let s = '';
  for (const [x0, y0, x1, y1, x2, y2] of [[44, 50, 22, 26, 6, 58], [48, 54, 28, 40, 12, 74], [62, 54, 80, 40, 98, 74], [66, 50, 88, 26, 106, 58], [50, 56, 36, 58, 24, 80], [60, 56, 74, 58, 86, 80], [46, 48, 30, 16, 18, 34], [64, 48, 80, 16, 92, 34]])
    s += line(`M${x0} ${y0} L${x1} ${y1} L${x2} ${y2}`, K, 8) + line(`M${x0} ${y0} L${x1} ${y1} L${x2} ${y2}`, ARA.sombra, 4);
  s += ell(55, 40, 24, 20, ARA.cuerpo, 6) + f('M38 50 C46 60 66 60 74 50 C66 56 46 56 38 50 Z', ARA.sombra) + o('M50 30 L55 24 L60 30 L55 44 Z', '#d8443a', 3);
  s += ell(55, 62, 15, 12, ARA.cuerpo, 6) + brillo(46, 28, 7, 4, 0.4);
  for (const [x, y, r] of [[50, 60, 3.2], [60, 60, 3.2], [46, 66, 2.2], [64, 66, 2.2], [55, 56, 2]]) s += circ(x, y, r, '#ff4a3a', 0) + circ(x - 0.8, y - 0.8, 0.8, P.blanco, 0);
  s += o('M51 72 l-3 6 l5 -2 Z M59 72 l3 6 l-5 -2 Z', P.crema, 2.5);
  scene('arana', svg(112, 84, s));
}
// Esqueleto con espada y escudo (96 × 112): cráneo, costillas, espada a un lado y escudo redondo al frente.
{
  const HUE = { hueso: '#efe8d6', huesoS: '#c9bfa6' };
  let s = '';
  s += line('M78 20 L84 76', K, 8) + line('M78 20 L84 76', '#dfe5ee', 4) + rect(74, 72, 18, 6, 3, P.oroS, 3) + rect(80, 76, 6, 14, 3, P.maderaS, 3);
  s += o('M34 62 C34 80 36 96 38 108 H62 C64 96 66 80 66 62 Z', HUE.huesoS, 5) + line('M50 64 V104 M38 72 H62 M38 82 H62 M40 92 H60', HUE.hueso, 3.5);
  s += circ(50, 36, 22, HUE.hueso, 6) + f('M30 44 C36 58 64 58 70 44 C64 52 36 52 30 44 Z', HUE.huesoS);
  s += ell(42, 36, 6, 7, '#2b1d16', 0) + ell(58, 36, 6, 7, '#2b1d16', 0) + circ(42, 37, 1.8, '#ff6b5e', 0) + circ(58, 37, 1.8, '#ff6b5e', 0);
  s += o('M47 46 L50 42 L53 46 Z', '#2b1d16', 0) + rect(40, 50, 20, 7, 2, HUE.hueso, 3) + line('M45 50 V57 M50 50 V57 M55 50 V57', K, 1.6);
  s += circ(26, 78, 20, P.maderaS, 6) + circ(26, 78, 13, P.madera, 0) + circ(26, 78, 20, 'none', 0) + `<circle cx="26" cy="78" r="17" fill="none" stroke="${P.grisS}" stroke-width="4"/>` + circ(26, 78, 4.5, P.grisS, 3);
  scene('esqueleto', svg(96, 112, s));
}
// Bandido con dagas (96 × 104): capucha café, pañoleta roja tapando la boca, ojos entrecerrados y una daga en cada mano.
{
  const BAN = { capa: '#6a4a3a', capaS: '#4e3528', piel: '#e8b98f', panuelo: '#b8352c' };
  let s = '';
  const daga = (x, y, rot) => g(`rotate(${rot} ${x} ${y})`, o(`M${x - 3} ${y} L${x} ${y - 20} L${x + 3} ${y} Z`, '#dfe5ee', 3) + rect(x - 6, y, 12, 4, 2, P.oroS, 2.5) + rect(x - 2, y + 4, 4, 9, 2, P.maderaS, 2.5));
  s += o('M22 64 C18 82 16 96 16 102 H80 C80 96 78 82 74 64 Z', BAN.capa, 6) + f('M48 66 V102 H60 C60 90 58 78 56 66 Z', BAN.capaS);
  s += daga(14, 70, -30) + daga(82, 70, 30);
  s += circ(14, 76, 6, BAN.piel, 4) + circ(82, 76, 6, BAN.piel, 4);
  s += o('M20 50 C20 22 34 10 48 10 C62 10 76 22 76 50 C76 64 64 70 48 70 C32 70 20 64 20 50 Z', BAN.capa, 6);
  s += o('M30 44 C30 32 38 26 48 26 C58 26 66 32 66 44 C66 56 58 62 48 62 C38 62 30 56 30 44 Z', BAN.piel, 4);
  s += o('M30 48 C38 54 58 54 66 48 L66 56 C58 64 38 64 30 56 Z', BAN.panuelo, 4);
  s += line('M36 40 l8 2 M60 40 l-8 2', K, 3.5) + circ(41, 44, 2.6, K, 0) + circ(55, 44, 2.6, K, 0);
  s += brillo(38, 22, 7, 4, 0.35);
  scene('bandido', svg(96, 104, s));
}
// Lo que hay tirado en la pradera: cráneos, cascos y petos abollados.
scene('craneo', svg(60, 46, ell(30, 40, 24, 5, '#00000022', 0) + o('M10 26 C10 12 20 4 30 4 C40 4 50 12 50 26 C50 32 46 36 42 38 V42 H18 V38 C14 36 10 32 10 26 Z', '#efe8d6', 4) + ell(22, 24, 5.5, 6, '#2b1d16', 0) + ell(38, 24, 5.5, 6, '#2b1d16', 0) + o('M28 32 L30 28 L32 32 Z', '#2b1d16', 0) + line('M24 38 V42 M30 38 V42 M36 38 V42', K, 1.8)));
scene('casco', svg(58, 44, o('M6 34 C6 16 16 6 29 6 C42 6 52 16 52 34 Z', '#b9bfcc', 5) + rect(4, 30, 50, 8, 3, '#8d93a6', 4) + line('M29 8 V30', '#8d93a6', 3) + o('M14 20 l6 4 l-2 6 Z', '#6d7383', 0) + brillo(18, 14, 5, 3, 0.6)));
scene('peto', svg(56, 50, o('M8 10 C18 4 38 4 48 10 L44 42 C36 48 20 48 12 42 Z', '#b9bfcc', 5) + line('M28 8 V44 M14 22 H42', '#8d93a6', 3) + o('M38 26 l6 -4 l-2 8 Z', '#6d7383', 0) + brillo(18, 14, 5, 3, 0.5)));
// ---- Desierto (niveles 31–40) ----
scene('cactus', svg(54, 70, o('M22 66 V16 C22 6 34 6 34 16 V66 Z', '#5fa55a', 5) + o('M22 40 H12 C6 40 6 34 6 30 V22 C6 16 14 16 14 22 V32 H22', '#5fa55a', 5) + o('M34 32 H42 V20 C42 14 50 14 50 20 V30 C50 38 46 42 40 42 H34', '#5fa55a', 5) + line('M28 14 V60', '#3f8040', 2.5) + f('M16 68 H40 V70 H16 Z', '#00000022')));
scene('vasija', svg(52, 48, o('M14 10 H38 L36 16 C46 22 48 34 42 42 C38 46 14 46 10 42 C4 34 6 22 16 16 Z', '#c8703a', 5) + line('M12 28 H40', '#e8a46a', 4) + o('M30 30 L40 24 L44 40 Z', '#8a4a24', 0) + brillo(18, 22, 4, 3, 0.5)));
// Escorpión gigante (120 × 84): caparazón café rojizo, tenazas al frente y la cola curva con aguijón.
{
  const ESC = { cuerpo: '#c06a36', sombra: '#8f4a22', claro: '#e89a5e' };
  let s = '';
  for (const [x0, y0, x1, y1] of [[40, 56, 26, 76], [52, 60, 44, 80], [66, 60, 74, 80], [78, 56, 92, 76]]) s += line(`M${x0} ${y0} L${x1} ${y1}`, K, 7) + line(`M${x0} ${y0} L${x1} ${y1}`, ESC.sombra, 3.5);
  s += o('M30 52 C38 28 22 10 40 4 C52 0 60 10 54 18 L50 14 C52 8 42 8 42 16 C42 26 48 36 44 50 Z', ESC.cuerpo, 5) + o('M50 12 L60 6 L56 18 Z', P.crema, 3);
  s += ell(60, 52, 28, 14, ESC.cuerpo, 6) + line('M44 46 V58 M56 44 V60 M68 44 V60 M78 46 V58', ESC.sombra, 3) + brillo(52, 44, 8, 3, 0.4);
  s += line('M84 50 L98 42', K, 8) + line('M84 50 L98 42', ESC.sombra, 4) + o('M96 34 C110 30 118 40 112 48 L104 44 L110 40 C106 36 100 38 98 42 Z', ESC.cuerpo, 4);
  s += line('M84 58 L100 62', K, 8) + line('M84 58 L100 62', ESC.sombra, 4) + o('M98 56 C112 52 118 64 112 70 L104 64 L110 62 C106 58 100 60 100 62 Z', ESC.cuerpo, 4);
  s += circ(86, 48, 2.6, K, 0) + circ(90, 52, 2.6, K, 0);
  scene('escorpion', svg(120, 84, s));
}
// Bandido del desierto (96 × 104): turbante y pañoleta arena, ojos entrecerrados y una cimitarra.
function bandidoDesierto({ lider = false } = {}) {
  const T = lider ? { tela: '#a8322c', telaS: '#7e2420', ropa: '#3e3a56' } : { tela: '#e2c48c', telaS: '#b99a5e', ropa: '#c8a066' };
  const piel = '#c98b5c';
  let s = '';
  // Cimitarra curva en la mano derecha (el líder, también en la izquierda).
  const cimitarra = (x, y, flip) => g(`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`, o('M0 0 C10 -8 16 -24 12 -40 C20 -26 18 -8 4 4 Z', '#dfe5ee', 3.5) + rect(-4, 2, 10, 4, 2, P.oroS, 2.5) + rect(-1, 6, 5, 10, 2, P.maderaS, 2.5));
  s += o('M22 64 C18 82 16 96 16 102 H80 C80 96 78 82 74 64 Z', T.ropa, 6) + f('M48 66 V102 H60 C60 90 58 78 56 66 Z', '#00000022');
  if (lider) s += line('M22 72 L74 92', P.oroS, 5) + circ(48, 82, 4, P.amarillo, 3);
  s += cimitarra(78, 66, false) + circ(80, 76, 6, piel, 4);
  if (lider) s += cimitarra(14, 66, true);
  s += circ(14, 76, 6, piel, 4);
  s += o('M30 46 C30 32 38 26 48 26 C58 26 66 32 66 46 C66 58 58 64 48 64 C38 64 30 58 30 46 Z', piel, 5);
  s += o('M28 50 C36 58 60 58 68 50 L68 58 C60 68 36 68 28 58 Z', T.tela, 4);
  s += o('M24 36 C22 16 36 8 48 8 C60 8 74 16 72 36 C64 28 32 28 24 36 Z', T.tela, 5) + line('M28 26 C40 20 56 20 68 26', T.telaS, 3);
  if (lider) s += o('M44 12 l4 -6 l4 6 Z', P.amarillo, 2.5) + circ(48, 14, 3, '#5bd1a8', 2);
  s += line('M37 40 l8 2 M59 40 l-8 2', K, 3.5) + circ(42, 44, 2.6, K, 0);
  s += lider ? o('M51 40 H60 V47 H51 Z', K, 0) + line('M48 38 L64 34', K, 2) : circ(55, 44, 2.6, K, 0);
  return s;
}
scene('bandidoDesierto', svg(96, 104, bandidoDesierto()));
scene('liderBandido', svg(140, 150, g('translate(10 0) scale(1.25)', bandidoDesierto({ lider: true }))));
// Minotauro guerrero (120 × 120): cabeza de toro con cuernos, argolla en la nariz, peto de cuero y hacha.
{
  const MIN = { pelo: '#8a5a3a', peloS: '#6a4128', hocico: '#c89a7a' };
  let s = '';
  s += line('M96 18 L88 108', K, 9) + line('M96 18 L88 108', P.maderaS, 5) + o('M92 16 C112 10 118 30 110 44 C104 36 98 32 94 32 Z', '#dfe5ee', 4) + o('M96 16 C80 10 76 28 82 40 C86 34 90 30 94 30 Z', '#c9d0dc', 4);
  s += o('M26 70 C22 88 20 104 20 116 H96 C96 104 94 88 90 70 Z', MIN.pelo, 6) + o('M32 74 H84 L80 100 H36 Z', '#7a4f2a', 4) + line('M58 74 V100', '#5a3a20', 3);
  s += o('M86 74 C92 76 96 80 96 86 l-6 4 C88 84 84 80 80 80 Z', MIN.pelo, 4);
  s += o('M20 30 C6 26 2 12 8 4 C12 14 18 20 30 22 Z', P.crema, 4) + o('M96 30 C110 26 114 12 108 4 C104 14 98 20 86 22 Z', P.crema, 4);
  s += circ(58, 42, 28, MIN.pelo, 6) + f('M34 52 C42 68 74 68 82 52 C74 62 42 62 34 52 Z', MIN.peloS);
  s += ell(58, 56, 16, 11, MIN.hocico, 4) + circ(52, 56, 2.4, K, 0) + circ(64, 56, 2.4, K, 0) + `<circle cx="58" cy="64" r="5" fill="none" stroke="${P.oroS}" stroke-width="3"/>`;
  s += circ(46, 38, 3.4, '#d8443a', 0) + circ(70, 38, 3.4, '#d8443a', 0) + cejas(58, 38, 10);
  scene('minotauro', svg(120, 120, s));
}
// Cíclope guerrero (124 × 128): gigante gris azulado con un solo ojo, casco y garrote con clavos.
{
  const CIC = { piel: '#9fb4c8', pielS: '#7a90a6' };
  let s = '';
  s += o('M92 40 C104 32 114 40 110 54 L92 108 L82 104 Z', P.maderaS, 5) + circ(104, 44, 3, '#dfe5ee', 2) + circ(98, 58, 3, '#dfe5ee', 2) + circ(108, 56, 3, '#dfe5ee', 2);
  s += o('M24 72 C20 92 18 110 18 124 H98 C98 110 96 92 92 72 Z', '#8a6a4a', 6) + line('M22 96 H96', '#6a4f34', 4) + rect(52, 92, 14, 10, 2, P.oroS, 3);
  s += o('M88 76 C94 78 98 82 98 88 l-6 4 C90 86 86 82 82 82 Z', CIC.piel, 4);
  s += circ(58, 46, 32, CIC.piel, 6) + f('M30 58 C38 76 78 76 86 58 C78 70 38 70 30 58 Z', CIC.pielS);
  s += circ(58, 42, 13, P.blanco, 5) + circ(60, 43, 6.5, '#d8443a', 0) + circ(60, 43, 3, K, 0) + circ(57, 40, 1.8, P.blanco, 0);
  s += line('M42 28 L74 28', K, 5) + o('M44 64 Q58 58 72 64 Q58 70 44 64 Z', '#4a2a2a', 3) + o('M50 64 l2 4 l2 -4 Z M62 64 l2 4 l2 -4 Z', P.blanco, 0);
  s += o('M26 26 C28 10 44 4 58 4 C72 4 88 10 90 26 C80 18 70 16 58 16 C46 16 36 18 26 26 Z', '#b9bfcc', 5) + o('M56 2 L58 -8 L60 2 Z', '#8d93a6', 3);
  scene('ciclope', svg(124, 128, g('translate(0 6)', s)));
}
// El jefe del nivel 30: Esqueleto Mago de fuego (140 × 160): sombrero morado de mago, túnica, bastón con llama.
{
  const HUE = { hueso: '#efe8d6', huesoS: '#c9bfa6' };
  let s = '';
  s += line('M112 40 L104 152', K, 9) + line('M112 40 L104 152', P.maderaS, 5);
  s += g('translate(94 -2) scale(0.56)', o('M32 4 c4 14 20 20 20 36 a20 20 0 0 1 -40 0 c0 -10 6 -14 8 -22 c4 6 6 8 8 8 c0 -8 2 -16 4 -22 z', P.fuego, 7) + f('M32 30 c2 8 10 10 10 18 a10 10 0 0 1 -20 0 c0 -6 4 -8 6 -12 c2 3 3 3 4 3 z', P.fuegoC));
  s += o('M34 92 C28 116 24 138 22 154 H112 C110 138 106 116 100 92 Z', '#5a3a8a', 6) + line('M44 110 H92 M40 130 H96', '#3e2766', 4) + o('M60 92 L67 152 L74 92 Z', '#3e2766', 0);
  s += o('M98 98 C106 98 110 102 110 108 l-6 4 C102 106 98 104 94 104 Z', HUE.hueso, 4);
  s += circ(67, 66, 28, HUE.hueso, 6) + f('M42 76 C50 92 84 92 92 76 C84 86 50 86 42 76 Z', HUE.huesoS);
  s += ell(57, 66, 8, 9, '#2b1d16', 0) + ell(77, 66, 8, 9, '#2b1d16', 0) + circ(57, 67, 3.4, '#ff8a2a', 0) + circ(77, 67, 3.4, '#ff8a2a', 0) + circ(57, 67, 1.4, P.amarillo, 0) + circ(77, 67, 1.4, P.amarillo, 0);
  s += o('M63 78 L67 72 L71 78 Z', '#2b1d16', 0) + rect(55, 82, 24, 8, 2, HUE.hueso, 3) + line('M61 82 V90 M67 82 V90 M73 82 V90', K, 1.8);
  s += o('M30 48 C44 44 90 44 104 48 C96 54 38 54 30 48 Z', '#5a3a8a', 5) + o('M44 46 C50 26 56 10 74 2 C70 14 78 30 90 46 Z', '#5a3a8a', 5) + o('M72 6 l6 -4 l-1 8 Z', '#5a3a8a', 3) + o('M60 34 l3 6 l6 1 l-4.5 4 l1 6 l-5.5 -3 l-5.5 3 l1 -6 l-4.5 -4 l6 -1 z', P.amarillo, 2.5);
  scene('esqueletoMago', svg(140, 160, s));
}
// ---- Montaña de piedra (niveles 41–50) ----
scene('pena', svg(70, 52, o('M6 46 C4 30 14 14 30 10 C44 6 60 14 64 28 C68 40 62 48 52 48 Z', '#9a958c', 5) + f('M14 40 C24 46 50 46 60 38 C56 46 20 48 14 40 Z', '#7f7a72') + line('M26 20 l6 8 l-4 8', '#7f7a72', 2.5) + brillo(26, 18, 7, 3, 0.4)));
scene('pino', svg(46, 72, rect(20, 56, 6, 14, 2, P.maderaS, 3) + o('M23 2 L40 26 H30 L42 44 H30 L44 60 H2 L16 44 H4 L16 26 H6 Z', '#3f7a58', 4) + line('M14 34 L22 30 M30 50 L22 46', '#2f5e44', 2.5)));
// Gólem de piedra (120 × 124): bloques de roca con musgo, ojos brillantes y brazos enormes.
{
  const R = { roca: '#9a958c', sombra: '#7a756c', musgo: '#7cb85a' };
  let s = '';
  s += o('M12 60 C6 74 8 92 18 100 L30 96 C26 84 26 72 30 62 Z', R.roca, 5) + o('M108 60 C114 74 112 92 102 100 L90 96 C94 84 94 72 90 62 Z', R.roca, 5);
  s += o('M30 82 L28 120 H52 L54 90 Z M90 82 L92 120 H68 L66 90 Z', R.sombra, 5);
  s += o('M24 48 C22 30 40 18 60 18 C80 18 98 30 96 48 L92 92 C80 100 40 100 28 92 Z', R.roca, 6) + line('M40 40 l10 8 l-6 10 M78 58 l-8 6 l6 10', R.sombra, 3);
  s += o('M36 22 C44 14 60 12 72 16 C66 20 50 22 36 22 Z', R.musgo, 3) + circ(84, 30, 5, R.musgo, 3);
  s += o('M42 34 H54 V42 H42 Z M66 34 H78 V42 H66 Z', '#2b2622', 0) + rect(44, 36, 8, 4, 2, '#7ef0ff', 0) + rect(68, 36, 8, 4, 2, '#7ef0ff', 0);
  s += line('M48 56 H72', '#2b2622', 4);
  scene('golem', svg(120, 124, s));
  scene('golemito', svg(60, 56, o('M8 40 C4 22 18 8 32 8 C46 8 56 20 52 38 C50 50 14 52 8 40 Z', R.roca, 5) + rect(18, 22, 7, 5, 2, '#7ef0ff', 0) + rect(34, 22, 7, 5, 2, '#7ef0ff', 0) + line('M24 34 H36', '#2b2622', 3) + o('M14 12 C20 6 30 6 36 8 C30 10 22 12 14 12 Z', R.musgo, 2.5)));
}
// Guerrero de hierro (100 × 112): armadura completa, yelmo con visera y pluma roja, espada y escudo.
function hierro({ arco = false } = {}) {
  const H = { metal: '#b9bfcc', metalS: '#8d93a6', oscuro: '#5c6276' };
  let s = '';
  if (arco) s += line('M84 26 C102 48 102 84 84 104', K, 9) + line('M84 26 C102 48 102 84 84 104', H.oscuro, 5) + line('M84 26 L84 104', P.blanco, 2);
  else s += line('M86 24 L80 92', K, 8) + line('M86 24 L80 92', '#dfe5ee', 4) + rect(72, 88, 18, 6, 3, H.oscuro, 3) + rect(78, 94, 6, 12, 3, P.maderaS, 3);
  s += o('M26 64 C22 82 20 98 20 110 H80 C80 98 78 82 74 64 Z', H.metal, 6) + line('M50 66 V108 M26 86 H74', H.metalS, 3) + circ(50, 76, 4, H.oscuro, 3);
  s += o('M76 70 C82 70 86 74 86 80 l-4 4 C82 78 80 76 74 76 Z', H.metal, 4);
  s += o('M28 44 C28 22 38 12 50 12 C62 12 72 22 72 44 C72 58 62 64 50 64 C38 64 28 58 28 44 Z', H.metal, 6) + rect(34, 36, 32, 8, 2, '#2b2622', 3) + line('M50 14 V36', H.metalS, 3);
  s += circ(42, 40, 2, '#ffd23f', 0) + circ(58, 40, 2, '#ffd23f', 0);
  s += o('M50 12 C54 2 66 0 72 6 C64 6 58 10 54 16 Z', P.rojo, 4) + brillo(38, 22, 6, 4, 0.5);
  if (!arco) s += circ(22, 80, 18, H.oscuro, 6) + circ(22, 80, 11, H.metal, 0) + o('M22 70 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z', P.rojo, 2.5);
  return s;
}
scene('guerreroHierro', svg(100, 112, hierro()));
scene('arqueroHierro', svg(100, 112, hierro({ arco: true })));
// Dragón pequeño (120 × 96): rojo con alas, cuernitos y una llamita en el hocico.
function dragon(c, { grande = false } = {}) {
  let s = '';
  s += o('M54 46 C40 20 20 10 6 14 C18 24 22 34 24 44 C30 40 40 42 54 46 Z', c.ala, 5) + line('M10 16 L30 42 M20 18 L36 42', c.sombra, 2.5);
  s += o('M66 46 C80 20 100 10 114 14 C102 24 98 34 96 44 C90 40 80 42 66 46 Z', c.ala, 5) + line('M110 16 L90 42 M100 18 L84 42', c.sombra, 2.5);
  s += o('M40 62 C24 66 14 74 8 86 C20 80 30 78 42 76 Z', c.cuerpo, 5) + o('M6 88 l4 -10 l6 6 Z', c.cuerno, 3);
  s += ell(60, 60, 24, 18, c.cuerpo, 6) + ell(60, 66, 14, 9, c.panza, 0);
  if (grande) for (const [x, y] of [[48, 52], [60, 50], [72, 52], [54, 58], [66, 58]]) s += o(`M${x - 4} ${y} L${x} ${y - 5} L${x + 4} ${y} L${x} ${y + 4} Z`, c.escama, 2);
  s += o('M74 44 C80 30 96 28 104 36 C110 42 108 52 98 54 C90 56 80 54 74 50 Z', c.cuerpo, 5);
  s += o('M82 30 L80 20 L88 28 Z M94 30 L98 20 L100 32 Z', c.cuerno, 3);
  s += circ(92, 40, 3.2, '#ffd23f', 0) + circ(92, 40, 1.6, K, 0) + circ(104, 46, 1.6, K, 0);
  s += o('M108 48 C116 46 120 50 118 54 C114 56 110 54 108 52 Z', '#ff8a2a', 3);
  for (const x of [50, 66]) s += rect(x, 72, 8, 12, 3, c.sombra, 4);
  return s;
}
scene('dragoncito', svg(120, 96, dragon({ cuerpo: '#e0603c', sombra: '#a8402a', ala: '#f08a5a', panza: '#ffd59a', cuerno: P.crema })));
// El jefe del nivel 50: Dragón de escamas de acero (180 × 144), plateado con escamas marcadas.
scene('dragonAcero', svg(180, 144, g('scale(1.5)', dragon({ cuerpo: '#9aa3b4', sombra: '#5c6276', ala: '#b9c1d0', panza: '#dfe5ee', cuerno: '#3e4352', escama: '#dfe5ee' }, { grande: true })) + `<circle cx="138" cy="60" r="5" fill="#ff4a3a"/>`));
// La telaraña que deja enredado a un arquero.
scene('telarana', svg(64, 64, `<g fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity=".95">` + [0, 45, 90, 135].map((a) => `<path d="M32 32 L${32 + 30 * Math.cos((a * Math.PI) / 180)} ${32 + 30 * Math.sin((a * Math.PI) / 180)} M32 32 L${32 - 30 * Math.cos((a * Math.PI) / 180)} ${32 - 30 * Math.sin((a * Math.PI) / 180)}"/>`).join('') + [10, 19, 28].map((r) => `<polygon points="${Array.from({ length: 8 }, (_, i) => `${32 + r * Math.cos((i * Math.PI) / 4)},${32 + r * Math.sin((i * Math.PI) / 4)}`).join(' ')}"/>`).join('') + '</g>'));
// Lo que hay tirado en el campo de batalla.
scene('espada', svg(90, 30, g('rotate(-12 45 15)', o('M18 12 H74 L82 15 L74 18 H18 Z', '#dfe5ee', 4) + line('M22 15 H72', '#a9b3c4', 2) + rect(12, 6, 6, 18, 2, P.oroS, 3) + rect(2, 11, 12, 8, 3, P.maderaS, 3))));
scene('tabla', svg(90, 34, g('rotate(8 45 17)', rect(4, 8, 82, 18, 4, P.madera, 4) + line('M10 14 H60 M24 20 H80', P.maderaS, 2) + circ(12, 17, 2, K, 0) + circ(78, 17, 2, K, 0))));
scene('escudo', svg(54, 40, ell(27, 22, 24, 15, P.maderaS, 5) + ell(27, 22, 16, 9, P.madera, 0) + ell(27, 22, 5, 3, P.grisS, 3) + line('M8 22 H46', '#8a7f70', 3)));

// ---- El mago (120 × 150): túnica y sombrero morados con estrellas, barba blanca, bastón con cristal ----
{
  let s = '';
  // Bastón
  s += line('M98 40 L90 146', K, 12) + line('M98 40 L90 146', P.maderaS, 6);
  s += o('M98 14 l10 14 l-10 14 l-10 -14 z', P.magiaC, 5) + brillo(96, 22, 3, 4, 0.8);
  // Túnica
  s += o('M30 70 C26 100 18 130 14 144 H86 C82 130 74 100 70 70 Z', P.morado, 6);
  s += f('M50 74 V144 H60 C58 120 56 96 54 74 Z', '#7a49b8');
  s += circ(36, 112, 3, P.amarillo, 0) + circ(66, 126, 3, P.amarillo, 0) + circ(28, 136, 2.5, P.amarillo, 0);
  // Brazo con el bastón
  s += o('M64 84 C76 82 86 78 94 74 l4 10 C88 92 76 96 66 98 Z', P.morado, 5) + circ(96, 80, 7, P.crema, 5);
  // Cara y barba
  s += circ(50, 62, 18, P.crema, 6);
  s += o('M32 64 C34 92 42 104 50 108 C58 104 66 92 68 64 C62 74 56 76 50 76 C44 76 38 74 32 64 Z', P.blanco, 5);
  s += circ(43, 58, 3.4, K, 0) + circ(57, 58, 3.4, K, 0) + circ(44.2, 56.8, 1.2, P.blanco, 0) + circ(58.2, 56.8, 1.2, P.blanco, 0) + line('M38 51 l8 -2 M62 51 l-8 -2', P.grisS, 4) + o('M46 64 h8 l-4 5 z', P.rosa, 3.5);
  // Sombrero
  s += o('M16 46 C30 40 70 40 84 46 C78 52 22 52 16 46 Z', '#6a3fb0', 6);
  s += o('M28 44 C34 30 40 10 58 2 C56 14 64 30 72 44 Z', P.morado, 6);
  s += f('M40 30 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 z', P.amarillo) + circ(56, 22, 2.5, P.amarillo, 0);
  scene('mago', svg(120, 150, s));
}

// ---- El arquero (100 × 120): capucha verde, arco y carcaj ----
function arquero() {
  let s = '';
  // Carcaj con flechas a la espalda
  s += o('M22 46 l10 -4 l10 34 l-10 4 z', P.maderaS, 5) + line('M26 44 l-4 -14 M31 42 l-2 -14', K, 3) + o('M18 28 l4 -6 l3 7 z M27 26 l2 -7 l4 6 z', P.blanco, 3);
  // Cuerpo (túnica verde con cinturón)
  s += o('M30 64 C28 84 24 102 22 114 H72 C70 102 66 84 64 64 Z', P.pastoS, 6) + f('M47 66 V114 H56 C55 98 53 82 52 66 Z', P.pastoO);
  s += rect(26, 84, 44, 7, 3, P.maderaS, 4) + rect(43, 83, 9, 9, 2, P.oro, 3);
  // Cara y capucha
  s += circ(47, 46, 17, P.crema, 6);
  s += circ(41, 46, 3.2, K, 0) + circ(54, 46, 3.2, K, 0) + circ(42.2, 44.8, 1.1, P.blanco, 0) + circ(55.2, 44.8, 1.1, P.blanco, 0) + line('M43 54 q4 3 8 0', K, 3.5);
  s += o('M28 50 C26 30 36 18 48 16 C62 18 70 32 68 50 C64 36 58 30 48 30 C38 30 32 36 28 50 Z', P.pasto, 6);
  s += o('M48 16 C54 8 62 6 70 8 C64 12 60 18 58 24 Z', P.pasto, 5);
  // Arco y mano
  s += line('M80 30 C96 50 96 82 80 102', K, 9) + line('M80 30 C96 50 96 82 80 102', P.madera, 5) + line('M80 30 L80 102', P.blanco, 2);
  s += o('M60 66 C68 66 76 66 84 66 l0 8 C76 74 68 74 60 74 Z', P.pastoS, 5) + circ(86, 70, 6, P.crema, 4);
  return svg(100, 120, s);
}
scene('arquero', arquero());
// La flecha que cae del cielo (vertical, punta abajo) y la de los arqueros (horizontal, punta a la derecha).
scene('flecha', svg(16, 72, line('M8 4 V58', K, 7) + line('M8 4 V58', P.madera, 3.5) + o('M2 54 L8 70 L14 54 Z', P.grisS, 3.5) + o('M8 4 l-6 -2 v12 l6 4 z M8 4 l6 -2 v12 l-6 4 z', P.blanco, 3)));

// ---- La muralla (se repite a lo ancho: 320 × 400 px = 40 × 50 unidades) y la torre del mago ----
const PIEDRA = { base: '#c9c0b2', sombra: '#a89e8f', clara: '#e4ddd0', junta: '#8a7f70' };
/** Bloques de piedra en hileras alternadas, dentro de un rectángulo (sin pasarse de sus bordes). */
function bloques(x0, y0, w, h, alto = 48, ancho = 80, desfase = 0) {
  let s = '';
  for (let fila = 0, y = y0; y < y0 + h; fila++, y += alto) {
    const off = (fila % 2 ? ancho / 2 : 0) + desfase;
    s += line(`M${x0} ${y} H${x0 + w}`, PIEDRA.junta, 4);
    for (let x = x0 - ancho + (off % ancho); x < x0 + w; x += ancho) {
      if (x > x0) s += line(`M${x} ${y} V${Math.min(y + alto, y0 + h)}`, PIEDRA.junta, 4);
      if (x + 10 > x0 && x + ancho - 10 < x0 + w) s += f(`M${x + 8} ${y + 6} h${ancho - 24} v6 h-${ancho - 24} z`, PIEDRA.clara, 'opacity=".7"');
    }
  }
  return s;
}
{
  let s = '';
  // Almenas (dos por tramo; el hueco de la orilla casa con el del siguiente tramo).
  for (const x of [40, 200]) s += o(`M${x} 66 V8 h80 V66`, PIEDRA.base, 6) + f(`M${x + 6} 14 h68 v10 h-68 z`, PIEDRA.clara, 'opacity=".8"');
  // Borde de arriba (adarve) y la cara del muro.
  s += rect(-10, 62, 340, 30, 0, PIEDRA.clara, 6);
  s += f('M-10 92 H330 V400 H-10 Z', PIEDRA.base) + line('M-10 92 H330', K, 6);
  s += bloques(0, 92, 320, 308);
  s += f('M-10 360 H330 V400 H-10 Z', PIEDRA.sombra, 'opacity=".7"');
  scene('muralla', svg(320, 400, s));
}
{
  // La torre del mago: 384 × 640 px = 48 × 80 unidades, con almenas, aspillera y estandarte.
  let s = '';
  for (const x of [36, 156, 276]) s += o(`M${x} 112 V44 h72 V112`, PIEDRA.base, 6) + f(`M${x + 6} 50 h60 v10 h-60 z`, PIEDRA.clara, 'opacity=".8"');
  s += o('M24 108 H360 V140 H24 Z', PIEDRA.clara, 6);
  s += o('M40 140 H344 V640 H40 Z', PIEDRA.base, 6);
  s += `<clipPath id="t"><rect x="40" y="140" width="304" height="500"/></clipPath><g clip-path="url(#t)">${bloques(40, 140, 304, 500, 52, 76)}</g>`;
  // Aspillera y estandarte morado con estrella.
  s += o('M182 230 h20 v70 h-20 z', '#4a3b30', 5);
  s += o('M120 330 H264 V470 L192 430 L120 470 Z', P.morado, 6) + f('M192 360 l9 18 l20 3 l-15 14 l4 20 l-18 -10 l-18 10 l4 -20 l-15 -14 l20 -3 z', P.amarillo);
  s += line('M112 330 H272', P.maderaS, 10);
  s += f('M40 590 H344 V640 H40 Z', PIEDRA.sombra, 'opacity=".7"');
  scene('torre', svg(384, 640, s));
}

// ---- El pasto (256 × 256, se repite): verde con matitas y manchas claras que cruzan el borde sin costura ----
// (la Pradera amarilla usa el mismo dibujo con hierba seca)
for (const [clave, base, claro, oscuro, ondas] of [['pasto', P.pasto, P.pastoC, P.pastoS], ['pasto_amarillo', '#d9c25e', '#efe19a', '#b3963a'], ['arena', '#ead08e', '#f6e4b4', '#cfae66', true], ['roca_suelo', '#a7a39c', '#c4c0b8', '#7f7a72', 'grietas']]) {
  const mata = (x, y, c = oscuro) => line(`M${x} ${y} l-4 -9 M${x} ${y} l0 -11 M${x} ${y} l5 -9`, c, 3);
  const mancha = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${claro}" opacity=".35"/>`;
  let s = rect(0, 0, 256, 256, 0, base, 0);
  const manchas = [[40, 50, 38, 20], [190, 30, 30, 16], [120, 150, 44, 22], [230, 200, 36, 18], [30, 220, 30, 16]];
  const matas = [[20, 30], [70, 90], [150, 40], [210, 110], [100, 200], [180, 170], [240, 250], [60, 160], [130, 100], [200, 230], [10, 120], [160, 250]];
  // Cada cosa se dibuja también desplazada 256 a los lados para que el borde case.
  for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) {
    for (const [x, y, rx, ry] of manchas) s += mancha(x + dx, y + dy, rx, ry);
    // En la arena, en lugar de matitas, ondas de duna.
    for (const [x, y] of matas) s += ondas === 'grietas' ? line(`M${x + dx - 10} ${y + dy - 4} l7 5 l5 -6 l8 4`, oscuro, 2.5) : ondas ? line(`M${x + dx - 12} ${y + dy} q6 -5 12 0 t12 0`, oscuro, 2.5) : mata(x + dx, y + dy);
  }
  scene(clave, svg(256, 256, s));
}

// ---- Decoraciones del campo ----
const flor = (petalo, centro) => {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    s += circ(20 + Math.cos(a) * 9, 20 + Math.sin(a) * 9, 7, petalo, 4);
  }
  return svg(40, 40, s + circ(20, 20, 6, centro, 4));
};
scene('flor_blanca', flor(P.blanco, P.amarillo));
scene('flor_roja', flor('#ff7a8a', P.amarillo));
scene('piedra', svg(60, 44, o('M6 36 C4 22 14 8 30 8 C46 8 56 20 54 34 C52 40 40 40 30 40 C18 40 8 40 6 36 Z', P.piedra, 5) + f('M10 34 C16 38 44 38 50 32 C48 36 40 38 30 38 C18 38 12 38 10 34 Z', P.piedraS) + brillo(22, 18, 8, 4, 0.7)));
scene('arbusto', svg(80, 60, circ(22, 36, 18, P.pastoS, 5) + circ(56, 36, 18, P.pastoS, 5) + circ(40, 24, 20, P.pastoS, 5) + f('M8 44 C20 56 60 56 72 44 C66 52 54 54 40 54 C26 54 14 52 8 44 Z', P.pastoO) + brillo(34, 16, 7, 4, 0.5) + circ(30, 34, 3.5, P.rojo, 0) + circ(52, 26, 3.5, P.rojo, 0)));
scene('mancha', svg(64, 40, f('M6 22 C4 12 18 6 32 8 C46 6 60 12 58 22 C60 32 44 36 32 34 C18 36 4 32 6 22 Z', P.blanco)));

// ---- Íconos (64 × 64) ----
const I = (body) => svg(64, 64, body);
const estrella = (cx, cy, r, fill) => {
  let d = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.55 : r;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return o(d + 'Z', fill, 5);
};
const mini = (x, y, s, base, sombra) => g(`translate(${x} ${y}) scale(${s})`, o('M10 70 C4 50 18 14 48 12 C78 14 92 50 86 70 C84 78 74 80 48 80 C22 80 12 78 10 70 Z', base, 7) + f('M14 66 C14 74 26 76 48 76 C70 76 82 74 82 66 C76 72 64 72 48 72 C32 72 20 72 14 66 Z', sombra) + circ(36, 46, 7, K, 0) + circ(60, 46, 7, K, 0) + circ(38, 43, 2.5, P.blanco, 0) + circ(62, 43, 2.5, P.blanco, 0));
const sombrero = (x, y, s) => g(`translate(${x} ${y}) scale(${s})`, o('M4 52 C18 46 46 46 60 52 C54 58 10 58 4 52 Z', '#6a3fb0', 6) + o('M14 50 C20 34 26 14 44 4 C42 18 50 34 56 50 Z', P.morado, 6) + f('M28 34 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 z', P.amarillo));
const llama = (x, y, s, fill = P.fuego, centro = P.fuegoC) => g(`translate(${x} ${y}) scale(${s})`, o('M32 4 c4 14 20 20 20 36 a20 20 0 0 1 -40 0 c0 -10 6 -14 8 -22 c4 6 6 8 8 8 c0 -8 2 -16 4 -22 z', fill, 5) + f('M32 30 c2 8 10 10 10 18 a10 10 0 0 1 -20 0 c0 -6 4 -8 6 -12 c2 3 3 3 4 3 z', centro));
const rayo = (x, y, s) => g(`translate(${x} ${y}) scale(${s})`, o('M36 4 l-22 32 h14 l-6 24 l24 -34 h-14 z', P.oro, 5));
const moneda = (cx, cy, r) => circ(cx, cy, r, P.oro, 5) + circ(cx, cy, r * 0.62, P.oroS, 0) + circ(cx, cy, r * 0.5, P.oro, 0) + brillo(cx - r * 0.35, cy - r * 0.4, r * 0.25, r * 0.15, 0.8);

icon('danio', I(estrella(32, 32, 28, P.fuegoC) + circ(32, 32, 11, P.fuego, 4) + circ(32, 32, 5, P.blanco, 0)));
icon('slimes', I(mini(2, 24, 0.36, P.limo, P.limoS) + mini(28, 26, 0.36, P.limo, P.limoS) + mini(14, 4, 0.36, P.limo, P.limoS)));
icon('radio', I(circ(32, 32, 26, 'none') + `<circle cx="32" cy="32" r="26" fill="${P.amarillo}" fill-opacity=".35" stroke="${K}" stroke-width="5"/>` + circ(32, 32, 16, 'none', 0) + `<circle cx="32" cy="32" r="15" fill="none" stroke="${P.oroS}" stroke-width="4" stroke-dasharray="6 5"/>` + circ(32, 32, 5, P.rojo, 4)));
icon('cadencia', I(rayo(-4, 2, 0.9) + rayo(20, 6, 0.9)));
icon('tiempo', I(circ(32, 34, 24, P.blanco) + line('M32 34 v-14 M32 34 l10 6', K, 5) + circ(32, 34, 3.5, P.rojo, 0) + rect(26, 2, 12, 8, 3, P.grisS, 4) + o('M46 6 h12 M52 0 v12', 'none', 0) + line('M48 8 h12 M54 2 v12', P.pastoS, 6)));
icon('oro', I(moneda(22, 38, 16) + moneda(42, 30, 16) + moneda(30, 20, 14)));
icon('botin', I(o('M6 30 C6 14 58 14 58 30 Z', P.maderaS, 5) + o('M6 30 H58 V56 H6 Z', P.madera, 5) + rect(4, 28, 56, 8, 3, P.oroS, 4) + rect(26, 30, 12, 14, 3, P.oro, 4) + circ(32, 38, 2.5, K, 0) + moneda(16, 18, 7) + moneda(44, 16, 7) + moneda(30, 12, 7)));
icon('mago', I(sombrero(0, 0, 1)));
icon('magoRapido', I(sombrero(-2, 4, 0.8) + rayo(28, 22, 0.7)));
icon('magoArea', I(`<rect x="12" y="20" width="40" height="40" rx="6" fill="${P.fuego}" fill-opacity=".45" stroke="${K}" stroke-width="5"/>` + sombrero(6, -8, 0.75)));
icon('fuego', I(llama(0, 0, 1)));
icon('fuegoFuerte', I(llama(-6, 10, 0.8) + llama(18, 4, 0.9, P.rojo, P.fuego)));
const flechita = (x, y, a, s = 1) => g(`translate(${x} ${y}) rotate(${a}) scale(${s})`, line('M0 0 H40', K, 7) + line('M0 0 H40', P.madera, 3.5) + o('M36 -6 L50 0 L36 6 Z', P.grisS, 3.5) + o('M2 0 l-4 -6 h8 z M2 0 l-4 6 h8 z', P.blanco, 3));
const arco = (x, y, s = 1) => g(`translate(${x} ${y}) scale(${s})`, line('M10 4 C34 18 34 46 10 60', K, 9) + line('M10 4 C34 18 34 46 10 60', P.madera, 5) + line('M10 4 V60', P.blanco, 2.5));
const capucha = (x, y, s = 1) => g(`translate(${x} ${y}) scale(${s})`, circ(32, 36, 16, P.crema, 5) + o('M14 40 C12 20 22 8 32 6 C44 8 54 20 50 40 C46 26 40 22 32 22 C24 22 18 26 14 40 Z', P.pasto, 5) + circ(26, 38, 2.8, K, 0) + circ(38, 38, 2.8, K, 0));
icon('lluvia', I(`<circle cx="32" cy="44" r="18" fill="${P.amarillo}" fill-opacity=".45" stroke="${K}" stroke-width="5"/>` + flechita(18, 4, 90, 0.62) + flechita(32, 0, 90, 0.7) + flechita(46, 6, 90, 0.62)));
icon('arquero', I(capucha(-6, 6, 0.95) + arco(30, 2, 0.95)));
icon('masArqueros', I(capucha(-10, 14, 0.7) + capucha(10, 4, 0.7) + capucha(26, 18, 0.7) + line('M54 6 v14 M47 13 h14', P.pastoS, 6)));
icon('multiflecha', I(flechita(6, 18, -14, 1) + flechita(6, 32, 0, 1) + flechita(6, 46, 14, 1)));
icon('arcoRapido', I(arco(2, 0, 0.95) + rayo(24, 10, 0.7)));
icon('arcoDanio', I(flechita(4, 36, -30, 1.1) + estrella(48, 16, 13, P.fuegoC)));
icon('magoDanio', I(sombrero(-4, 4, 0.8) + estrella(48, 18, 13, P.fuegoC)));
// Tipos de daño (cada uno con su color: físico gris acero, fuego naranja, hielo celeste, energía morado,
// muerte verde oscuro, luz amarillo).
const espada = o('M44 6 l14 0 l0 14 l-26 26 l-8 -6 z', '#dfe5ee', 5) + line('M48 12 l-20 20', '#a9b3c4', 3) + o('M16 36 l12 12 l-4 4 l-12 -12 z', P.maderaS, 4) + o('M10 46 l8 8 l-6 6 l-8 -8 z', P.oroS, 4);
icon('tipo_fisico', I(circ(32, 32, 28, '#8d93aa') + espada));
icon('tipo_fuego', I(circ(32, 32, 28, P.fuego) + llama(10, 8, 0.7, P.fuegoC, P.blanco)));
{
  let copo = '';
  for (let i = 0; i < 6; i++) copo += g(`rotate(${i * 60} 32 32)`, line('M32 32 V10 M32 18 l-6 -6 M32 18 l6 -6', P.blanco, 5));
  icon('tipo_hielo', I(circ(32, 32, 28, P.aguaS) + copo + circ(32, 32, 5, P.blanco, 0)));
}
icon('tipo_energia', I(circ(32, 32, 28, P.morado) + o('M36 8 l-16 26 h12 l-6 22 l20 -28 h-12 z', P.amarillo, 4)));
icon('tipo_muerte', I(circ(32, 32, 28, '#3f5a46') + o('M18 30 a14 14 0 0 1 28 0 v4 c0 4 -3 6 -5 6 v8 h-18 v-8 c-2 0 -5 -2 -5 -6 z', P.piedra, 4) + circ(26, 30, 4, K, 0) + circ(38, 30, 4, K, 0) + line('M28 42 v5 M32 42 v5 M36 42 v5', K, 2.5)));
{
  let rayos = '';
  for (let i = 0; i < 8; i++) rayos += g(`rotate(${i * 45} 32 32)`, line('M32 10 V4', P.blanco, 5));
  icon('tipo_luz', I(circ(32, 32, 28, P.oro) + rayos + circ(32, 32, 12, P.blanco, 4)));
}
// Glosario (libro), vida (corazón), velocidad (bota con aire) y ataque (espadas cruzadas).
icon('glosario', I(o('M8 12 C18 8 28 10 32 16 C36 10 46 8 56 12 V54 C46 50 36 52 32 56 C28 52 18 50 8 54 Z', P.rojo, 5) + o('M12 14 C20 12 28 14 31 19 V52 C26 48 18 48 12 50 Z', P.crema, 4) + o('M52 14 C44 12 36 14 33 19 V52 C38 48 46 48 52 50 Z', P.crema, 4) + line('M16 24 h10 M16 30 h10 M38 24 h10 M38 30 h10', P.grisS, 3) + mini(36, 32, 0.18, P.limo, P.limoS)));
icon('vida', I(o('M32 54 C10 40 6 28 10 20 C14 10 28 10 32 22 C36 10 50 10 54 20 C58 28 54 40 32 54 Z', P.rojo, 5) + brillo(20, 22, 5, 3, 0.7)));
icon('velocidad', I(o('M14 14 h18 v22 l18 6 c6 2 8 6 8 12 h-44 z', P.maderaC, 5) + line('M14 50 h44', K, 5) + line('M2 22 h8 M0 32 h10 M2 42 h8', P.grisS, 4)));
icon('ataque', I(g('rotate(45 32 32)', rect(28, 4, 8, 40, 3, '#dfe5ee', 4) + rect(20, 42, 24, 6, 3, P.oroS, 4) + rect(29, 48, 6, 12, 2, P.maderaS, 4)) + g('rotate(-45 32 32)', rect(28, 4, 8, 40, 3, '#dfe5ee', 4) + rect(20, 42, 24, 6, 3, P.oroS, 4) + rect(29, 48, 6, 12, 2, P.maderaS, 4))));
// Oro mientras no juegas: luna con "z" y una moneda; Bolsa grande: costal de monedas.
icon('inactivo', I(o('M40 6 A24 24 0 1 0 58 40 A18 18 0 1 1 40 6 Z', '#b8a6f0', 5) + brillo(22, 22, 5, 3, 0.6) + line('M42 10 h8 l-8 9 h8', '#6a3fb0', 3.5) + moneda(44, 46, 12)));
icon('bolsa', I(o('M22 18 C10 26 6 40 10 50 C14 58 50 58 54 50 C58 40 54 26 42 18 Z', P.maderaC, 5) + o('M22 18 l-4 -10 h28 l-4 10 Z', P.maderaC, 5) + line('M20 18 H44', P.maderaS, 5) + moneda(32, 40, 11) + line('M48 10 v10 M43 15 h10', P.pastoS, 4)));
// Muralla reforzada: un tramo de muralla con un escudo.
icon('muralla', I(o('M6 26 V14 h10 v6 h8 v-6 h10 v6 h8 v-6 h10 v12 Z', '#c9c0b2', 4) + o('M6 26 H52 V58 H6 Z', '#c9c0b2', 5) + line('M6 38 H52 M6 48 H52 M20 26 V38 M36 38 V48 M22 48 V58', '#8a7f70', 3) + o('M40 30 h20 v12 c0 10 -10 16 -10 16 c0 0 -10 -6 -10 -16 z', P.azul, 4) + line('M50 34 v16 M43 41 h14', P.blanco, 3)));
icon('corona', I(o('M8 50 L12 14 L24 30 L32 8 L40 30 L52 14 L56 50 Z', P.oro, 5) + f('M12 44 H52 V50 H12 Z', P.oroS) + circ(32, 34, 5, P.rojo, 3) + circ(20, 38, 3.5, P.azul, 3) + circ(44, 38, 3.5, P.azul, 3)));
// Gemas moradas (misiones) y Reliquias (se compran con gemas).
const gema = (x, y, k = 1) => g(`translate(${x} ${y}) scale(${k})`, o('M14 4 H50 L60 20 L32 60 L4 20 Z', '#a46cf0', 5) + f('M14 4 H50 L60 20 H4 Z', '#c9a9f5') + line('M4 20 H60 M24 4 L18 20 L32 60 L46 20 L40 4', '#6a3fb0', 2.5) + brillo(22, 12, 5, 3, 0.8));
icon('gema', I(gema(0, 2)));
icon('misiones', I(o('M14 8 H48 C54 8 56 12 56 16 V50 C56 56 52 58 48 58 H16 C10 58 8 54 8 50 V14 C8 10 10 8 14 8 Z', P.crema, 5) + o('M8 14 C8 8 16 8 16 14 V18 H8 Z', P.cremaS, 4) + line('M20 22 H46 M20 32 H46 M20 42 H38', P.grisS, 4) + g('translate(34 34) scale(0.42)', o('M14 4 H50 L60 20 L32 60 L4 20 Z', '#a46cf0', 6))));
icon('poder', I(o('M32 4 l7 14 l15 2 l-11 10 l3 15 l-14 -7 l-14 7 l3 -15 l-11 -10 l15 -2 z', '#a46cf0', 5) + circ(32, 30, 7, '#e0c8ff', 3) + line('M10 54 l8 -6 M54 54 l-8 -6 M32 62 v-8', '#a46cf0', 4)));
icon('critico', I(o('M32 4 l6 16 l18 -6 l-10 16 l16 8 l-18 4 l4 18 l-16 -10 l-16 10 l4 -18 l-18 -4 l16 -8 l-10 -16 l18 6 z', '#ff5a8a', 5) + line('M24 26 l16 16 M40 26 l-16 16', P.blanco, 5)));
icon('carcaj', I(o('M18 18 l20 -6 l12 42 l-20 6 z', P.maderaS, 5) + line('M26 16 l-6 -12 M32 14 l-2 -12 M38 12 l2 -12', K, 3) + o('M16 4 l4 6 l4 -6 z M26 2 l4 6 l4 -6 z M38 0 l2 7 l5 -5 z', '#c9a9f5', 3) + circ(46, 46, 9, '#a46cf0', 4) + line('M46 41 v10 M41 46 h10', P.blanco, 3)));
icon('albanil', I(rect(6, 34, 26, 14, 2, '#c9c0b2', 4) + rect(20, 46, 26, 14, 2, '#c9c0b2', 4) + g('rotate(35 40 24)', rect(36, 6, 8, 34, 3, P.maderaS, 4) + rect(26, 4, 28, 12, 3, P.grisS, 4)) + circ(52, 52, 8, P.pasto, 4) + line('M52 48 v8 M48 52 h8', P.blanco, 3)));
// Trofeo del ranking: copa dorada con asas, una estrella y su base.
icon('trofeo', I(o('M14 12 C4 12 4 30 18 32 M50 12 C60 12 60 30 46 32', 'none', 5) + o('M14 6 H50 V22 C50 34 42 40 32 40 C22 40 14 34 14 22 Z', P.oro, 5) + rect(28, 40, 8, 8, 1, P.oroS, 4) + rect(18, 48, 28, 10, 3, P.maderaS, 5) + o('M32 13 l3 6 l6 1 l-4.5 4 l1 6 l-5.5 -3 l-5.5 3 l1 -6 l-4.5 -4 l6 -1 z', P.blanco, 2.5) + brillo(20, 14, 4, 6, 0.7)));
// PvP: espadas cruzadas, medalla, tienda, estandarte y un escudo por liga.
const espadaPvp = (rot) => g(`rotate(${rot} 32 32)`, o('M29 4 H35 V40 H29 Z', '#dfe5ee', 4) + line('M32 8 V38', '#a9b3c4', 2) + rect(20, 40, 24, 6, 3, P.oroS, 4) + rect(28, 46, 8, 12, 3, P.maderaS, 4) + circ(32, 60, 3.5, P.oro, 3));
icon('pvp', I(espadaPvp(-40) + espadaPvp(40)));
icon('medalla', I(o('M18 4 L28 26 L36 26 L46 4 Z', P.rojo, 4) + line('M32 4 V26', P.blanco, 4) + circ(32, 40, 18, P.oro, 5) + circ(32, 40, 11, P.oroS, 0) + o('M32 32 l2.6 5.4 l5.9 .8 l-4.3 4.1 l1 5.8 l-5.2 -2.8 l-5.2 2.8 l1 -5.8 l-4.3 -4.1 l5.9 -.8 z', P.amarillo, 2.5)));
icon('tienda', I(o('M8 26 H56 V58 H8 Z', P.crema, 5) + o('M4 26 L10 8 H54 L60 26 Z', P.rojo, 5) + line('M18 8 L16 26 M32 8 V26 M46 8 L48 26', P.blanco, 4) + o('M24 58 V40 H40 V58', P.maderaC, 4) + g('translate(42 30) scale(0.28)', o('M18 4 L28 26 L36 26 L46 4 Z', P.rojo, 8) + circ(32, 40, 18, P.oro, 8))));
icon('estandarte', I(line('M14 4 V62', P.maderaS, 6) + circ(14, 4, 4, P.oro, 3) + o('M16 8 H54 L46 22 L54 36 H16 Z', P.morado, 5) + o('M30 14 l3 6 l6 1 l-4.5 4 l1 6 l-5.5 -3 l-5.5 3 l1 -6 l-4.5 -4 l6 -1 z', P.amarillo, 2.5)));
for (const [id, color, claro] of [['bronce', '#c47a3a', '#e8a46a'], ['plata', '#9aa3b2', '#d8dde6'], ['oro', '#e8a91c', '#ffd36e'], ['platino', '#3fb0a8', '#9ee6df'], ['diamante', '#5b8cff', '#b8ccff'], ['campeon', '#a24fe0', '#dcb6ff']]) {
  icon(`liga_${id}`, I(o('M32 4 L56 12 V32 C56 46 46 56 32 62 C18 56 8 46 8 32 V12 Z', color, 5) + f('M32 10 L50 16 V32 C50 42 43 50 32 55 Z', claro, 'opacity=".55"') + o('M32 20 l4 8.5 l9 1.2 l-6.6 6.3 l1.6 9 l-8 -4.4 l-8 4.4 l1.6 -9 l-6.6 -6.3 l9 -1.2 z', P.blanco, 3)));
}
// Autoapuntado: una mira azul con su flecha que da vuelta (se mueve sola).
icon('autoapuntar', I(circ(30, 34, 22, P.azulC, 5) + circ(30, 34, 11, 'none', 4) + line('M30 6 V16 M30 52 V62 M2 34 H12 M48 34 H58', K, 4) + circ(30, 34, 4, P.rojo, 0) + line('M44 6 C54 8 60 14 61 24', P.azulS, 5) + o('M55 22 L62 28 L66 19 Z', P.azulS, 3)));
icon('moneda', I(moneda(32, 32, 26)));
icon('reloj', I(circ(32, 32, 26, P.blanco) + line('M32 32 v-16 M32 32 l12 8', K, 6) + circ(32, 32, 4, P.rojo, 0)));
icon('candado', I(o('M18 28 v-8 a14 14 0 0 1 28 0 v8', 'none', 6) + rect(10, 28, 44, 30, 8, P.oro, 5) + circ(32, 41, 5, K, 0) + rect(29, 42, 6, 10, 2, K, 0)));
icon('arbol', I(line('M32 14 V30 M32 30 L14 46 M32 30 V46 M32 30 L50 46', K, 5) + circ(32, 12, 9, P.oro, 5) + circ(14, 50, 8, P.limo, 5) + circ(32, 50, 8, P.magia, 5) + circ(50, 50, 8, P.fuego, 5)));
icon('jugar', I(o('M20 10 L54 32 L20 54 Z', P.blanco, 6)));
icon('ajustes', I(o('M32 6 l6 2 l2 8 l8 4 l8 -2 l4 6 l-5 6 l0 8 l5 6 l-4 6 l-8 -2 l-8 4 l-2 8 l-6 2 l-6 -2 l-2 -8 l-8 -4 l-8 2 l-4 -6 l5 -6 l0 -8 l-5 -6 l4 -6 l8 2 l8 -4 l2 -8 z', P.grisS, 5) + circ(32, 34, 9, P.piedra, 5)));
icon('mano', I(o('M20 60 v-22 l-8 -10 c-2 -4 4 -8 7 -4 l7 8 v-24 a4 4 0 0 1 8 0 v16 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v16 c0 8 -6 12 -14 12 z', P.crema, 5)));

// ---- Ícono de la app: un slime en la mira dorada, sobre pasto ----
{
  const body = rect(0, 0, 512, 512, 96, P.pasto, 0) + g('translate(96 120) scale(3.4)', slime(P.limo, P.limoS, P.limoC).replace(/^<svg[^>]*>|<\/svg>$/g, ''))
    + `<circle cx="256" cy="282" r="190" fill="${P.amarillo}" fill-opacity=".22" stroke="${P.oro}" stroke-width="22"/>` + `<circle cx="256" cy="282" r="190" fill="none" stroke="${K}" stroke-width="8"/>`;
  mkdirSync('public', { recursive: true });
  render('public/icono.png', svg(512, 512, body));
  for (const [dir, size] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
    mkdirSync(`apk-prueba/res/mipmap-${dir}`, { recursive: true });
    render(`apk-prueba/res/mipmap-${dir}/ic_launcher.png`, svg(size, size, `<g transform="scale(${size / 512})">${body}</g>`).replace(`viewBox="0 0 ${size} ${size}"`, `viewBox="0 0 ${size} ${size}"`));
  }
}
