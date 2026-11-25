// Las estadísticas de una partida, calculadas de los niveles de los talentos.
import { BASE, type TalentId } from './datos';

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
  /** Enemigos al empezar, cuántos aparecen por segundo y cuántos puede haber a la vez. */
  inicial: number;
  aparicion: number;
  maximo: number;
  /** Multiplica el oro de cada enemigo. */
  oroMult: number;
  /** Fracción de los que aparecen que son azules (0 si no se han abierto). */
  azules: number;
  /** El mago: un rectángulo de `ancho` × `alto` cada `intervalo` s. */
  mago: { activo: boolean; intervalo: number; ancho: number; alto: number; danio: number };
  /** El suelo en llamas que dejan los rectángulos del mago. */
  fuego: { activo: boolean; duracion: number; dps: number };
  /** Arqueros: cuántos, cada cuánto tiran, a cuántos objetivos a la vez y cuánto pega cada flecha. */
  arqueros: { cantidad: number; intervalo: number; objetivos: number; danio: number };
}

const lv = (levels: Levels, id: TalentId) => levels[id] ?? 0;

export function computeStats(levels: Levels): Stats {
  const danio = lv(levels, 'danio');
  const slimes = lv(levels, 'slimes');
  // Daño: +1 por nivel y se duplica cada 10 niveles. El mago, el fuego y los arqueros pegan en proporción.
  const golpe = (BASE.danio + danio) * Math.pow(2, Math.floor(danio / 10));
  const area = 1 + 0.1 * lv(levels, 'magoArea');
  return {
    danio: golpe,
    radio: BASE.radio * (1 + 0.1 * lv(levels, 'radio')),
    intervalo: BASE.intervalo * Math.pow(0.9, lv(levels, 'cadencia')),
    duracion: BASE.duracion + 2 * lv(levels, 'tiempo'),
    inicial: BASE.inicial + 10 * slimes,
    aparicion: BASE.aparicion * Math.pow(1.3, slimes),
    maximo: BASE.maximo + 40 * slimes,
    oroMult: 1 + 0.3 * lv(levels, 'oro'),
    azules: lv(levels, 'azules') > 0 ? 0.3 : 0,
    mago: {
      activo: lv(levels, 'mago') > 0,
      intervalo: BASE.mago.intervalo * Math.pow(0.88, lv(levels, 'magoRapido')),
      ancho: BASE.mago.ancho * area,
      alto: BASE.mago.alto * area,
      danio: golpe * BASE.mago.danio * (1 + 0.5 * lv(levels, 'magoDanio')),
    },
    fuego: {
      activo: lv(levels, 'mago') > 0 && lv(levels, 'fuego') > 0,
      duracion: BASE.fuego.duracion + 0.3 * lv(levels, 'fuegoFuerte'),
      dps: golpe * BASE.fuego.dps * (1 + 0.4 * lv(levels, 'fuegoFuerte')),
    },
    arqueros: {
      cantidad: lv(levels, 'arqueros') > 0 ? 1 + lv(levels, 'masArqueros') : 0,
      intervalo: BASE.arqueros.intervalo * Math.pow(0.88, lv(levels, 'arcoRapido')),
      objetivos: BASE.arqueros.objetivos + lv(levels, 'multiflecha'),
      danio: golpe * BASE.arqueros.danio * (1 + 0.5 * lv(levels, 'arcoDanio')),
    },
  };
}
