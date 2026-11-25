// Objetos de la Luna (cohete, laboratorio y superficie). Cada uno se apoya en el borde de abajo del lienzo
// y ocupa casi todo el lienzo; los tamaños son los que el juego usa para colocarlos: no cambiarlos.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene } from './lib.mjs';

// ---- Colores extra (planos y vivos) ----
const C = {
  negro: '#3b3b4a', negroS: '#2b2a3a', negroC: '#565670', rojoS: '#c23b30', coral: '#f0717a', coralS: '#c94a58', vino: '#a83a48',
  lila: '#d4cdf0', lilaS: '#a89fd6', roca: '#6b7387', rocaS: '#4a5060', rocaC: '#8b94a9', cristal: '#7ddb4c', cristalS: '#4fa82e', cristalC: '#c6f59a',
  alien: '#6fd36f', alienS: '#48a84c', corcho: '#b08556', corchoS: '#8a6239', visor: '#3a2030', metal: '#aab1c2', metalS: '#7f879c',
  tierra: '#5a3b2a', blancoS: '#dcd5e6', ojoVerde: '#8ff07a', panel: '#2f6fb8',
};
const BL = P.blanco;
/** Contorno solo (para repintar el borde encima de los rellenos interiores). */
const borde = (x, y, w, h, r, sw = 5) => rect(x, y, w, h, r, 'none', sw);
const clipC = (id, cx, cy, r) => `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
const clipP = (id, d) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
const clipped = (id, body) => `<g clip-path="url(#${id})">${body}</g>`;
const brillo = (x, y, w, h, op = 0.5) => rect(x, y, w, h, Math.min(w, h) / 2, BL, 0).replace('/>', ` opacity="${op}"/>`);
/** Huella de gato: almohadilla grande y cuatro deditos. */
const huella = (cx, cy, r, fill) =>
  ell(cx, cy + r * 0.6, r * 1.15, r * 0.95, fill, 0) +
  ell(cx - r * 1.2, cy - r * 0.3, r * 0.42, r * 0.56, fill, 0) + ell(cx - r * 0.42, cy - r * 0.95, r * 0.42, r * 0.56, fill, 0) +
  ell(cx + r * 0.42, cy - r * 0.95, r * 0.42, r * 0.56, fill, 0) + ell(cx + r * 1.2, cy - r * 0.3, r * 0.42, r * 0.56, fill, 0);

// ---- casco 116 × 128: casco de astronauta blanco con orejas de gato y visor naranja ----
{
  let s = '';
  // orejas (detrás del domo)
  s += o('M12 50 l6 -44 l38 26 z', BL, 5) + o('M104 50 l-6 -44 l-38 26 z', BL, 5);
  s += f('M21 42 l3 -25 l22 15 z', P.rosa) + f('M95 42 l-3 -25 l-22 15 z', P.rosa);
  // aro del cuello
  s += rect(20, 108, 76, 17, 7, C.lilaS, 5);
  s += f('M26 112 h64 v3 h-64 z', BL, 'opacity=".45"');
  // domo
  s += ell(58, 72, 53, 48, BL, 5);
  s += f('M94 34 c16 20 16 52 -2 74 c-8 10 -18 14 -28 16 c26 -8 40 -32 40 -54 c0 -14 -4 -26 -10 -36 z', C.lila);
  s += f('M10 92 c16 18 62 20 92 2 c-26 10 -64 10 -92 -2 z', C.lila);
  // visor
  s += ell(50, 76, 38, 30, P.naranja, 5);
  s += f('M50 54 c22 0 36 12 36 24 c0 12 -10 22 -26 26 c16 -6 22 -16 20 -26 c-2 -12 -14 -20 -30 -24 z', P.naranjaS);
  s += f('M18 84 c6 12 20 20 40 20 c-16 2 -32 -4 -40 -20 z', P.naranjaS);
  s += brillo(18, 60, 12, 22, 0.75);
  s += circ(34, 58, 3.5, BL, 0).replace('/>', ' opacity=".7"/>');
  // pieza lateral (audífono)
  s += circ(100, 84, 10, C.lila, 5) + circ(100, 84, 4, P.naranja, 0);
  scene('obj_casco', svg(116, 128, s));
}

// ---- comida 72 × 168: tubo de comida espacial con etiqueta de pescadito ----
{
  let s = '';
  const tubo = 'M12 18 h48 v110 l-10 22 l6 14 h-40 l6 -14 l-10 -22 z';
  s += o(tubo, C.coral, 5);
  s += f('M50 22 h8 v106 l-10 22 l6 14 h-8 l-4 -14 l8 -22 z', C.coralS);
  s += f('M20 140 h32 l-2 6 h-28 z', C.coralS, 'opacity=".7"');
  s += brillo(17, 26, 6, 60, 0.6);
  // etiqueta
  s += rect(18, 48, 36, 52, 6, P.crema, 4);
  s += f('M22 90 h28 v4 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 z', P.cremaS);
  // pescadito rosa
  s += o('M44 74 l10 -8 v16 z', P.rosa, 3);
  s += ell(34, 74, 11, 8, P.rosa, 3);
  s += f('M34 78 c6 0 10 -2 11 -4 c0 4 -4 8 -11 8 c-6 0 -10 -2 -11 -4 c2 1 6 0 11 0 z', '#e87a95');
  s += circ(29, 72, 2, K, 0);
  // tapa
  s += rect(14, 15, 44, 8, 3, C.vino, 4);
  s += rect(8, 4, 56, 15, 5, C.vino, 5);
  s += f('M12 8 h48 v3 h-48 z', BL, 'opacity=".35"');
  s += line('M18 13 v4 M26 13 v4 M34 13 v4 M42 13 v4 M50 13 v4', K, 2);
  // pliegue de abajo
  s += line('M22 150 h28', K, 3);
  scene('obj_comida', svg(72, 168, s));
}

// ---- pecera 120 × 128: pecera redonda con pez naranja, tapa y base de madera ----
{
  let s = '';
  // base
  s += rect(14, 106, 92, 19, 7, P.maderaS, 5);
  s += f('M20 110 h80 v4 h-80 z', P.madera);
  // vidrio
  s += circ(60, 62, 51, P.azulC, 5);
  s += clipC('agua', 60, 62, 48);
  let agua = f('M0 32 c15 -6 30 6 45 0 c15 -6 30 6 45 0 c12 -4 22 2 30 0 v100 h-120 z', P.azul);
  agua += f('M8 92 c20 -12 60 -8 104 4 v30 h-104 z', P.azulS, 'opacity=".55"');
  agua += ell(60, 104, 26, 5, P.piedraS, 0) + circ(44, 104, 4, P.piedra, 0) + circ(58, 106, 3, P.piedra, 0) + circ(74, 103, 4, P.piedra, 0);
  // pez
  agua += o('M78 70 l18 -14 v28 z', P.naranja, 4);
  agua += f('M84 70 l10 -8 v16 z', P.naranjaS);
  agua += o('M46 60 c6 -12 18 -14 26 -4 l-8 6 z', P.naranja, 4);
  agua += ell(60, 70, 22, 14, P.naranja, 4);
  agua += f('M40 74 c10 8 30 8 40 0 c-6 8 -16 10 -22 10 c-8 0 -14 -4 -18 -10 z', P.naranjaS);
  agua += o('M56 80 c4 6 10 6 14 0', P.naranja, 3);
  agua += circ(70, 66, 4.5, BL, 0) + circ(71, 66, 2.5, K, 0);
  agua += line('M46 70 q-2 6 0 8', P.naranjaS, 3);
  // burbujas
  agua += circ(30, 44, 4, BL, 0) + circ(26, 54, 2.5, BL, 0) + circ(88, 40, 3, BL, 0);
  s += clipped('agua', agua);
  s += circ(60, 62, 51, 'none', 5);
  s += f('M20 46 a42 42 0 0 1 22 -28 v8 a34 34 0 0 0 -16 22 z', BL, 'opacity=".7"');
  // tapa
  s += rect(18, 4, 84, 18, 7, P.madera, 5);
  s += f('M22 15 h76 v3 a4 4 0 0 1 -4 4 h-68 a4 4 0 0 1 -4 -4 z', P.maderaS);
  s += f('M24 7 h40 c3 0 3 4 0 4 h-40 c-3 0 -3 -4 0 -4 z', P.maderaC, 'opacity=".9"');
  scene('obj_pecera', svg(120, 128, s));
}

// ---- traje 144 × 360: traje espacial blanco con huella de gato en el pecho ----
{
  let s = '';
  // botas
  s += rect(32, 328, 38, 29, 10, P.gris, 5) + rect(74, 328, 38, 29, 10, P.gris, 5);
  s += f('M36 347 h30 v3 a6 6 0 0 1 -6 6 h-18 a6 6 0 0 1 -6 -6 z M78 347 h30 v3 a6 6 0 0 1 -6 6 h-18 a6 6 0 0 1 -6 -6 z', P.rojo);
  // piernas
  s += rect(36, 210, 34, 124, 12, BL, 5) + rect(74, 210, 34, 124, 12, BL, 5);
  s += f('M60 214 h6 v116 h-6 z M98 214 h6 v116 h-6 z', P.piedraS, 'opacity=".6"');
  s += rect(42, 262, 22, 18, 8, P.piedra, 0) + rect(80, 262, 22, 18, 8, P.piedra, 0);
  // brazos y guantes
  s += rect(6, 112, 28, 122, 12, BL, 5) + rect(110, 112, 28, 122, 12, BL, 5);
  s += f('M26 118 h4 v110 h-4 z M130 118 h4 v110 h-4 z', P.piedraS, 'opacity=".6"');
  s += rect(4, 226, 32, 30, 12, P.rojo, 5) + rect(108, 226, 32, 30, 12, P.rojo, 5);
  s += f('M8 244 h24 v2 a8 8 0 0 1 -8 8 h-8 a8 8 0 0 1 -8 -8 z M112 244 h24 v2 a8 8 0 0 1 -8 8 h-8 a8 8 0 0 1 -8 -8 z', C.rojoS);
  s += brillo(8, 230, 8, 10, 0.5) + brillo(112, 230, 8, 10, 0.5);
  // torso
  s += rect(28, 96, 88, 126, 22, BL, 5);
  s += f('M98 102 c8 30 8 86 0 116 h10 c6 -30 6 -86 0 -116 z', P.piedraS, 'opacity=".7"');
  s += f('M34 206 h76 c0 8 -4 12 -12 12 h-52 c-8 0 -12 -4 -12 -12 z', P.piedraS, 'opacity=".5"');
  s += rect(30, 108, 8, 22, 3, P.rojo, 0) + rect(106, 108, 8, 22, 3, P.rojo, 0);
  s += line('M44 198 h56', P.gris, 4);
  s += huella(72, 150, 9, K);
  s += brillo(36, 104, 8, 40, 0.8);
  // cuello
  s += rect(50, 86, 44, 16, 6, P.gris, 5);
  // casco
  s += circ(72, 50, 45, BL, 5);
  s += f('M100 20 c14 14 16 42 2 58 c-6 8 -14 12 -24 14 c22 -8 34 -28 32 -46 c0 -10 -4 -18 -10 -26 z', P.piedraS, 'opacity=".6"');
  s += circ(72, 54, 32, C.visor, 5);
  s += f('M50 44 c4 -12 14 -18 26 -16 c-10 4 -18 10 -20 20 z', P.rojo, 'opacity=".75"');
  s += brillo(46, 38, 8, 14, 0.85);
  s += rect(20, 42, 12, 22, 5, P.gris, 5) + rect(112, 42, 12, 22, 5, P.gris, 5);
  scene('obj_traje', svg(144, 360, s));
}

// ---- telescopio 168 × 288: telescopio dorado en tripié de madera ----
{
  let s = '';
  // patas del tripié
  const patas = ['M86 120 L14 280', 'M86 120 L98 280', 'M86 120 L156 280'];
  for (const d of patas) s += line(d, K, 13) + line(d, P.madera, 7);
  s += line('M50 200 L122 200', K, 9) + line('M50 200 L122 200', P.maderaS, 4);
  for (const d of patas) s += line(d, P.maderaS, 2.5).replace('/>', ' opacity=".6" transform="translate(2 0)"/>');
  // cabeza del tripié y soporte
  s += rect(66, 104, 40, 22, 7, P.maderaS, 5);
  s += rect(72, 76, 26, 34, 6, P.oroS, 5);
  s += f('M76 80 h4 v26 h-4 z', P.oro, 'opacity=".6"');
  // tubo (inclinado hacia arriba a la derecha)
  let t = '';
  t += rect(30, -15, 100, 30, 6, P.oro, 5);
  t += f('M36 3 h88 v8 a4 4 0 0 1 -4 4 h-80 a4 4 0 0 1 -4 -4 z', P.oroS);
  t += brillo(40, -10, 60, 5, 0.55);
  t += rect(-6, -11, 42, 22, 5, P.oro, 5);
  t += f('M0 3 h32 v5 a3 3 0 0 1 -3 3 h-26 a3 3 0 0 1 -3 -3 z', P.oroS);
  t += ell(-5, 0, 6, 11, C.metalS, 4) + ell(-5, 0, 3, 6, C.negroS, 0);
  t += rect(124, -19, 26, 38, 6, P.oro, 5);
  t += f('M130 6 h16 v8 a4 4 0 0 1 -4 4 h-8 a4 4 0 0 1 -4 -4 z', P.oroS);
  t += brillo(130, -14, 12, 5, 0.55);
  t += rect(28, -17, 8, 34, 3, P.oroS, 4) + rect(118, -18, 8, 36, 3, P.oroS, 4) + rect(76, -16, 8, 32, 3, P.oroS, 4);
  s += g('translate(26 104) rotate(-32)', t);
  scene('obj_telescopio', svg(168, 288, s));
}

// ---- roca 152 × 120: roca lunar gris con cristales verdes ----
{
  let s = '';
  // cristales (la roca los tapa por abajo)
  s += o('M46 32 l14 -14 l12 14 v40 h-26 z', C.cristal, 5);
  s += f('M60 20 l12 12 v40 h-10 v-40 z', C.cristalS);
  s += o('M100 30 l12 -12 l12 14 v38 h-24 z', C.cristal, 5);
  s += f('M112 20 l12 12 v38 h-10 v-38 z', C.cristalS);
  s += o('M78 6 l18 18 v46 h-36 v-46 z', C.cristal, 5);
  s += f('M78 8 l18 16 v46 h-12 v-46 z', C.cristalS);
  s += line('M72 20 l-8 8 v26', C.cristalC, 4) + line('M52 34 l6 -6 v14', C.cristalC, 3) + line('M106 32 l5 -5 v12', C.cristalC, 3);
  // roca
  const roca = 'M6 108 c-4 -22 10 -44 36 -52 c22 -7 46 -9 72 -4 c22 4 36 20 32 44 c-2 10 -8 18 -18 18 h-104 c-10 0 -16 -2 -18 -6 z';
  s += o(roca, C.roca, 5);
  s += clipP('rocaClip', roca);
  let sh = f('M30 100 c30 12 80 8 116 -8 c0 12 -6 22 -18 24 h-100 c-6 -4 -4 -10 2 -16 z', C.rocaS);
  sh += f('M118 60 c14 6 22 18 24 34 c-4 -10 -12 -18 -26 -22 c2 -4 2 -8 2 -12 z', C.rocaS, 'opacity=".7"');
  sh += ell(40, 78, 12, 7, C.rocaC, 0) + ell(118, 94, 9, 5, C.rocaC, 0) + circ(90, 96, 5, C.rocaC, 0);
  sh += ell(24, 94, 6, 4, C.rocaS, 0) + ell(70, 86, 5, 3, C.rocaS, 0);
  sh += brillo(22, 66, 18, 6, 0.3);
  s += clipped('rocaClip', sh);
  s += o(roca, 'none', 5);
  scene('obj_roca', svg(152, 120, s));
}

// ---- alien 104 × 176: alien verde saludando dentro de un frasco con tapa de corcho ----
{
  let s = '';
  const frasco = 'M22 34 h60 v12 c10 4 14 12 14 22 v88 c0 10 -8 16 -18 16 h-52 c-10 0 -18 -6 -18 -16 v-88 c0 -10 4 -18 14 -22 z';
  s += o(frasco, P.azulC, 5);
  // alien
  let a = '';
  a += line('M62 116 c12 -2 18 -14 16 -26', K, 11) + line('M62 116 c12 -2 18 -14 16 -26', C.alien, 5) + circ(78, 88, 6, C.alien, 4);
  a += line('M42 118 c-8 4 -10 12 -8 20', K, 11) + line('M42 118 c-8 4 -10 12 -8 20', C.alien, 5) + circ(34, 140, 6, C.alien, 4);
  a += rect(41, 138, 9, 24, 4, C.alien, 5) + rect(54, 138, 9, 24, 4, C.alien, 5);
  a += o('M44 110 h16 c5 10 5 22 0 32 h-16 c-5 -10 -5 -22 0 -32 z', C.alien, 5);
  a += f('M56 112 h4 c5 10 5 22 0 32 h-4 c4 -10 4 -22 0 -32 z', C.alienS);
  a += ell(52, 90, 21, 22, C.alien, 5);
  a += f('M60 70 c10 6 14 16 12 26 c-2 8 -8 14 -16 16 c10 -6 14 -16 12 -26 c-1 -6 -4 -12 -8 -16 z', C.alienS);
  a += ell(44, 92, 5, 7.5, K, 0) + ell(60, 92, 5, 7.5, K, 0);
  a += circ(42.5, 89, 1.8, BL, 0) + circ(58.5, 89, 1.8, BL, 0);
  a += line('M48 103 q4 4 8 0', K, 3);
  a += brillo(38, 76, 6, 10, 0.5);
  s += a;
  // brillos del vidrio
  s += brillo(14, 72, 7, 76, 0.7) + brillo(84, 72, 4, 40, 0.4);
  s += f('M14 150 c10 10 60 12 76 0 v6 c0 10 -8 16 -18 16 h-44 c-10 0 -14 -6 -14 -14 z', P.azul, 'opacity=".35"');
  s += o(frasco, 'none', 5);
  // tapa de corcho
  s += rect(14, 4, 76, 32, 9, C.corcho, 5);
  s += f('M18 24 h68 v4 a8 8 0 0 1 -8 8 h-52 a8 8 0 0 1 -8 -8 z', C.corchoS);
  s += line('M30 10 v10 M52 9 v12 M74 10 v10', C.corchoS, 3);
  s += f('M20 7 h30 c3 0 3 4 0 4 h-30 c-3 0 -3 -4 0 -4 z', BL, 'opacity=".4"');
  scene('obj_alien', svg(104, 176, s));
}

// ---- robot 164 × 268: robot blanco redondo y amable ----
{
  let s = '';
  // antena
  s += line('M84 46 c-2 -12 -6 -22 -12 -32', K, 5);
  s += circ(72, 12, 7, P.rojo, 5);
  // pies
  s += rect(38, 234, 46, 30, 12, BL, 5) + rect(86, 234, 46, 30, 12, BL, 5);
  s += f('M42 250 h38 c0 6 -4 10 -10 10 h-20 c-6 0 -8 -4 -8 -10 z M90 250 h38 c0 6 -4 10 -10 10 h-20 c-6 0 -8 -4 -8 -10 z', P.rojo);
  // piernas
  s += rect(50, 220, 22, 22, 8, C.metalS, 5) + rect(96, 220, 22, 22, 8, C.metalS, 5);
  // brazos
  for (const [sx, hx, dir] of [[40, 24, -1], [134, 148, 1]]) {
    const d = `M${sx} 168 c${dir * 6} 10 ${dir * 10} 24 ${dir * 12} 36`;
    s += line(d, K, 17) + line(d, BL, 11);
    s += circ(sx + dir * 12, 204, 8, C.metalS, 4);
    const d2 = `M${sx + dir * 12} 204 c${dir * 4} 6 ${dir * 2} 12 ${hx - sx - dir * 12} ${222 - 204}`;
    s += line(d2, K, 15) + line(d2, BL, 9);
    s += circ(hx, 224, 11, BL, 5) + circ(hx, 224, 4, C.metalS, 0);
  }
  // cuerpo
  s += ell(86, 188, 46, 50, BL, 5);
  s += f('M112 150 c16 20 16 50 2 70 c-6 10 -16 16 -26 18 c24 -10 36 -34 34 -56 c-2 -12 -6 -24 -10 -32 z', C.blancoS);
  s += f('M46 200 c10 18 60 22 80 2 c-16 14 -60 14 -80 -2 z', C.blancoS);
  s += rect(70, 180, 32, 20, 8, C.metal, 4) + circ(80, 190, 3.5, P.pasto, 0) + circ(92, 190, 3.5, P.rojo, 0);
  s += brillo(52, 156, 10, 24, 0.7);
  s += circ(40, 168, 9, C.metalS, 4) + circ(134, 168, 9, C.metalS, 4);
  // cabeza
  s += circ(82, 92, 52, BL, 5);
  s += f('M108 50 c20 20 22 56 4 80 c-8 10 -18 16 -30 18 c26 -8 42 -36 40 -62 c0 -14 -6 -26 -14 -36 z', C.blancoS);
  s += f('M36 112 c12 22 60 28 90 6 c-20 16 -70 18 -90 -6 z', C.blancoS);
  s += brillo(44, 58, 12, 24, 0.75);
  // orejas
  s += circ(32, 102, 15, C.metalS, 5) + circ(32, 102, 9, C.coral, 0) + circ(29, 99, 3, BL, 0).replace('/>', ' opacity=".6"/>');
  s += circ(132, 102, 11, C.metalS, 5) + circ(132, 102, 5, C.metal, 0);
  // cara
  s += rect(58, 70, 62, 46, 18, C.negro, 5);
  s += rect(70, 82, 11, 20, 5.5, C.ojoVerde, 0) + rect(95, 82, 11, 20, 5.5, C.ojoVerde, 0);
  s += circ(74, 87, 2, BL, 0) + circ(99, 87, 2, BL, 0);
  s += brillo(64, 75, 28, 6, 0.3);
  scene('obj_robot', svg(164, 268, g('translate(-4 0)', s)));
}

// ---- bandera 184 × 376: bandera con huella de gato en un asta ----
{
  let s = '';
  // base y asta
  s += rect(10, 356, 30, 17, 6, P.maderaS, 5);
  s += rect(20, 22, 10, 340, 5, P.maderaS, 5);
  s += f('M23 28 h2 v326 h-2 z', P.maderaC, 'opacity=".55"');
  s += circ(25, 14, 8, P.oro, 5);
  s += rect(16, 24, 18, 8, 3, P.oroS, 4);
  s += circ(23, 12, 2.5, BL, 0).replace('/>', ' opacity=".7"/>');
  // tela
  const tela = 'M30 50 c40 -8 90 -6 140 2 c-6 30 -6 60 6 90 c-10 14 -20 24 -34 26 c-30 -8 -70 -6 -112 -2 z';
  s += o(tela, P.crema, 5);
  s += clipP('telaClip', tela);
  let d = f('M146 58 c-2 30 -2 56 10 88 c-6 8 -12 14 -20 18 c-6 -30 -8 -66 -2 -106 z', P.naranja, 'opacity=".55"');
  d += f('M36 150 c40 -12 80 -10 112 -4 c-6 8 -12 14 -20 18 c-30 -8 -70 -6 -112 -2 z', P.cremaS);
  d += f('M34 54 c30 -6 60 -6 90 -4 c-30 4 -60 6 -90 10 z', BL, 'opacity=".6"');
  s += clipped('telaClip', d);
  s += o(tela, 'none', 5);
  s += huella(100, 104, 17, C.tierra);
  scene('obj_bandera', svg(184, 376, s));
}

// ---- satelite 184 × 240: satélite con paneles solares azules y antena de plato ----
{
  let s = '';
  // patas de madera
  s += rect(16, 190, 14, 44, 4, P.maderaS, 5) + rect(84, 216, 16, 18, 4, P.maderaS, 5) + rect(154, 196, 14, 38, 4, P.maderaS, 5);
  // cuello de la antena
  s += line('M118 90 L126 52', K, 17) + line('M118 90 L126 52', C.metal, 11);
  // caras del cuerpo: L(14,94) F(92,120) R(170,98) B(92,72); abajo L'(14,196) F'(92,222) R'(170,200)
  s += o('M8 92 L92 122 V226 L8 196 z', C.metalS, 5);
  s += o('M92 122 L176 98 V202 L92 226 z', P.gris, 5);
  s += f('M92 212 L176 188 V202 L92 226 z', P.grisS, 'opacity=".6"');
  s += o('M8 92 L92 68 L176 98 L92 122 z', P.piedra, 5);
  s += f('M26 92 L92 74 L124 86 L58 104 z', BL, 'opacity=".6"');
  // paneles solares en la cara izquierda (parallelogramo L→F, L→L')
  const pt = (u, v) => `${(8 + u * 84).toFixed(1)} ${(92 + u * 30 + v * 104).toFixed(1)}`;
  const cell = (u0, u1, v0, v1) => `M${pt(u0, v0)} L${pt(u1, v0)} L${pt(u1, v1)} L${pt(u0, v1)} z`;
  s += o(cell(0.1, 0.9, 0.08, 0.88), C.panel, 4);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
    const u0 = 0.14 + i * 0.38, v0 = 0.12 + j * 0.26;
    s += f(cell(u0, u0 + 0.32, v0, v0 + 0.21), P.azul);
    s += f(cell(u0 + 0.02, u0 + 0.12, v0 + 0.02, v0 + 0.19), P.azulC, 'opacity=".5"');
  }
  // puerto redondo de la cara derecha
  s += circ(140, 166, 16, C.metalS, 5) + circ(140, 166, 8, C.negroS, 0) + circ(136, 162, 2.5, BL, 0).replace('/>', ' opacity=".6"/>');
  s += line('M106 114 l26 -7 M106 124 l26 -7', P.grisS, 3);
  // plato
  let p = '';
  p += rect(-10, 4, 20, 14, 5, P.rojo, 5);
  p += ell(0, 0, 46, 15, P.gris, 5);
  p += f('M-38 2 a38 9 0 0 0 76 0 a38 7 0 0 1 -76 0 z', P.grisS);
  p += ell(0, -1, 33, 8, C.metal, 0);
  p += brillo(-28, -6, 24, 5, 0.6);
  p += line('M0 0 l6 -22', K, 5) + circ(7, -24, 4, P.rojo, 3);
  s += g('translate(128 34) rotate(-18)', p);
  scene('obj_satelite', svg(184, 240, s));
}

// ---- rover 308 × 256: rover lunar amarillo de 6 ruedas con antena ----
{
  let s = '';
  // ruedas traseras
  for (const x of [96, 190, 276]) s += circ(x, 206, 24, C.negro, 5) + circ(x, 206, 10, P.oro, 4) + circ(x, 206, 3, C.negro, 0);
  // antena
  s += line('M266 124 v-84', K, 11) + line('M266 124 v-84', P.gris, 5);
  s += circ(266, 28, 17, BL, 5) + brillo(254, 18, 8, 12, 0.7);
  // chasis
  s += rect(8, 124, 268, 84, 18, P.oro, 5);
  s += f('M14 190 h256 v6 a12 12 0 0 1 -12 12 h-232 a12 12 0 0 1 -12 -12 z', P.oroS);
  s += f('M14 142 h256 v4 h-256 z', P.oroS, 'opacity=".6"');
  // equipo trasero
  s += rect(214, 94, 46, 34, 8, C.metal, 5) + f('M218 112 h38 v6 a6 6 0 0 1 -6 6 h-26 a6 6 0 0 1 -6 -6 z', C.metalS);
  s += circ(250, 106, 5, P.rojo, 0) + line('M222 104 h14', C.metalS, 3);
  // cabina
  s += o('M34 128 c0 -40 20 -66 60 -66 h70 c24 0 36 16 36 36 v30 z', P.oro, 5);
  s += f('M176 68 c14 4 20 14 20 28 v28 h-14 v-28 c0 -12 -2 -22 -6 -28 z', P.oroS);
  s += o('M46 124 c2 -30 18 -50 48 -50 h24 v50 z', P.azul, 5);
  s += f('M60 120 c4 -22 18 -38 40 -40 h14 v40 z', P.azulS, 'opacity=".5"');
  s += brillo(66, 84, 8, 26, 0.7);
  s += rect(128, 78, 44, 40, 8, P.azul, 5) + f('M136 110 h30 v4 h-30 z', P.azulS) + brillo(134, 84, 6, 20, 0.6);
  s += f('M40 70 h30 c3 0 3 4 0 4 h-30 c-3 0 -3 -4 0 -4 z', P.amarillo, 'opacity=".9"');
  s += line('M100 124 v-40', P.oroS, 4);
  // defensa y faros
  s += rect(4, 148, 26, 44, 9, C.metalS, 5);
  s += circ(17, 160, 6, P.amarillo, 3) + circ(17, 180, 6, P.amarillo, 3);
  s += line('M38 166 h26 M38 176 h26', P.oroS, 5);
  // ruedas delanteras
  for (const x of [50, 148, 238]) {
    s += circ(x, 222, 30, C.negro, 5);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      s += circ(x + Math.cos(a) * 23, 222 + Math.sin(a) * 23, 3.5, C.negroC, 0);
    }
    s += circ(x, 222, 13, P.oro, 4) + circ(x, 222, 4, C.negro, 0);
    s += f(`M${x - 22} ${212} a24 24 0 0 1 12 -18 l3 6 a18 18 0 0 0 -9 14 z`, BL, 'opacity=".35"');
  }
  scene('obj_rover', svg(308, 256, s));
}

// ---- cohete 264 × 776: cohete blanco y rojo, alto, con ventanilla ----
{
  let s = '';
  // aletas
  s += o('M64 500 c-30 50 -54 130 -58 214 l58 -18 z', P.rojo, 5);
  s += o('M200 500 c30 50 54 130 58 214 l-58 -18 z', P.rojo, 5);
  s += f('M200 560 c14 40 22 90 24 134 l-24 7 z', C.rojoS);
  s += f('M64 560 c-10 40 -16 90 -18 134 l18 -4 z', C.rojoS, 'opacity=".5"');
  s += brillo(30, 580, 8, 60, 0.4);
  // tobera
  s += o('M94 700 h76 l18 72 h-112 z', C.metalS, 5);
  s += f('M148 704 h22 l18 68 h-24 z', C.negroS, 'opacity=".45"');
  s += f('M100 704 h8 l-12 66 h-10 z', BL, 'opacity=".25"');
  s += rect(86, 692, 92, 16, 8, C.metal, 5);
  // cuerpo
  s += rect(64, 196, 136, 510, 26, BL, 5);
  s += f('M172 212 h22 v470 a10 10 0 0 1 -10 10 h-12 z', P.piedraS, 'opacity=".9"');
  s += f('M70 686 h124 c0 10 -8 16 -18 16 h-88 c-10 0 -18 -6 -18 -16 z', P.piedraS, 'opacity=".7"');
  s += brillo(74, 220, 12, 200, 0.55);
  s += line('M64 560 h136', P.piedraS, 4);
  s += rect(64, 612, 136, 20, 0, P.rojo, 0) + f('M172 612 h22 v20 h-22 z', C.rojoS);
  s += borde(64, 196, 136, 510, 26);
  // ventanilla
  s += circ(132, 330, 42, C.metal, 5) + f('M132 288 a42 42 0 0 1 40 50 l-10 -2 a32 32 0 0 0 -30 -38 z', C.metalS);
  s += circ(132, 330, 28, P.azul, 5);
  s += f('M106 334 c10 12 36 12 50 -4 c-4 16 -18 26 -30 24 c-12 -2 -20 -10 -20 -20 z', P.azulS);
  s += brillo(112, 310, 9, 20, 0.75);
  for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; s += circ(132 + Math.cos(a) * 35, 330 + Math.sin(a) * 35, 3, C.metalS, 0); }
  // nariz
  s += o('M64 212 c0 -90 30 -170 68 -202 c38 32 68 112 68 202 z', P.rojo, 5);
  s += f('M132 24 c30 34 54 100 60 184 h-22 c-2 -80 -16 -140 -38 -184 z', C.rojoS);
  s += brillo(84, 96, 12, 80, 0.5);
  s += rect(60, 200, 144, 20, 10, C.rojoS, 5) + f('M68 204 h40 v4 h-40 z', P.rojo);
  scene('obj_cohete', svg(264, 776, s));
}
