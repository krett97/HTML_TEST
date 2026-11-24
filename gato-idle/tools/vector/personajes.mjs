// Pandilla (aliados), dueño y la Escoba Furiosa. Medidas en px a 8 px por unidad; los aliados se
// dibujan en el juego a la escala de ALLY_SCALE (ratón 0.5 … cabra 0.9), por eso van grandes aquí.
import { K, P, svg, o, f, line, circ, ell, rect, g, scene, eyes, nose, whiskers } from './lib.mjs';

const C = { ...P, ratonG: '#b9b4c9', ratonS: '#8f89a6', shiba: '#f2b05a', shibaS: '#d98a2e', crema2: '#fff3dc', verdeP: '#5fc46a', verdeS: '#3f9b4c', pico: '#ffb84d',
  negro: '#3b3550', negroS: '#262238', mapache: '#8e8a99', mapacheS: '#67637a', antifaz: '#2c2838', blancoS: '#dedbe6', cabra: '#f7f3ec', cabraS: '#d9d2c6', cuerno: '#d9b26a',
  piel: '#f6c9a2', pielS: '#dba379', pelo: '#6b3b1e', sudadera: '#e04b3a', sudaderaS: '#b23526', mezclilla: '#4f6fa8', mezclillaS: '#3a5283', tenis: '#f4f4f4',
  paja: '#f2c744', pajaS: '#c99a1f', pajaC: '#fde58a', palo: '#9b6b3a', paloS: '#6e4722', metal: '#8f93a8', metalS: '#5f6378' };

// ---- Ratón (12 × 13.75 → 96 × 110) ----
{
  let s = '';
  s += line('M56 98 c22 -4 34 10 30 26', C.rosa, 5);
  s += o('M14 100 c-4 -26 14 -42 34 -42 c20 0 36 16 32 42 z', C.ratonG, 5);
  s += f('M30 100 c0 -16 8 -26 18 -26 c10 0 18 10 18 26 z', C.crema2);
  s += circ(22, 38, 18, C.ratonG, 5); s += circ(74, 38, 18, C.ratonG, 5);
  s += circ(22, 38, 10, C.rosa, 0); s += circ(74, 38, 10, C.rosa, 0);
  s += o('M12 60 c0 -24 16 -38 36 -38 c20 0 36 14 36 38 c0 20 -14 32 -36 32 c-22 0 -36 -12 -36 -32 z', C.ratonG, 5);
  s += f('M26 70 c6 10 16 14 22 14 c6 0 16 -4 22 -14 c-6 4 -14 6 -22 6 c-8 0 -16 -2 -22 -6 z', C.crema2);
  s += eyes(48, 56, 13, 8, false);
  s += nose(48, 70, 7); s += whiskers(48, 70, 14);
  s += ell(30, 104, 10, 5, C.rosa, 4); s += ell(66, 104, 10, 5, C.rosa, 4);
  scene('aliado_raton', svg(96, 110, s));
}

// ---- Perro shiba de reojo (18 × 26.25 → 144 × 210) ----
{
  let s = '';
  s += o('M110 150 c30 -20 44 -4 30 24 c-6 10 -18 10 -22 2 c-4 -10 2 -16 -8 -26 z', C.shiba, 5);
  s += o('M22 200 c-6 -50 18 -80 50 -80 c32 0 56 30 50 80 z', C.shiba, 5);
  s += f('M44 200 c0 -34 10 -54 28 -54 c18 0 28 20 28 54 z', C.crema2);
  s += ell(44, 202, 18, 8, C.crema2, 5); s += ell(100, 202, 18, 8, C.crema2, 5);
  s += o('M22 46 l12 -40 l32 30 z', C.shiba, 5); s += o('M122 46 l-12 -40 l-32 30 z', C.shiba, 5);
  s += f('M32 44 l6 -22 l18 18 z', C.rosa); s += f('M112 44 l-6 -22 l-18 18 z', C.rosa);
  s += o('M12 84 c0 -36 26 -56 60 -56 c34 0 60 20 60 56 c0 32 -24 50 -60 50 c-36 0 -60 -18 -60 -50 z', C.shiba, 5);
  s += f('M30 100 c0 -24 18 -40 42 -40 c24 0 42 16 42 40 c0 20 -16 32 -42 32 c-26 0 -42 -12 -42 -32 z', C.crema2);
  // de reojo: pupilas a un lado y párpados a media asta
  s += ell(52, 86, 11, 12, C.blanco, 5); s += ell(92, 86, 11, 12, C.blanco, 5);
  s += circ(58, 88, 6, K, 0); s += circ(98, 88, 6, K, 0);
  s += f('M41 74 h22 v8 h-22 z M81 74 h22 v8 h-22 z', C.shiba);
  s += line('M41 80 h22 M81 80 h22', K, 4);
  s += o('M64 104 h16 l-8 8 z', K, 3);
  s += line('M66 114 q6 5 12 0', K, 4);
  s += line('M32 62 l-2 10 M46 54 l-2 10', C.shibaS, 5);
  scene('aliado_perro', svg(144, 210, s));
}

