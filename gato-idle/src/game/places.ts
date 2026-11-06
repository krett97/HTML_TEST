// Escenarios: cada objeto está en un cuarto (cocina, sala, baño, recámara, cuarto de lavado; en la
// casa, jardín, estudio y cochera; en la mansión, salón, cine y alberca; en la Luna, cohete,
// laboratorio lunar y superficie) y sobre una superficie (barra, mesa, mueble, repisa,
// cama, escritorio o el piso). Con arte de PixelLab (pared_*, piso_*, ventana_*, cuadro_*, mueble_*)
// la escena lo usa; lo que no tenga PNG se dibuja aquí con rectángulos, con las mismas medidas.
import type Phaser from 'phaser';
import type { PlaceId } from '../core/data';

export type Room = 'cocina' | 'sala' | 'bano' | 'recamara' | 'lavado' | 'jardin' | 'estudio' | 'cochera' | 'salon' | 'cine' | 'alberca' | 'cohete' | 'labluna' | 'superficie';
export type SurfaceKind = 'barra' | 'mesa' | 'mueble' | 'repisa' | 'cama' | 'escritorio' | 'piso';

export interface Surface {
  kind: SurfaceKind;
  /** Alto de la cubierta sobre el piso (0 = el objeto está en el piso y se vuelca ahí mismo). */
  height: number;
  /** Dónde empieza y la orilla de la que caen las cosas. */
  left: number;
  right: number;
}

export interface Place {
  room: Room;
  surface: Surface;
}

const SURFACES: Record<SurfaceKind, Surface> = {
  barra: { kind: 'barra', height: 50, left: 6, right: 160 },
  mesa: { kind: 'mesa', height: 26, left: 20, right: 158 },
  mueble: { kind: 'mueble', height: 34, left: 26, right: 160 },
  repisa: { kind: 'repisa', height: 62, left: 34, right: 156 },
  cama: { kind: 'cama', height: 30, left: 10, right: 160 },
  escritorio: { kind: 'escritorio', height: 40, left: 22, right: 158 },
  piso: { kind: 'piso', height: 0, left: 8, right: 172 },
};

/**
 * Medidas de cada mueble con su arte (mueble_<lugar>.png, a su tamaño natural): ancho y alto de la
 * cubierta. `sobresale`: lo que el dibujo sube por encima de la cubierta (la cabecera de la cama).
 */
const FURNITURE: Partial<Record<PlaceId, { ancho: number; alto: number; sobresale?: number }>> = {
  'cocina-barra': { ancho: 136.25, alto: 23.25 },
  'sala-mesa': { ancho: 132.5, alto: 16 },
  'sala-mueble': { ancho: 125.5, alto: 17.5 },
  'bano-repisa': { ancho: 102.5, alto: 62, sobresale: 1.5 },
  'recamara-cama': { ancho: 113, alto: 24.5, sobresale: 13 },
  'recamara-escritorio': { ancho: 95, alto: 27 },
  'jardin-mesa': { ancho: 112, alto: 16 },
  'estudio-escritorio': { ancho: 123, alto: 33 },
  'estudio-repisa': { ancho: 109, alto: 62 },
  'salon-mesa': { ancho: 99, alto: 20.5 },
  'salon-mueble': { ancho: 128, alto: 26.5 },
  'cine-mueble': { ancho: 125, alto: 21 },
  'alberca-mesa': { ancho: 94.5, alto: 18.5 },
  'cohete-mueble': { ancho: 134, alto: 25.5 },
  'labluna-mesa': { ancho: 83, alto: 14.5 },
};

export function placeOf(id: PlaceId): Place {
  const [room, kind] = id.split('-') as [Room, SurfaceKind];
  const base = SURFACES[kind];
  const art = FURNITURE[id];
  return { room, surface: art ? { ...base, height: art.alto, right: base.left + art.ancho } : base };
}

