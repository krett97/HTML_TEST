// Objetos del departamento (los que no viven en cocina.mjs). Cada uno se apoya en el borde de abajo del
// lienzo y ocupa casi todo el lienzo; los tamaños son los que el juego usa para colocarlos: no cambiarlos.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, icon, eyes, nose, whiskers, grape } from './lib.mjs';

// ---- Colores extra (planos y vivos) ----
const C = {
  negro: '#3b3b4a', negroS: '#2b2a3a', negroC: '#565670', pink: '#e87a95', rojoS: '#c23b30', amarilloS: '#e6c24a',
  teal: '#3f9b94', tealS: '#2f7a74', azulO: '#2a6fa8', galleta: '#c9803f', galletaS: '#a3622b', hoja: '#3f9a5a',
  humo: '#e7eef2', humoS: '#c3cfd8', ladoRefri: '#9aa5b5',
};
const BL = P.blanco;
/** Contorno solo (para repintar el borde encima de los rellenos interiores). */
const borde = (x, y, w, h, r, sw = 5) => rect(x, y, w, h, r, 'none', sw);
const clipR = (id, x, y, w, h, r) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>`;
const clipC = (id, cx, cy, r) => `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
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

// ---- control 116 × 104: control remoto negro en diagonal ----
{
  let r = '';
  r += rect(-56, -15, 112, 30, 11, C.negro, 5);
  r += f('M-48 -11 h96 a3 3 0 0 1 0 5 h-96 a3 3 0 0 1 0 -5 z', BL, 'opacity=".2"');
  r += f('M-52 5 h104 v6 a4 4 0 0 1 -4 4 h-96 a4 4 0 0 1 -4 -4 z', C.negroS);
  r += circ(-48, 0, 3.5, P.rojo, 0);
  r += circ(-28, 0, 9, C.negroC, 3) + line('M-28 -5 v10 M-33 0 h10', K, 3);
  r += circ(-6, -5, 3.5, P.rojo, 0) + circ(2, -5, 3.5, P.pasto, 0) + circ(-6, 4, 3.5, P.amarillo, 0) + circ(2, 4, 3.5, P.azul, 0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) r += rect(14 + i * 12, -8 + j * 9, 8, 6, 2, C.negroC, 0);
  scene('obj_control', svg(116, 104, g('translate(58 54) rotate(38)', r)));
}

// ---- florero 80 × 184: jarrón azul panzón con una rosa ----
{
  let s = '';
  // tallo y hojas
  s += line('M40 36 c-2 18 2 36 0 54', K, 11) + line('M40 36 c-2 18 2 36 0 54', C.hoja, 5);
  s += o('M39 66 c-10 -14 -22 -12 -26 -2 c10 6 18 8 26 2 z', P.pasto, 4);
  s += o('M41 80 c10 -12 22 -10 26 0 c-10 6 -18 8 -26 0 z', P.pasto, 4);
  // rosa
  s += o('M40 6 c-12 0 -18 10 -14 20 c3 8 8 11 14 11 c6 0 11 -3 14 -11 c4 -10 -2 -20 -14 -20 z', P.rojo, 5);
  s += f('M40 10 c8 0 12 8 10 16 c-1 4 -4 7 -8 8 c6 -4 8 -12 4 -18 c-2 -3 -4 -4 -6 -6 z', C.rojoS);
  s += line('M40 20 c6 -8 -10 -12 -8 -2 c2 8 14 4 10 -4', K, 3);
  s += o('M30 32 c-6 4 -8 10 -6 14 c6 -2 10 -6 12 -12 z M50 32 c6 4 8 10 6 14 c-6 -2 -10 -6 -12 -12 z', P.pasto, 3);
  // jarrón
  s += rect(20, 170, 40, 11, 5, C.azulO, 5);
  s += o('M28 86 h24 v22 c0 8 -24 8 -24 0 z', P.azulS, 5);
  s += ell(40, 138, 35, 37, P.azulS, 5);
  s += f('M58 110 c12 14 14 40 2 54 c-6 7 -14 9 -22 8 c16 -4 26 -14 28 -30 c2 -12 -2 -22 -8 -32 z', C.azulO);
  s += f('M22 150 c-6 -12 -4 -26 4 -34 c-4 12 -2 24 6 34 z', C.azulO, 'opacity=".6"');
  s += brillo(20, 114, 10, 26, 0.65);
  s += ell(40, 86, 16, 6, P.azul, 5);
  scene('obj_florero', svg(80, 184, s));
}

// ---- celular 72 × 108: teléfono rosa ladeado con pantalla morada estrellada ----
{
  let r = '';
  r += rect(-23, -45, 46, 90, 9, P.rosa, 5);
  r += f('M-18 30 h36 v8 a8 8 0 0 1 -8 8 h-20 a8 8 0 0 1 -8 -8 z', C.pink);
  r += rect(-18, -36, 36, 66, 4, P.morado, 0);
  r += f('M-18 -36 h36 v22 c-14 -4 -24 0 -36 10 z', P.moradoC, 'opacity=".45"');
  r += star(-6, -20, 5, P.amarillo, 0) + star(8, 0, 4, BL, 0) + star(-8, 14, 3.5, P.amarillo, 0) + star(6, 22, 3, BL, 0) + star(10, -28, 3, BL, 0);
  r += rect(-7, -42, 14, 3, 1.5, C.pink, 0);
  r += circ(0, 37, 4, C.pink, 0);
  r += f('M-16 -32 v50 h4 v-50 z', BL, 'opacity=".35"');
  scene('obj_celular', svg(72, 108, g('translate(36 54) rotate(-12)', r)));
}

