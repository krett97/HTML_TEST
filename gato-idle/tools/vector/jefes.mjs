// Jefes: Pepino Gigante, Aspiradora Industrial y Veterinario Espacial, cada uno con su versión derrotada.
// Medidas en px a 8 px por unidad. El personaje se apoya en el borde inferior del lienzo (origen abajo al
// centro en el juego) y lo ocupa casi entero. Mismo estilo que personajes.mjs: contorno K 6 px, dos tonos,
// brillos blancos con opacidad, formas redondas.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene } from './lib.mjs';

const C = { ...P,
  pepino: '#6fc63f', pepinoS: '#3f9430', pepinoC: '#b8ea6c', tallo: '#4f9a2a', talloS: '#2f6a18',
  amar: '#f4c431', amarS: '#c48f14', negroM: '#3b3550', negroS: '#262238', metal: '#9a9fb4', metalS: '#5f6378', metalC: '#d6d9e6',
  ojoRojo: '#ff4040', ojoRojoC: '#ffb0a0',
  traje: '#f6f6fa', trajeS: '#c8cad9', visor: '#2b2742', guante: '#4b3a33', guanteS: '#2f221d', cian: '#5ff2d2', cianS: '#1cb892',
  vidrio: '#e6f6ff', liquido: '#3fd9a4', liquidoS: '#22a97a', lengua: '#f27a9a', lenguaS: '#c94f74', encia: '#8a2f3e',
};

// ---- Piezas comunes de "derrotado" ----
/** Trazo en espiral (ojos mareados). */
function espiral(cx, cy, r, vueltas = 2.4, sw = 5, color = K) {
  const n = 64, pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = t * vueltas * Math.PI * 2, rr = r * t;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return line('M' + pts.join(' L'), color, sw);
}
const ojoEspiral = (cx, cy, r) => circ(cx, cy, r, C.blanco, 5) + espiral(cx, cy, r * 0.7);
/** Lengua colgando desde (cx, y), ancho w y largo h. */
const lengua = (cx, y, w, h) =>
  o(`M${cx - w / 2} ${y} c${w * 0.3} -6 ${w * 0.7} -6 ${w} 0 c${w * 0.12} ${h * 0.55} -${w * 0.15} ${h} -${w * 0.5} ${h} c-${w * 0.35} 0 -${w * 0.62} -${h * 0.45} -${w * 0.5} -${h} z`, C.lengua, 5)
  + line(`M${cx} ${y + 10} v${h - 24}`, C.lenguaS, 4);
/** Gota de sudor con la punta arriba. */
const gota = (x, y, r) =>
  o(`M${x} ${y - r * 1.9} c${r * 0.8} ${r * 1.1} ${r} ${r * 1.5} ${r} ${r * 1.9} a${r} ${r} 0 1 1 -${2 * r} 0 c0 -${r * 0.4} ${r * 0.2} -${r * 0.8} ${r} -${r * 1.9} z`, C.azul, 4)
  + circ(x - r * 0.35, y + r * 0.1, r * 0.25, C.blanco, 0);
/** Estrellita de mareo. */
const estrella = (x, y, r) =>
  o(`M${x} ${y - r} q${r * 0.15} ${r * 0.85} ${r} ${r} q-${r * 0.85} ${r * 0.15} -${r} ${r} q-${r * 0.15} -${r * 0.85} -${r} -${r} q${r * 0.85} -${r * 0.15} ${r} -${r} z`, C.oro, 4);
const mancha = (x, y, rx, ry, color, op) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${op}"/>`;