/** Clave del arte del mueble y cuánto sobresale por encima de la cubierta (null: se dibuja con rectángulos). */
export function furnitureArt(room: Room, surface: Surface): { key: string; sobresale: number } | null {
  const art = FURNITURE[`${room}-${surface.kind}` as PlaceId];
  return art ? { key: `mueble_${room}_${surface.kind}`, sobresale: art.sobresale ?? 0 } : null;
}

/** Qué partes del cuarto tienen arte (las demás se dibujan con rectángulos). */
export interface RoomArt {
  pared: boolean;
  piso: boolean;
  ventana: boolean;
  cuadro: boolean;
}

/** La barda del jardín (pared_jardin.png) es una franja junto al piso; arriba sigue el cielo de su color. */
export const GARDEN_STRIP_H = 32;
const GARDEN_SKY = 0x60dfe6; // el cielo de pared_jardin.png

/** Ventana y cuadro (el perico se para en el cuadro y el cuervo en la ventana), medidos desde el piso. */
export const WINDOW_ABOVE_FLOOR = 140;
export const PICTURE_ABOVE_FLOOR = 114;
/** Con la cámara cerca el cuarto es bajito: la ventana y el cuadro bajan hasta quedar a la vista. */
const WINDOW_MIN_TOP = 16;
const PICTURE_MIN_TOP = 18;
/** Centro de la ventana: a la derecha del medidor de daño (arriba a la izquierda), para que no la tape. */
export const WINDOW_X = 92;

/** Dónde queda arriba la ventana y el cuadro según el alto del cuarto. */
export function perchTops(floorY: number): { windowY: number; pictureY: number } {
  return { windowY: Math.max(WINDOW_MIN_TOP, floorY - WINDOW_ABOVE_FLOOR), pictureY: Math.max(PICTURE_MIN_TOP, floorY - PICTURE_ABOVE_FLOOR) };
}

/** Color de las sombras del cuarto (el morado oscuro de la interfaz). */
export const SHADOW = 0x120b16;

interface RoomLook {
  wall: number;
  wallDark: number;
  floor: number;
  floorLine: number;
  /** Marco y contenido del "cuadro": en la cocina es un reloj, en el baño un espejo… */
  frame: number;
  picture: number;
}

