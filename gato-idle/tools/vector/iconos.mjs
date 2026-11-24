// Íconos de la interfaz (64 × 64): sustituyen a src/assets/iconos/<nombre>.png con la misma clave.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, icon, eyes, nose, whiskers, grape } from './lib.mjs';

// ---- Íconos de la interfaz (64 × 64) ----
const I = (body) => svg(64, 64, body);
icon('fuerza', I(circ(32, 34, 26, P.naranja) + f('M20 42 a12 12 0 0 1 24 0 a6 6 0 0 1 -12 8 a6 6 0 0 1 -12 -8 z', P.rosa) + circ(18, 24, 6, P.rosa, 0) + circ(28, 17, 6, P.rosa, 0) + circ(40, 17, 6, P.rosa, 0) + circ(49, 25, 6, P.rosa, 0) + line('M4 10 l6 6 M60 10 l-6 6 M32 2 v8', P.oro, 5)));
icon('valor', I(o('M12 24 l10 -14 h20 l10 14 l-20 32 z', P.azul, 5) + f('M16 24 l8 -10 h16 l8 10 z', P.azulC, 'opacity=".8"') + f('M32 56 l-12 -32 h24 z', P.azulS, 'opacity=".6"') + line('M12 24 h40 M22 10 l10 14 l10 -14', K, 4)));
icon('critico', I(o('M32 4 l8 14 l16 -6 l-6 16 l14 8 l-14 8 l6 16 l-16 -6 l-8 14 l-8 -14 l-16 6 l6 -16 l-14 -8 l14 -8 l-6 -16 l16 6 z', P.oro, 5) + line('M22 44 l8 -22 M32 46 l4 -24 M42 44 l-6 -22', P.rojo, 6) + line('M22 44 l8 -22 M32 46 l4 -24 M42 44 l-6 -22', '#fff0d6', 2)));
icon('dps', I(o('M32 4 l7 12 l14 -4 l-4 14 l12 7 l-12 7 l4 14 l-14 -4 l-7 12 l-7 -12 l-14 4 l4 -14 l-12 -7 l12 -7 l-4 -14 l14 4 z', P.oro, 5) + circ(32, 32, 12, P.naranja, 4) + circ(32, 32, 5, P.amarillo, 0)));
icon('viral', I(o('M32 4 c4 14 20 20 20 36 a20 20 0 0 1 -40 0 c0 -10 6 -14 8 -22 c4 6 6 8 8 8 c0 -8 2 -16 4 -22 z', P.rojo, 5) + f('M32 30 c2 8 10 10 10 18 a10 10 0 0 1 -20 0 c0 -6 4 -8 6 -12 c2 3 3 3 4 3 z', P.oro)));
icon('gato', I(o('M10 24 l4 -18 l16 12 h4 l16 -12 l4 18 c0 20 -10 32 -22 32 c-12 0 -22 -12 -22 -32 z', P.naranja, 5) + f('M16 22 l2 -8 l8 6 z M48 22 l-2 -8 l-8 6 z', P.rosa) + eyes(32, 32, 9, 5, false) + nose(32, 40, 6) + whiskers(32, 40, 8)));
icon('gatito', I(o('M8 26 l4 -20 l18 14 h4 l18 -14 l4 20 c0 20 -12 30 -24 30 c-12 0 -24 -10 -24 -30 z', P.gris, 5) + f('M14 24 l2 -9 l9 7 z M50 24 l-2 -9 l-9 7 z', P.rosa) + eyes(32, 32, 10, 6, false) + nose(32, 42, 6) + circ(14, 40, 4, P.rosa, 0) + circ(50, 40, 4, P.rosa, 0)));
icon('mejoras', I(circ(32, 44, 14, P.naranja, 5) + circ(14, 30, 7, P.naranja, 5) + circ(26, 18, 7, P.naranja, 5) + circ(40, 18, 7, P.naranja, 5) + circ(52, 30, 7, P.naranja, 5)));
icon('ajustes', I(o('M32 6 l6 2 l2 8 l8 4 l8 -2 l4 6 l-5 6 l0 8 l5 6 l-4 6 l-8 -2 l-8 4 l-2 8 l-6 2 l-6 -2 l-2 -8 l-8 -4 l-8 2 l-4 -6 l5 -6 l0 -8 l-5 -6 l4 -6 l8 2 l8 -4 l2 -8 z', P.grisS, 5) + circ(32, 34, 9, P.piedra, 5)));
icon('pregunta', I(circ(32, 32, 26, P.oro) + line('M22 24 a10 10 0 1 1 14 10 c-3 2 -4 4 -4 8', K, 7) + circ(32, 50, 4.5, K, 0)));
icon('turbo', I(o('M36 4 l-22 32 h14 l-6 24 l24 -34 h-14 z', P.oro, 5) + f('M34 12 l-14 22 h8 z', P.amarillo)));
icon('trofeo', I(o('M18 8 h28 v18 a14 14 0 0 1 -28 0 z', P.oro, 5) + o('M12 12 h6 v12 a8 8 0 0 1 -8 -6 z M52 12 h-6 v12 a8 8 0 0 0 8 -6 z', P.oro, 4) + rect(26, 38, 12, 10, 2, P.oroS, 4) + rect(16, 48, 32, 10, 4, P.maderaS, 4) + f('M22 12 h6 v12 h-6 z', P.amarillo)));
icon('candado', I(o('M18 28 v-8 a14 14 0 0 1 28 0 v8', 'none', 6) + rect(10, 28, 44, 30, 8, P.oro, 5) + circ(32, 41, 5, K, 0) + rect(29, 42, 6, 10, 2, K, 0)));
icon('mano', I(o('M20 60 v-22 l-8 -10 c-2 -4 4 -8 7 -4 l7 8 v-24 a4 4 0 0 1 8 0 v16 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v16 c0 8 -6 12 -14 12 z', P.crema, 5)));
icon('check', I(circ(32, 32, 26, P.pasto) + line('M18 34 l10 10 l18 -22', P.blanco, 8)));
icon('reloj', I(circ(32, 32, 26, P.blanco) + line('M32 32 v-16 M32 32 l12 8', K, 6) + circ(32, 32, 4, P.rojo, 0)));
icon('anuncio', I(rect(6, 12, 52, 40, 10, P.morado) + o('M26 22 l16 10 l-16 10 z', P.blanco, 4)));
icon('canal', I(rect(6, 18, 40, 30, 8, P.rojo) + o('M46 26 l12 -8 v28 l-12 -8 z', P.rojo, 5) + circ(26, 33, 8, P.blanco, 4) + circ(14, 12, 5, P.gris, 4) + circ(28, 10, 6, P.gris, 4)));
icon('laboratorio', I(o('M24 6 h16 v18 l14 26 c2 4 0 8 -4 8 h-36 c-4 0 -6 -4 -4 -8 l14 -26 z', P.azulC, 5) + f('M20 44 h24 l6 10 h-36 z', P.pasto) + circ(30, 40, 3, P.blanco, 0) + rect(20, 4, 24, 6, 3, K, 0)));
icon('trofeo_gris', I(o('M18 8 h28 v18 a14 14 0 0 1 -28 0 z', P.gris, 5) + rect(16, 48, 32, 10, 4, P.grisS, 4) + rect(26, 38, 12, 10, 2, P.grisS, 4)));
icon('susto', I(circ(32, 32, 26, P.amarillo) + eyes(32, 30, 10, 6, true) + ell(32, 46, 6, 7, P.vino, 4)));
icon('mudanza', I(o('M8 30 l24 -20 l24 20 v26 h-48 z', P.rojo, 5) + rect(26, 38, 12, 18, 2, P.maderaS, 4) + f('M12 30 l20 -16 l20 16 v4 h-40 z', '#ff8a7a')));
icon('seguidores', I(circ(22, 24, 10, P.naranja, 5) + o('M6 56 c0 -14 8 -22 16 -22 c8 0 16 8 16 22 z', P.naranja, 5) + circ(44, 22, 8, P.gris, 5) + o('M34 54 c0 -12 6 -18 10 -18 c6 0 14 6 14 18 z', P.gris, 5)));
icon('visualizaciones', I(o('M4 32 c10 -16 46 -16 56 0 c-10 16 -46 16 -56 0 z', P.blanco, 5) + circ(32, 32, 10, P.azul, 4) + circ(32, 32, 4, K, 0)));