// ---- Pepino Gigante (62 × 90 → 496 × 720; derrotado 376 × 720) ----
function pepino({ derrotada = false } = {}) {
  const W = derrotada ? 376 : 496, H = 720, cx = W / 2;
  const espejo = (b) => b + g(`translate(${2 * cx} 0) scale(-1 1)`, b);
  let s = '';
  // patitas
  s += espejo(ell(cx - 64, 700, 52, 15, C.pepino, 6) + line(`M${cx - 84} 694 v18 M${cx - 64} 692 v24 M${cx - 44} 694 v18`, K, 4));
  let t = ''; // tronco con brazos y cara (se inclina si está derrotado)
  if (derrotada) {
    // brazos colgando
    t += espejo(o(`M${cx - 112} 330 c-50 30 -60 110 -40 200 c6 24 32 22 34 -2 c0 -70 10 -130 50 -170 z`, C.pepino, 6)
      + circ(cx - 140, 545, 28, C.pepino, 6) + line(`M${cx - 156} 540 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0`, K, 4));
  } else {
    // brazos musculosos flexionados: antebrazo, bíceps, puño y pulgar
    t += espejo(
      g(`rotate(8 ${cx - 203} 330)`, rect(cx - 226, 262, 46, 136, 23, C.pepino, 6))
      + g(`rotate(-18 ${cx - 160} 340)`, ell(cx - 160, 340, 72, 42, C.pepino, 6)
        + f(`M${cx - 200} 322 c0 -8 12 -14 28 -14 c14 0 24 6 24 12 c-16 -4 -36 -2 -52 2 z`, C.pepinoC, 'opacity=".7"'))
      + circ(cx - 205, 252, 36, C.pepino, 6)
      + line(`M${cx - 223} 236 q6 -9 12 0 q6 -9 12 0 q6 -9 12 0`, K, 4)
      + ell(cx - 178, 270, 10, 15, C.pepino, 5));
  }
  // cuerpo
  const cuerpo = `M${cx} 70 C${cx + 100} 70 ${cx + 136} 280 ${cx + 130} 470 C${cx + 128} 610 ${cx + 80} 692 ${cx} 692 C${cx - 80} 692 ${cx - 128} 610 ${cx - 130} 470 C${cx - 136} 280 ${cx - 100} 70 ${cx} 70 Z`;
  t += o(cuerpo, C.pepino, 6);
  t += f(`M${cx} 70 C${cx + 100} 70 ${cx + 136} 280 ${cx + 130} 470 C${cx + 128} 610 ${cx + 80} 692 ${cx} 692 C${cx + 44} 660 ${cx + 88} 580 ${cx + 88} 470 C${cx + 88} 300 ${cx + 64} 130 ${cx} 70 Z`, C.pepinoS, 'opacity=".5"');
  t += f(`M${cx - 92} 190 c-16 110 -14 290 2 390 c-30 -100 -40 -280 -2 -390 z`, C.pepinoC, 'opacity=".75"');
  t += line(`M${cx - 30} 420 c-8 80 -6 170 6 250 M${cx + 36} 400 c10 90 8 180 -4 270`, C.pepinoS, 5);
  for (const [x, y, r] of [[-66, 160, 7], [44, 130, 6], [-20, 300, 8], [92, 330, 6], [-96, 400, 7], [60, 460, 8], [-50, 560, 6], [20, 620, 7], [104, 540, 6], [-104, 520, 5], [70, 590, 6]]) {
    t += circ(cx + x, y, r, C.pepinoC, 0) + circ(cx + x - r * 0.3, y - r * 0.3, r * 0.35, C.blanco, 0);
  }
  t += line(cuerpo, K, 6);
  // tallo
  if (derrotada) t += o(`M${cx - 16} 78 c-2 -22 6 -36 22 -42 c16 -6 36 4 44 20 c4 8 -8 12 -12 4 c-6 -12 -20 -14 -30 -6 c-8 6 -8 14 -6 24 z`, C.tallo, 6);
  else t += o(`M${cx - 16} 78 c-2 -26 4 -46 20 -58 c12 -8 24 -2 18 10 c-6 10 -16 18 -18 48 z`, C.tallo, 6) + line(`M${cx + 14} 26 c10 -12 24 -10 26 2`, C.tallo, 8);
  // cara
  if (derrotada) {
    t += ojoEspiral(cx - 58, 218, 30) + ojoEspiral(cx + 58, 218, 30);
    t += line(`M${cx - 96} 172 q34 14 60 4 M${cx + 96} 172 q-34 14 -60 4`, K, 8);
    t += o(`M${cx - 50} 280 c20 -12 80 -12 100 0 c-2 40 -22 62 -50 62 c-28 0 -48 -22 -50 -62 z`, C.encia, 6);
    t += lengua(cx + 10, 300, 46, 110);
    t += mancha(cx - 104, 300, 14, 22, C.rosa, 0.6) + mancha(cx + 98, 380, 12, 18, C.rosa, 0.6) + mancha(cx - 70, 470, 10, 16, C.rosa, 0.6);
    t += gota(cx - 128, 160, 12) + gota(cx + 124, 196, 10);
  } else {
    t += ell(cx - 58, 220, 34, 30, C.blanco, 6) + ell(cx + 58, 220, 34, 30, C.blanco, 6);
    t += circ(cx - 50, 226, 16, C.rojo, 0) + circ(cx + 50, 226, 16, C.rojo, 0);
    t += circ(cx - 48, 228, 8, K, 0) + circ(cx + 48, 228, 8, K, 0);
    t += circ(cx - 56, 216, 4, C.blanco, 0) + circ(cx + 56, 216, 4, C.blanco, 0);
    t += o(`M${cx - 100} 170 l84 32 l-6 22 l-84 -26 z`, C.pepino, 6) + o(`M${cx + 100} 170 l-84 32 l6 22 l84 -26 z`, C.pepino, 6);
    t += line(`M${cx - 6} 182 v-18 M${cx + 6} 182 v-18`, C.pepinoS, 4);
    t += o(`M${cx - 96} 272 c30 -16 162 -16 192 0 c-4 52 -44 84 -96 84 c-52 0 -92 -32 -96 -84 z`, C.encia, 6);
    t += f(`M${cx - 60} 326 c20 12 100 12 120 0 c-10 16 -34 24 -60 24 c-26 0 -50 -8 -60 -24 z`, C.lengua);
    t += f(`M${cx - 84} 282 h168 c-4 18 -10 30 -20 38 h-128 c-10 -8 -16 -20 -20 -38 z`, C.blanco);
    t += line(`M${cx - 60} 282 v36 M${cx - 36} 282 v38 M${cx - 12} 282 v38 M${cx + 12} 282 v38 M${cx + 36} 282 v38 M${cx + 60} 282 v36`, K, 3);
  }
  s += derrotada ? g(`rotate(-4 ${cx} 700)`, t) : t;
  return svg(W, H, derrotada ? g('translate(11 0)', s) : s);
}