const ROOMS: Record<Room, RoomLook> = {
  cocina: { wall: 0x2f4a4f, wallDark: 0x263c40, floor: 0x6a6f7a, floorLine: 0x585c66, frame: 0xe8e8f0, picture: 0xfff1e0 },
  sala: { wall: 0x3b2a4d, wallDark: 0x30223f, floor: 0x6b4a3a, floorLine: 0x56392c, frame: 0xd9a441, picture: 0x5ec4a8 },
  bano: { wall: 0x34505e, wallDark: 0x2a424e, floor: 0x8fa3b0, floorLine: 0x74889a, frame: 0xe8e8f0, picture: 0xa8d8ea },
  recamara: { wall: 0x4a2d3c, wallDark: 0x3d2532, floor: 0x6b3a4a, floorLine: 0x5a2f3e, frame: 0xd9a441, picture: 0xe5a0b0 },
  lavado: { wall: 0x3a3f4a, wallDark: 0x30343d, floor: 0x5a5f68, floorLine: 0x4a4e56, frame: 0xffd36e, picture: 0x4a7ab8 },
  // Jardín: el "muro" es el cielo; la ventana es una rama y el cuadro una casita de pájaros.
  jardin: { wall: 0x7ec4e8, wallDark: 0x9a6a3c, floor: 0x5f9e3f, floorLine: 0x4a8030, frame: 0xc0504d, picture: 0xe8c48a },
  // Estudio del influencer: paredes moradas con espuma acústica, tira de luz neón y un póster.
  estudio: { wall: 0x2a2140, wallDark: 0x221a35, floor: 0x4a3434, floorLine: 0x3d2b2b, frame: 0xff5ec4, picture: 0x5ec4ff },
  // Cochera: block gris, ventanita alta y tablero de herramientas.
  cochera: { wall: 0x6b6f76, wallDark: 0x5a5e65, floor: 0x8a8d93, floorLine: 0x7a7d83, frame: 0x8a6a4a, picture: 0xc9a27a },
  // La mansión: salón de tapiz rojo y mármol, sala de cine y alberca techada.
  salon: { wall: 0x7a1f2b, wallDark: 0x5a1520, floor: 0xe8e4dc, floorLine: 0x2a2630, frame: 0xd9a441, picture: 0xe8a050 },
  cine: { wall: 0x5a1220, wallDark: 0x3a0a14, floor: 0x8a1c2c, floorLine: 0x6a1420, frame: 0x2b1d2f, picture: 0xffd36e },
  alberca: { wall: 0x5fb8d8, wallDark: 0x3a8aaa, floor: 0xf0ece2, floorLine: 0xbcd6e0, frame: 0xff7a3d, picture: 0xffffff },
  // La Luna: la cabina del cohete, el laboratorio lunar y la superficie (con la Tierra en el cielo).
  cohete: { wall: 0x5a6270, wallDark: 0x3a404a, floor: 0x3a404a, floorLine: 0x2a2e36, frame: 0xc99a3a, picture: 0x8fc7e8 },
  labluna: { wall: 0xc8d2d8, wallDark: 0x9aa8b0, floor: 0xd8e2e8, floorLine: 0xb8c4cc, frame: 0x2a2e36, picture: 0x5ec4a8 },
  superficie: { wall: 0x0a0a1e, wallDark: 0x1a1a2e, floor: 0x9a9aa4, floorLine: 0x7a7a84, frame: 0x8a8a94, picture: 0x7be07b },
};

/** Alinea un patrón a la cuadrícula aunque la cámara esté corrida a la izquierda (x negativas). */
function snap(x: number, step: number): number {
  return Math.floor(x / step) * step;
}

const WOOD = 0x8a5a3c;
const WOOD_DARK = 0x5e3b26;
const WHITE = 0xe8e8f0;
const STONE = 0xd8d4cc;
const STONE_DARK = 0xa8a39a;

/**
 * Pared, piso, ventana y cuadro del cuarto, menos lo que ya tiene arte. `left`/`w` cubren todo el
 * canvas (más ancho que el área de juego).
 */
export function drawRoom(g: Phaser.GameObjects.Graphics, room: Room, left: number, w: number, h: number, floorY: number, art: RoomArt): void {
  const look = ROOMS[room];
  if (art.pared) {
    if (room === 'jardin') {
      // Arriba de la barda sigue el cielo (las nubes vienen en la barda; el sol es un sprite).
      g.fillStyle(GARDEN_SKY).fillRect(left, 0, w, floorY - GARDEN_STRIP_H);
    } else {
      g.fillStyle(look.wallDark).fillRect(left, floorY - 6, w, 6); // zoclo
    }
  } else {
    drawWall(g, room, left, w, floorY);
  }

  // Ventana y cuadro (en el jardín: un árbol y una casita de pájaros, donde se paran el cuervo y el perico).
  const { windowY, pictureY } = perchTops(floorY);
  if (room === 'jardin') {
    if (art.ventana && art.cuadro) drawGardenPosts(g, windowY, pictureY, floorY);
    else drawGardenPerches(g, windowY, pictureY, floorY);
  } else if (!art.ventana) {
    const wx = WINDOW_X - 24;
    g.fillStyle(0xe8d8c4).fillRect(wx, windowY, 48, 40);
    g.fillStyle(0x8fc7e8).fillRect(wx + 3, windowY + 3, 42, 34);
    g.fillStyle(0xe8d8c4).fillRect(wx + 23, windowY + 3, 2, 34).fillRect(wx + 3, windowY + 19, 42, 2);
    if (room === 'recamara') {
      // Cortinas.
      g.fillStyle(0xb85c7a).fillRect(wx - 3, windowY - 2, 8, 44).fillRect(wx + 43, windowY - 2, 8, 44);
    }
  }
  if (room !== 'jardin' && !art.cuadro) drawPicture(g, room, pictureY);

  if (!art.piso) drawFloor(g, room, left, w, h, floorY);
}

