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

// La misma pata con las garras afuera.
export const CLAW = [
  'kkkkkkkkk...',
  'oooooowwwkcc',
  'oooooowpwkcc',
  'kkkkkkkkk...',
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

export const SPRITES = { gato: CAT, pata: PAW, garra: CLAW, carrito: CAR, aspiradora: VACUUM };

/** Cómo luce el gato según la herramienta del objeto en la mesa. */
export interface ToolLook {
  /** Textura del brazo. */
  arm: 'pata' | 'garra';
  /** Vehículo bajo el gato, si hay. */
  vehicle: 'carrito' | 'aspiradora' | null;
  /** Cuánto sube el gato para ir sentado en el vehículo. */
  lift: number;
}

export function toolLook(toolId: string): ToolLook {
  switch (toolId) {
    case 'garras':
      return { arm: 'garra', vehicle: null, lift: 0 };
    case 'carrito':
      return { arm: 'pata', vehicle: 'carrito', lift: 6 };
    case 'aspiradora':
      return { arm: 'pata', vehicle: 'aspiradora', lift: 4 };
    default:
      return { arm: 'pata', vehicle: null, lift: 0 };
  }
}
