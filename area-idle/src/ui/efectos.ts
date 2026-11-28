// Qué cambia al subir un talento: el valor de ahora y el del siguiente nivel, para el texto
// "Daño 3 → 4" del árbol.
import { BASE, HIELO, type TalentId } from '../core/datos';
import { formatNum } from '../core/format';
import { computeStats, type Levels, type Stats } from '../core/stats';

const uno = (n: number) => (Math.round(n * 10) / 10).toString();
const VALOR: Partial<Record<TalentId, (s: Stats, l: Levels) => string>> = {
  danio: (s) => formatNum(s.danio),
  slimes: (s) => `×${uno(s.ritmo)}`,
  botin: (s) => `×${uno(s.premioMult)}`,
  inactivo: (s) => `${Math.round(s.inactivo.eficiencia * 100)}%`,
  bolsa: (s) => String(s.inactivo.horas),
  autoapuntar: (s) => String(s.autoapuntar.velocidad),
  muralla: (s) => formatNum(s.muro.vida),
  poder: (_, l) => `+${10 * (l.poder ?? 0)}%`,
  critico: (s) => `${Math.round(s.critico.prob * 100)}%`,
  carcaj: (s) => String(s.arqueros.objetivos),
  albanil: (s) => `${Math.round(s.muro.reparar * 100)}%`,
  radio: (s) => uno(s.radio),
  cadencia: (_, l) => `×${uno(Math.pow(1 / 0.9, l.cadencia ?? 0))}`,
  tiempo: (s) => String(s.duracion),
  oro: (s) => uno(s.oroMult),
  mago: (s) => uno(s.mago.intervalo),
  magoRapido: (s) => uno(s.mago.intervalo),
  magoArea: (s) => `${Math.round(s.mago.lado)}×${Math.round(s.mago.lado)}`,
  magoDanio: (s) => formatNum(s.mago.danio),
  fuegoFuerte: (s) => formatNum(s.fuego.dps),
  masArqueros: (s) => String(s.arqueros.objetivos),
  multiflecha: (s) => String(s.arqueros.rebotes),
  arcoRapido: (_, l) => `×${uno(Math.pow(1 / BASE.arqueros.rapido, l.arcoRapido ?? 0))}`,
  arcoDanio: (s) => formatNum(s.arqueros.danio),
  flechaHielo: (_, l) => `${Math.round(100 * ((l.flechaHielo ?? 0) > 0 ? HIELO.lento + HIELO.porNivel * ((l.flechaHielo ?? 0) - 1) : 0))}%`,
  espada: (s) => formatNum(s.caballero.danio),
  tajo: (s) => uno(s.caballero.intervalo),
  coraza: (s) => formatNum(s.caballero.vida),
  barrido: (s) => String(s.caballero.objetivos),
  regreso: (s) => uno(s.caballero.regreso),
  mando: (_, l) => `+${5 * ((l.caballero ?? 0) > 0 ? (l.mando ?? 0) : 0)}%`,
  luz: (s) => formatNum(s.sacerdote.danio),
  rayoOscuro: (s) => formatNum(s.bruja.danio),
  conjuro: (s) => uno(s.bruja.intervalo),
  rayos: (s) => String(s.bruja.rayos),
  maldicion: (s) => `+${Math.round(s.bruja.maldicion * 100)}%`,
  sombra: (s) => uno(s.bruja.ancho),
  plegaria: (s) => uno(s.sacerdote.intervalo),
  sanar: (s) => `${Math.round(s.sacerdote.curaCaballero * 100)}%`,
  halo: (s) => uno(s.sacerdote.radio),
  bendicion: (s) => `${(Math.round(s.sacerdote.curaMuro * 1000) / 10).toString()}%`,
};

export function effectValues(id: TalentId, levels: Levels): { a: string; b: string } {
  const f = VALOR[id];
  if (!f) return { a: '', b: '' };
  const sig = { ...levels, [id]: (levels[id] ?? 0) + 1 };
  return { a: f(computeStats(levels), levels), b: f(computeStats(sig), sig) };
}