/**
 * Luz del cuarto, en bandas (como se sombrea en pixel art): el techo queda en penumbra, la pared se
 * oscurece un poco para que los personajes resalten y el mueble deja sombra en el piso. Va encima
 * de la pared y el piso y debajo del mueble y los personajes.
 */
export function drawShading(g: Phaser.GameObjects.Graphics, room: Room, surface: Surface, left: number, w: number, h: number, floorY: number): void {
  const outdoors = room === 'jardin' || room === 'superficie';
  if (!outdoors) {
    g.fillStyle(SHADOW, 0.1).fillRect(left, 0, w, floorY);
    const bands = [0.28, 0.18, 0.1, 0.05];
    bands.forEach((alpha, i) => g.fillStyle(SHADOW, alpha).fillRect(left, i * 3, w, 3));
  }
  // La unión de la pared con el piso y la sombra del mueble.
  g.fillStyle(SHADOW, 0.14).fillRect(left, floorY, w, 2);
  if (surface.height > 0) {
    const bands = [0.26, 0.16, 0.08];
    bands.forEach((alpha, i) => g.fillStyle(SHADOW, alpha).fillRect(surface.left, floorY + i * 2, surface.right - surface.left + 2 + i * 2, 2));
  }
  // Un poco más oscuro abajo del todo: el piso se aleja de la luz.
  g.fillStyle(SHADOW, 0.08).fillRect(left, h - 6, w, 6);
}

/** Pared con su detalle (azulejos, lambrín, barda, espuma…) y el zoclo. */
function drawWall(g: Phaser.GameObjects.Graphics, room: Room, left: number, w: number, floorY: number): void {
  const look = ROOMS[room];
  g.fillStyle(look.wall).fillRect(left, 0, w, floorY);

  // Detalle de la pared.
  if (room === 'cocina') {
    // Azulejos sobre la barra.
    const top = floorY - SURFACES.barra.height - 24;
    for (let row = 0; row < 4; row++) {
      for (let x = snap(left, 12); x < left + w; x += 12) {
        g.fillStyle(row % 2 === 0 ? 0x3c5c62 : 0x35535a).fillRect(x + (row % 2) * 6, top + row * 6, 6, 6);
      }
    }
  } else if (room === 'bano') {
    // Lambrín de azulejo.
    g.fillStyle(0x3e5d6c).fillRect(left, floorY - 56, w, 56);
    for (let y = floorY - 56; y < floorY; y += 8) g.fillStyle(look.wallDark).fillRect(left, y, w, 1);
    for (let x = snap(left, 8); x < left + w; x += 8) g.fillStyle(look.wallDark).fillRect(x, floorY - 56, 1, 56);
  } else if (room === 'jardin') {
    // Sol, nubes y barda de madera.
    g.fillStyle(0xffe27a).fillRect(150, 12, 14, 14);
    g.fillStyle(0xffffff).fillRect(snap(left, 2) + 30, 20, 22, 6).fillRect(snap(left, 2) + 36, 16, 12, 4).fillRect(90, 34, 18, 5);
    const top = floorY - 44;
    for (let x = snap(left, 10); x < left + w; x += 10) {
      g.fillStyle(0xb98552).fillRect(x, top, 9, 44);
      g.fillStyle(0x9a6a3c).fillRect(x + 9, top, 1, 44).fillRect(x, top, 9, 1);
    }
    g.fillStyle(0x9a6a3c).fillRect(left, top + 10, w, 3).fillRect(left, top + 30, w, 3);
  } else if (room === 'estudio') {
    // Espuma acústica a cuadros y tira de luz neón arriba.
    for (let row = 0; row < 6; row++) {
      for (let x = snap(left, 12); x < left + w; x += 12) {
        g.fillStyle(row % 2 === 0 ? 0x332850 : 0x2e2448).fillRect(x + (row % 2) * 6, floorY - 70 + row * 8, 6, 8);
      }
    }
    g.fillStyle(0xff5ec4).fillRect(left, 4, w, 2);
    g.fillStyle(0xb8408a).fillRect(left, 6, w, 1);
  } else if (room === 'cochera') {
    // Block de concreto y una franja amarilla de seguridad.
    for (let row = 0; floorY - 6 - row * 8 > 0; row++) {
      const y = floorY - 6 - (row + 1) * 8;
      g.fillStyle(look.wallDark).fillRect(left, y, w, 1);
      for (let x = snap(left, 16) + (row % 2) * 8; x < left + w; x += 16) g.fillStyle(look.wallDark).fillRect(x, y, 1, 8);
    }
    for (let x = snap(left, 8); x < left + w; x += 8) {
      g.fillStyle(0xffd36e).fillRect(x, floorY - 12, 4, 4);
      g.fillStyle(0x2b1d2f).fillRect(x + 4, floorY - 12, 4, 4);
    }
  } else if (room === 'lavado') {
    // Repisa con detergentes.
    const y = floorY - 92;
    g.fillStyle(WOOD_DARK).fillRect(96, y, 60, 3);
    g.fillStyle(0xe5534b).fillRect(102, y - 10, 8, 10);
    g.fillStyle(0x5ec4a8).fillRect(114, y - 8, 7, 8);
    g.fillStyle(0xffd36e).fillRect(126, y - 12, 9, 12);
  }
  g.fillStyle(look.wallDark).fillRect(left, floorY - 6, w, 6); // zoclo
}

