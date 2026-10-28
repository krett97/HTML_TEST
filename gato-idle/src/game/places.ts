// Escenarios: cada objeto está en un cuarto (cocina, sala, baño, recámara, cuarto de lavado) y
// sobre una superficie (barra, mesa, mueble, repisa, cama, escritorio o el piso). Arte provisional
// dibujado con rectángulos; cuando llegue el de PixelApp se cambia el dibujo y las medidas se quedan.
import type Phaser from 'phaser';
import type { PlaceId } from '../core/data';

export type Room = 'cocina' | 'sala' | 'bano' | 'recamara' | 'lavado';
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

export function placeOf(id: PlaceId): Place {
  const [room, kind] = id.split('-') as [Room, SurfaceKind];
  return { room, surface: SURFACES[kind] };
}

/** Ventana y cuadro (el perico se para en el cuadro y el cuervo en la ventana), medidos desde el piso. */
export const WINDOW_ABOVE_FLOOR = 140;
export const PICTURE_ABOVE_FLOOR = 114;

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

/** Pared, piso, ventana y cuadro del cuarto. `left`/`w` cubren todo el canvas (más ancho que el área de juego). */
export function drawRoom(g: Phaser.GameObjects.Graphics, room: Room, left: number, w: number, h: number, floorY: number): void {
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
  } else if (room === 'lavado') {
    // Repisa con detergentes.
    const y = floorY - 92;
    g.fillStyle(WOOD_DARK).fillRect(96, y, 60, 3);
    g.fillStyle(0xe5534b).fillRect(102, y - 10, 8, 10);
    g.fillStyle(0x5ec4a8).fillRect(114, y - 8, 7, 8);
    g.fillStyle(0xffd36e).fillRect(126, y - 12, 9, 12);
  }
  g.fillStyle(look.wallDark).fillRect(left, floorY - 6, w, 6); // zoclo

  // Ventana y cuadro, si caben.
  const windowY = floorY - WINDOW_ABOVE_FLOOR;
  if (windowY >= 6) {
    g.fillStyle(0xe8d8c4).fillRect(22, windowY, 48, 40);
    g.fillStyle(0x8fc7e8).fillRect(25, windowY + 3, 42, 34);
    g.fillStyle(0xe8d8c4).fillRect(45, windowY + 3, 2, 34).fillRect(25, windowY + 19, 42, 2);
    if (room === 'recamara') {
      // Cortinas.
      g.fillStyle(0xb85c7a).fillRect(19, windowY - 2, 8, 44).fillRect(65, windowY - 2, 8, 44);
    }
  }
  const pictureY = floorY - PICTURE_ABOVE_FLOOR;
  if (pictureY >= 6) {
    g.fillStyle(look.frame).fillRect(116, pictureY, 30, 22);
    g.fillStyle(look.picture).fillRect(118, pictureY + 2, 26, 18);
    if (room === 'cocina') {
      // Reloj: manecillas.
      g.fillStyle(0x2b1d2f).fillRect(130, pictureY + 5, 2, 7).fillRect(130, pictureY + 10, 6, 2);
    }
  }

  // Piso.
  g.fillStyle(look.floor).fillRect(left, floorY, w, h - floorY);
  if (room === 'cocina' || room === 'bano') {
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

/** La superficie donde está el objeto. */
export function drawSurface(g: Phaser.GameObjects.Graphics, surface: Surface, floorY: number): void {
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
      // Repisa flotante del baño, y abajo el inodoro.
      g.fillStyle(WHITE).fillRect(left, top, width, 3);
      g.fillStyle(0xb8c4d0).fillRect(left, top + 3, width, 1);
      g.fillStyle(0xb8c4d0).fillRect(left + 10, top + 4, 3, 6).fillRect(right - 14, top + 4, 3, 6);
      g.fillStyle(WHITE).fillRect(64, floorY - 30, 14, 18); // tanque
      g.fillStyle(WHITE).fillRect(60, floorY - 14, 26, 6); // taza
      g.fillStyle(0xb8c4d0).fillRect(66, floorY - 8, 14, 8); // base
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
