// El gato protagonista (sin la uva de antes), con detalle: pelo de los cachetes y del pecho, rayas en frente, lomo y cola,
// ojos con iris y dos brillos, hocico claro, patas con dedos, sombra en la panza y brillo en la cabeza.
// Medidas iguales que antes: reposo 16 × 20.75 unidades (128 × 166 px) con el pie izquierdo en x = 0;
// manotazo 25.75 × 17.5 (206 × 140) inclinado a la derecha con la pata estirada. Opciones: saco de jefe
// (solapas, camisa y corbata) y garras (en el golpe).
import { K, P, svg, o, f, line, circ, ell, rect, g, scene } from './lib.mjs';

const C = {
  piel: '#f7a84e', sombra: '#de7f2b', sombra2: '#c4661a', raya: '#cf6a1e', crema: '#fff1d8', cremaS: '#f3d6a9', brillo: '#ffd79a',
  rosa: '#f79cb3', rosaS: '#e07794', iris: '#64c493', irisS: '#3f9b6c', ojoS: '#dde3f0', boca: '#8a2f3e', lengua: '#f26d8d',
  uva: '#8e5bd1', uvaC: '#b48af0', hoja: '#5fbf4e', saco: '#2d2b3d', sacoS: '#1f1d2c', camisa: '#ffffff', corbata: '#ef4f4f',
};

/** Ojo grande: blanco, iris verde, pupila y dos brillos; `susto`: pupila chica y párpado de arriba recto. */
export function ojo(cx, cy, r, susto, dx = 0, iris = C.iris, irisS = C.irisS) {
  let s = ell(cx, cy, r, r * 1.18, '#ffffff', 4.5);
  const pr = susto ? r * 0.7 : r * 0.82;
  s += circ(cx + dx, cy + r * 0.2, pr, iris, 0);
  s += f(`M${cx + dx - pr} ${cy + r * 0.2} a${pr} ${pr} 0 0 0 ${2 * pr} 0 v${pr * 0.5} h-${2 * pr} z`, irisS, 'opacity=".5"');
  s += circ(cx + dx, cy + r * 0.26, pr * 0.62, K, 0);
  s += circ(cx + dx - pr * 0.38, cy - r * 0.12, pr * 0.34, '#ffffff', 0);
  s += circ(cx + dx + pr * 0.4, cy + r * 0.55, pr * 0.16, '#ffffff', 0);
  s += line(`M${cx - r * 0.9} ${cy - r * 0.95} q${r * 0.9} -${r * 0.5} ${r * 1.8} 0`, K, 4);
  return s;
}

/** Zigzag de pelo entre dos puntos (para cachetes y pecho). */
export function pelo(x1, y1, x2, y2, n, amp) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    const nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1;
    const k = i % 2 ? amp : 0;
    pts.push(`${(x + (nx / l) * k).toFixed(1)} ${(y + (ny / l) * k).toFixed(1)}`);
  }
  return pts.join(' L');
}