/** El "cuadro" del cuarto: reloj, póster, tablero de herramientas… */
function drawPicture(g: Phaser.GameObjects.Graphics, room: Room, pictureY: number): void {
  const look = ROOMS[room];
  g.fillStyle(look.frame).fillRect(116, pictureY, 30, 22);
  g.fillStyle(look.picture).fillRect(118, pictureY + 2, 26, 18);
  if (room === 'cocina') {
    // Reloj: manecillas.
    g.fillStyle(0x2b1d2f).fillRect(130, pictureY + 5, 2, 7).fillRect(130, pictureY + 10, 6, 2);
  } else if (room === 'estudio') {
    // Póster: el logo del canal (un botón de "play").
    g.fillStyle(0xe5534b).fillRect(124, pictureY + 6, 14, 10);
    g.fillStyle(0xffffff).fillRect(129, pictureY + 8, 2, 6).fillRect(131, pictureY + 9, 2, 4).fillRect(133, pictureY + 10, 1, 2);
  } else if (room === 'cochera') {
    // Tablero con herramientas: martillo, llave y desarmador.
    g.fillStyle(0x5a5e65).fillRect(121, pictureY + 4, 2, 12).fillRect(119, pictureY + 4, 6, 3);
    g.fillStyle(0x8a94a6).fillRect(129, pictureY + 4, 2, 13).fillRect(128, pictureY + 3, 4, 3);
    g.fillStyle(0xe5534b).fillRect(137, pictureY + 4, 3, 6);
    g.fillStyle(0x8a94a6).fillRect(138, pictureY + 10, 1, 7);
  }
}