// ---- papel 108 × 96: rollo de papel de baño acostado, destapándose ----
{
  let s = '';
  // hoja que se desenrolla y queda en el piso
  s += o('M5 92 c6 -12 14 -18 22 -24 h36 c-4 8 -4 14 -2 24 z', P.azulC, 5);
  s += f('M14 88 c4 -6 8 -10 14 -14 h4 c-6 4 -10 8 -14 14 z', P.azul, 'opacity=".5"');
  // cuerpo del rollo
  s += o('M28 10 h56 a17 34 0 0 1 0 68 h-56 a17 34 0 0 1 0 -68 z', P.azulC, 5);
  s += f('M20 20 h60 v8 h-62 z M14 36 h66 v8 h-66 z M14 52 h66 v8 h-66 z M18 66 h62 v6 h-62 z', P.azul, 'opacity=".45"');
  s += f('M20 16 h56 v6 h-58 z', BL, 'opacity=".8"');
  // cara del rollo (espiral) con tubo rojo
  s += ell(84, 44, 17, 34, BL, 5);
  s += line('M84 22 c8 2 12 12 10 22 c-2 10 -10 14 -16 8 c-4 -4 -2 -10 2 -10', P.piedraS, 3);
  s += ell(84, 44, 6, 12, P.rojo, 4);
  s += ell(84, 44, 2.5, 5, C.rojoS, 0);
  scene('obj_papel', svg(108, 96, s));
}

// ---- cojin 120 × 104: cojín con cara de gato ----
{
  let s = '';
  s += o('M10 46 l6 -40 l34 22 z', P.naranja, 5) + o('M110 46 l-6 -40 l-34 22 z', P.naranja, 5);
  s += f('M18 40 l3 -22 l20 14 z', P.rosa) + f('M102 40 l-3 -22 l-20 14 z', P.rosa);
  s += rect(4, 24, 112, 76, 30, P.naranja, 5);
  s += f('M14 80 c10 14 30 18 46 18 c16 0 36 -4 46 -18 c-8 10 -26 14 -46 14 c-20 0 -38 -4 -46 -14 z', P.naranjaS, 'opacity=".7"');
  s += line('M48 30 l-3 10 M60 28 v11 M72 30 l3 10', P.naranjaS, 6);
  s += f('M24 58 c0 -12 10 -16 20 -12 c8 3 12 10 10 18 c-2 8 -10 10 -18 8 c-8 -2 -12 -6 -12 -14 z', P.crema);
  s += f('M96 58 c0 -12 -10 -16 -20 -12 c-8 3 -12 10 -10 18 c2 8 10 10 18 8 c8 -2 12 -6 12 -14 z', P.crema);
  s += brillo(14, 34, 30, 8, 0.45);
  s += circ(22, 70, 6, P.rosa, 0) + circ(98, 70, 6, P.rosa, 0);
  s += eyes(60, 54, 20, 9, false);
  s += nose(60, 66, 8);
  s += line('M52 76 q8 8 16 0', K, 4);
  s += whiskers(60, 62, 18);
  scene('obj_cojin', svg(120, 104, s));
}

// ---- tenis 148 × 84: tenis blanco con raya rosa y agujetas rosas (punta a la derecha) ----
{
  let s = '';
  // empeine alto
  s += o('M14 66 c-4 -24 2 -52 20 -60 c14 -6 26 4 36 14 c14 12 36 18 62 24 c10 2 12 10 10 22 z', BL, 5);
  s += f('M20 64 c-2 -18 2 -36 12 -46 c-4 14 -4 30 0 46 z', P.piedraS, 'opacity=".8"');
  s += o('M96 50 c16 2 30 6 44 12 c0 -8 -4 -14 -12 -16 c-10 -2 -22 -2 -32 4 z', P.piedra, 4);
  // lengüeta y agujetas
  s += o('M44 14 c10 -6 20 0 28 10 c8 10 14 20 16 32 l-36 -6 c-4 -12 -8 -24 -8 -36 z', P.piedra, 4);
  s += line('M46 26 l26 8 M46 36 l30 8 M48 46 l32 6', P.rosa, 7);
  s += line('M46 26 l26 8 M46 36 l30 8 M48 46 l32 6', K, 2.5);
  s += o('M40 8 c6 -6 14 -4 16 2 l-10 10 z', P.rosa, 4);
  // raya rosa
  s += o('M40 62 c26 -14 60 -10 100 -2 l-2 8 c-40 -8 -72 -10 -98 0 z', P.rosa, 4);
  s += f('M46 62 c24 -10 54 -8 86 -2 l-1 3 c-32 -6 -60 -8 -84 2 z', C.pink, 'opacity=".6"');
  s += brillo(102, 42, 22, 6, 0.6);
  // suela
  s += o('M6 70 c0 -6 6 -8 14 -8 h114 c10 0 14 4 12 10 c-2 6 -8 8 -16 8 h-110 c-8 0 -14 -4 -14 -10 z', P.gris, 5);
  s += f('M10 72 h132 c-2 4 -6 6 -12 6 h-108 c-6 0 -10 -2 -12 -6 z', P.azul);
  s += f('M14 64 h112 v3 h-112 z', BL, 'opacity=".7"');
  scene('obj_tenis', svg(148, 84, g('translate(3 3) scale(0.96)', s)));
}