// ---- Perico verde (12.75 × 16.25 → 102 × 130) ----
{
  let s = '';
  s += o('M30 124 c-14 -10 -16 -38 -2 -56 c8 -8 16 -14 22 -14 c0 20 -2 50 -20 70 z', C.rojo, 5);
  s += o('M20 112 c-6 -40 16 -72 40 -72 c26 0 40 30 32 70 c-4 12 -14 18 -36 18 c-20 0 -34 -6 -36 -16 z', C.verdeP, 5);
  s += f('M36 112 c-2 -28 10 -50 24 -50 c12 0 20 20 16 48 c-6 6 -14 8 -20 8 c-10 0 -16 -2 -20 -6 z', '#a6e36a');
  s += o('M30 70 c-10 -8 -6 -28 8 -40 c10 -6 20 -4 28 4 c-8 10 -12 24 -8 36 c-10 4 -20 4 -28 0 z', C.azul, 5);
  s += circ(58, 36, 30, C.verdeP, 5);
  s += f('M40 44 c-2 -14 8 -24 18 -22 c-8 6 -12 14 -10 24 z', '#a6e36a');
  s += o('M74 36 c14 2 20 12 14 22 c-6 8 -16 6 -20 -2 z', C.pico, 5);
  s += f('M80 50 c4 2 8 2 10 0 c-2 6 -8 8 -12 4 z', '#c87d1a');
  s += eyes(58, 34, 8, 7, false);
  s += ell(36, 124, 10, 5, C.pico, 4); s += ell(60, 124, 10, 5, C.pico, 4);
  scene('aliado_perico', svg(102, 130, s));
}

// ---- Cuervo (10 × 13.5 → 80 × 108) ----
{
  let s = '';
  s += o('M12 96 c-10 -4 -10 -24 0 -40 l14 -2 c-4 14 -4 28 -2 40 z', C.negro, 5);
  s += o('M16 96 c-4 -34 10 -60 30 -60 c20 0 32 24 28 58 c-2 8 -12 10 -28 10 c-16 0 -28 -2 -30 -8 z', C.negro, 5);
  s += f('M30 92 c-2 -22 8 -40 18 -40 c10 0 16 18 14 38 c-6 2 -10 2 -16 2 c-8 0 -12 0 -16 0 z', '#56506e');
  s += circ(42, 30, 24, C.negro, 5);
  s += o('M62 28 l18 6 l-16 8 z', '#f4c04e', 5);
  s += eyes(40, 28, 7, 6, false);
  s += line('M30 6 l4 6 M40 2 v8 M50 6 l-4 6', K, 4);
  s += ell(30, 102, 9, 4, '#f4c04e', 4); s += ell(50, 102, 9, 4, '#f4c04e', 4);
  scene('aliado_cuervo', svg(80, 108, s));
}