// ---- Segunda tanda: aliados, jefes, objetos y botones ----
// Colores sueltos que no están en la paleta general (oscuros para cuervo, saco, claqueta...).
const X = { negro: '#4a4458', negroC: '#6b6480', verdeO: '#3e9c5c', mascara: '#55495a', carbon: '#5a5f70', carbonC: '#7c8396' };
/** Cejas enojadas sobre un par de ojos centrado en (cx, cy) con separación `sep`. */
const cenio = (cx, cy, sep) => line(`M${cx - sep - 7} ${cy - 11} l11 5 M${cx + sep + 7} ${cy - 11} l-11 5`, K, 4);
/** Brillo blanco redondo (mancha ovalada con opacidad). */
const brillo = (cx, cy, rx, ry = rx * 0.6, op = 0.55) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${P.blanco}" opacity="${op}"/>`;

// Objetos y botones
icon('apreton', I(rect(-4, 36, 14, 18, 3, P.azul, 5) + rect(54, 12, 14, 18, 3, X.negro, 5)
  + o('M8 38 h22 c8 0 12 4 12 9 c0 5 -4 9 -12 9 h-22 z', P.crema, 5)
  + o('M56 14 h-22 c-8 0 -12 4 -12 9 v18 c0 4 3 7 7 7 c4 0 7 -3 7 -7 v-9 h20 z', P.cremaS, 5) + line('M27 38 v8 M31 38 v8', K, 3)
  + g('rotate(-30 40 34)', ell(40, 34, 9, 4.5, P.crema, 4)) + brillo(16, 44, 4, 2) + brillo(48, 19, 4, 2)));