export function gato({ golpe = false, saco = false, garra = false } = {}) {
  const W = golpe ? 206 : 128;
  const H = golpe ? 140 : 166;
  const bx = golpe ? 70 : 64, by = golpe ? 128 : 158; // centro y base del cuerpo
  const hx = golpe ? 96 : 64, hy = golpe ? 56 : 64; // centro de la cabeza
  let s = '';
  // ---- cola (atrás), con rayas y punta clara ----
  s += o(`M${bx - 42} ${by - 12} c-22 -6 -28 -34 -12 -50 c8 -8 20 -6 20 4 c0 8 -10 10 -8 20 c2 10 10 12 14 16 z`, C.piel, 5);
  s += line(`M${bx - 52} ${by - 44} l10 -4 M${bx - 54} ${by - 34} l10 -2 M${bx - 52} ${by - 24} l8 2`, C.raya, 5);
  s += f(`M${bx - 46} ${by - 62} c6 -6 14 -4 14 2 c-4 4 -10 4 -14 -2 z`, C.crema);
  // ---- patas traseras (caderas) ----
  s += ell(bx - 40, by - 10, 16, 15, C.piel, 5);
  s += ell(bx + 40, by - 10, 16, 15, C.piel, 5);
  // ---- cuerpo ----
  s += o(`M${bx - 46} ${by - 6} c-6 -40 16 -62 46 -62 c30 0 52 22 46 62 c-2 10 -20 12 -46 12 c-26 0 -44 -2 -46 -12 z`, C.piel, 6);
  s += f(`M${bx - 40} ${by - 14} c6 16 24 20 40 20 c16 0 34 -4 40 -20 c-6 10 -22 14 -40 14 c-18 0 -34 -4 -40 -14 z`, C.sombra, 'opacity=".7"');
  // panza clara con orilla de pelo
  s += f(`M${pelo(bx - 28, by - 46, bx + 28, by - 46, 6, 5)} c6 10 8 24 0 40 c-8 8 -48 8 -56 0 c-8 -16 -6 -30 0 -40 z`, C.crema);
  s += f(`M${bx - 20} ${by - 14} c6 6 34 6 40 0 c-4 6 -36 6 -40 0 z`, C.cremaS);
  // rayas del lomo
  s += line(`M${bx - 44} ${by - 44} l8 6 M${bx - 46} ${by - 32} l8 4 M${bx + 44} ${by - 44} l-8 6 M${bx + 46} ${by - 32} l-8 4`, C.raya, 5);
  if (saco) {
    s += o(`M${bx - 44} ${by - 20} c0 -30 18 -48 44 -48 l-16 46 l-10 28 c-10 -4 -18 -14 -18 -26 z`, C.saco, 5);
    s += o(`M${bx + 44} ${by - 20} c0 -30 -18 -48 -44 -48 l16 46 l10 28 c10 -4 18 -14 18 -26 z`, C.saco, 5);
    s += f(`M${bx - 36} ${by - 44} c4 -8 10 -12 16 -14 l-10 30 z M${bx + 36} ${by - 44} c-4 -8 -10 -12 -16 -14 l10 30 z`, C.sacoS, 'opacity=".6"');
    s += f(`M${bx - 12} ${by - 66} h24 l-12 28 z`, C.camisa);
    s += o(`M${bx - 5} ${by - 62} h10 l-2 9 l4 20 l-7 8 l-7 -8 l4 -20 z`, C.corbata, 4);
    s += circ(bx + 22, by - 34, 2.5, C.camisa, 0);
  }
  // ---- patas delanteras ----
  if (golpe) {
    // la izquierda apoyada; la derecha estirada hacia el objeto
    s += rect(bx - 30, by - 30, 20, 36, 9, C.piel, 5);
    s += ell(bx - 20, by + 4, 15, 7, C.piel, 5);
    s += line(`M${bx - 28} ${by + 4} v4 M${bx - 20} ${by + 5} v4 M${bx - 12} ${by + 4} v4`, K, 3);
    const sleeve = saco ? C.saco : C.piel;
    s += o(`M${bx + 16} ${by - 34} c30 -16 62 -24 96 -26 c10 0 12 14 2 16 c-32 6 -60 16 -88 32 z`, sleeve, 5);
    if (saco) s += rect(bx + 86, by - 60, 14, 22, 4, C.camisa, 4);
    s += ell(bx + 116, by - 50, 18, 13, C.piel, 5);
    s += line(`M${bx + 108} ${by - 56} v8 M${bx + 118} ${by - 58} v8 M${bx + 128} ${by - 54} v8`, K, 3);
    s += f(`M${bx + 104} ${by - 44} a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0 M${bx + 114} ${by - 46} a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0 M${bx + 124} ${by - 42} a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0`, C.rosa);
    if (garra) s += o(`M${bx + 130} ${by - 60} l18 -12 l-10 16 z M${bx + 134} ${by - 50} l20 -4 l-16 10 z M${bx + 132} ${by - 40} l16 6 l-18 2 z`, '#f3f0ff', 3);
    s += line(`M${bx + 130} ${by - 76} l10 -10 M${bx + 140} ${by - 62} l14 -4 M${bx + 138} ${by - 36} l12 6`, '#fff6cc', 5);
  } else {
    for (const x of [bx - 18, bx + 18]) {
      s += rect(x - 10, by - 36, 20, 40, 9, C.piel, 5);
      s += line(`M${x - 4} ${by - 28} v18`, C.sombra, 3);
      s += ell(x, by + 2, 15, 7, C.piel, 5);
      s += line(`M${x - 8} ${by + 2} v4 M${x} ${by + 3} v4 M${x + 8} ${by + 2} v4`, K, 3);
    }
  }
  // ---- orejas ----
  s += o(`M${hx - 40} ${hy - 22} c-4 -12 -2 -26 4 -34 c10 4 22 10 32 20 z`, C.piel, 5);
  s += o(`M${hx + 40} ${hy - 22} c4 -12 2 -26 -4 -34 c-10 4 -22 10 -32 20 z`, C.piel, 5);
  s += f(`M${hx - 33} ${hy - 26} c-2 -7 -1 -14 2 -19 c6 3 12 7 18 12 z`, C.rosa);
  s += f(`M${hx + 33} ${hy - 26} c2 -7 1 -14 -2 -19 c-6 3 -12 7 -18 12 z`, C.rosa);
  s += f(`M${hx - 30} ${hy - 30} l-5 -11 l9 7 z M${hx + 30} ${hy - 30} l5 -11 l-9 7 z`, C.crema);
  // ---- cabeza con pelo en los cachetes ----
  s += o(`M${hx - 48} ${hy} c0 -28 20 -46 48 -46 c28 0 48 18 48 46 c0 10 -2 18 -6 24 l7 5 l-9 2 l4 9 l-10 -3 c-8 8 -20 11 -34 11 c-14 0 -26 -3 -34 -11 l-10 3 l4 -9 l-9 -2 l7 -5 c-4 -6 -6 -14 -6 -24 z`, C.piel, 6);
  // sombra bajo la cabeza y brillo arriba
  s += f(`M${hx - 36} ${hy + 30} c10 8 22 10 36 10 c14 0 26 -2 36 -10 c-8 12 -22 14 -36 14 c-14 0 -28 -2 -36 -14 z`, C.sombra, 'opacity=".55"');
  s += f(`M${hx - 34} ${hy - 26} c8 -12 24 -18 40 -14 c-14 0 -28 4 -40 14 z`, C.brillo, 'opacity=".9"');
  // rayas de la frente (la "M") y de los cachetes
  s += line(`M${hx - 16} ${hy - 40} l-4 14 M${hx} ${hy - 44} v16 M${hx + 16} ${hy - 40} l4 14`, C.raya, 7);
  s += line(`M${hx - 44} ${hy + 4} l8 2 M${hx - 42} ${hy + 14} l8 0 M${hx + 44} ${hy + 4} l-8 2 M${hx + 42} ${hy + 14} l-8 0`, C.raya, 4);
  // hocico claro
  s += f(`M${hx - 26} ${hy + 22} c0 -12 12 -18 26 -18 c14 0 26 6 26 18 c0 12 -12 20 -26 20 c-14 0 -26 -8 -26 -20 z`, C.crema);
  // ojos (de susto: muy abiertos, cejas arriba)
  s += ojo(hx - 19, hy + 4, 12, true, 1);
  s += ojo(hx + 19, hy + 4, 12, true, -1);
  s += line(`M${hx - 30} ${hy - 20} q11 -8 22 -1 M${hx + 30} ${hy - 20} q-11 -8 -22 -1`, K, 5);
  // nariz, boca y chapitas
  s += o(`M${hx - 6} ${hy + 20} c0 -4 12 -4 12 0 c0 4 -4 8 -6 8 c-2 0 -6 -4 -6 -8 z`, C.rosa, 4);
  s += f(`M${hx - 3} ${hy + 19} c1 -1 3 -1 4 0 c-1 1 -3 1 -4 0 z`, '#ffffff', 'opacity=".9"');
  s += line(`M${hx} ${hy + 28} v3`, K, 3.5);
  s += ell(hx, hy + 36, 5, 6, C.boca, 3.5);
  s += f(`M${hx - 3} ${hy + 38} q3 5 6 0 z`, C.lengua);
  s += circ(hx - 36, hy + 22, 6, C.rosa, 0);
  s += circ(hx + 36, hy + 22, 6, C.rosa, 0);
  // bigotes y pecas
  s += line(`M${hx - 26} ${hy + 24} l-22 -5 M${hx - 26} ${hy + 29} l-24 1 M${hx - 26} ${hy + 34} l-20 6 M${hx + 26} ${hy + 24} l22 -5 M${hx + 26} ${hy + 29} l24 1 M${hx + 26} ${hy + 34} l20 6`, K, 3);
  s += circ(hx - 14, hy + 30, 1.6, C.sombra2, 0) + circ(hx - 19, hy + 34, 1.6, C.sombra2, 0) + circ(hx + 14, hy + 30, 1.6, C.sombra2, 0) + circ(hx + 19, hy + 34, 1.6, C.sombra2, 0);
  // mechón de pelo en la cabeza (donde antes iba la uva)
  s += line(`M${hx - 8} ${hy - 48} q6 -9 12 -2 q4 -8 10 -1`, C.raya, 4);
  return svg(W, H, s);
}