function drawFloor(g: Phaser.GameObjects.Graphics, room: Room, left: number, w: number, h: number, floorY: number): void {
  const look = ROOMS[room];
  g.fillStyle(look.floor).fillRect(left, floorY, w, h - floorY);
  if (room === 'jardin') {
    // Pasto con hojitas.
    for (let row = 0; floorY + 2 + row * 5 < h; row++) {
      for (let x = snap(left, 7) + (row % 2) * 3; x < left + w; x += 7) g.fillStyle(look.floorLine).fillRect(x, floorY + 2 + row * 5, 1, 2);
    }
  } else if (room === 'cochera') {
    // Concreto con una mancha de aceite.
    for (let y = floorY + 12; y < h; y += 12) g.fillStyle(look.floorLine).fillRect(left, y, w, 1);
    g.fillStyle(0x5a5d63).fillRect(96, floorY + 8, 22, 4).fillRect(100, floorY + 6, 14, 8);
  } else if (room === 'cocina' || room === 'bano') {
    // Losetas a cuadros.
    for (let row = 0; floorY + row * 8 < h; row++) {
      for (let x = snap(left, 16); x < left + w; x += 16) {
        g.fillStyle(look.floorLine).fillRect(x + (row % 2) * 8, floorY + row * 8, 8, 8);
      }
    }
  } else if (room === 'recamara') {
    // Alfombra con puntitos.
    for (let row = 0; floorY + 4 + row * 6 < h; row++) {
      for (let x = snap(left, 10) + (row % 2) * 5; x < left + w; x += 10) g.fillStyle(look.floorLine).fillRect(x, floorY + 4 + row * 6, 1, 1);
    }
  } else {
    for (let y = floorY + 8; y < h; y += 8) g.fillStyle(look.floorLine).fillRect(left, y, w, 1);
  }
}

/** Rama (donde se para el cuervo) y casita de pájaros (el perico se para en el techo). */
/** Con arte (ventana_jardin.png = copa del árbol, cuadro_jardin.png = casita): el tronco y el poste hasta el piso. */
function drawGardenPosts(g: Phaser.GameObjects.Graphics, windowY: number, pictureY: number, floorY: number): void {
  const trunkTop = windowY + 40 - 6;
  g.fillStyle(0x6b4a2a).fillRect(WINDOW_X - 5, trunkTop, 10, floorY - trunkTop);
  g.fillStyle(0x4a3018).fillRect(WINDOW_X + 3, trunkTop, 2, floorY - trunkTop).fillRect(WINDOW_X - 2, trunkTop + 8, 1, 12);
  const postTop = pictureY + 22 - 4;
  g.fillStyle(0x9a6a3c).fillRect(129, postTop, 4, floorY - postTop);
  g.fillStyle(0x6b4a2a).fillRect(132, postTop, 1, floorY - postTop);
}

function drawGardenPerches(g: Phaser.GameObjects.Graphics, windowY: number, pictureY: number, floorY: number): void {
  // Árbol a la izquierda con una rama a la altura de la "ventana".
  const branchY = windowY;
  g.fillStyle(0x6b4a2a).fillRect(8, branchY - 30, 8, floorY - branchY + 30);
  g.fillStyle(0x4a8030).fillRect(-6, branchY - 46, 36, 22).fillRect(0, branchY - 54, 24, 10);
  g.fillStyle(0x6b4a2a).fillRect(14, branchY, 60, 3);
  // Casita de pájaros en un poste, con el techo a la altura del "cuadro".
  const top = pictureY;
  g.fillStyle(0x9a6a3c).fillRect(129, top + 20, 4, floorY - top - 20);
  g.fillStyle(0xc0504d).fillRect(118, top, 26, 4);
  g.fillStyle(0xe8c48a).fillRect(121, top + 4, 20, 16);
  g.fillStyle(0x2b1d2f).fillRect(128, top + 9, 6, 6);
}