// ---- cortinas 240 × 352: cortina morada colgada de un tubo de madera ----
{
  let s = '';
  s += rect(10, 10, 220, 12, 6, P.maderaS, 5);
  s += circ(14, 16, 9, P.madera, 5) + circ(226, 16, 9, P.madera, 5);
  const tela = 'M28 28 h184 c-4 50 -12 100 -28 160 c-4 30 8 80 18 150 c-40 14 -124 14 -164 0 c10 -70 22 -120 18 -150 c-16 -60 -24 -110 -28 -160 z';
  s += o(tela, P.morado, 5);
  s += `<clipPath id="tela"><path d="${tela}"/></clipPath>`;
  // pliegues (recortados a la tela)
  let pl = '';
  pl += f('M60 32 c0 50 -4 100 -12 156 c4 30 -4 80 -10 142 c6 -60 18 -112 14 -142 c10 -56 12 -106 8 -156 z M150 32 c4 50 -2 100 -10 156 c-2 30 10 80 14 142 c-8 -60 -22 -112 -18 -142 c6 -56 10 -106 14 -156 z M200 32 c-2 50 -10 100 -24 156 c0 30 8 80 14 142 c0 -60 -10 -112 -8 -142 c14 -56 18 -106 18 -156 z', '#6a3fb0', 'opacity=".75"');
  pl += f('M44 36 c2 50 2 100 -6 150 c-2 30 8 80 6 140 c-2 -60 -14 -110 -10 -140 c10 -50 12 -100 10 -150 z M108 36 c0 50 -2 100 -4 150 c0 30 2 80 2 140 c-4 -60 -8 -110 -8 -140 c4 -50 8 -100 10 -150 z', P.moradoC, 'opacity=".5"');
  s += clipped('tela', pl) + o(tela, 'none', 5);
  // argollas
  for (let i = 0; i < 6; i++) s += circ(44 + i * 30, 20, 8, 'none', 5);
  // lazo dorado
  s += rect(44, 176, 150, 24, 12, P.oro, 5);
  s += f('M50 190 h138 v4 a8 8 0 0 1 -8 8 h-122 a8 8 0 0 1 -8 -8 z', P.oroS);
  s += brillo(56, 180, 50, 6, 0.6);
  scene('obj_cortinas', svg(240, 352, s));
}

// ---- sofa 344 × 132: sofá rojo de dos cojines ----
{
  let s = '';
  s += rect(30, 8, 284, 82, 18, P.rojo, 5);
  s += line('M172 12 v70', C.rojoS, 5);
  // caritas tejidas del respaldo
  for (const cx of [100, 244]) s += line(`M${cx - 18} 44 h8 M${cx + 10} 44 h8 M${cx - 8} 54 q8 6 16 0`, C.rojoS, 5);
  s += f('M38 14 h120 c6 0 8 4 6 8 h-120 c-6 0 -8 -4 -6 -8 z', BL, 'opacity=".25"');
  s += rect(40, 64, 132, 44, 14, P.rojo, 5) + rect(172, 64, 132, 44, 14, P.rojo, 5);
  s += f('M46 94 h120 c0 6 -4 10 -10 10 h-100 c-6 0 -10 -4 -10 -10 z M178 94 h120 c0 6 -4 10 -10 10 h-100 c-6 0 -10 -4 -10 -10 z', C.rojoS);
  s += brillo(52, 70, 60, 8, 0.3) + brillo(184, 70, 60, 8, 0.3);
  s += rect(4, 46, 50, 68, 24, P.rojo, 5) + rect(290, 46, 50, 68, 24, P.rojo, 5);
  s += f('M12 96 h34 c0 8 -6 14 -14 14 h-6 c-8 0 -14 -6 -14 -14 z M298 96 h34 c0 8 -6 14 -14 14 h-6 c-8 0 -14 -6 -14 -14 z', C.rojoS);
  s += brillo(12, 52, 14, 30, 0.3) + brillo(298, 52, 14, 30, 0.3);
  s += rect(24, 108, 296, 12, 6, C.rojoS, 5);
  s += rect(40, 118, 22, 10, 3, P.maderaS, 4) + rect(282, 118, 22, 10, 3, P.maderaS, 4) + rect(160, 118, 22, 10, 3, P.maderaS, 4);
  scene('obj_sofa', svg(344, 132, s));
}

// ---- colchon 408 × 56: colchón tirado de lado ----
{
  let s = '';
  s += rect(4, 4, 400, 49, 14, BL, 5);
  s += f('M8 31 h392 v10 h-392 z', P.azul);
  s += rect(6, 40, 396, 11, 8, P.azulC, 0);
  s += f('M8 41 h392 v4 h-392 z', P.azulS, 'opacity=".5"');
  for (let x = 24; x < 400; x += 28) s += circ(x, 18, 3, P.grisS, 0);
  for (let x = 38; x < 392; x += 28) s += line(`M${x - 6} 11 l6 7 l-6 7 M${x + 6} 11 l-6 7 l6 7`, P.piedraS, 2);
  s += line('M18 8 h372', P.piedraS, 2);
  s += borde(4, 4, 400, 49, 14);
  scene('obj_colchon', svg(408, 56, s));
}

