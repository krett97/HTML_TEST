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
  r: '#e5534b', // corbata
  R: '#a83a34', // rojo oscuro
  y: '#ffd36e', // faro
  g: '#8a8a9a', // rin
  s: '#4a4a5a', // gris oscuro (dueño)
  S: '#6a6a7a', // gris medio
  G: '#5ec4a8', // verde agua
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
  j: '#34303f', // saco negro
  J: '#5a5470', // solapa del saco
  h: '#f2c29b', // piel del dueño
  H: '#3a2a20', // pelo del dueño
  z: '#3a6298', // pantalón del dueño
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

// Saco de jefe (mejora de aliados): el mismo gato con saco negro de la cintura para arriba, solapa,
// camisa blanca (su pecho) y corbata roja.
export const CAT_SUIT = [
  '...........k....k...',
  '..........kok..kok..',
  '..........koooooook.',
  '..........kooooeook.',
  '..........koooowwwp.',
  '..........koooowwwk.',
  '...........kooowwk..',
  '.....kkkkkkjjJwrk...',
  '....kooddjjjjJwrwk..',
  '...kooooojjjjjJwrk..',
  'k..kooddojjjjjjJrk..',
  'k.kooooodjjjjjjjJwk.',
  'kokooddoojjjjjjjJwk.',
  'kokoooooojjjjjjJwk..',
  'kkkoooookooooowwk...',
  '...kwwkkkkkkkwwk....',
];

// Sombrero ridículo (mejora de daño crítico). Dibujo provisional (chistera morada); el arte es un sombrero de copa negro de mago.
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

// El dueño (influencer), de perfil hacia el gato, con el celular grabando. Se dibuja al doble.
export const OWNER = [
  '.....kkkk...',
  '....kHHHHk..',
  '...kHHHHHHk.',
  '...khhhhhHk.',
  '...kehhhhhk.',
  '...khhhhhk..',
  '...kphhhhk..',
  '....khhhk...',
  '...krrrrrk..',
  'kkkkrrrrrrk.',
  'knGkhrrrrrrk',
  'knGkhrrrrrrk',
  'kkkk.krrrrrk',
  '.....krrrrrk',
  '.....krrrrrk',
  '.....kzzzzzk',
  '.....kzzzzzk',
  '.....kzzkzzk',
  '.....kzzkzzk',
  '.....kzzkzzk',
  '.....kzzkzzk',
  '....kkkkkkkk',
];

export const SPRITES = {
  gato: CAT,
  gato_saco: CAT_SUIT,
  // Cuadro del manotazo (con garras y/o saco). Provisional: el mismo gato sentado.
  gato_golpe: CAT,
  gato_garra_golpe: CAT,
  gato_saco_golpe: CAT_SUIT,
  gato_saco_garra_golpe: CAT_SUIT,
  sombrero: HAT,
  duenio: OWNER,
  aliado_gatito: KITTEN,
  aliado_gatito_golpe: KITTEN,
  aliado_perro: DOG,
  aliado_perico: PARROT,
  aliado_mapache: RACCOON,
  aliado_raton: MOUSE,
  aliado_cuervo: CROW,
  aliado_cabra: GOAT,
};