// ---- Mapache con su saco de botín (18 × 25.75 → 144 × 206) ----
{
  let s = '';
  s += o('M112 160 c26 -14 36 6 24 26 c-8 10 -18 8 -22 0 c-4 -8 4 -14 -2 -26 z', C.mapache, 5);
  s += line('M118 172 l20 -6 M122 184 l16 -2', C.antifaz, 5);
  s += o('M18 196 c-6 -48 20 -78 52 -78 c32 0 56 30 50 78 z', C.mapache, 5);
  s += f('M40 196 c0 -32 12 -52 30 -52 c18 0 30 20 30 52 z', C.blancoS);
  // saco de botín al frente
  s += o('M86 138 c20 -8 42 8 40 34 c-2 20 -16 28 -34 26 c-18 -2 -26 -16 -22 -34 c2 -12 8 -20 16 -26 z', '#c9a06a', 5);
  s += line('M92 134 q10 -6 18 2', K, 4);
  s += circ(102, 166, 7, C.oro, 3); s += circ(116, 176, 6, C.oro, 3); s += circ(104, 184, 5, C.oro, 3);
  s += ell(38, 198, 16, 7, C.antifaz, 5);
  s += o('M26 52 l8 -34 l30 26 z', C.mapache, 5); s += o('M118 52 l-8 -34 l-30 26 z', C.mapache, 5);
  s += o('M14 90 c0 -36 26 -56 58 -56 c32 0 58 20 58 56 c0 30 -22 48 -58 48 c-36 0 -58 -18 -58 -48 z', C.mapache, 5);
  s += f('M36 104 c0 -20 16 -34 36 -34 c20 0 36 14 36 34 c0 16 -14 26 -36 26 c-22 0 -36 -10 -36 -26 z', C.blancoS);
  s += o('M30 90 c0 -16 10 -24 24 -20 c8 2 12 8 12 16 c0 10 -8 16 -18 14 c-10 -2 -18 -4 -18 -10 z', C.antifaz, 4);
  s += o('M114 90 c0 -16 -10 -24 -24 -20 c-8 2 -12 8 -12 16 c0 10 8 16 18 14 c10 -2 18 -4 18 -10 z', C.antifaz, 4);
  s += eyes(72, 86, 18, 8, false);
  s += o('M64 108 h16 l-8 8 z', K, 3);
  s += line('M66 118 q6 5 12 0', K, 4);
  scene('aliado_mapache', svg(144, 206, s));
}

// ---- Cabra que grita (25.25 × 29.25 → 202 × 234) ----
{
  let s = '';
  s += o('M30 222 c-10 -60 20 -100 70 -100 c56 0 80 40 70 100 z', C.cabra, 5);
  s += f('M64 222 c0 -40 14 -66 36 -66 c22 0 36 26 36 66 z', C.cabraS, 'opacity=".5"');
  s += o('M158 128 c20 -10 32 6 22 24 c-6 8 -16 6 -18 -2 c-2 -10 4 -12 -4 -22 z', C.cabra, 5);
  for (const x of [48, 84, 120, 156]) s += rect(x - 10, 196, 20, 32, 6, C.cabra, 5) + rect(x - 10, 220, 20, 10, 4, K, 0);
  // cabeza larga, boca abierta gritando
  s += o('M34 60 c0 -30 24 -46 56 -46 c34 0 60 16 60 46 c0 10 -2 20 -2 30 c0 28 -20 44 -56 44 c-36 0 -58 -16 -58 -44 z', C.cabra, 5);
  s += o('M60 108 c10 -8 50 -8 60 0 c4 14 -8 30 -30 30 c-22 0 -34 -16 -30 -30 z', C.vino, 5);
  s += f('M70 112 c8 -4 36 -4 44 0 c-2 6 -10 10 -22 10 c-12 0 -20 -4 -22 -10 z', C.rosa);
  s += f('M66 108 h12 v8 h-12 z M102 108 h12 v8 h-12 z', C.blanco);
  s += o('M60 22 c-14 -14 -10 -36 6 -34 c-4 10 -2 22 4 32 z', C.cuerno, 5);
  s += o('M120 22 c14 -14 10 -36 -6 -34 c4 10 2 22 -4 32 z', C.cuerno, 5);
  s += o('M30 70 c-16 -2 -26 10 -18 22 c6 8 16 6 20 -2 z', C.cabra, 5);
  s += o('M150 70 c16 -2 26 10 18 22 c-6 8 -16 6 -20 -2 z', C.cabra, 5);
  s += ell(66, 72, 11, 13, C.blanco, 5); s += ell(114, 72, 11, 13, C.blanco, 5);
  s += rect(60, 68, 12, 8, 2, K, 0); s += rect(108, 68, 12, 8, 2, K, 0);
  s += line('M50 52 q16 -10 30 0 M100 52 q16 -10 30 0', K, 5);
  s += o('M78 136 q12 20 24 0 v14 q-12 14 -24 0 z', C.cabraS, 4);
  scene('aliado_cabra', svg(202, 234, s));
}

