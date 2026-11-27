// Las estadísticas de una partida, calculadas de los niveles de los talentos.
import { AUTOAPUNTAR, BASE, INACTIVO, ORO_TALENTOS, type DamageType, type TalentId } from './datos';
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
  /** El caballero: cuánto pega, cada cuánto, a cuántos, su alcance, su vida, qué tan rápido camina y en cuánto vuelve si cae. */
  caballero: { activo: boolean; danio: number; intervalo: number; objetivos: number; alcance: number; vida: number; velocidad: number; regreso: number };
  /** El sacerdote: su columna de luz (daño, cada cuánto, radio) y sus curas (cada cuánto y qué parte de la vida del caballero y de la muralla). */
  sacerdote: { activo: boolean; danio: number; intervalo: number; radio: number; cadaCura: number; curaCaballero: number; curaMuro: number };
  /** La bruja: sus rayos de oscuridad (daño, cada cuánto, cuántos, qué tan anchos) y su maldición (más daño de todo, por cuánto tiempo). */
  bruja: { activo: boolean; danio: number; intervalo: number; rayos: number; ancho: number; maldicion: number; dura: number };
  /** De qué elemento es tu círculo (físico, si no lo has cambiado). */
  elemento: DamageType;
}

const lv = (levels: Levels, id: TalentId) => levels[id] ?? 0;

/** Las estadísticas: el árbol (`levels`), si se da, el equipo de la Herrería (multiplica encima) y el elemento de tu círculo. */
export function computeStats(levels: Levels, equipo: EquipoNiveles = {}, elemento: DamageType = 'fisico'): Stats {
  const eq = bonosEquipo(equipo);
  const danio = lv(levels, 'danio');
  const slimes = lv(levels, 'slimes');
  // Daño: +1 por nivel y se duplica cada 10 niveles. El mago, el fuego y los arqueros pegan en proporción.
  // Poder ancestral (Reliquia): +10 % a todo el daño por nivel.
  // Mando (el caballero, el líder): +5 % a todo el daño por nivel (solo si tienes al caballero).
  const mando = lv(levels, 'caballero') > 0 ? 1 + 0.05 * lv(levels, 'mando') : 1;
  const golpe = (BASE.danio + danio) * Math.pow(2, Math.floor(danio / 10)) * (1 + 0.1 * lv(levels, 'poder')) * eq.danio * mando;
  const area = (1 + 0.1 * lv(levels, 'magoArea')) * eq.magoArea;
  return {
    danio: golpe,
    radio: BASE.radio * (1 + 0.1 * lv(levels, 'radio')),
    intervalo: BASE.intervalo * Math.pow(0.9, lv(levels, 'cadencia')),
    duracion: BASE.duracion + 2 * lv(levels, 'tiempo'),
    ritmo: BASE.ritmo * Math.pow(1.2, slimes),
    oroMult: (1 + ORO_TALENTOS.oro * lv(levels, 'oro')) * eq.oro,
    premioMult: 1 + ORO_TALENTOS.botin * lv(levels, 'botin'),
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
    caballero: {
      activo: lv(levels, 'caballero') > 0,
      danio: golpe * BASE.caballero.danio * (1 + 0.5 * lv(levels, 'espada')),
      intervalo: BASE.caballero.intervalo * Math.pow(0.9, lv(levels, 'tajo')),
      objetivos: BASE.caballero.objetivos + lv(levels, 'barrido'),
      alcance: BASE.caballero.alcance + 2 * lv(levels, 'barrido'),
      // Su vida crece con la Coraza y con la de la muralla (Muralla reforzada y el equipo de la base).
      vida: BASE.caballero.vida * (1 + 0.4 * lv(levels, 'coraza')) * (1 + 0.1 * lv(levels, 'muralla')) * eq.muroVida,
      velocidad: BASE.caballero.velocidad,
      regreso: BASE.caballero.regreso * Math.pow(0.85, lv(levels, 'regreso')),
    },
    sacerdote: {
      activo: lv(levels, 'sacerdote') > 0,
      danio: golpe * BASE.sacerdote.danio * (1 + 0.5 * lv(levels, 'luz')),
      intervalo: BASE.sacerdote.intervalo * Math.pow(0.9, lv(levels, 'plegaria')),
      radio: BASE.sacerdote.radio * (1 + 0.1 * lv(levels, 'halo')),
      cadaCura: BASE.sacerdote.cadaCura,
      curaCaballero: BASE.sacerdote.curaCaballero + 0.03 * lv(levels, 'sanar'),
      curaMuro: BASE.sacerdote.curaMuro + 0.004 * lv(levels, 'bendicion'),
    },
    bruja: {
      activo: lv(levels, 'bruja') > 0,
      danio: golpe * BASE.bruja.danio * (1 + 0.5 * lv(levels, 'rayoOscuro')),
      intervalo: BASE.bruja.intervalo * Math.pow(0.9, lv(levels, 'conjuro')),
      rayos: BASE.bruja.rayos + lv(levels, 'rayos'),
      ancho: BASE.bruja.ancho * (1 + 0.2 * lv(levels, 'sombra')),
      maldicion: BASE.bruja.maldicion * lv(levels, 'maldicion'),
      dura: BASE.bruja.dura,
    },
    elemento,
  };
}