// ---- lampara 116 × 276: lámpara de lava ----
{
  let s = '';
  s += o('M20 268 c0 -14 16 -22 28 -24 c6 -24 4 -44 -2 -62 h24 c-6 18 -8 38 -2 62 c12 2 28 10 28 24 z', P.gris, 5);
  s += f('M68 182 c-4 18 -6 38 0 62 c10 2 22 8 24 20 h-10 c-2 -8 -10 -12 -18 -14 c-4 -24 -2 -44 2 -62 z', P.grisS);
  s += brillo(50, 190, 6, 40, 0.5);
  s += o('M38 32 h40 c6 50 14 100 18 150 c0 10 -76 10 -76 0 c4 -50 12 -100 18 -150 z', P.naranja, 5);
  s += f('M74 40 c6 48 12 96 16 142 c0 4 -8 6 -16 7 c6 -2 8 -4 8 -7 c-4 -46 -10 -94 -14 -142 z', P.naranjaS);
  // burbujas de lava
  s += ell(58, 158, 20, 17, P.oro, 0) + ell(70, 112, 11, 12, P.oro, 0) + ell(54, 76, 6, 7, P.oro, 0) + ell(78, 170, 7, 6, P.oro, 0);
  s += ell(54, 154, 7, 5, P.amarillo, 0) + ell(67, 108, 4, 4, P.amarillo, 0);
  s += f('M34 182 h48 c0 4 -48 4 -48 0 z', P.naranjaS);
  s += brillo(40, 44, 7, 110, 0.45);
  s += rect(26, 176, 64, 14, 7, P.grisS, 5);
  s += rect(42, 9, 32, 27, 8, P.gris, 5);
  s += f('M60 12 h10 v20 h-10 z', P.grisS);
  s += ell(58, 9, 16, 4, P.gris, 5);
  scene('obj_lampara', svg(116, 276, s));
}

// ---- bocina 112 × 208: bocina alta con woofer azul ----
{
  let s = '';
  s += rect(6, 4, 100, 200, 10, C.negro, 5);
  s += rect(16, 14, 80, 180, 6, C.negroS, 0);
  s += f('M9 10 h4 v186 h-4 z', BL, 'opacity=".15"');
  s += circ(56, 42, 13, P.grisS, 4) + circ(56, 42, 5, C.negroS, 0);
  s += circ(56, 82, 19, P.grisS, 4) + circ(56, 82, 11, C.negro, 4) + circ(56, 82, 4, P.azul, 0);
  s += circ(56, 148, 38, P.azulS, 5) + circ(56, 148, 28, P.azul, 4) + circ(56, 148, 14, C.azulO, 4) + circ(56, 148, 5, P.azulC, 0);
  s += f('M34 132 a28 28 0 0 1 24 -12 v6 a22 22 0 0 0 -18 10 z', BL, 'opacity=".6"');
  s += circ(56, 194, 3.5, P.pasto, 0);
  scene('obj_bocina', svg(112, 208, s));
}

// ---- consola 152 × 72: consola de videojuegos con su control ----
{
  let s = '';
  s += line('M64 26 c0 -18 40 -16 50 8', K, 4);
  s += rect(4, 26, 100, 40, 8, P.piedra, 5);
  s += f('M8 50 h92 v8 a4 4 0 0 1 -4 4 h-84 a4 4 0 0 1 -4 -4 z', P.piedraS);
  s += f('M12 30 h84 v6 h-84 z', BL, 'opacity=".8"');
  s += line('M20 42 h40 M20 48 h40', P.grisS, 3);
  s += rect(70, 40, 24, 5, 2, C.negro, 0);
  s += circ(90, 56, 4, P.rojo, 0) + circ(78, 56, 4, P.pasto, 0);
  // control
  let ctl = '';
  ctl += o('M98 32 h44 c6 0 8 4 8 10 v14 c0 8 -8 12 -12 6 l-4 -6 h-28 l-4 6 c-4 6 -12 2 -12 -6 v-14 c0 -6 2 -10 8 -10 z', P.gris, 5);
  ctl += f('M100 36 h40 v4 h-40 z', BL, 'opacity=".6"');
  ctl += line('M108 46 v10 M103 51 h10', C.negro, 4);
  ctl += circ(132, 46, 3.5, P.rojo, 0) + circ(138, 52, 3.5, P.azul, 0) + circ(126, 52, 3.5, P.oro, 0) + circ(132, 58, 3.5, P.pasto, 0);
  s += g('translate(-4 0)', ctl);
  scene('obj_consola', svg(152, 72, s));
}

