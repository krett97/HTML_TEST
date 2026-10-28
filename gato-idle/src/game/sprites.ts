// Dibujos provisionales en pixel art, como mapas de caracteres (un carácter = un píxel).
// Sin Phaser, para poder probarlos. Cuando llegue el arte de PixelApp se reemplazan por PNG.

export const PALETTE: Record<string, string> = {
  k: '#2b1d2f', // contorno
  o: '#f28c28', // naranja
  d: '#c4621a', // rayas
  w: '#fff1e0', // blanco
  p: '#ff8fab', // nariz y cojinetes
  e: '#1a1020', // ojo
  c: '#e8e8f0', // garras
  r: '#e5534b', // carrito
  R: '#a83a34', // carrito, sombra
  y: '#ffd36e', // faro
  g: '#8a8a9a', // rin
  s: '#4a4a5a', // aspiradora
  S: '#6a6a7a', // aspiradora, costado
  G: '#5ec4a8', // luz de la aspiradora
  a: '#b8b0c0', // gris (gatito, mapache)
  A: '#8a8296', // gris oscuro
  b: '#a8693a', // café (perro)
  B: '#7a4a28', // café oscuro
  v: '#4caf50', // verde (perico)
  V: '#2e7d32', // verde oscuro
  n: '#26232e', // negro (cuervo)
  N: '#45405a', // ala del cuervo
  m: '#9fb3c8', // acero (garras afiladas)
  M: '#ffffff', // brillo del acero
  u: '#8e5bd1', // sombrero morado
  U: '#6a3fa3', // sombrero, sombra
};

// Gato naranja sentado, de perfil, mirando a la derecha (hacia la orilla).
export const CAT = [
  '...........k....k...',
  '..........kok..kok..',
  '..........koooooook.',
  '..........kooooeook.',
  '..........koooowwwp.',
  '..........koooowwwk.',
  '...........kooowwk..',
  '.....kkkkkkooowwk...',
  '....kooddooooowwwk..',
  '...koooooddoooowwk..',
  'k..kooddoooooooowk..',
  'k.koooooddooooooowk.',
  'kokooddoooooooooowk.',
  'kokooooooooooooowk..',
  'kkkoooookooooowwk...',
  '...kwwkkkkkkkwwk....',
];

// Brazo con la patita blanca en la punta; sale del pecho del gato en cada manotazo.
export const PAW = [
  'kkkkkkkkk.',
  'oooooowwwk',
  'oooooowpwk',
  'kkkkkkkkk.',
];

// Garras afiladas (mejora de crítico): la misma pata con garras de acero que brillan.
export const CLAW = [
  'kkkkkkkkkk.mm.',
  'oooooowwwkmMm.',
  'oooooowpwkmMMm',
  'kkkkkkkkkk.mm.',
];

// Sombrero ridículo (mejora de daño crítico): chistera morada con flor, un poco grande para el gato.
export const HAT = [
  '...kkkkk...',
  '..kuuuuUk..',
  '..kuuuuUk..',
  '..kuuuuUk..',
  '..kyypyyk..',
  '..kuuuuUk..',
  'kkkuuuuUkkk',
  'kuuuuuuuuUk',
  'kkkkkkkkkkk',
];

// Carrito a control remoto; el gato va sentado encima.
export const CAR = [
  '..kkkkkkkkkkkkkkkkkkkk..',
  '.krrrrrrrrrrrrrrrrrrrrk.',
  'krrrrrrrrrrrrrrrrrrrrryk',
  'kRRRRRRRRRRRRRRRRRRRRRRk',
  '.kkkkkkkkkkkkkkkkkkkkkk.',
  '..kkkk..........kkkk....',
  '.kkggkk........kkggkk...',
  '..kkkk..........kkkk....',
];

// Aspiradora robot vista de lado.
export const VACUUM = [
  '....kkkkkkkkkkkkkkkk....',
  '..kksssssssGsssssssskk..',
  '.kssssssssssssssssssssk.',
  'kSSSSSSSSSSSSSSSSSSSSSSk',
  'kSSSSSSSSSSSSSSSSSSSSSSk',
  '.kkkkkkkkkkkkkkkkkkkkkk.',
];