// ---- Dueño grabando con el celular (13.5 × 42.25 → 108 × 338) ----
{
  let s = '';
  s += rect(30, 290, 22, 44, 6, C.mezclilla, 5); s += rect(56, 290, 22, 44, 6, C.mezclilla, 5);
  s += o('M22 322 h34 c6 0 8 6 6 12 h-42 c-4 0 -4 -12 2 -12 z', C.tenis, 5);
  s += o('M52 322 h34 c6 0 8 6 6 12 h-42 c-4 0 -4 -12 2 -12 z', C.tenis, 5);
  s += line('M30 332 h26 M60 332 h26', C.rojo, 4);
  s += rect(26, 200, 56, 100, 8, C.mezclilla, 5);
  s += line('M54 206 v90', C.mezclillaS, 4);
  s += o('M18 120 c0 -14 10 -22 22 -22 h28 c12 0 22 8 22 22 v90 c0 6 -4 10 -10 10 h-52 c-6 0 -10 -4 -10 -10 z', C.sudadera, 5);
  s += f('M24 160 h60 v44 c0 6 -4 10 -10 10 h-40 c-6 0 -10 -4 -10 -10 z', C.sudaderaS, 'opacity=".35"');
  s += rect(36, 170, 36, 22, 6, C.sudaderaS, 4);
  s += line('M44 118 v40 M64 118 v40', C.blanco, 5);
  // brazos: el izquierdo sostiene el celular enfrente
  s += o('M18 130 c-10 20 -12 50 -4 70 c4 8 14 6 16 -2 c4 -22 2 -44 -2 -66 z', C.sudadera, 5);
  s += o('M90 130 c10 14 8 34 -6 44 l-20 8 c-8 2 -12 -8 -6 -12 l16 -10 c4 -10 2 -20 -2 -28 z', C.sudadera, 5);
  s += circ(62, 182, 10, C.piel, 5);
  s += rect(50, 150, 30, 46, 6, C.negro, 5); s += rect(55, 156, 20, 32, 3, C.azul, 0); s += circ(65, 160, 3, '#ffffff', 0);
  s += ell(44, 200, 10, 8, C.piel, 5);
  // cuello y cabeza
  s += rect(44, 86, 20, 20, 6, C.pielS, 5);
  s += o('M24 52 c0 -30 18 -44 30 -44 c12 0 30 14 30 44 c0 28 -14 44 -30 44 c-16 0 -30 -16 -30 -44 z', C.piel, 5);
  s += o('M22 46 c0 -26 16 -42 32 -42 c18 0 34 14 32 40 c-8 -12 -18 -16 -28 -14 c-6 4 -14 6 -20 2 c-6 2 -12 6 -16 14 z', C.pelo, 5);
  s += eyes(54, 56, 12, 7, false);
  s += line('M36 42 q10 -6 18 -2 M72 42 q-10 -6 -18 -2', K, 4);
  s += ell(54, 78, 7, 5, C.vino, 4);
  scene('duenio', svg(108, 338, s));
}