icon('aspiradora', I(o('M6 34 a26 11 0 0 1 52 0 v7 a26 11 0 0 1 -52 0 z', X.carbon, 5) + ell(32, 34, 26, 11, X.carbonC, 5)
  + circ(32, 33, 5, P.pasto, 4) + brillo(20, 30, 7, 3) + line('M4 50 l-2 6 M60 50 l2 6', K, 4)));
icon('calavera', I(o('M10 30 a22 22 0 0 1 44 0 v6 c0 6 -4 10 -8 10 v10 h-28 v-10 c-4 0 -8 -4 -8 -10 z', P.piedra, 5)
  + f('M18 46 h28 v10 h-28 z', P.piedraS) + circ(23, 30, 6.5, K, 0) + circ(41, 30, 6.5, K, 0) + f('M32 36 l-4 7 h8 z', K)
  + line('M26 47 v8 M32 47 v8 M38 47 v8', K, 3) + brillo(22, 18, 6, 3.5)));
icon('carrito', I(o('M4 40 c0 -4 4 -6 8 -6 l6 -12 h20 l10 12 h8 c4 0 6 2 6 6 v8 h-58 z', P.rojo, 5)
  + f('M20 24 h10 v10 h-14 z M34 24 h4 l8 10 h-12 z', P.azulC) + f('M4 46 h58 v2 h-58 z', '#c9463a')
  + circ(17, 50, 7, K, 0) + circ(17, 50, 3, P.gris, 0) + circ(47, 50, 7, K, 0) + circ(47, 50, 3, P.gris, 0)
  + circ(59, 42, 3, P.amarillo, 0) + brillo(14, 37, 5, 2)));
icon('claqueta', I(rect(8, 28, 48, 28, 4, X.negro, 5) + line('M14 36 h36 M14 44 h36', P.blanco, 4)
  + g('rotate(-14 8 28)', rect(8, 14, 48, 14, 3, X.negro, 5) + f('M14 17 l6 0 l-4 8 h-6 z M30 17 h6 l-4 8 h-6 z M46 17 h6 l-4 8 h-6 z', P.blanco))
  + brillo(16, 50, 4, 2)));
