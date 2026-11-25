// Objetos de la casa con jardín (jardín, estudio de youtuber y cochera). Cada uno se apoya en el borde de
// abajo del lienzo y ocupa casi todo el lienzo; los tamaños son los que el juego usa para colocarlos: no
// cambiarlos. Mismo estilo que objetos.mjs: contorno K de 5 px, colores planos en dos tonos y un brillo.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, eyes } from './lib.mjs';

// ---- Colores extra (planos y vivos) ----
const C = {
  negro: '#3b3b4a', negroS: '#2b2a3a', negroC: '#565670', pink: '#e87a95', rojoS: '#c23b30', rojoC: '#ff8f84',
  hoja: '#3f9a5a', pastoS: '#3f9a5a', barro: '#c96a3c', barroS: '#a3532c', barroC: '#e08a5e', piel: '#f8c9a0',
  pielS: '#e9a97c', nariz: '#f29e8c', humo: '#e7eef2', humoS: '#c3cfd8', tripie: '#4a4660', tripieS: '#363250',
  azulM: '#3f8de0', azulO: '#2a6fa8', moradoS: '#6a2fa8', moradoB: '#9a4fd6', plata: '#dde3ee', plataS: '#aab3c6',
  marino: '#2a2f55', marinoS: '#1d2040', nogal: '#6b4028', nogalS: '#4e2d1b', salchicha: '#e8603f', salchichaS: '#bf4229',
  carbon: '#2b2a3a', brasa: '#ff7a3c', galleta: '#c9803f', galletaS: '#a3622b', acero: '#8d93aa', aceroC: '#bfc5d6',
};
const BL = P.blanco;
/** Contorno solo (para repintar el borde encima de los rellenos interiores). */
const borde = (x, y, w, h, r, sw = 5) => rect(x, y, w, h, r, 'none', sw);
const clipR = (id, x, y, w, h, r) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>`;
const clipP = (id, d) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
const clipped = (id, body) => `<g clip-path="url(#${id})">${body}</g>`;
const brillo = (x, y, w, h, op = 0.5) => rect(x, y, w, h, Math.min(w, h) / 2, BL, 0).replace('/>', ` opacity="${op}"/>`);
/** Tubo: línea gruesa de color con contorno K (marcos de bici, alambres, varas). */
const tubo = (d, color, w) => line(d, K, w + 5) + line(d, color, w);
function star(cx, cy, r, fill = P.oro, sw = 3) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return o(d + 'z', fill, sw);
}
/** Rueda negra con rin: llanta, rin, rayos y masa. */
function rueda(cx, cy, r, rin = P.gris, rayos = 8) {
  let s = circ(cx, cy, r, C.negro, 5);
  s += circ(cx, cy, r * 0.62, rin, 4);
  let d = '';
  for (let i = 0; i < rayos; i++) {
    const a = (i * Math.PI * 2) / rayos;
    d += `M${cx} ${cy} l${(Math.cos(a) * r * 0.58).toFixed(1)} ${(Math.sin(a) * r * 0.58).toFixed(1)} `;
  }
  s += line(d, C.negroC, 3);
  s += circ(cx, cy, r * 0.2, P.grisS, 4);
  s += f(`M${cx - r * 0.5} ${cy - r * 0.3} a${r * 0.55} ${r * 0.55} 0 0 1 ${r * 0.3} -${r * 0.35} l${r * 0.12} ${r * 0.14} a${r * 0.4} ${r * 0.4} 0 0 0 -${r * 0.22} ${r * 0.26} z`, BL, 'opacity=".5"');
  return s;
}

// ---- maceta 108 × 152: cactus en maceta con gorrito de fiesta ----
{
  let s = '';
  // brazos
  s += o('M40 92 c-18 2 -34 -6 -34 -24 v-14 c0 -11 18 -11 18 0 v10 c0 6 8 8 16 8 z', P.pasto, 5);
  s += o('M68 82 c18 2 34 -6 34 -24 v-10 c0 -11 -18 -11 -18 0 v6 c0 6 -8 8 -16 8 z', P.pasto, 5);
  s += f('M90 48 c4 0 6 2 6 6 v6 c0 6 -4 12 -10 16 c4 -6 6 -12 6 -18 v-6 c0 -2 -1 -4 -2 -4 z', C.pastoS);
  s += f('M20 56 c0 -2 1 -4 2 -4 l-6 0 c-2 0 -2 2 -2 4 v8 c0 8 4 14 10 18 c-4 -6 -4 -12 -4 -18 z', C.pastoS);
  // cuerpo
  s += rect(34, 34, 40, 76, 20, P.pasto, 5);
  s += f('M60 40 c8 10 8 50 0 64 h8 c7 -14 7 -54 0 -64 z', C.pastoS);
  s += brillo(40, 46, 5, 34, 0.45);
  s += line('M44 56 l-6 -3 M44 92 l-6 3 M66 96 l6 3 M16 70 l-6 1 M96 62 l6 1 M30 40 l-5 -4', K, 2.5);
  s += eyes(54, 72, 9, 5, false);
  s += line('M49 84 q5 5 10 0', K, 3);
  s += circ(41, 80, 3, P.rosa, 0) + circ(67, 80, 3, P.rosa, 0);
  // maceta
  s += o('M22 112 h64 l-8 36 h-48 z', C.barro, 5);
  s += f('M70 116 h12 l-7 30 h-10 z', C.barroS);
  s += brillo(29, 118, 6, 24, 0.4);
  s += rect(14, 100, 80, 16, 6, C.barroC, 5);
  s += f('M20 108 h68 v2 a4 4 0 0 1 -4 4 h-60 a4 4 0 0 1 -4 -4 z', C.barroS);
  s += brillo(20, 103, 30, 4, 0.5);
  // gorrito de fiesta
  const gorro = 'M54 14 l-19 32 h38 z';
  s += o(gorro, P.rosa, 5);
  s += clipP('gorro', gorro);
  s += clipped('gorro', line('M30 30 l34 -16 M28 44 l40 -20', C.pink, 6));
  s += star(50, 36, 3.5, P.amarillo, 0) + star(60, 26, 3, BL, 0);
  s += circ(54, 11, 5.5, P.amarillo, 4);
  scene('obj_maceta', svg(108, 152, s));
}

// ---- gnomo 152 × 248: gnomo de jardín con gorro rojo, barbón, haciendo el pulgar arriba ----
{
  let s = '';
  // botas
  s += o('M38 222 h32 v22 h-38 c-4 0 -6 -3 -4 -7 c2 -4 6 -8 10 -15 z', C.nogal, 5);
  s += o('M82 222 h32 c4 7 8 11 10 15 c2 4 0 7 -4 7 h-38 z', C.nogal, 5);
  s += f('M42 236 h26 v6 h-30 z M84 236 h26 l2 6 h-28 z', C.nogalS);
  // pantalón
  s += rect(42, 190, 70, 38, 8, C.azulO, 5);
  s += line('M77 196 v28', K, 4);
  // brazo derecho (abajo, con la mano en la cintura)
  s += o('M110 136 c16 6 26 20 26 36 c0 8 -8 12 -16 8 c-10 -4 -14 -14 -22 -22 z', C.azulM, 5);
  s += circ(132, 178, 11, C.piel, 5);
  // túnica
  s += o('M34 130 c0 -14 10 -22 22 -22 h40 c12 0 22 8 22 22 l6 76 h-96 z', C.azulM, 5);
  s += f('M106 112 c8 4 12 10 12 18 l6 76 h-14 l-4 -76 c0 -8 -2 -14 -6 -18 z', C.azulO);
  s += brillo(40, 118, 8, 50, 0.3);
  // cinturón con hebilla
  s += rect(30, 170, 94, 18, 6, C.nogal, 5);
  s += f('M36 182 h82 v2 a4 4 0 0 1 -4 4 h-74 a4 4 0 0 1 -4 -4 z', C.nogalS);
  s += rect(66, 167, 22, 24, 5, P.oro, 4) + rect(72, 173, 10, 12, 2, C.nogal, 0);
  // brazo izquierdo con pulgar arriba
  s += o('M44 136 c-14 8 -22 18 -26 34 c-2 8 6 14 12 8 c8 -8 14 -18 26 -24 z', C.azulM, 5);
  s += o('M8 120 c0 -12 8 -18 18 -18 h8 c8 0 10 8 8 14 c4 4 4 10 0 12 c-2 6 -8 8 -14 8 h-6 c-8 0 -14 -6 -14 -16 z', C.piel, 5);
  s += o('M16 106 c-2 -12 2 -22 8 -22 c6 0 8 10 6 20 z', C.piel, 5);
  s += line('M22 118 h14 M22 126 h12', C.pielS, 3);
  // barba
  s += o('M38 112 c-6 24 -4 46 8 62 c10 12 22 18 30 18 c8 0 20 -6 30 -18 c12 -16 14 -38 8 -62 c-10 -10 -22 -14 -38 -14 c-16 0 -28 4 -38 14 z', BL, 5);
  s += f('M98 116 c8 20 6 40 -4 56 c-8 10 -16 14 -22 16 c12 -2 24 -8 32 -20 c8 -16 8 -34 2 -52 z', P.piedraS, 'opacity=".7"');
  s += line('M58 136 c2 16 4 26 6 34 M76 140 v36 M94 136 c-2 16 -4 26 -6 34', P.piedraS, 3);
  // cara
  s += ell(76, 96, 32, 24, C.piel, 5);
  s += f('M96 80 c8 8 10 20 6 30 c-2 6 -8 10 -14 12 c8 -4 12 -12 12 -20 c0 -8 -2 -16 -4 -22 z', C.pielS);
  s += circ(76, 104, 11, C.nariz, 5) + circ(72, 100, 3, BL, 0);
  s += circ(62, 90, 3.5, K, 0) + circ(90, 90, 3.5, K, 0);
  // bigote
  s += o('M52 112 c6 -8 16 -8 24 -2 c8 -6 18 -6 24 2 c-4 8 -14 10 -24 6 c-10 4 -20 2 -24 -6 z', BL, 4);
  // cejas blancas
  s += o('M50 82 c6 -8 16 -8 20 -2 c-6 0 -12 2 -20 2 z M102 82 c-6 -8 -16 -8 -20 -2 c6 0 12 2 20 2 z', BL, 4);
  // gorro
  s += o('M34 84 c2 -34 16 -56 38 -70 c12 -8 28 -10 42 -6 c-12 4 -16 16 -12 28 c4 14 12 28 20 48 z', P.rojo, 5);
  s += f('M106 12 c-8 6 -10 16 -6 26 c4 14 12 28 20 46 h-12 c-8 -18 -14 -30 -18 -44 c-2 -12 2 -22 10 -28 z', C.rojoS);
  s += brillo(52, 44, 8, 30, 0.35);
  s += rect(24, 80, 108, 16, 8, P.rojo, 5);
  s += f('M30 90 h96 v2 a4 4 0 0 1 -4 4 h-88 a4 4 0 0 1 -4 -4 z', C.rojoS);
  scene('obj_gnomo', svg(152, 248, s));
}

// ---- flamenco 156 × 348: flamenco rosa de plástico clavado en una vara ----
{
  let s = '';
  // vara de metal
  s += tubo('M100 226 v115', C.acero, 7);
  s += line('M98 240 v90', C.aceroC, 2);
  // cola
  s += o('M134 176 c12 -10 18 -22 14 -40 c-6 8 -14 14 -22 24 c-6 -2 -12 -2 -18 2 z', P.rosa, 5);
  // cuerpo
  s += ell(92, 194, 58, 42, P.rosa, 5);
  s += f('M48 206 c10 22 36 32 66 26 c16 -4 30 -14 34 -26 c-8 20 -30 30 -54 30 c-20 0 -36 -10 -46 -30 z', C.pink);
  // ala
  s += o('M72 172 c20 -12 54 -8 68 10 c-8 4 -14 10 -22 14 c-6 -2 -12 4 -18 2 c-6 -2 -10 4 -16 2 c-6 -2 -10 2 -14 0 c-4 -10 -2 -20 2 -28 z', C.pink, 4);
  s += brillo(60, 180, 14, 6, 0.6);
  // cuello
  s += tubo('M66 178 c-32 -18 -36 -62 -14 -92 c10 -14 14 -28 6 -52', P.rosa, 20);
  s += line('M64 176 c-24 -18 -28 -56 -10 -84', C.pink, 5);
  // cabeza
  s += circ(44, 29, 22, P.rosa, 5);
  s += f('M56 13 c8 8 10 20 4 30 c-2 4 -6 6 -10 8 c6 -4 10 -12 8 -22 c-2 -6 -4 -12 -2 -16 z', C.pink);
  // pico
  s += o('M26 25 c-14 6 -20 22 -16 40 l12 -2 c-2 -10 4 -20 12 -24 z', P.crema, 5);
  s += f('M10 63 c-2 -6 -2 -12 0 -16 l10 -2 c-2 6 -2 10 0 16 z', K);
  s += circ(48, 25, 5, K, 0) + circ(50, 23, 1.8, BL, 0);
  s += brillo(34, 15, 6, 10, 0.5);
  scene('obj_flamenco', svg(156, 348, s));
}

// ---- aro 180 × 516: aro de luz de youtuber en tripié ----
{
  let s = '';
  // tripié
  s += o('M82 420 l-68 86 c-2 4 4 8 8 4 l64 -80 z', C.tripie, 5);
  s += o('M98 420 l68 86 c2 4 -4 8 -8 4 l-64 -80 z', C.tripie, 5);
  s += rect(80, 416, 20, 96, 6, C.tripie, 5);
  s += f('M90 420 h6 v88 h-6 z', C.tripieS);
  s += line('M62 448 h56', K, 9) + line('M62 448 h56', C.tripie, 4);
  // poste
  s += rect(80, 104, 20, 310, 6, C.tripie, 5);
  s += f('M90 110 h6 v300 h-6 z', C.tripieS);
  s += brillo(83, 120, 3, 60, 0.3);
  s += rect(70, 196, 40, 20, 7, C.tripie, 5) + rect(70, 302, 40, 20, 7, C.tripie, 5) + rect(66, 400, 48, 26, 8, C.tripie, 5);
  s += f('M76 208 h28 v2 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 z M76 314 h28 v2 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 z', C.tripieS);
  s += circ(116, 206, 6, P.gris, 4) + circ(116, 312, 6, P.gris, 4);
  // aro de luz
  s += o('M90 8 a82 82 0 1 0 0.1 0 z M90 36 a54 54 0 1 1 -0.1 0 z', P.amarillo, 5, 'fill-rule="evenodd"');
  s += f('M90 36 a54 54 0 0 1 54 54 a68 68 0 0 1 -68 68 a54 54 0 0 1 -54 -54 a54 54 0 0 0 54 54 a54 54 0 0 0 54 -54 a54 54 0 0 0 -54 -54 a68 68 0 0 1 68 68 a68 68 0 0 0 -68 -68 z', P.oro, 'opacity=".5"');
  s += line('M30 70 a66 66 0 0 1 24 -36', BL, 7);
  s += line('M30 70 a66 66 0 0 1 24 -36', BL, 7).replace('/>', ' opacity=".6"/>');
  s += `<path d="M90 8 a82 82 0 1 0 0.1 0 z M90 36 a54 54 0 1 1 -0.1 0 z" fill="none" stroke="${K}" stroke-width="5" fill-rule="evenodd"/>`;
  // centro: esfera de montaje y pinza
  s += rect(78, 124, 24, 18, 5, C.tripie, 5);
  s += circ(90, 104, 24, C.tripie, 5);
  s += f('M100 86 c8 6 10 20 4 30 c-2 4 -6 6 -10 8 c8 -4 12 -12 12 -20 c0 -8 -2 -14 -6 -18 z', C.tripieS);
  s += brillo(78, 92, 6, 10, 0.4);
  scene('obj_aro', svg(180, 516, s));
}

// ---- microfono 124 × 256: micrófono de condensador morado con brazo y base ----
{
  let s = '';
  // cable
  s += tubo('M52 228 c-32 0 -44 -14 -40 -28 c2 -8 10 -8 14 -2', C.negro, 5);
  // base
  s += o('M8 236 c0 -12 24 -18 54 -18 c30 0 54 6 54 18 v6 c0 6 -24 10 -54 10 c-30 0 -54 -4 -54 -10 z', C.moradoS, 5);
  s += f('M14 240 h96 c-2 4 -22 7 -48 7 c-26 0 -46 -3 -48 -7 z', '#4a1f74');
  s += ell(62, 236, 46, 11, C.moradoB, 0);
  s += brillo(26, 232, 24, 4, 0.5);
  // tallo
  s += rect(54, 182, 16, 50, 5, C.moradoS, 5);
  s += f('M64 186 h4 v42 h-4 z', '#4a1f74');
  // horquilla
  s += tubo('M20 104 c-8 50 10 84 42 84 c32 0 50 -34 42 -84', C.moradoS, 9);
  s += circ(20, 104, 10, C.moradoB, 5) + circ(104, 104, 10, C.moradoB, 5);
  s += circ(20, 104, 3, C.moradoS, 0) + circ(104, 104, 3, C.moradoS, 0);
  // cápsula
  const cap = 'M28 40 c0 -20 15 -34 34 -34 c19 0 34 14 34 34 v98 c0 12 -8 20 -20 20 h-28 c-12 0 -20 -8 -20 -20 z';
  s += o(cap, C.moradoB, 5);
  s += clipP('cap', cap);
  let rej = '';
  for (let y = 16; y < 96; y += 10) rej += line(`M26 ${y} h72`, C.moradoS, 4);
  for (let x = 34; x < 96; x += 10) rej += line(`M${x} 6 v90`, C.moradoS, 4);
  rej += f('M78 6 h20 v92 h-20 z', '#4a1f74', 'opacity=".45"');
  rej += f('M80 100 h18 v58 h-18 z', C.moradoS);
  rej += rect(26, 96, 72, 14, 0, P.moradoC, 0);
  rej += f('M26 106 h72 v4 h-72 z', C.moradoS, 'opacity=".5"');
  s += clipped('cap', rej);
  s += o(cap, 'none', 5);
  s += brillo(34, 22, 7, 60, 0.4);
  s += circ(62, 134, 5, P.pasto, 0);
  scene('obj_microfono', svg(124, 256, s));
}

// ---- camara 112 × 164: cámara de video en tripié chico ----
{
  let s = '';
  // tripié
  s += o('M52 100 l-40 56 c-2 4 4 8 8 4 l38 -52 z', C.negro, 5);
  s += o('M60 100 l40 56 c2 4 -4 8 -8 4 l-38 -52 z', C.negro, 5);
  s += rect(50, 96, 12, 64, 4, C.negro, 5);
  s += f('M56 100 h3 v56 h-3 z', C.negroS);
  s += rect(42, 84, 28, 16, 5, C.negroS, 5);
  // lente
  s += rect(8, 40, 34, 32, 7, C.negroS, 5);
  s += f('M30 44 h8 v24 h-8 z', C.negro);
  s += line('M18 44 v24 M24 44 v24', C.negroC, 2);
  s += ell(10, 56, 5, 14, P.azulS, 4);
  s += f('M8 50 a3 5 0 0 1 2 -4 v6 z', BL, 'opacity=".7"');
  // cuerpo
  s += rect(34, 22, 72, 62, 10, C.negro, 5);
  s += f('M88 26 h14 v54 h-14 z', C.negroS);
  s += f('M40 28 h40 v6 h-40 z', BL, 'opacity=".15"');
  s += rect(44, 36, 30, 22, 4, C.negroC, 4);
  s += f('M48 40 h10 v14 h-10 z', P.azulC, 'opacity=".8"');
  s += circ(94, 36, 4.5, P.rojo, 0) + circ(94, 50, 3.5, P.grisS, 0) + circ(94, 62, 3.5, P.grisS, 0);
  s += line('M42 70 h30', P.grisS, 3);
  // asa y micrófono de arriba
  s += rect(40, 8, 44, 16, 6, C.negroS, 5);
  s += f('M46 12 h30 v3 h-30 z', BL, 'opacity=".2"');
  s += rect(80, 10, 22, 12, 6, C.negroC, 4);
  scene('obj_camara', svg(112, 164, s));
}

// ---- placa 192 × 224: placa de 100K suscriptores (botón de play plateado) ----
{
  let s = '';
  // base de madera
  s += o('M24 180 h144 l18 38 h-180 z', C.nogal, 5);
  s += f('M12 206 h168 l6 12 h-180 z', C.nogalS);
  s += brillo(38, 186, 40, 5, 0.3);
  // marco plateado
  s += rect(8, 6, 176, 182, 18, C.plata, 5);
  s += f('M168 14 c6 0 10 4 10 10 v150 c0 6 -4 10 -10 10 h-146 c-6 0 -10 -4 -10 -10 c10 6 20 6 30 6 h116 c6 0 10 -4 10 -10 v-146 c0 -4 -2 -8 -6 -10 z', C.plataS);
  s += f('M16 26 c0 -6 4 -10 10 -10 h50 c4 0 4 6 0 6 h-46 c-4 0 -6 2 -6 6 v40 c0 4 -8 4 -8 0 z', BL, 'opacity=".8"');
  // panel interior
  s += rect(26, 24, 140, 146, 10, C.marino, 5);
  s += f('M32 30 h128 c-10 10 -36 14 -64 14 c-28 0 -54 -4 -64 -14 z', '#3d4480');
  // botón de play
  s += o('M64 50 c0 -8 8 -12 14 -8 l52 30 c6 4 6 12 0 16 l-52 30 c-6 4 -14 0 -14 -8 z', P.oro, 5);
  s += f('M118 80 c2 2 2 6 0 8 l-48 28 c-4 2 -8 0 -8 -4 c2 2 6 2 10 0 l44 -26 c2 -2 2 -4 2 -6 z', P.oroS);
  s += brillo(72, 56, 8, 22, 0.55);
  // banda de la cifra (sin letras): placa dorada con estrellitas
  s += rect(50, 128, 92, 30, 7, C.marinoS, 4);
  s += rect(56, 134, 80, 18, 5, P.oro, 0);
  s += f('M58 146 h76 v2 a4 4 0 0 1 -4 4 h-68 a4 4 0 0 1 -4 -4 z', P.oroS);
  s += star(74, 143, 6, BL, 0) + star(96, 143, 7, BL, 0) + star(118, 143, 6, BL, 0);
  s += borde(26, 24, 140, 146, 10);
  // tornillitos del marco
  for (const [x, y] of [[18, 16], [174, 16], [18, 178], [174, 178]]) s += circ(x, y, 3.5, P.grisS, 0);
  scene('obj_placa', svg(192, 224, s));
}

// ---- silla 268 × 448: silla gamer roja con base de ruedas ----
{
  let s = '';
  // base de estrella con ruedas
  for (const [x, y] of [[16, 432], [86, 440], [182, 440], [252, 432]]) {
    s += line(`M134 404 L${x} ${y}`, K, 20) + line(`M134 404 L${x} ${y}`, C.negro, 12);
    s += circ(x, y, 8, C.negroS, 4);
  }
  s += rect(118, 346, 32, 66, 8, P.grisS, 5);
  s += f('M136 350 h8 v56 h-8 z', P.gris);
  s += circ(134, 404, 20, C.negro, 5) + circ(134, 404, 8, C.negroC, 0);
  // brazos
  s += rect(30, 274, 16, 44, 4, C.negro, 5) + rect(222, 274, 16, 44, 4, C.negro, 5);
  s += rect(14, 258, 50, 22, 10, C.negro, 5) + rect(204, 258, 50, 22, 10, C.negro, 5);
  s += f('M20 262 h38 v4 h-38 z M210 262 h38 v4 h-38 z', BL, 'opacity=".15"');
  // base del asiento
  s += rect(70, 342, 128, 18, 6, C.negro, 5);
  // respaldo
  const resp = 'M80 8 h108 c16 0 22 14 22 30 l6 110 c2 40 -8 110 -14 150 h-136 c-6 -40 -16 -110 -14 -150 l6 -110 c0 -16 6 -30 22 -30 z';
  s += o(resp, P.rojo, 5);
  s += clipP('resp', resp);
  let det = '';
  det += f('M50 60 c-6 60 -2 160 8 250 h30 c-8 -90 -12 -190 -8 -250 z', C.negro);
  det += f('M218 60 c6 60 2 160 -8 250 h-30 c8 -90 12 -190 8 -250 z', C.negro);
  det += f('M96 60 c-2 60 -2 160 4 236 h8 c-6 -76 -6 -176 -4 -236 z M172 60 c2 60 2 160 -4 236 h-8 c6 -76 6 -176 4 -236 z', C.rojoS);
  det += line('M86 110 h96 M84 160 h100 M86 210 h96', C.rojoS, 4);
  det += rect(104, 36, 60, 10, 5, C.negro, 0);
  det += f('M64 300 h140 c-20 6 -40 10 -70 10 c-30 0 -50 -4 -70 -10 z', C.rojoS);
  det += brillo(84, 20, 36, 8, 0.3);
  s += clipped('resp', det);
  s += o(resp, 'none', 5);
  // asiento
  s += rect(40, 298, 188, 54, 22, P.rojo, 5);
  s += f('M48 330 h172 c-4 12 -12 16 -28 16 h-116 c-16 0 -24 -4 -28 -16 z', C.rojoS);
  s += f('M62 304 c-12 10 -14 26 -10 40 h18 c-2 -14 -2 -30 4 -40 z M206 304 c12 10 14 26 10 40 h-18 c2 -14 2 -30 -4 -40 z', C.negro);
  s += line('M90 316 h88 M92 326 h84', C.rojoS, 3);
  s += brillo(84, 304, 50, 7, 0.3);
  scene('obj_silla', svg(268, 448, s));
}

// ---- parrilla 264 × 344: asador redondo con salchichas y humo ----
{
  let s = '';
  // patas
  s += o('M76 262 l-44 70 c-2 4 6 8 8 4 l48 -70 z', C.negroS, 5);
  s += o('M186 262 l40 56 c2 4 -4 8 -8 4 l-44 -54 z', C.negroS, 5);
  s += rect(124, 258, 14, 70, 4, C.negroS, 5);
  s += circ(228, 326, 13, C.negro, 5) + circ(228, 326, 4, P.grisS, 0);
  // brasas y rejilla
  s += ell(132, 140, 112, 28, C.carbon, 5);
  for (const [x, y, r] of [[70, 142, 10], [110, 150, 11], [150, 138, 9], [190, 146, 10], [130, 132, 7], [210, 134, 7], [52, 134, 6]]) s += circ(x, y, r, C.brasa, 0) + circ(x - 2, y - 2, r * 0.45, P.amarillo, 0);
  s += line('M30 150 h204 M26 140 h212 M34 130 h196', P.grisS, 3);
  // salchichas
  for (const [x, y, a] of [[80, 118, -62], [134, 106, -58], [188, 116, -62]]) {
    let sal = '';
    sal += rect(-46, -16, 92, 32, 16, C.salchicha, 5);
    sal += f('M-40 4 h80 c-2 8 -8 10 -18 10 h-48 c-8 0 -12 -4 -14 -10 z', C.salchichaS);
    sal += line('M-22 -6 l4 10 M-2 -8 l4 10 M18 -6 l4 10', C.salchichaS, 4);
    sal += brillo(-36, -11, 36, 6, 0.45);
    s += g(`translate(${x} ${y}) rotate(${a})`, sal);
  }
  // tazón
  s += o('M14 154 h236 c0 68 -52 110 -118 110 c-66 0 -118 -42 -118 -110 z', '#4a3a3a', 5);
  s += f('M180 166 c30 10 50 20 56 40 c-10 30 -40 52 -82 56 c40 -8 68 -34 72 -64 c-4 -14 -20 -24 -46 -32 z', '#352828');
  s += f('M30 170 c6 30 20 54 46 70 c-16 -12 -30 -34 -36 -70 z', '#352828', 'opacity=".7"');
  s += brillo(34, 168, 36, 8, 0.25);
  s += rect(6, 144, 252, 18, 9, '#5c4848', 5);
  s += f('M12 156 h240 v1 a5 5 0 0 1 -5 5 h-230 a5 5 0 0 1 -5 -5 z', '#352828');
  s += brillo(16, 148, 40, 4, 0.35);
  // humo
  s += circ(142, 46, 13, C.humo, 4) + circ(126, 30, 11, C.humo, 4) + circ(138, 14, 8, C.humo, 4);
  s += f('M146 36 c6 4 8 12 4 18 c-2 2 -4 4 -6 4 c6 -4 6 -12 2 -22 z M128 22 c6 4 8 10 4 16 c4 -4 4 -10 -4 -16 z', C.humoS);
  s += circ(138, 42, 3, BL, 0) + circ(124, 27, 2.5, BL, 0);
  scene('obj_parrilla', svg(264, 344, s));
}

// ---- bici 352 × 224: bicicleta azul con canasta ----
{
  let s = '';
  // ruedas
  s += rueda(64, 161, 56, P.gris, 10) + rueda(288, 161, 56, P.gris, 10);
  // guardafangos
  s += tubo('M13 124 a62 62 0 0 1 102 0', C.azulM, 8) + tubo('M237 124 a62 62 0 0 1 102 0', C.azulM, 8);
  // cadena y plato
  s += line('M190 160 l98 0 M190 160 l98 -12', K, 4);
  s += circ(190, 160, 16, P.grisS, 5) + circ(288, 160, 9, P.grisS, 4);
  // cuadro
  s += tubo('M98 58 L190 162 L212 56 L100 58 M190 162 L288 160 L212 56', C.azulM, 9);
  s += tubo('M94 62 L64 160', C.azulM, 8);
  s += line('M104 64 L182 152', '#7fb6ec', 2.5);
  // pedal
  s += line('M190 160 l12 20', K, 6) + rect(196, 178, 20, 8, 3, C.negro, 4);
  // asiento
  s += tubo('M212 56 v-18', C.acero, 5);
  s += o('M190 36 c6 -8 20 -10 36 -8 c10 2 14 8 10 12 c-16 2 -32 2 -46 -4 z', C.negro, 5);
  // manubrio
  s += tubo('M98 58 c-2 -14 2 -24 10 -30', C.acero, 6);
  s += tubo('M86 28 h50', C.acero, 6);
  s += rect(76, 22, 18, 12, 6, C.negro, 4) + rect(130, 22, 18, 12, 6, C.negro, 4);
  // canasta
  s += line('M56 56 l-20 -8 M60 46 l-16 -10', K, 4);
  s += o('M12 16 h76 c2 20 0 36 -8 50 h-60 c-8 -14 -10 -30 -8 -50 z', C.azulM, 5);
  s += line('M22 28 h56 M22 40 h56 M24 52 h52 M30 20 v42 M44 20 v44 M58 20 v44 M72 20 v42', C.azulO, 3);
  s += f('M18 20 h62 v6 h-62 z', BL, 'opacity=".35"');
  s += circ(66, 16, 10, P.amarillo, 4) + circ(63, 13, 3, BL, 0);
  s += o('M12 16 h76 c2 20 0 36 -8 50 h-60 c-8 -14 -10 -30 -8 -50 z', 'none', 5);
  scene('obj_bici', svg(352, 224, s));
}

// ---- moto 548 × 416: motoneta roja de lado ----
{
  let s = '';
  // ruedas
  s += rueda(78, 352, 58, P.gris, 8) + rueda(452, 352, 58, P.gris, 8);
  // escape
  s += o('M372 330 c20 -4 44 0 60 6 c10 4 12 14 4 20 c-14 8 -40 10 -60 6 c-10 -2 -12 -10 -8 -20 z', P.grisS, 5);
  s += f('M382 348 c16 4 36 4 50 -2 c-10 8 -36 10 -50 4 z', C.negroC);
  // guardafango delantero
  s += o('M8 352 a70 70 0 0 1 140 0 h-9 a61 61 0 0 0 -122 0 z', P.rojo, 5);
  s += f('M78 286 a66 66 0 0 1 66 66 h-9 a57 57 0 0 0 -57 -57 z', C.rojoS);
  s += brillo(36, 306, 18, 6, 0.4);
  // cuerpo trasero
  s += o('M296 176 h120 c70 0 124 60 124 120 c0 30 -20 40 -50 40 h-200 c-10 0 -18 -8 -18 -18 v-108 c0 -20 8 -34 24 -34 z', P.rojo, 5);
  s += f('M470 190 c40 20 70 60 70 106 c0 30 -20 40 -50 40 h-30 c30 0 50 -10 50 -40 c0 -42 -14 -78 -40 -106 z', C.rojoS);
  s += f('M280 300 h250 c-4 20 -16 32 -40 32 h-192 c-10 0 -18 -8 -18 -18 z', C.rojoS, 'opacity=".55"');
  s += line('M450 236 h50 M452 256 h56 M454 276 h54', C.negro, 8);
  s += brillo(320, 196, 60, 10, 0.4);
  s += circ(436, 286, 24, P.rojo, 5) + circ(436, 286, 8, C.rojoS, 0);
  // piso y faldón delantero
  s += o('M150 94 h66 v230 h-76 c-14 0 -22 -8 -22 -22 v-140 c0 -30 10 -58 32 -68 z', P.rojo, 5);
  s += f('M196 100 h20 v224 h-20 z', C.rojoS);
  s += brillo(144, 120, 12, 90, 0.35);
  s += rect(200, 302, 150, 24, 8, C.rojoS, 5);
  s += line('M220 314 h110', K, 3);
  // asiento
  let asiento = '';
  asiento += o('M250 150 c-4 -22 6 -34 26 -36 h150 c22 0 26 24 10 34 c-20 14 -40 14 -62 16 h-104 c-14 0 -18 -6 -20 -14 z', C.negro, 5);
  asiento += f('M260 152 c20 6 40 8 60 8 h100 c-20 10 -40 10 -60 10 h-80 c-14 0 -18 -6 -20 -18 z', C.negroS);
  asiento += line('M300 130 h110', C.negroC, 4);
  asiento += brillo(270, 122, 60, 7, 0.3);
  s += g('translate(0 16)', asiento);
  // manubrio, faro y espejo
  s += tubo('M184 96 v-24', C.acero, 8);
  s += tubo('M136 70 h96', C.acero, 8);
  s += rect(120, 58, 30, 22, 10, C.negro, 5) + rect(218, 58, 30, 22, 10, C.negro, 5);
  s += circ(176, 54, 30, P.gris, 5) + circ(176, 54, 20, P.amarillo, 4) + circ(169, 47, 6, BL, 0);
  s += tubo('M214 66 l16 -42', C.acero, 5);
  s += circ(236, 18, 13, C.negro, 5) + circ(234, 16, 5, P.gris, 0);
  // calavera trasera
  s += rect(520, 236, 20, 26, 7, P.rojo, 5) + f('M526 242 h8 v14 h-8 z', C.rojoC);
  scene('obj_moto', svg(548, 416, s));
}

// ---- coche 1024 × 424: coche compacto convertible de lado, con maleta en el asiento ----
{
  let s = '';
  // chasis y ruedas
  s += rect(300, 320, 440, 20, 6, C.negroS, 5);
  s += rueda(224, 342, 78, P.gris, 6) + rueda(816, 342, 78, P.gris, 6);
  // maleta en el asiento trasero
  s += o('M458 50 v-12 c0 -4 4 -8 8 -8 h32 c4 0 8 4 8 8 v12', 'none', 5);
  s += rect(430, 48, 104, 100, 12, C.galleta, 5);
  s += f('M436 120 h92 v16 c0 4 -4 8 -8 8 h-76 c-4 0 -8 -4 -8 -8 z', C.galletaS);
  s += line('M456 52 v92 M508 52 v92', C.galletaS, 6);
  s += rect(448, 76, 20, 14, 3, P.oro, 3) + rect(500, 76, 20, 14, 3, P.oro, 3);
  s += star(486, 108, 10, P.rosa, 3);
  s += brillo(438, 56, 50, 6, 0.4);
  // asiento
  s += rect(612, 84, 58, 40, 16, C.negro, 5);
  s += rect(600, 112, 76, 60, 12, C.negro, 5);
  s += f('M606 118 h40 v6 h-40 z', BL, 'opacity=".15"');
  // carrocería
  const car = 'M6 318 c0 -30 6 -70 36 -98 c40 -40 110 -60 222 -64 h296 c200 0 320 20 390 60 c40 24 62 56 66 94 c0 6 -4 8 -10 8 h-111.6 a82 82 0 0 0 -156.8 0 h-435.2 a82 82 0 0 0 -156.8 0 h-133.6 c-4 0 -6 -2 -6 -6 z';
  s += o(car, P.rojo, 5);
  s += clipP('car', car);
  let det = '';
  det += f('M560 156 c200 0 320 20 390 60 c40 24 62 56 66 94 h-40 c-6 -40 -30 -70 -70 -90 c-70 -40 -170 -56 -346 -58 z', C.rojoS);
  det += f('M10 318 c0 -20 4 -44 14 -64 c-4 24 -4 44 -2 64 z', C.rojoS, 'opacity=".7"');
  det += f('M0 290 h1030 v40 h-1030 z', C.rojoS, 'opacity=".55"');
  det += line('M560 160 c-6 50 -6 100 0 160', K, 4);
  det += f('M60 176 c50 -22 110 -34 170 -36 c4 0 6 6 2 8 c-60 2 -116 14 -168 36 c-4 2 -8 -4 -4 -8 z', BL, 'opacity=".4"');
  det += brillo(690, 172, 120, 10, 0.3);
  s += clipped('car', det);
  // salpicaderas bombadas
  for (const cx of [224, 816]) {
    s += o(`M${cx - 93} 318 a96 96 0 0 1 186 0 h-14.6 a82 82 0 0 0 -156.8 0 z`, P.rojo, 5);
    s += f(`M${cx} 246 a96 96 0 0 1 93 72 h-14.6 a82 82 0 0 0 -78.4 -58 z`, C.rojoS);
    s += brillo(cx - 60, 262, 26, 8, 0.4);
  }
  s += o(car, 'none', 5);
  // faro, defensas, manija y calavera
  s += circ(52, 226, 22, P.amarillo, 5) + circ(46, 220, 7, BL, 0);
  s += rect(6, 286, 72, 16, 8, P.gris, 5) + rect(946, 286, 72, 16, 8, P.gris, 5);
  s += f('M12 290 h60 v4 h-60 z M952 290 h60 v4 h-60 z', BL, 'opacity=".6"');
  s += rect(592, 212, 44, 14, 7, P.gris, 4);
  s += rect(992, 226, 20, 30, 7, C.rojoS, 5) + f('M998 232 h8 v18 h-8 z', C.rojoC);
  // parabrisas
  s += o('M262 158 L300 8 h30 L314 158 z', P.azulC, 5);
  s += f('M296 24 h14 l-12 110 h-14 z', BL, 'opacity=".5"');
  s += f('M318 30 h8 l-12 124 h-8 z', P.azul, 'opacity=".5"');
  s += line('M262 158 L300 8 h30', K, 7);
  scene('obj_coche', svg(1024, 424, s));
}
