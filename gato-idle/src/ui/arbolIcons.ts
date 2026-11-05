// Íconos del árbol del Canal: los de cada rama y los de cada habilidad (src/assets/iconos).
export const BRANCHES = ['manotazo', 'pandilla', 'produccion', 'viral'] as const;

export const BRANCH_ICONS: Record<string, string> = { manotazo: 'gato', pandilla: 'perro', produccion: 'claqueta', viral: 'viral' };

export const SKILL_ICONS: Record<string, string> = {
  embestida: 'carrito',
  pesas: 'pesas',
  garrasLargas: 'esmalte',
  pandilla: 'huellas',
  croquetas: 'croquetas',
  veterinario: 'estetoscopio',
  recolectora: 'aspiradora',
  express: 'laboratorio',
  patrocinador: 'apreton',
  clickbait: 'susto',
  miniaturas: 'miniatura',
  hashtags: 'hashtag',
};