icon('corona', I(o('M10 50 v-28 l12 10 l10 -18 l10 18 l12 -10 v28 z', P.oro, 5) + f('M14 42 h36 v4 h-36 z', P.oroS)
  + circ(10, 20, 4, P.oro, 4) + circ(54, 20, 4, P.oro, 4) + circ(32, 12, 4, P.oro, 4)
  + circ(32, 38, 4.5, P.rojo, 0) + circ(20, 40, 3, P.azul, 0) + circ(44, 40, 3, P.azul, 0) + brillo(18, 30, 3, 5)));
icon('croquetas', I(circ(22, 32, 6, P.cafe, 4) + circ(44, 33, 6, P.cafe, 4) + circ(33, 27, 6, P.cafe, 4) + circ(28, 34, 5, P.maderaS, 4) + circ(39, 35, 5, P.maderaS, 4)
  + o('M6 38 h52 c0 12 -8 20 -26 20 c-18 0 -26 -8 -26 -20 z', P.azul, 5) + f('M14 50 c4 4 10 6 18 6 c8 0 14 -2 18 -6 c-4 6 -10 8 -18 8 c-8 0 -14 -2 -18 -8 z', P.azulS)
  + brillo(16, 44, 5, 2.5)));
icon('esmalte', I(rect(22, 4, 20, 20, 4, P.vino, 5) + f('M26 8 h3 v12 h-3 z', P.blanco, 'opacity=".35"')
  + rect(14, 24, 36, 36, 10, P.rosa, 5) + f('M20 50 c6 4 18 4 24 0 c-2 6 -8 8 -12 8 c-4 0 -10 -2 -12 -8 z', '#d9748f')
  + rect(21, 30, 5, 16, 2.5, P.blanco, 0) + rect(26, 14, 12, 12, 2, P.vino, 0)));
icon('estetoscopio', I(line('M18 8 v16 a11 11 0 0 0 22 0 v-16', K, 11) + line('M18 8 v16 a11 11 0 0 0 22 0 v-16', P.grisS, 4)
  + line('M29 36 v6 c0 10 12 10 14 2', K, 10) + line('M29 36 v6 c0 10 12 10 14 2', P.grisS, 4)
  + circ(18, 6, 4, P.gris, 4) + circ(40, 6, 4, P.gris, 4) + circ(45, 50, 9, P.grisS, 5) + circ(45, 50, 4, P.gris, 0) + brillo(42, 46, 2.5, 2)));
icon('ficha', I(circ(32, 32, 27, P.oro, 5) + `<circle cx="32" cy="32" r="22" fill="none" stroke="${P.blanco}" stroke-width="7" stroke-dasharray="9 14" transform="rotate(15 32 32)"/>`
  + circ(32, 32, 15, P.oro, 4) + ell(32, 36, 5.5, 4.5, K, 0) + circ(25, 29, 2.8, K, 0) + circ(31, 25, 2.8, K, 0) + circ(38, 28, 2.8, K, 0) + brillo(22, 20, 4, 2.5)));
icon('hashtag', I(o('M17 8 h10 v48 h-10 z M37 8 h10 v48 h-10 z M8 20 h48 v10 h-48 z M8 36 h48 v10 h-48 z', P.morado, 5)
  + f('M17 8 h10 v48 h-10 z M37 8 h10 v48 h-10 z M8 20 h48 v10 h-48 z M8 36 h48 v10 h-48 z', P.morado)
  + f('M17 8 h10 v12 h-10 z M37 8 h10 v12 h-10 z M8 20 h48 v4 h-48 z', P.moradoC, 'opacity=".7"')));
icon('huellas', I(ell(32, 44, 15, 12, P.naranja, 5) + circ(14, 28, 6.5, P.naranja, 5) + circ(25, 17, 6.5, P.naranja, 5) + circ(39, 17, 6.5, P.naranja, 5) + circ(50, 28, 6.5, P.naranja, 5)
  + f('M20 48 c4 4 20 4 24 0 c-2 5 -8 7 -12 7 c-4 0 -10 -2 -12 -7 z', P.naranjaS) + brillo(26, 40, 4, 2.5)));
