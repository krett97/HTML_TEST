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
{
  const mata = (x, y, c = P.pastoS) => line(`M${x} ${y} l-4 -9 M${x} ${y} l0 -11 M${x} ${y} l5 -9`, c, 3);
  const mancha = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${P.pastoC}" opacity=".35"/>`;
  let s = rect(0, 0, 256, 256, 0, P.pasto, 0);
  const manchas = [[40, 50, 38, 20], [190, 30, 30, 16], [120, 150, 44, 22], [230, 200, 36, 18], [30, 220, 30, 16]];
  const matas = [[20, 30], [70, 90], [150, 40], [210, 110], [100, 200], [180, 170], [240, 250], [60, 160], [130, 100], [200, 230], [10, 120], [160, 250]];
  // Cada cosa se dibuja también desplazada 256 a los lados para que el borde case.
  for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) {
    for (const [x, y, rx, ry] of manchas) s += mancha(x + dx, y + dy, rx, ry);
    for (const [x, y] of matas) s += mata(x + dx, y + dy);
  }
  scene('pasto', svg(256, 256, s));
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