scene('gato', gato());
scene('gato_golpe', gato({ golpe: true }));
scene('gato_garra_golpe', gato({ golpe: true, garra: true }));
scene('gato_saco', gato({ saco: true }));
scene('gato_saco_golpe', gato({ golpe: true, saco: true }));
scene('gato_saco_garra_golpe', gato({ golpe: true, saco: true, garra: true }));

// ---- Gatito bebé (15.5 × 21.75 → 124 × 174; en el juego al 60 %): cabezón, gris atigrado, ojos azules ----
const G = { piel: '#c3c8d8', sombra: '#949bb2', raya: '#7e869e', crema: '#ffffff', cremaS: '#e3e6ef', rosa: '#f79cb3', iris: '#6cb6ff', irisS: '#3f84d6', biberon: '#dff4ff', leche: '#ffffff', chupon: '#f79cb3' };
export function gatito({ golpe = false } = {}) {
  const W = golpe ? 162 : 124;
  const H = golpe ? 166 : 174;
  const bx = 58, by = golpe ? 158 : 166, hx = 60, hy = golpe ? 60 : 64;
  let s = '';
  // cola chiquita y cuerpo redondo
  s += o(`M${bx - 32} ${by - 10} c-18 -2 -24 -22 -12 -34 c6 -4 12 0 10 6 c-2 6 -6 8 -4 14 c2 6 6 8 6 14 z`, G.piel, 5);
  s += line(`M${bx - 42} ${by - 36} l8 -2 M${bx - 42} ${by - 26} l8 2`, G.raya, 4);
  s += o(`M${bx - 36} ${by - 6} c-4 -30 14 -46 36 -46 c22 0 40 16 36 46 c-2 10 -16 12 -36 12 c-20 0 -34 -2 -36 -12 z`, G.piel, 5);
  s += f(`M${bx - 30} ${by - 14} c6 10 18 14 30 14 c12 0 24 -4 30 -14 c-6 8 -18 10 -30 10 c-12 0 -24 -2 -30 -10 z`, G.sombra, 'opacity=".6"');
  s += f(`M${pelo(bx - 18, by - 38, bx + 18, by - 38, 4, 4)} c4 8 6 18 0 30 c-6 6 -30 6 -36 0 c-6 -12 -4 -22 0 -30 z`, G.crema);
  // patas
  if (golpe) {
    s += rect(bx - 24, by - 26, 16, 30, 7, G.piel, 4);
    s += ell(bx - 16, by, 12, 6, G.piel, 4);
    s += o(`M${bx + 10} ${by - 30} c24 -14 50 -20 78 -22 c8 0 10 12 2 14 c-26 4 -50 12 -74 26 z`, G.piel, 5);
    s += ell(bx + 92, by - 44, 14, 10, G.piel, 4);
    s += f(`M${bx + 84} ${by - 40} a3 3 0 1 1 6 0 a3 3 0 1 1 -6 0 M${bx + 92} ${by - 42} a3 3 0 1 1 6 0 a3 3 0 1 1 -6 0 M${bx + 100} ${by - 38} a3 3 0 1 1 6 0 a3 3 0 1 1 -6 0`, G.rosa);
    s += line(`M${bx + 104} ${by - 64} l8 -8 M${bx + 112} ${by - 52} l10 -2`, '#fff6cc', 4);
  } else {
    for (const x of [bx - 16, bx + 16]) { s += rect(x - 8, by - 30, 16, 34, 7, G.piel, 4); s += ell(x, by, 12, 6, G.piel, 4); s += line(`M${x - 6} ${by} v3 M${x} ${by + 1} v3 M${x + 6} ${by} v3`, K, 2.5); }
    // biberón abrazado
    s += rect(bx + 22, by - 60, 18, 44, 6, G.biberon, 4);
    s += f(`M${bx + 25} ${by - 40} h12 v20 h-12 z`, G.leche);
    s += rect(bx + 24, by - 70, 14, 12, 4, G.chupon, 3.5);
    s += line(`M${bx + 26} ${by - 54} v10 M${bx + 26} ${by - 40} v10`, '#9fd4f0', 2);
  }
  // orejas grandes y cabeza
  s += o(`M${hx - 44} ${hy - 18} c-6 -14 -4 -30 4 -40 c12 4 24 12 34 26 z`, G.piel, 5);
  s += o(`M${hx + 44} ${hy - 18} c6 -14 4 -30 -4 -40 c-12 4 -24 12 -34 26 z`, G.piel, 5);
  s += f(`M${hx - 36} ${hy - 22} c-3 -8 -2 -16 2 -24 c7 3 14 8 20 16 z M${hx + 36} ${hy - 22} c3 -8 2 -16 -2 -24 c-7 3 -14 8 -20 16 z`, G.rosa);
  s += o(`M${hx - 52} ${hy + 2} c0 -32 24 -50 52 -50 c28 0 52 18 52 50 c0 10 -2 18 -6 24 l7 5 l-9 2 l4 9 l-10 -3 c-8 8 -22 12 -38 12 c-16 0 -30 -4 -38 -12 l-10 3 l4 -9 l-9 -2 l7 -5 c-4 -6 -6 -14 -6 -24 z`, G.piel, 5);
  s += f(`M${hx - 36} ${hy - 24} c8 -12 24 -18 40 -14 c-14 0 -28 4 -40 14 z`, '#e6e9f3', 'opacity=".9"');
  s += line(`M${hx - 14} ${hy - 42} l-3 12 M${hx} ${hy - 46} v14 M${hx + 14} ${hy - 42} l3 12`, G.raya, 6);
  s += line(`M${hx - 10} ${hy - 50} q6 -8 10 -2 q4 -8 10 -2`, G.raya, 4); // mechón de bebé
  s += f(`M${hx - 28} ${hy + 24} c0 -12 12 -18 28 -18 c16 0 28 6 28 18 c0 12 -12 20 -28 20 c-16 0 -28 -8 -28 -20 z`, G.crema);
  s += ojo(hx - 20, hy + 6, 14, false, 1, G.iris, G.irisS);
  s += ojo(hx + 20, hy + 6, 14, false, -1, G.iris, G.irisS);
  s += o(`M${hx - 5} ${hy + 24} c0 -3 10 -3 10 0 c0 3 -3 6 -5 6 c-2 0 -5 -3 -5 -6 z`, G.rosa, 3.5);
  s += line(`M${hx} ${hy + 30} v3 M${hx} ${hy + 33} q-5 5 -9 0 M${hx} ${hy + 33} q5 5 9 0`, K, 3);
  s += circ(hx - 38, hy + 24, 6, G.rosa, 0); s += circ(hx + 38, hy + 24, 6, G.rosa, 0);
  s += line(`M${hx - 28} ${hy + 26} l-18 -4 M${hx - 28} ${hy + 32} l-18 3 M${hx + 28} ${hy + 26} l18 -4 M${hx + 28} ${hy + 32} l18 3`, K, 2.5);
  return svg(W, H, s);
}
scene('aliado_gatito', gatito());
scene('aliado_gatito_golpe', gatito({ golpe: true }));