icon('maquinita', I(rect(10, 10, 44, 48, 8, P.rojo, 5) + f('M14 14 h36 v8 h-36 z', P.oro) + rect(16, 24, 32, 16, 3, P.blanco, 4)
  + circ(22, 32, 4, P.rojo, 0) + circ(32, 32, 4, P.oro, 0) + circ(42, 32, 4, P.pasto, 0)
  + rect(22, 46, 20, 6, 3, P.oroS, 4) + line('M57 20 v16', K, 5) + circ(57, 16, 5, P.oro, 4) + brillo(16, 50, 3, 2)));
icon('marca', I(circ(32, 32, 27, P.rojo, 5) + f('M14 40 a19 19 0 0 0 36 0 a21 21 0 0 1 -36 0 z', '#c9463a')
  + o('M17 14 c-4 12 0 26 10 36 c-3 -12 -1 -24 3 -34 z M30 10 c-2 12 1 26 7 40 c0 -14 1 -26 5 -38 z M47 14 c2 12 -2 26 -11 36 c3 -12 1 -24 -2 -34 z', P.crema, 4)
  + brillo(20, 18, 4, 2.5)));
icon('microscopio', I(rect(10, 50, 44, 8, 4, X.carbon, 5) + line('M22 50 c-6 -14 0 -26 12 -32', K, 11) + line('M22 50 c-6 -14 0 -26 12 -32', X.carbonC, 5)
  + rect(20, 36, 26, 7, 2, X.carbon, 4) + g('rotate(22 40 20)', rect(34, 4, 12, 30, 4, P.gris, 5) + rect(35, 2, 10, 6, 2, K, 0) + rect(37, 10, 3, 14, 1.5, P.blanco, 0))
  + circ(29, 39, 3, P.azul, 0)));
icon('miniatura', I(rect(4, 14, 52, 38, 6, P.rojo, 5) + f('M8 44 h44 v4 h-44 z', '#c9463a') + o('M24 24 l16 9 l-16 9 z', P.blanco, 4)
  + o('M52 2 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z', P.oro, 4)));
icon('pesas', I(rect(14, 29, 36, 6, 3, X.carbonC, 4) + rect(4, 16, 10, 32, 3, X.carbon, 5) + rect(14, 21, 7, 22, 2, X.carbonC, 4)
  + rect(50, 16, 10, 32, 3, X.carbon, 5) + rect(43, 21, 7, 22, 2, X.carbonC, 4) + f('M6 19 h3 v10 h-3 z M52 19 h3 v10 h-3 z', P.blanco, 'opacity=".4"')));
icon('pescado', I(o('M44 34 l16 -13 v26 z', P.naranja, 5) + ell(28, 34, 21, 14, P.naranja, 5) + f('M44 34 l6 -5 v10 z', P.naranjaS)
  + f('M12 40 c6 6 26 6 32 0 c-6 6 -26 6 -32 0 z', P.naranjaS) + line('M30 23 l4 22 M38 25 l2 18', P.naranjaS, 4)
  + o('M24 20 l6 -10 l6 10 z', P.naranja, 4) + circ(18, 31, 5, P.blanco, 4) + circ(19, 32, 2.5, K, 0) + brillo(24, 26, 4, 2.5)));
icon('reiniciar', I(`<path d="M42.9 21 A17 17 0 1 0 48 39.8" fill="none" stroke="${K}" stroke-width="15" stroke-linecap="round"/>`
  + `<path d="M42.9 21 A17 17 0 1 0 48 39.8" fill="none" stroke="${P.pasto}" stroke-width="8" stroke-linecap="butt"/>`
  + o('M44.7 9.4 L49.8 26.8 L31.9 24.8 z', P.pasto, 5) + line('M21 26 a14 14 0 0 1 7 -7', '#b7f0c4', 3)));
icon('saco', I(o('M8 20 l16 -10 l8 8 l8 -8 l16 10 v38 h-48 z', X.negro, 5) + f('M24 12 l8 8 l8 -8 v46 h-16 z', P.blanco)
  + f('M22 11 l10 9 l-5 22 l-9 -14 z M42 11 l-10 9 l5 22 l9 -14 z', X.negroC) + o('M23 22 l9 4 l9 -4 v8 l-9 -4 l-9 4 z', P.rojo, 4)
  + circ(32, 40, 2, K, 0) + circ(32, 48, 2, K, 0)));
