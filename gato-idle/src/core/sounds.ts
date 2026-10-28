// Catálogo de sonidos que pueden usar los datos (objects.json, allies.json). Aquí solo están los
// nombres, para validar los JSON; cómo suena cada uno está en services/audio.ts.

/** Al recibir un golpe o un rasguño. */
export const HIT_SOUNDS = ['tintineo', 'ceramica', 'plastico', 'rasguno', 'rechinido', 'madera', 'metal'] as const;

/** Al romperse. */
export const BREAK_SOUNDS = [
  'cristal',
  'ceramica-rota',
  'plastico-roto',
  'chispazo',
  'desgarro',
  'resorte',
  'tele',
  'madera-rota',
  'metal-cae',
  'ding',
  'motor',
] as const;

/** Voces de los aliados y sonidos de la interfaz. */
export const OTHER_SOUNDS = [
  'miau',
  'guau',
  'pio',
  'chillido',
  'chirrido',
  'graznido',
  'balido',
  'compra',
  'herramienta',
  'objeto-nuevo',
  'descubrimiento',
] as const;

export type HitSound = (typeof HIT_SOUNDS)[number];
export type BreakSound = (typeof BREAK_SOUNDS)[number];
export type OtherSound = (typeof OTHER_SOUNDS)[number];
export type SoundId = HitSound | BreakSound | OtherSound;

export const ALL_SOUNDS: readonly SoundId[] = [...HIT_SOUNDS, ...BREAK_SOUNDS, ...OTHER_SOUNDS];

/** Cómo suena un objeto: un sonido al golpearlo, otro al romperse y su tono (1 = normal, 2 = una octava arriba). */
export interface ObjectSound {
  golpe: HitSound;
  rotura: BreakSound;
  tono: number;
}