/** La superficie donde está el objeto (sin arte). `inodoro`: si el inodoro del baño ya tiene arte. */
export function drawSurface(g: Phaser.GameObjects.Graphics, surface: Surface, floorY: number, room: Room, inodoro = false): void {
  const { left, right, height } = surface;
  const top = floorY - height;
  const width = right - left;
  switch (surface.kind) {
    case 'barra': {
      // Cubierta de piedra y gabinetes con puertas.
      g.fillStyle(WOOD).fillRect(left + 2, top + 6, width - 4, height - 6);
      for (let x = left + 2; x < right - 4; x += 26) {
        g.fillStyle(WOOD_DARK).fillRect(x, top + 6, 1, height - 6);
        g.fillStyle(0xe8d8c4).fillRect(x + 20, top + 16, 2, 4);
      }
      g.fillStyle(WOOD_DARK).fillRect(left + 2, floorY - 4, width - 4, 4);
      g.fillStyle(STONE).fillRect(left, top, width, 4);
      g.fillStyle(STONE_DARK).fillRect(left, top + 4, width, 2);
      break;
    }
    case 'mesa': {
      // Mesa de centro, bajita.
      g.fillStyle(WOOD).fillRect(left, top, width, 4);
      g.fillStyle(WOOD_DARK).fillRect(left, top + 4, width, 2);
      g.fillStyle(WOOD_DARK).fillRect(left + 6, top + 6, 4, height - 6).fillRect(right - 10, top + 6, 4, height - 6);
      break;
    }
    case 'mueble': {
      // Mueble de TV con dos cajones.
      g.fillStyle(WOOD_DARK).fillRect(left, top, width, height);
      g.fillStyle(0x7a4a2c).fillRect(left, top, width, 3);
      const mid = left + Math.floor(width / 2);
      g.fillStyle(0x46301f).fillRect(left + 4, top + 8, width - 8, 1).fillRect(mid, top + 8, 1, height - 12);
      g.fillStyle(0xd9a441).fillRect(mid - 8, top + 16, 3, 2).fillRect(mid + 6, top + 16, 3, 2);
      break;
    }
    case 'repisa': {
      // Repisa flotante (en el baño, con el inodoro abajo).
      g.fillStyle(WHITE).fillRect(left, top, width, 3);
      g.fillStyle(0xb8c4d0).fillRect(left, top + 3, width, 1);
      g.fillStyle(0xb8c4d0).fillRect(left + 10, top + 4, 3, 6).fillRect(right - 14, top + 4, 3, 6);
      if (room === 'bano' && !inodoro) {
        g.fillStyle(WHITE).fillRect(64, floorY - 30, 14, 18); // tanque
        g.fillStyle(WHITE).fillRect(60, floorY - 14, 26, 6); // taza
        g.fillStyle(0xb8c4d0).fillRect(66, floorY - 8, 14, 8); // base
      }
      break;
    }
    case 'cama': {
      // Cama: base de madera, colchón, cobija y almohada.
      g.fillStyle(WOOD_DARK).fillRect(left, top + 12, width, height - 12);
      g.fillStyle(WOOD_DARK).fillRect(left, top - 10, 5, height + 10); // cabecera
      g.fillStyle(WHITE).fillRect(left + 5, top, width - 5, 5);
      g.fillStyle(0x4a7ab8).fillRect(left + 30, top + 2, width - 30, 10);
      g.fillStyle(0x3a6298).fillRect(left + 30, top + 10, width - 30, 2);
      g.fillStyle(0xfff1e0).fillRect(left + 6, top - 4, 18, 5); // almohada
      break;
    }
    case 'escritorio': {
      // Escritorio gris con cajonera.
      g.fillStyle(0xb8b0c0).fillRect(left, top, width, 4);
      g.fillStyle(0x8a8296).fillRect(left, top + 4, width, 2);
      g.fillStyle(0x8a8296).fillRect(left + 4, top + 6, 3, height - 6);
      g.fillStyle(0x8a8296).fillRect(right - 36, top + 6, 32, height - 6);
      g.fillStyle(0x6a6276).fillRect(right - 34, top + 16, 28, 1).fillRect(right - 34, top + 26, 28, 1);
      break;
    }
    case 'piso':
      break;
  }
}