icon('sombrero', I(rect(14, 6, 36, 42, 6, P.morado, 5) + f('M18 32 h28 v8 h-28 z', P.oro) + ell(32, 48, 28, 8, P.morado, 5)
  + f('M6 50 c6 6 46 6 52 0 c-4 5 -14 7 -26 7 c-12 0 -22 -2 -26 -7 z', '#6a3fa8') + rect(20, 12, 5, 16, 2.5, P.moradoC, 0, 'opacity=".8"')));
icon('subir', I(rect(6, 6, 52, 52, 12, P.rojo, 5) + f('M10 48 h44 v6 h-44 z', '#c9463a') + o('M32 14 l16 16 h-9 v18 h-14 v-18 h-9 z', P.blanco, 4) + brillo(14, 14, 3, 3)));
icon('vaso', I(o('M14 6 h36 l-4 52 h-28 z', P.azulC, 5) + f('M18 24 h28 l-3 32 h-22 z', P.azul) + f('M24 28 h4 v26 h-4 z', P.blanco, 'opacity=".55"')
  + f('M18 24 h28 c-4 3 -24 3 -28 0 z', P.blanco, 'opacity=".6"')));

// Aliados: comparten los ojos y la nariz de gato/gatito.
icon('cabra', I(o('M20 22 c-12 -2 -16 -12 -8 -20 c-1 7 3 11 12 13 z M44 22 c12 -2 16 -12 8 -20 c1 7 -3 11 -12 13 z', P.maderaC, 5)
  + ell(12, 32, 8, 5, P.blanco, 5) + ell(52, 32, 8, 5, P.blanco, 5)
  + o('M16 24 c0 -10 32 -10 32 0 v16 c0 12 -8 18 -16 18 c-8 0 -16 -6 -16 -18 z', P.blanco, 5) + f('M20 46 c4 6 20 6 24 0 c-2 7 -8 9 -12 9 c-4 0 -10 -2 -12 -9 z', P.piedraS)
  + eyes(32, 34, 8, 4.5, false) + nose(32, 44, 6) + o('M27 56 l5 8 l5 -8 z', P.piedraS, 4)));
icon('cuervo', I(line('M24 14 l-4 -8 M30 11 l0 -8 M36 12 l5 -7', K, 5) + circ(32, 34, 22, X.negro, 5)
  + f('M14 40 c6 10 30 10 36 0 c-4 12 -32 12 -36 0 z', '#332d40') + eyes(32, 30, 9, 5, false)
  + o('M22 38 h20 l-10 18 z', P.oro, 4) + f('M28 41 h8 l-4 8 z', P.oroS) + brillo(20, 20, 5, 3)));
icon('mapache', I(o('M10 24 l4 -16 l16 12 h4 l16 -12 l4 16 c0 20 -10 32 -22 32 c-12 0 -22 -12 -22 -32 z', P.gris, 5)
  + f('M16 22 l2 -8 l8 6 z M48 22 l-2 -8 l-8 6 z', P.rosa) + ell(32, 48, 13, 9, P.piedra, 0)
  + f('M10 30 q22 -10 44 0 q0 12 -9 12 q-13 -4 -26 0 q-9 0 -9 -12 z', X.mascara) + eyes(32, 33, 9, 4.5, false) + nose(32, 44, 6) + whiskers(32, 44, 7)));
icon('perico', I(f('M24 14 q6 -12 16 -6 q-5 3 -6 10 z', P.rojo) + circ(32, 34, 22, P.pasto, 5) + f('M12 40 c6 10 34 10 40 0 c-4 12 -36 12 -40 0 z', X.verdeO)
  + eyes(32, 30, 9, 4.5, false)
  + o('M22 40 c0 -4 20 -4 20 0 c0 6 -4 12 -10 14 c-6 -2 -10 -8 -10 -14 z', P.oro, 4) + f('M26 46 h12 c-2 4 -4 6 -6 6 c-2 0 -4 -2 -6 -6 z', P.oroS) + brillo(22, 20, 5, 3)));