// Gatito bebé gris, mirando a la derecha.
export const KITTEN = [
  '.......k..k.',
  '......kakkak',
  '......kaaaak',
  '......kaaeak',
  '..k...kaawwp',
  '.k.kkkkaawk.',
  '.kkaaAaaawk.',
  '..kaAaaaaak.',
  '...kwkkkwk..',
];

// Perro café sentado.
export const DOG = [
  '.........kkkk...',
  '........kbbbbk..',
  '.......kBbbebbk.',
  '.......kBbbbbbkk',
  '.......kBbbwwwwk',
  '........kbbwwkk.',
  '..kkkkkkbbbbk...',
  '.kbbbbbbbbbbbk..',
  'kbkbbbbbbbbbbk..',
  '..kbwbkkkbwbk...',
  '..kkkk...kkkk...',
];

// Perico verde parado.
export const PARROT = [
  '...kkkk...',
  '..kvvvvk..',
  '.kvvvvevk.',
  '.kvvvvvkyk',
  '.kvVvvvkk.',
  'kvVVvvvk..',
  'kvVVvvvk..',
  'kvVVvrrk..',
  '.kVVvvk...',
  '..kVkk....',
  '..kk.k....',
];

// Mapache con antifaz.
export const RACCOON = [
  '........k..k..',
  '.......kak.kak',
  '.......kaaaaak',
  '.......kkwkkwk',
  '.......kaawwak',
  '..k....kaaaak.',
  '.kAk.kkaaaak..',
  '.kaAkaaaaaaak.',
  '..kAaaaaaaak..',
  '...kakkkkak...',
];

// Ratón gris.
export const MOUSE = [
  '......k.k..',
  '.....kakak.',
  '...kkaaaaek',
  '..kaaaaaaap',
  'kkaaaaaaak.',
  '...kpk.kpk.',
];

// Cuervo negro.
export const CROW = [
  '.....kkk....',
  '....knnnk...',
  '...knnwnk...',
  '...knnnnkyy.',
  '..knnnnnk...',
  '.knNNnnnk...',
  'knNNNnnnk...',
  'knNNnnnk....',
  '.kknnkk.....',
  '...k.k......',
];

// Cabra blanca con cuernos.
export const GOAT = [
  '..........gg....',
  '.........kkgk...',
  '........kwwwwk..',
  '........kwwewwk.',
  '........kwwwwwwk',
  '.........kwwwkk.',
  '..kkkkkkkwwwk...',
  '.kwwwwwwwwwwk...',
  'kwkwwwwwwwwwk...',
  '.kwwwwwwwwwwk...',
  '..kwkkkkkkwk....',
  '..kwk....kwk....',
  '..kkk....kkk....',
];

// Lentes de jefe (mejora de aliados): lentes oscuros "deal with it", de perfil, con brillo.
export const GLASSES = [
  'kkkkkkkkkk',
  '...knnnMnk',
  '....knnnk.',
];

export const SPRITES = {
  gato: CAT,
  pata: PAW,
  garra: CLAW,
  sombrero: HAT,
  lentes: GLASSES,
  carrito: CAR,
  aspiradora: VACUUM,
  aliado_gatito: KITTEN,
  aliado_perro: DOG,
  aliado_perico: PARROT,
  aliado_mapache: RACCOON,
  aliado_raton: MOUSE,
  aliado_cuervo: CROW,
  aliado_cabra: GOAT,
};

/** Cómo luce el gato según la herramienta del objeto en la mesa (las garras van aparte: son la mejora de crítico). */
export interface ToolLook {
  /** Vehículo bajo el gato, si hay. */
  vehicle: 'carrito' | 'aspiradora' | null;
  /** Cuánto sube el gato para ir sentado en el vehículo. */
  lift: number;
}

export function toolLook(toolId: string): ToolLook {
  switch (toolId) {
    case 'carrito':
      return { vehicle: 'carrito', lift: 6 };
    case 'aspiradora':
      return { vehicle: 'aspiradora', lift: 4 };
    default:
      return { vehicle: null, lift: 0 };
  }
}
