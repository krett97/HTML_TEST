// Qué cambia al subir un talento: el valor de ahora y el del siguiente nivel, para el texto
// "Daño 3 → 4" del árbol.
import type { TalentId } from '../core/datos';
import { formatNum } from '../core/format';
import { computeStats, type Levels, type Stats } from '../core/stats';

const uno = (n: number) => (Math.round(n * 10) / 10).toString();
const VALOR: Partial<Record<TalentId, (s: Stats) => string>> = {
  danio: (s) => formatNum(s.danio),
  slimes: (s) => `×${uno(s.ritmo)}`,
  botin: (s) => `×${uno(s.premioMult)}`,
  inactivo: (s) => `${Math.round(s.inactivo.eficiencia * 100)}%`,
  bolsa: (s) => String(s.inactivo.horas),
  muralla: (s) => formatNum(s.muro.vida),
  radio: (s) => uno(s.radio),
  cadencia: (s) => uno(1 / s.intervalo),
  tiempo: (s) => String(s.duracion),
  oro: (s) => uno(s.oroMult),
  mago: (s) => uno(s.mago.intervalo),
  magoRapido: (s) => uno(s.mago.intervalo),
  magoArea: (s) => `${Math.round(s.mago.lado)}×${Math.round(s.mago.lado)}`,
  magoDanio: (s) => formatNum(s.mago.danio),
  fuegoFuerte: (s) => formatNum(s.fuego.dps),
  masArqueros: (s) => String(s.arqueros.cantidad),
  multiflecha: (s) => String(s.arqueros.objetivos),
  arcoRapido: (s) => uno(1 / s.arqueros.intervalo),
  arcoDanio: (s) => formatNum(s.arqueros.danio),
};

export function effectValues(id: TalentId, levels: Levels): { a: string; b: string } {
  const f = VALOR[id];
  if (!f) return { a: '', b: '' };
  const ahora = computeStats(levels);
  const despues = computeStats({ ...levels, [id]: (levels[id] ?? 0) + 1 });
  return { a: f(ahora), b: f(despues) };
}
