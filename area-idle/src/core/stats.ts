// Las estadísticas de una partida, calculadas de los niveles de los talentos.
import { AUTOAPUNTAR, BASE, INACTIVO, type TalentId } from './datos';
import { bonosEquipo, type EquipoNiveles } from './equipo';

export type Levels = Partial<Record<TalentId, number>>;

export interface Stats {
  /** Daño de cada disparo a cada enemigo dentro del círculo. */
  danio: number;
  /** Radio del círculo, en unidades del campo. */
  radio: number;
  /** Segundos entre disparos. */
  intervalo: number;
  /** Segundos que dura la partida. */
  duracion: number;
  /** Multiplica la rapidez con que llegan los slimes del nivel. */
  ritmo: number;
  /** "Ganancia de oro" multiplica todo el oro (slimes, premio y lo que se junta sin jugar); "Botín", el premio. */
  oroMult: number;
  premioMult: number;
  /** Oro mientras no juegas: qué parte de lo que se gana jugando y hasta cuántas horas. */
  inactivo: { eficiencia: number; horas: number };
  /** El mago: una explosión cuadrada de `lado` × `lado` cada `intervalo` s. */
  mago: { activo: boolean; intervalo: number; lado: number; danio: number };
  /** El suelo en llamas que dejan las explosiones del mago. */
  fuego: { activo: boolean; duracion: number; dps: number };
  /** Vida de la muralla y cuánto se repara sola una vez por nivel (Albañil; 0: no se repara). */
  muro: { vida: number; reparar: number };
  /** Golpes críticos de tus flechas: probabilidad y cuánto multiplican. */
  critico: { prob: number; mult: number };
  /** Autoapuntado: qué tan rápido se mueve solo tu círculo (0: no lo tienes). */
  autoapuntar: { velocidad: number };
  /** Arqueros: cuántos, cada cuánto tiran, a cuántos objetivos a la vez y cuánto pega cada flecha. */
  arqueros: { cantidad: number; intervalo: number; objetivos: number; danio: number };
}

const lv = (levels: Levels, id: TalentId) => levels[id] ?? 0;

/** Las estadísticas: el árbol (`levels`) y, si se da, el equipo de la Herrería (multiplica encima). */
export function computeStats(levels: Levels, equipo: EquipoNiveles = {}): Stats {
  const eq = bonosEquipo(equipo);
  const danio = lv(levels, 'danio');
  const slimes = lv(levels, 'slimes');
  // Daño: +1 por nivel y se duplica cada 10 niveles. El mago, el fuego y los arqueros pegan en proporción.
  // Poder ancestral (Reliquia): +10 % a todo el daño por nivel.
  const golpe = (BASE.danio + danio) * Math.pow(2, Math.floor(danio / 10)) * (1 + 0.1 * lv(levels, 'poder')) * eq.danio;
  const area = (1 + 0.1 * lv(levels, 'magoArea')) * eq.magoArea;
  return {
    danio: golpe,
    radio: BASE.radio * (1 + 0.1 * lv(levels, 'radio')),
    intervalo: BASE.intervalo * Math.pow(0.9, lv(levels, 'cadencia')),
    duracion: BASE.duracion + 2 * lv(levels, 'tiempo'),
    ritmo: BASE.ritmo * Math.pow(1.2, slimes),
    oroMult: (1 + 0.3 * lv(levels, 'oro')) * eq.oro,
    premioMult: 1 + 0.25 * lv(levels, 'botin'),
    inactivo: {
      eficiencia: INACTIVO.eficiencia + INACTIVO.porNivel * lv(levels, 'inactivo'),
      horas: INACTIVO.horas + INACTIVO.horasPorNivel * lv(levels, 'bolsa'),
    },
    mago: {
      activo: lv(levels, 'mago') > 0,
      intervalo: BASE.mago.intervalo * Math.pow(0.88, lv(levels, 'magoRapido')) * eq.magoIntervalo,
      lado: BASE.mago.lado * area,
      danio: golpe * BASE.mago.danio * (1 + 0.5 * lv(levels, 'magoDanio')) * eq.magoDanio,
    },
    fuego: {
      activo: lv(levels, 'mago') > 0 && lv(levels, 'fuego') > 0,
      duracion: BASE.fuego.duracion + 0.3 * lv(levels, 'fuegoFuerte'),
      dps: golpe * BASE.fuego.dps * (1 + 0.4 * lv(levels, 'fuegoFuerte')),
    },
    muro: { vida: BASE.muro.vida * (1 + 0.5 * lv(levels, 'muralla')) * eq.muroVida, reparar: lv(levels, 'albanil') > 0 ? 0.25 + 0.15 * lv(levels, 'albanil') : 0 },
    critico: { prob: 0.05 * lv(levels, 'critico'), mult: 3 },
    autoapuntar: { velocidad: lv(levels, 'autoapuntar') > 0 ? AUTOAPUNTAR.velocidad + AUTOAPUNTAR.porNivel * (lv(levels, 'autoapuntar') - 1) : 0 },
    arqueros: {
      cantidad: lv(levels, 'arqueros') > 0 ? 1 + lv(levels, 'masArqueros') : 0,
      intervalo: BASE.arqueros.intervalo * Math.pow(0.88, lv(levels, 'arcoRapido')) * eq.arcoIntervalo,
      objetivos: BASE.arqueros.objetivos + lv(levels, 'multiflecha') + lv(levels, 'carcaj') + eq.arcoObjetivos,
      danio: golpe * BASE.arqueros.danio * (1 + 0.5 * lv(levels, 'arcoDanio')) * eq.arcoDanio,
    },
  };
}