// ---- tv 168 × 176: tele retro con un gato en pantalla ----
{
  let s = '';
  s += rect(70, 136, 28, 18, 4, C.negroS, 5);
  s += rect(30, 152, 108, 20, 10, C.negro, 5);
  s += rect(4, 4, 160, 136, 16, C.negro, 5);
  s += rect(16, 16, 112, 112, 12, C.teal, 5);
  // gatito en la pantalla
  const hx = 72, hy = 78;
  s += o(`M${hx - 32} ${hy - 18} l4 -28 l24 18 z`, P.naranja, 4) + o(`M${hx + 32} ${hy - 18} l-4 -28 l-24 18 z`, P.naranja, 4);
  s += f(`M${hx - 26} ${hy - 22} l2 -14 l12 10 z`, P.rosa) + f(`M${hx + 26} ${hy - 22} l-2 -14 l-12 10 z`, P.rosa);
  s += o(`M${hx - 36} ${hy} c0 -24 16 -34 36 -34 c20 0 36 10 36 34 c0 22 -16 32 -36 32 c-20 0 -36 -10 -36 -32 z`, P.naranja, 4);
  s += f(`M${hx - 26} ${hy + 10} c0 -8 8 -12 16 -10 c6 2 8 8 8 14 c-2 6 -8 8 -14 6 c-6 -2 -10 -4 -10 -10 z`, P.crema);
  s += f(`M${hx + 26} ${hy + 10} c0 -8 -8 -12 -16 -10 c-6 2 -8 8 -8 14 c2 6 8 8 14 6 c6 -2 10 -4 10 -10 z`, P.crema);
  s += eyes(hx, hy + 2, 13, 7, false) + nose(hx, hy + 12, 6) + line(`M${hx - 5} ${hy + 19} q5 5 10 0`, K, 3) + whiskers(hx, hy + 13, 14);
  s += f('M24 22 c20 -6 60 -4 80 2 l-2 8 c-26 -4 -54 -4 -76 2 z', BL, 'opacity=".3"');
  s += borde(16, 16, 112, 112, 12);
  // panel lateral
  s += circ(146, 36, 9, P.gris, 4) + line('M146 36 v-6', K, 3) + circ(146, 62, 9, P.gris, 4) + line('M146 62 l5 -3', K, 3);
  s += line('M138 86 h16 M138 94 h16 M138 102 h16 M138 110 h16', P.grisS, 3);
  s += circ(146, 124, 3.5, P.rojo, 0);
  scene('obj_tv', svg(168, 176, s));
}

// ---- mesa 176 × 84: mesita de centro de madera ----
{
  let s = '';
  s += rect(36, 22, 14, 48, 3, P.maderaS, 5) + rect(126, 22, 14, 48, 3, P.maderaS, 5);
  s += rect(14, 22, 18, 58, 4, P.madera, 5) + rect(144, 22, 18, 58, 4, P.madera, 5);
  s += f('M26 26 h3 v50 h-3 z M156 26 h3 v50 h-3 z', P.maderaS);
  s += rect(14, 22, 148, 12, 3, P.maderaS, 5);
  s += rect(4, 4, 168, 20, 7, P.madera, 5);
  s += line('M20 12 h50 M90 10 h60 M40 18 h70', P.maderaS, 3);
  s += f('M10 8 h40 c3 0 3 4 0 4 h-40 c-3 0 -3 -4 0 -4 z', P.maderaC, 'opacity=".9"');
  scene('obj_mesa', svg(176, 84, s));
}

// ---- librero 132 × 384: librero alto lleno de libros, con maceta encima ----
{
  let s = '';
  // maceta
  let mac = '';
  mac += o('M66 24 c-12 -14 -26 -16 -32 -6 c10 6 20 8 32 6 z M66 24 c12 -14 26 -16 32 -6 c-10 6 -20 8 -32 6 z M66 24 c-4 -12 0 -20 4 -22 c4 6 4 14 -4 22 z', P.pasto, 4);
  mac += o('M48 22 h36 l-4 20 h-28 z', '#c96a3c', 5);
  mac += f('M52 26 h8 l2 12 h-8 z', '#ffb08a', 'opacity=".5"');
  s += g('translate(0 3)', mac);
  s += rect(6, 38, 120, 342, 8, P.madera, 5);
  const libros = [P.rojo, P.azul, P.pasto, P.oro, P.morado, P.rosa, P.verde, P.naranja, P.azulS, C.rojoS];
  for (let i = 0; i < 5; i++) {
    const y0 = 50 + i * 66;
    s += rect(16, y0, 100, 54, 3, P.maderaS, 0);
    let x = 20, k = i * 3;
    while (x < 112) {
      const w = 9 + ((k * 7) % 6);
      const h = 34 + ((k * 11) % 16);
      if (x + w > 112) break;
      s += rect(x, y0 + 54 - h, w, h, 2, libros[k % libros.length], 3);
      s += f(`M${x + 2} ${y0 + 60 - h} h${w - 4} v3 h-${w - 4} z`, BL, 'opacity=".5"');
      x += w + 2; k++;
    }
    s += rect(10, y0 + 54, 112, 10, 2, P.maderaC, 4);
  }
  s += f('M9 42 h4 v334 h-4 z', P.maderaC, 'opacity=".7"');
  scene('obj_librero', svg(132, 384, s));
}

