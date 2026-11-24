// La moneda del juego: dorada, con la silueta de un gatito (orejas y ojos). Pixel art de 13×13
// dibujado como SVG para que se vea nítido a cualquier tamaño. Se usa en lugar del "$".
const COIN = [
  '....kkkkk....',
  '..kkyyyyykk..',
  '.khhyyyyyyyk.',
  '.kyhDyyyyDyk.',
  'kyyDDyyyDDyyk',
  'kyyDDDDDDDyyk',
  'kyyDyDDDyDyyk',
  'kyyDDDDDDDyyk',
  'kyyDDDpDDDyyk',
  '.kyyDDDDDyyk.',
  '.kyyyyyyyyok.',
  '..kkoyyyokk..',
  '....kkkkk....',
];

const COLORS: Record<string, string> = {
  k: '#5e3b10', // borde
  y: '#ffd36e', // oro
  h: '#fff3c4', // brillo
  o: '#e0a83a', // sombra del borde
  D: '#c98a1e', // silueta del gatito
  p: '#ff8fab', // naricita
};

function svgMarkup(): string {
  let rects = '';
  COIN.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[ch]}"/>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 13" shape-rendering="crispEdges">${rects}</svg>`;
}

import { ES_VECTOR } from '../app/estilo';

/** Moneda del piloto vectorial: redonda, con borde grueso y la carita del gatito. */
const COIN_VECTOR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<circle cx="32" cy="32" r="29" fill="#3a2518"/><circle cx="32" cy="31" r="26" fill="#ffc93c"/><circle cx="32" cy="31" r="19" fill="#e9a21c"/>
<path d="M19 34 l3 -12 l7 6 h6 l7 -6 l3 12 c0 8 -6 12 -13 12 c-7 0 -13 -4 -13 -12 z" fill="#ffc93c"/>
<circle cx="27" cy="36" r="2.2" fill="#3a2518"/><circle cx="37" cy="36" r="2.2" fill="#3a2518"/><path d="M30 41 h4 l-2 2.5 z" fill="#ff7a9a"/>
<path d="M22 14 a20 20 0 0 1 20 -4" fill="none" stroke="#fff3c4" stroke-width="4" stroke-linecap="round"/></svg>`;

/** SVG de la moneda (para ponerlo dentro de un elemento). */
export const COIN_SVG = ES_VECTOR ? COIN_VECTOR : svgMarkup();

/** La misma moneda como data URL (para <img> o fondos en CSS). */
export const COIN_URL = `data:image/svg+xml,${encodeURIComponent(COIN_SVG)}`;