// ---- Escoba Furiosa (59 × 90 → 472 × 720; derrotada 488 × 720) ----
function escoba({ derrotada = false } = {}) {
  const W = derrotada ? 488 : 472, H = 720;
  const cx = 236;
  let s = '';
  // piernas y botas
  s += o(`M${cx - 70} 540 l-20 120 h60 l10 -120 z`, C.metal, 5);
  s += o(`M${cx + 70} 540 l20 120 h-60 l-10 -120 z`, C.metal, 5);
  s += o(`M${cx - 110} 650 c-10 20 -6 46 10 54 h70 c10 -10 6 -30 -4 -54 z`, C.palo, 5);
  s += o(`M${cx + 110} 650 c10 20 6 46 -10 54 h-70 c-10 -10 -6 -30 4 -54 z`, C.palo, 5);
  s += f(`M${cx - 104} 690 h70 v10 h-70 z M${cx + 34} 690 h70 v10 h-70 z`, C.paloS);
  // palo (cuerpo)
  s += rect(cx - 44, 300, 88, 260, 20, C.palo, 6);
  s += f(`M${cx - 36} 310 h20 v240 h-20 z`, C.pajaC, 'opacity=".35"');
  s += line(`M${cx - 20} 330 v200 M${cx + 10} 350 v160`, C.paloS, 5);
  // brazos de metal
  s += o(`M${cx - 44} 360 c-50 10 -80 50 -70 110 c4 20 24 24 30 6 c6 -40 20 -70 50 -90 z`, C.metal, 6);
  s += o(`M${cx + 44} 360 c50 10 80 50 70 110 c-4 20 -24 24 -30 6 c-6 -40 -20 -70 -50 -90 z`, C.metal, 6);
  s += circ(cx - 92, 476, 24, C.metalS, 5); s += circ(cx + 92, 476, 24, C.metalS, 5);
  // cabeza: la paja en picos
  const spikes = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 10) * Math.PI;
    const x1 = cx - 150 + i * 30, x2 = cx - 150 + (i + 1) * 30;
    const tipX = (x1 + x2) / 2 + (derrotada ? Math.sin(i * 2) * 10 : 0);
    const tipY = derrotada ? 60 + Math.abs(Math.cos(a)) * 90 : 20 + Math.abs(Math.cos(a)) * 70;
    spikes.push(`L${tipX} ${tipY} L${x2} 150`);
  }
  s += o(`M${cx - 160} 300 c-20 -60 -10 -120 10 -150 ${spikes.join(' ')} c20 30 30 90 10 150 c-40 30 -100 40 -160 40 c-60 0 -120 -10 -160 -40 z`, C.paja, 6);
  s += f(`M${cx - 120} 300 c-6 -30 -4 -60 6 -80 c30 30 90 40 114 40 c24 0 84 -10 114 -40 c10 20 12 50 6 80 c-30 20 -80 28 -120 28 c-40 0 -90 -8 -120 -28 z`, C.pajaS, 'opacity=".45"');
  for (let i = 0; i < 9; i++) s += line(`M${cx - 120 + i * 30} 165 l${(i % 2) * 6 - 3} 110`, C.pajaS, 5);
  // cara
  if (derrotada) {
    s += circ(cx - 56, 220, 24, C.blanco, 5); s += circ(cx + 56, 220, 24, C.blanco, 5);
    s += line(`M${cx - 56} 220 m-10 0 a10 10 0 1 1 10 10 a4 4 0 1 0 -4 -4 M${cx + 56} 220 m-10 0 a10 10 0 1 1 10 10 a4 4 0 1 0 -4 -4`, K, 5);
    s += o(`M${cx - 40} 268 c20 -10 60 -10 80 0 c0 30 -20 50 -40 50 c-20 0 -40 -20 -40 -50 z`, C.vino, 5);
    s += o(`M${cx - 14} 300 c10 -6 20 -6 28 0 c6 26 -2 50 -14 50 c-12 0 -20 -24 -14 -50 z`, C.rosa, 4);
    s += line(`M${cx - 110} 170 l-10 30 M${cx + 110} 170 l10 30`, C.azul, 8);
    s += rect(cx + 40, 150, 70, 22, 8, C.rojo, 4);
  } else {
    s += ell(cx - 56, 222, 26, 22, C.blanco, 5); s += ell(cx + 56, 222, 26, 22, C.blanco, 5);
    s += circ(cx - 50, 226, 11, K, 0); s += circ(cx + 50, 226, 11, K, 0);
    s += f(`M${cx - 92} 192 l72 24 l-72 8 z M${cx + 92} 192 l-72 24 l72 8 z`, C.paja);
    s += line(`M${cx - 92} 196 l70 22 M${cx + 92} 196 l-70 22`, K, 7);
    s += o(`M${cx - 60} 266 c30 -12 90 -12 120 0 c-6 34 -28 52 -60 52 c-32 0 -54 -18 -60 -52 z`, C.vino, 5);
    s += f(`M${cx - 50} 270 h100 l-6 16 h-88 z`, C.blanco);
    s += line(`M${cx - 30} 270 v14 M${cx} 270 v16 M${cx + 30} 270 v14`, K, 3);
  }
  // espátula en la mano izquierda
  s += line(`M${cx - 92} 476 l-30 -200`, C.paloS, 12);
  s += o(`M${cx - 160} 280 l-30 -90 h80 l10 90 z`, C.metalS, 5);
  s += line(`M${cx - 165} 212 v50 M${cx - 145} 212 v54 M${cx - 125} 212 v56`, '#c9ccd8', 4);
  return svg(W, H, s);
}
scene('jefe_escoba', escoba());
scene('jefe_escoba_derrotado', escoba({ derrotada: true }));