// ---- cafetera 112 × 168: cafetera de goteo con jarra ----
{
  let s = '';
  s += rect(8, 150, 96, 14, 6, C.negro, 5);
  s += rect(8, 40, 32, 116, 6, C.negro, 5);
  s += rect(8, 6, 96, 40, 10, C.negro, 5);
  s += f('M14 10 h84 v8 h-84 z', BL, 'opacity=".2"');
  s += rect(26, 14, 60, 8, 4, C.negroC, 0);
  s += f('M12 42 h6 v110 h-6 z', BL, 'opacity=".15"');
  s += circ(24, 134, 4, P.rojo, 0);
  // gotas de café cayendo
  s += line('M68 52 v6 M68 64 v6', P.cafe, 4);
  // jarra
  s += o('M94 92 c16 2 16 34 0 38', 'none', 5);
  s += o('M42 82 h52 c6 24 6 44 0 66 h-52 c-6 -22 -6 -42 0 -66 z', P.azulC, 5);
  s += f('M40 112 h56 c0 12 -1 24 -2 36 h-52 c-1 -12 -2 -24 -2 -36 z', P.cafe);
  s += f('M80 114 h14 c0 12 -1 22 -2 34 h-12 z', '#6b3b2a');
  s += brillo(46, 90, 6, 50, 0.6);
  s += rect(40, 74, 56, 12, 6, C.negro, 5);
  scene('obj_cafetera', svg(112, 168, s));
}

// ---- licuadora 112 × 216: licuadora con licuado rosa y fresa ----
{
  let s = '';
  s += rect(14, 152, 84, 60, 12, C.negro, 5);
  s += f('M18 196 h76 v6 a6 6 0 0 1 -6 6 h-64 a6 6 0 0 1 -6 -6 z', C.negroS);
  s += rect(26, 166, 14, 8, 3, P.rojo, 0) + rect(44, 166, 14, 8, 3, P.oro, 0) + rect(62, 166, 14, 8, 3, P.pasto, 0);
  s += circ(84, 180, 7, P.grisS, 4) + line('M84 180 v-5', K, 3);
  s += f('M18 158 h4 v36 h-4 z', BL, 'opacity=".15"');
  // jarra y asa
  s += o('M92 68 c22 4 22 56 -2 62', 'none', 5);
  s += o('M22 154 l-4 -112 h76 l-4 112 z', P.azulC, 5);
  s += f('M24 96 c10 -6 20 2 30 -2 c10 -4 20 2 32 -4 l-3 60 h-56 z', P.rosa);
  s += f('M74 92 c6 -2 10 -2 14 -4 l-3 60 h-12 z', C.pink);
  s += circ(40, 112, 3, BL, 0) + circ(60, 126, 2.5, BL, 0);
  s += brillo(28, 50, 6, 90, 0.6);
  s += line('M44 148 l24 -2 M46 144 l20 6', P.grisS, 4);
  s += rect(16, 32, 80, 16, 8, P.gris, 5);
  s += f('M22 36 h68 v4 h-68 z', BL, 'opacity=".6"');
  s += rect(42, 20, 28, 14, 5, P.grisS, 5);
  // fresa
  let fr = '';
  fr += o('M56 4 c-10 0 -14 8 -8 16 c3 4 13 4 16 0 c6 -8 2 -16 -8 -16 z', P.rojo, 4);
  fr += f('M51 10 h2 v2 h-2 z M57 12 h2 v2 h-2 z M54 16 h2 v2 h-2 z', P.amarillo);
  fr += o('M48 5 c4 -4 12 -4 16 0 l-8 4 z', P.pasto, 3);
  s += g('translate(0 3)', fr);
  scene('obj_licuadora', svg(112, 216, s));
}

// ---- microondas 180 × 112: horno de microondas con sopita humeante ----
{
  let s = '';
  s += rect(16, 98, 24, 10, 3, P.grisS, 4) + rect(140, 98, 24, 10, 3, P.grisS, 4);
  s += rect(4, 6, 172, 94, 10, P.crema, 5);
  s += f('M10 86 h160 v6 a6 6 0 0 1 -6 6 h-148 a6 6 0 0 1 -6 -6 z', P.cremaS);
  s += rect(14, 16, 112, 74, 8, P.cremaS, 5);
  s += rect(24, 26, 92, 54, 6, '#7a4a2a', 5);
  // plato con sopa y vapor
  s += ell(70, 70, 28, 7, P.piedra, 4);
  s += o('M46 60 h48 c-2 12 -10 18 -24 18 c-14 0 -22 -6 -24 -18 z', BL, 4);
  s += ell(70, 60, 24, 5, P.naranja, 0);
  s += line('M58 50 c-4 -6 4 -10 0 -16 M72 48 c-4 -6 4 -10 0 -16 M84 50 c-4 -6 4 -10 0 -16', BL, 3);
  s += f('M30 30 h80 v6 h-80 z', BL, 'opacity=".25"');
  s += rect(118, 30, 6, 46, 3, P.grisS, 0);
  // panel
  s += circ(150, 36, 10, P.grisS, 4) + line('M150 36 v-7', K, 3);
  s += circ(150, 62, 10, P.grisS, 4) + line('M150 62 l6 -4', K, 3);
  s += rect(138, 78, 24, 8, 3, P.rojo, 3);
  s += f('M10 10 h110 v5 h-110 z', BL, 'opacity=".7"');
  scene('obj_microondas', svg(180, 112, s));
}