icon('perro', I(o('M10 28 c0 -14 6 -20 10 -20 c4 0 8 4 12 8 c4 -4 8 -8 12 -8 c4 0 10 6 10 20 c0 18 -10 30 -22 30 c-12 0 -22 -12 -22 -30 z', P.naranja, 5)
  + f('M14 24 c0 -8 4 -12 6 -12 c2 0 5 3 7 6 z M50 24 c0 -8 -4 -12 -6 -12 c-2 0 -5 3 -7 6 z', P.naranjaS)
  + f('M18 36 c0 -6 28 -6 28 0 v10 c0 10 -6 14 -14 14 c-8 0 -14 -4 -14 -14 z', P.crema) + eyes(32, 32, 9, 4.5, false) + nose(32, 42, 6)
  + line('M26 50 q6 4 12 0', K, 3.5)));
icon('raton', I(circ(14, 20, 11, P.gris, 5) + circ(50, 20, 11, P.gris, 5) + circ(14, 20, 5.5, P.rosa, 0) + circ(50, 20, 5.5, P.rosa, 0)
  + circ(32, 36, 20, P.gris, 5) + f('M14 42 c6 10 30 10 36 0 c-4 12 -32 12 -36 0 z', P.grisS)
  + eyes(32, 34, 8, 4.5, false) + nose(32, 44, 6) + whiskers(32, 44, 7)));

// Jefes: caras enojadas.
icon('escoba', I(rect(29, 2, 6, 26, 3, P.madera, 4) + o('M16 26 h32 l6 32 h-44 z', P.oro, 5) + line('M20 50 v6 M28 50 v6 M36 50 v6 M44 50 v6', P.oroS, 3)
  + rect(18, 24, 28, 8, 3, P.rojo, 4) + eyes(32, 40, 7, 4, false) + cenio(32, 40, 7) + line('M26 50 q6 -4 12 0', K, 3.5)));
icon('industrial', I(rect(20, 6, 24, 12, 4, X.carbonC, 5) + line('M50 28 c14 0 14 20 2 26', K, 10) + line('M50 28 c14 0 14 20 2 26', X.carbonC, 4)
  + rect(12, 16, 40, 38, 8, P.oro, 5) + f('M16 44 h32 v6 h-32 z', P.oroS) + circ(20, 56, 5, K, 0) + circ(44, 56, 5, K, 0)
  + eyes(32, 30, 8, 4, false) + cenio(32, 30, 8) + line('M22 42 l5 4 l5 -4 l5 4 l5 -4', K, 3.5) + brillo(18, 24, 3, 4)));
icon('pepino', I(g('rotate(-22 32 32)', rect(20, 4, 24, 56, 12, P.pasto, 5) + f('M32 14 h6 v40 h-6 z', X.verdeO, 'opacity=".5"')
  + circ(26, 12, 2, P.verdeL, 0) + circ(38, 50, 2, P.verdeL, 0) + circ(25, 52, 2, P.verdeL, 0)
  + eyes(32, 26, 6, 3.6, false) + cenio(32, 26, 6) + line('M26 38 q6 4 12 0 M28 40 v-3 M36 40 v-3', K, 3))));
icon('veterinario', I(rect(16, 50, 32, 12, 4, P.gris, 5) + circ(32, 30, 26, P.blanco, 5) + f('M8 36 c6 12 42 12 48 0 c-4 14 -44 14 -48 0 z', P.gris)
  + circ(32, 32, 16, '#5c5675', 5) + eyes(32, 30, 7, 4, false) + cenio(32, 30, 7) + line('M26 40 q6 -5 12 0', K, 3.5)
  + brillo(18, 14, 5, 3)));

// Bola de pelo con carita.
icon('pelos', I(o('M12 38 c-5 -10 3 -23 14 -21 c4 -6 10 -6 14 -2 c11 -2 17 10 12 20 c6 8 -2 16 -10 14 c-4 6 -12 6 -16 0 c-10 2 -18 -4 -14 -11 z', P.gris, 5)
  + f('M16 44 c6 8 26 8 32 0 c-4 10 -28 10 -32 0 z', P.grisS) + eyes(32, 34, 8, 4, false) + line('M27 44 q5 4 10 0', K, 3.5)
  + line('M8 24 l-5 -4 M56 22 l5 -5 M30 10 l1 -6', K, 4)));
