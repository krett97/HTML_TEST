// Copiado del juego del gato (gato-idle/tools/vector/lib.mjs). Utilidades compartidas del arte vectorial: paleta, formas con contorno, caras y render a PNG.
// Reglas del estilo (las mismas para todo el juego): contorno café K de 5–6 px, dos tonos por color
// (base y sombra), brillos blancos con opacidad, formas redondas. Arte de escena a 8 px por unidad del
// mundo; íconos de 64 × 64.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

export const OUT = 'src/assets/arte';
mkdirSync(`${OUT}/iconos`, { recursive: true });

// ---- Paleta ----
export const K = '#3a2518'; // contorno
export const P = {
  naranja: '#f6a44c', naranjaS: '#dc7d2a', crema: '#fff0d6', cremaS: '#f1d3a6', rosa: '#f59ab0', vino: '#8a2f3e',
  gris: '#bfc5d6', grisS: '#8d93aa', blanco: '#ffffff', azul: '#6cc8f5', azulS: '#3f9bd6', azulC: '#dff4ff',
  madera: '#d9a066', maderaS: '#b2733a', maderaC: '#ecc08c', piedra: '#ece6dc', piedraS: '#c9c0b2',
  verde: '#9fd3c1', verdeS: '#7cb8a4', verdeL: '#c7eadf', pasto: '#5ec47a', oro: '#ffc93c', oroS: '#e09a1a',
  rojo: '#ef5a4c', morado: '#8e5bd1', moradoC: '#c9a9f5', amarillo: '#ffe27a', cafe: '#8a5a2b', pizza: '#f4b942',
  uva: '#8e5bd1', uvaC: '#b48af0',
  // Campo y slimes
  pastoC: '#7fd68f', pastoS: '#45a862', pastoO: '#3a8f53', limo: '#8be06a', limoS: '#57b84a', limoC: '#c8f59b',
  agua: '#5cc1f2', aguaS: '#2f8fd0', aguaC: '#c4ecff', fuego: '#ff8a2a', fuegoC: '#ffd23f', magia: '#a46cf0', magiaC: '#e0c8ff',
};

export const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
/** Forma con contorno. */
export const o = (d, fill, sw = 6, extra = '') => `<path d="${d}" fill="${fill}" stroke="${K}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
/** Forma sin contorno (sombras, brillos). */
export const f = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const line = (d, color = K, sw = 5) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const circ = (cx, cy, r, fill, sw = 6) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${sw ? `stroke="${K}" stroke-width="${sw}"` : ''}/>`;
export const ell = (cx, cy, rx, ry, fill, sw = 6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${sw ? `stroke="${K}" stroke-width="${sw}"` : ''}/>`;
export const rect = (x, y, w, h, r, fill, sw = 6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${sw ? `stroke="${K}" stroke-width="${sw}"` : ''}/>`;
export const g = (transform, body) => `<g transform="${transform}">${body}</g>`;

export function render(path, markup) {
  const png = new Resvg(markup, { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } }).render().asPng();
  writeFileSync(path, png);
  console.log(path);
}
export const scene = (name, markup) => render(`${OUT}/${name}.png`, markup);
export const icon = (name, markup) => render(`${OUT}/iconos/${name}.png`, markup);

// ---- Caras ----
/** Ojos grandes de caricatura: blanco, pupila y brillo. `susto`: pupilas chicas y cejas arriba. */
export function eyes(cx, cy, sep, r, susto) {
  const pr = susto ? r * 0.42 : r * 0.58;
  let s = '';
  for (const x of [cx - sep, cx + sep]) {
    s += ell(x, cy, r, r * 1.15, P.blanco, 5);
    s += circ(x + 1, cy + r * 0.15, pr, K, 0);
    s += circ(x + 1 + pr * 0.35, cy + r * 0.15 - pr * 0.4, pr * 0.38, P.blanco, 0);
  }
  if (susto) s += line(`M${cx - sep - r} ${cy - r * 1.6} q${r * 0.9} -${r * 0.6} ${r * 1.9} 0`) + line(`M${cx + sep + r} ${cy - r * 1.6} q-${r * 0.9} -${r * 0.6} -${r * 1.9} 0`);
  return s;
}
export const nose = (cx, cy, w) => o(`M${cx - w / 2} ${cy} h${w} l-${w / 2} ${w * 0.7} z`, P.rosa, 4);
export const whiskers = (cx, cy, l) => line(`M${cx - l * 0.55} ${cy - 4} l-${l} -4 M${cx - l * 0.55} ${cy + 6} l-${l} 4 M${cx + l * 0.55} ${cy - 4} l${l} -4 M${cx + l * 0.55} ${cy + 6} l${l} 4`, K, 4);
export const grape = (x, y) =>
  g(`translate(${x} ${y})`, line('M0 -4 q6 -10 14 -12', K, 4) + circ(-7, 0, 7, P.uva, 5) + circ(7, 0, 7, P.uva, 5) + circ(0, 9, 7, P.uvaC, 5) + circ(-9, -3, 2.2, '#dcc8ff', 0) + circ(5, -3, 2.2, '#dcc8ff', 0));