// ---- computadora 196 × 176: computadora con arcoíris en pantalla, teclado y ratón ----
{
  let s = '';
  s += rect(60, 126, 76, 14, 6, C.negro, 5);
  s += rect(84, 112, 28, 16, 3, C.negroS, 5);
  s += rect(20, 4, 156, 114, 10, C.negro, 5);
  s += clipR('scr', 30, 14, 136, 92, 6);
  let arc = `<rect x="30" y="14" width="136" height="92" fill="${P.azulC}"/>`;
  const rainbow = ['#ef5a4c', '#f6a44c', '#ffe27a', '#5ec47a', '#6cc8f5', '#8e5bd1', '#c9a9f5'];
  rainbow.forEach((c, i) => { arc += `<circle cx="36" cy="112" r="${118 - i * 14}" fill="none" stroke="${c}" stroke-width="15"/>`; });
  s += clipped('scr', arc);
  s += f('M38 20 h60 c4 0 4 6 0 6 h-60 c-4 0 -4 -6 0 -6 z', BL, 'opacity=".5"');
  s += borde(30, 14, 136, 92, 6);
  s += circ(156, 110, 3, P.pasto, 0);
  // teclado
  s += rect(4, 144, 148, 28, 6, C.negro, 5);
  const keys = [P.rojo, P.naranja, P.amarillo, P.pasto, P.azul, P.morado, P.rosa];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 11; i++) s += rect(12 + i * 12 + r * 4, 150 + r * 10, 8, 7, 2, keys[(i + r * 3) % keys.length], 0);
  // ratón
  s += line('M172 150 c-4 -10 -10 -14 -20 -14', K, 4);
  s += ell(172, 160, 16, 11, P.gris, 5);
  s += line('M172 150 v8', K, 3);
  s += f('M162 156 a10 6 0 0 1 8 -4 v3 a7 4 0 0 0 -5 3 z', BL, 'opacity=".7"');
  scene('obj_computadora', svg(196, 176, s));
}

// ---- lavadora 160 × 208: lavadora de carga frontal con agua y burbujas ----
{
  let s = '';
  s += rect(12, 198, 28, 8, 3, P.grisS, 4) + rect(120, 198, 28, 8, 3, P.grisS, 4);
  s += rect(4, 4, 152, 196, 10, BL, 5);
  s += f('M10 184 h140 v6 a6 6 0 0 1 -6 6 h-128 a6 6 0 0 1 -6 -6 z', P.piedraS);
  s += rect(10, 10, 140, 34, 6, P.piedra, 0);
  s += circ(30, 27, 10, P.gris, 4) + line('M30 27 v-7', K, 3);
  s += rect(96, 18, 46, 18, 4, P.azulS, 4) + f('M100 22 h12 v10 h-12 z M116 22 h6 v10 h-6 z', P.azulC);
  s += circ(56, 27, 5, P.pasto, 3) + circ(74, 27, 5, P.rojo, 3);
  // puerta
  s += circ(80, 122, 56, P.gris, 5);
  s += clipC('ojo', 80, 122, 42);
  s += clipped('ojo', `<circle cx="80" cy="122" r="42" fill="${P.azulC}"/>` + f('M30 118 c10 -8 20 8 30 0 c10 -8 20 8 30 0 c10 -8 20 8 30 0 v60 h-120 z', P.azul) + f('M30 130 c20 0 30 -6 40 -8 c10 -2 30 2 50 10 v40 h-90 z', P.azulS, 'opacity=".6"') + circ(60, 140, 7, BL, 0) + circ(88, 150, 5, BL, 0) + circ(100, 132, 4, BL, 0) + circ(70, 158, 3, BL, 0));
  s += circ(80, 122, 42, 'none', 5);
  s += f('M48 110 a34 34 0 0 1 24 -22 v8 a26 26 0 0 0 -18 16 z', BL, 'opacity=".7"');
  s += f('M80 70 a52 52 0 0 1 50 38 l-6 2 a46 46 0 0 0 -44 -34 z', P.grisS, 'opacity=".6"');
  s += rect(60, 170, 40, 8, 4, P.grisS, 0);
  scene('obj_lavadora', svg(160, 208, s));
}

// ---- secadora 176 × 268: secadora amarilla con un calcetín dando vueltas ----
{
  let s = '';
  s += o('M28 16 l-22 14 v222 l22 10 z', P.naranja, 5);
  s += f('M14 40 v206 l8 4 v-206 z', P.naranjaS, 'opacity=".6"');
  s += rect(28, 4, 144, 258, 10, P.amarillo, 5);
  s += f('M34 244 h132 v8 a6 6 0 0 1 -6 6 h-120 a6 6 0 0 1 -6 -6 z', C.amarilloS);
  s += rect(36, 12, 128, 36, 6, C.amarilloS, 0);
  s += rect(44, 22, 30, 16, 3, C.negroS, 4) + f('M48 26 h12 v8 h-12 z', P.pasto);
  s += circ(100, 30, 10, P.gris, 4) + line('M100 30 l6 -5', K, 3);
  s += rect(124, 22, 32, 16, 4, C.negro, 4) + f('M128 26 h16 v8 h-16 z', P.azulC);
  // puerta y calcetín
  s += circ(100, 148, 56, C.amarilloS, 5);
  s += circ(100, 148, 42, C.negroS, 5);
  s += g('translate(100 148) rotate(-30)', o('M-10 -34 h20 v34 c0 10 10 14 16 20 c4 6 -2 12 -10 12 h-14 c-8 0 -12 -6 -12 -14 z', BL, 4) + f('M-10 -34 h20 v8 h-20 z M-6 18 c4 4 10 6 16 6 c4 0 6 -2 6 -6 c-6 4 -14 2 -22 0 z', P.rojo));
  s += f('M66 138 a34 34 0 0 1 24 -24 v8 a26 26 0 0 0 -18 16 z', BL, 'opacity=".6"');
  s += rect(120, 216, 36, 24, 4, C.amarilloS, 4) + line('M130 228 h16', K, 3);
  s += f('M40 56 h80 v5 h-80 z', BL, 'opacity=".6"');
  scene('obj_secadora', svg(176, 268, s));
}