// ---- Aspiradora Industrial (67 × 88.5 → 536 × 708; derrotada 470 × 706) ----
function industrial({ derrotada = false } = {}) {
  const W = derrotada ? 470 : 536, H = derrotada ? 706 : 708, cx = W / 2;
  const espejo = (b) => b + g(`translate(${2 * cx} 0) scale(-1 1)`, b);
  let s = '';
  // manguera enrollada a la espalda
  const mx = derrotada ? 148 : 150, my = 300, mr = derrotada ? 104 : 110;
  s += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="none" stroke="${K}" stroke-width="56"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="none" stroke="${C.negroM}" stroke-width="44"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="none" stroke="${C.negroS}" stroke-width="44" stroke-dasharray="7 15"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${mr + 12}" fill="none" stroke="${C.blanco}" stroke-width="6" opacity=".25"/>`;
  // piernas a rayas y botas
  s += espejo(rect(cx - 110, 520, 80, 130, 26, C.negroM, 6)
    + f(`M${cx - 104} 552 h68 v18 h-68 z M${cx - 104} 596 h68 v18 h-68 z`, C.amar)
    + o(`M${cx - 130} 640 c-12 16 -10 46 6 60 h106 c14 -10 12 -40 -2 -60 z`, C.negroM, 6)
    + f(`M${cx - 124} 672 c-2 12 2 22 8 28 h44 v-28 z`, C.metal) + line(`M${cx - 72} 672 v28`, K, 4));
  let t = ''; // torso (se inclina si está derrotado)
  t += rect(cx - 130, 176, 260, 380, 36, C.amar, 6);
  t += f(`M${cx + 70} 182 h40 c12 0 18 8 18 20 v330 c0 12 -8 20 -20 20 h-38 z`, C.amarS, 'opacity=".55"');
  // banda con remaches y panel frontal
  t += rect(cx - 136, 376, 272, 28, 8, C.negroM, 6);
  for (const x of [-100, -34, 34, 100]) t += circ(cx + x, 390, 7, C.metalC, 4);
  t += rect(cx - 74, 420, 148, 110, 16, C.amarS, 6);
  t += rect(cx - 50, 440, 100, 54, 10, C.negroS, 5);
  t += line(`M${cx - 36} 456 h72 M${cx - 36} 472 h72`, C.metalS, 5);
  for (const [x, y] of [[-58, 434], [58, 434], [-58, 516], [58, 516]]) t += circ(cx + x, y, 7, C.metalC, 4);
  // cúpula
  t += o(`M${cx - 128} 182 v-18 c0 -66 54 -114 128 -114 c74 0 128 48 128 114 v18 z`, C.amar, 6);
  t += f(`M${cx + 60} 70 c40 20 60 50 64 94 v18 h-48 v-18 c0 -40 -8 -66 -16 -94 z`, C.amarS, 'opacity=".55"');
  t += f(`M${cx - 86} 150 c-2 -40 14 -70 42 -84 c-12 20 -18 46 -18 84 z`, C.blanco, 'opacity=".6"');
  t += circ(cx + 46, 112, 9, C.rojo, 5);
  if (derrotada) {
    const d = `M${cx - 50} 64 c-2 -26 -12 -42 -34 -36`;
    t += espejo(line(d, K, 22) + line(d, C.negroM, 12) + circ(cx - 84, 30, 16, C.negroM, 6) + circ(cx - 88, 26, 5, C.blanco, 0));
    t += line(`M${cx - 20} 76 l10 14 l-8 12 l12 10`, K, 4);
  } else {
    t += rect(cx - 22, 30, 44, 30, 10, C.metal, 6) + circ(cx, 28, 14, C.metalS, 6) + circ(cx - 4, 24, 4, C.blanco, 0);
  }
  t += rect(cx - 136, 160, 272, 30, 8, C.metal, 6);
  for (const x of [-108, -54, 0, 54, 108]) t += circ(cx + x, 175, 6, C.metalS, 4);
  // cara
  if (derrotada) {
    t += ojoEspiral(cx - 60, 228, 32) + ojoEspiral(cx + 60, 228, 32);
    t += espejo(o(`M${cx - 104} 200 l86 -18 l4 18 l-86 12 z`, C.metalS, 6));
    t += o(`M${cx - 62} 282 c20 -12 104 -12 124 0 c-2 46 -28 72 -62 72 c-34 0 -60 -26 -62 -72 z`, C.encia, 6);
    t += f(`M${cx - 48} 288 l12 22 l12 -22 l12 22 l12 -22 l12 22 l12 -22 l12 22 l12 -22 z`, C.blanco);
    t += lengua(cx + 8, 318, 44, 96);
    t += gota(cx - 150, 150, 12) + gota(cx + 150, 200, 10) + gota(cx - 140, 270, 9);
  } else {
    t += espejo(ell(cx - 60, 228, 36, 28, C.negroS, 6) + ell(cx - 58, 232, 20, 15, C.ojoRojo, 0) + circ(cx - 66, 226, 5, C.ojoRojoC, 0));
    t += espejo(o(`M${cx - 106} 186 l92 26 l-6 18 l-90 -22 z`, C.metalS, 6));
    t += o(`M${cx - 84} 270 c24 -14 144 -14 168 0 c-2 56 -32 88 -84 88 c-52 0 -82 -32 -84 -88 z`, C.encia, 6);
    t += f(`M${cx - 36} 332 c10 6 62 6 72 0 c-6 14 -22 20 -36 20 c-14 0 -30 -6 -36 -20 z`, C.lengua);
    let d = `M${cx - 72} 276`; for (let i = 0; i < 6; i++) d += ' l12 26 l12 -26'; t += f(d + ' z', C.blanco);
    d = `M${cx - 50} 338`; for (let i = 0; i < 5; i++) d += ' l10 -22 l10 22'; t += f(d + ' z', C.blanco);
  }
  // brazos de manguera a rayas con garras
  const brazo = () => {
    const hx = cx - (derrotada ? 176 : 216), hy = derrotada ? 580 : 548;
    const d = derrotada ? `M${cx - 128} 250 C${cx - 184} 270 ${cx - 202} 420 ${hx} ${hy - 30}` : `M${cx - 128} 250 C${cx - 200} 270 ${cx - 238} 380 ${hx} ${hy - 30}`;
    return line(d, K, 72) + line(d, C.negroM, 60) + `<path d="${d}" fill="none" stroke="${C.amar}" stroke-width="60" stroke-dasharray="22 40" stroke-dashoffset="-20"/>`
      + circ(cx - 130, 250, 44, C.metal, 6) + circ(cx - 130, 250, 18, C.metalS, 5)
      + circ(hx, hy, 44, C.negroM, 6) + f(`M${hx - 24} ${hy - 26} c10 -10 30 -10 40 0 c-14 -2 -28 -2 -40 0 z`, C.metalC, 'opacity=".5"')
      + line(`M${hx - 18} ${hy + 8} v28 M${hx} ${hy + 12} v30 M${hx + 18} ${hy + 8} v28`, K, 5)
      + ell(hx + 30, hy - 10, 12, 18, C.negroM, 5);
  };
  t += espejo(brazo());
  s += derrotada ? g(`rotate(4 ${cx} 560)`, t) : t;
  return svg(W, H, derrotada ? g('translate(-4 0)', s) : s);
}

