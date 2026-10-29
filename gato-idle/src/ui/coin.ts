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

/** SVG de la moneda (para ponerlo dentro de un elemento). */
export const COIN_SVG = svgMarkup();

/** La misma moneda como data URL (para <img> o fondos en CSS). */
export const COIN_URL = `data:image/svg+xml,${encodeURIComponent(COIN_SVG)}`;