// ---- estufa 140 × 180: estufa blanca con una olla roja ----
{
  let s = '';
  s += rect(4, 72, 132, 104, 8, BL, 5);
  s += f('M10 160 h120 v6 a6 6 0 0 1 -6 6 h-108 a6 6 0 0 1 -6 -6 z', P.piedraS);
  // perillas
  for (const x of [24, 52, 88, 116]) s += circ(x, 86, 7, P.gris, 4) + line(`M${x} 86 v-5`, K, 3);
  // horno
  s += rect(16, 100, 108, 56, 8, P.piedra, 5);
  s += rect(26, 110, 88, 32, 6, C.negro, 5);
  s += f('M32 114 h30 v6 h-30 z', BL, 'opacity=".3"');
  s += rect(20, 96, 100, 8, 4, P.gris, 4);
  // cubierta y quemadores
  s += rect(4, 52, 132, 24, 8, BL, 5);
  s += f('M10 56 h120 v5 h-120 z', BL);
  s += ell(26, 62, 14, 6, C.negro, 4) + ell(114, 62, 14, 6, C.negro, 4);
  s += ell(70, 64, 22, 7, C.negro, 4) + ell(70, 64, 14, 4, C.negroC, 0);
  // olla
  s += o('M40 26 h60 c0 14 0 24 -4 32 h-52 c-4 -8 -4 -18 -4 -32 z', P.rojo, 5);
  s += f('M82 30 h14 c0 12 0 20 -3 26 h-14 c3 -6 3 -14 3 -26 z', C.rojoS);
  s += brillo(48, 32, 6, 16, 0.5);
  s += rect(28, 30, 14, 8, 4, P.rojo, 4) + rect(98, 30, 14, 8, 4, P.rojo, 4);
  s += ell(70, 26, 34, 8, P.rojo, 5);
  s += f('M44 26 a26 5 0 0 1 52 0 a26 3 0 0 1 -52 0 z', '#ff8f84', 'opacity=".6"');
  s += rect(60, 12, 20, 10, 5, C.negro, 4);
  s += line('M54 16 c-4 -6 4 -8 0 -12 M88 16 c-4 -6 4 -8 0 -12', P.grisS, 3);
  scene('obj_estufa', svg(140, 180, s));
}

// ---- refri 200 × 452: refri de dos puertas con imanes ----
{
  let s = '';
  s += rect(40, 440, 30, 8, 3, C.negro, 4) + rect(150, 440, 30, 8, 3, C.negro, 4);
  s += o('M26 14 l-20 12 v404 l20 10 z', C.ladoRefri, 5);
  s += f('M12 40 v376 l8 4 v-376 z', P.grisS, 'opacity=".5"');
  s += rect(26, 4, 168, 436, 12, C.humo, 5);
  s += f('M32 420 h156 v8 a8 8 0 0 1 -8 8 h-140 a8 8 0 0 1 -8 -8 z', C.humoS);
  s += f('M32 134 h156 v8 h-156 z', C.humoS);
  s += line('M26 146 h168', K, 5);
  s += f('M34 10 h40 c4 0 4 6 0 6 h-40 c-4 0 -4 -6 0 -6 z', BL, 'opacity=".9"');
  s += f('M34 152 h40 c4 0 4 6 0 6 h-40 c-4 0 -4 -6 0 -6 z', BL, 'opacity=".9"');
  // manijas
  s += rect(36, 36, 10, 84, 5, P.gris, 4) + rect(36, 166, 10, 130, 5, P.gris, 4);
  // imanes: galleta de jengibre
  s += g('translate(126 84)', circ(0, -14, 11, C.galleta, 4) + o('M-7 -4 h14 l13 8 l-4 6 l-7 -3 l6 22 h-9 l-5 -10 l-5 10 h-9 l6 -22 l-7 3 l-4 -6 z', C.galleta, 4) + f('M-4 -16 a1.5 1.5 0 1 1 3 0 a1.5 1.5 0 1 1 -3 0 M2 -16 a1.5 1.5 0 1 1 3 0 a1.5 1.5 0 1 1 -3 0', K) + line('M-3 -10 q3 3 6 0', K, 2) + circ(0, 4, 2, BL, 0) + circ(0, 12, 2, BL, 0));
  s += star(166, 48, 10) + star(168, 198, 9) + star(66, 390, 8, P.rosa);
  // imán de huevo estrellado
  s += o('M126 300 c-12 -16 -40 -8 -34 10 c-10 10 2 26 14 20 c8 10 30 8 32 -6 c14 -4 8 -26 -12 -24 z', BL, 4);
  s += circ(124, 312, 11, P.oro, 4) + circ(120, 308, 3, P.amarillo, 0);
  // nota pegada
  s += rect(140, 350, 34, 30, 2, P.amarillo, 4) + line('M146 360 h22 M146 368 h16', P.oroS, 3);
  scene('obj_refri', svg(200, 452, s));
}