// ---- Veterinario Espacial (59.25 × 88 → 474 × 704; derrotado 478 × 704) ----
function veterinario({ derrotada = false } = {}) {
  const W = derrotada ? 478 : 474, H = 704, cx = derrotada ? 264 : 262;
  let s = '';
  // mochila, tanque y tubo hacia el casco
  s += rect(cx + 88, 280, derrotada ? 118 : 116, 210, 26, C.trajeS, 6);
  s += f(`M${cx + 100} 292 h30 v186 h-30 z`, C.traje, 'opacity=".6"');
  s += rect(cx + 128, 320, 48, 120, 16, C.metal, 5);
  const tubo = `M${cx + 160} 300 c20 -50 -4 -110 -70 -120`;
  s += line(tubo, K, 18) + line(tubo, C.metal, 10);
  // piernas y botas
  for (const x of [cx - 48, cx + 48]) {
    s += rect(x - 38, 450, 76, 210, 26, C.traje, 6);
    s += f(`M${x + 10} 456 h22 v198 h-22 z`, C.trajeS, 'opacity=".6"');
    s += line(`M${x - 28} 540 q28 10 56 0`, C.trajeS, 5);
    s += o(`M${x - 46} 630 c-12 20 -10 50 4 66 h92 c14 -10 12 -42 -2 -66 z`, C.guante, 6);
    s += line(`M${x - 40} 690 h84`, C.guanteS, 6);
    s += f(`M${x - 40} 640 h80 v10 h-80 z`, C.trajeS);
  }
  // torso
  s += o(`M${cx - 96} 304 c0 -26 14 -40 36 -40 h120 c22 0 36 14 36 40 v150 c0 20 -14 32 -34 32 h-124 c-20 0 -34 -12 -34 -32 z`, C.traje, 6);
  s += f(`M${cx + 48} 270 h12 c22 0 36 14 36 40 v144 c0 20 -14 32 -34 32 h-14 z`, C.trajeS, 'opacity=".6"');
  s += line(`M${cx - 30} 300 v130`, C.trajeS, 5);
  s += rect(cx - 92, 440, 184, 24, 8, C.trajeS, 6) + rect(cx - 16, 436, 32, 32, 8, C.oro, 5);
  s += rect(cx - 2, 326, 56, 50, 10, C.negroM, 5) + circ(cx + 26, 351, 13, C.oro, 0) + rect(cx + 20, 345, 12, 12, 2, K, 0);
  s += rect(cx - 42, 246, 96, 40, 16, C.trajeS, 6);
  // brazos
  const brazo = (d) => line(d, K, 64) + line(d, C.traje, 52);
  if (derrotada) {
    s += brazo(`M${cx + 70} 320 L${cx + 124} 420 L${cx + 112} 500`) + circ(cx + 114, 508, 28, C.guante, 6);
    s += brazo(`M${cx - 78} 320 L${cx - 152} 428 L${cx - 120} 324`);
  } else {
    s += brazo(`M${cx + 70} 320 L${cx + 150} 400 L${cx + 96} 462`) + circ(cx + 98, 468, 28, C.guante, 6);
    s += brazo(`M${cx - 70} 320 L${cx - 168} 410 L${cx - 142} 300`);
  }
  s += ell(cx + 108, 362, 13, 17, C.pasto, 4);
  // jeringa gigante (coordenadas locales: el émbolo en 0, la aguja hacia -y) con la mano que la sujeta
  const px = derrotada ? 190 : 164, py = derrotada ? 420 : 400, ang = derrotada ? -26 : -22;
  let j = '';
  j += line('M0 -246 v-160', K, 12) + line('M0 -246 v-160', C.metalC, 6);
  j += rect(-36, -240, 72, 240, 14, C.vidrio, 6);
  j += f('M-30 -150 h60 v138 h-60 z', C.liquido) + f('M12 -150 h18 v138 h-18 z', C.liquidoS, 'opacity=".7"');
  j += f('M-30 -164 h60 v14 h-60 z', C.negroM);
  j += f('M-26 -228 h10 v212 h-10 z', C.blanco, 'opacity=".7"');
  j += line('M14 -220 h12 M14 -196 h12 M14 -172 h12 M14 -120 h12 M14 -96 h12 M14 -72 h12 M14 -48 h12', K, 3);
  j += rect(-42, -250, 84, 22, 8, C.rojo, 5);
  j += rect(-62, -8, 124, 20, 8, C.rojo, 5);
  j += rect(-10, 10, 20, 52, 6, C.metal, 5);
  j += rect(-42, 56, 84, 20, 8, C.rojo, 5);
  j += rect(-46, -134, 92, 52, 24, C.guante, 6);
  j += line('M-34 -120 q34 -10 68 0 M-34 -104 q34 -10 68 0', K, 4);
  j += circ(-38, -126, 13, C.guante, 5);
  s += g(`translate(${px} ${py}) rotate(${ang})`, j);
  // casco con visor y cara dentro (se ladea si está derrotado)
  const hx = cx + 6, hy = 150;
  let c = '';
  c += circ(hx, hy, 120, C.traje, 6);
  c += f(`M${hx + 40} ${hy - 110} a120 120 0 0 1 0 220 a96 96 0 0 0 0 -220 z`, C.trajeS, 'opacity=".6"');
  c += rect(hx + 104, hy - 26, 34, 56, 12, C.trajeS, 6);
  c += circ(hx + 4, hy + 4, 92, C.visor, 6);
  if (derrotada) {
    for (const x of [hx - 38, hx + 38]) c += circ(x, hy - 6, 26, C.cian, 5) + espiral(x, hy - 6, 19, 2.2, 5, C.visor);
    c += o(`M${hx - 62} ${hy + 30} q62 70 124 0 q-62 26 -124 0 z`, C.encia, 5);
    c += f(`M${hx - 50} ${hy + 36} q50 44 100 0 q-50 18 -100 0 z`, C.blanco);
    c += line(`M${hx - 30} ${hy + 42} v16 M${hx} ${hy + 48} v18 M${hx + 30} ${hy + 42} v16`, K, 3);
    c += lengua(hx + 22, hy + 58, 30, 36);
    c += gota(hx - 126, hy - 50, 12) + gota(hx + 104, hy - 104, 10);
    c += estrella(hx - 112, hy - 108, 12) + estrella(hx + 128, hy - 66, 10);
  } else {
    const ojo = g(`rotate(16 ${hx - 36} ${hy - 4})`, o(`M${hx - 66} ${hy - 4} q30 -30 60 -2 q-30 16 -60 2 z`, C.cian, 4) + circ(hx - 30, hy - 10, 5, K, 0));
    c += ojo + g(`translate(${2 * hx} 0) scale(-1 1)`, ojo);
    c += line(`M${hx - 34} ${hy + 50} q34 16 68 -4`, C.cian, 6);
  }
  c += g(`rotate(-40 ${hx - 40} ${hy - 44})`, mancha(hx - 40, hy - 44, 30, 12, C.blanco, 0.5));
  c += mancha(hx - 62, hy - 4, 6, 6, C.blanco, 0.5);
  s += derrotada ? g(`rotate(10 ${cx} 272)`, c) : c;
  return svg(W, H, s);
}

scene('jefe_pepino', pepino());
scene('jefe_pepino_derrotado', pepino({ derrotada: true }));
scene('jefe_industrial', industrial());
scene('jefe_industrial_derrotado', industrial({ derrotada: true }));
scene('jefe_veterinario', veterinario());
scene('jefe_veterinario_derrotado', veterinario({ derrotada: true }));
