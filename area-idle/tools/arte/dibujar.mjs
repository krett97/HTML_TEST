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
icon('magoArea', I(`<rect x="4" y="30" width="56" height="26" rx="5" fill="${P.fuego}" fill-opacity=".45" stroke="${K}" stroke-width="5"/>` + sombrero(6, -6, 0.75)));
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
