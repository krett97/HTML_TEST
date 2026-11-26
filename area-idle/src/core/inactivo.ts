// Oro mientras no juegas. Se abre al llegar al nivel 3 (INACTIVO.desde). Da una parte de lo que se gana
// por minuto jugando el nivel más alto ya superado (sus slimes y su premio, una partida cada 30 s), con
// "Ganancia de oro" incluida, durante el tiempo que estuviste fuera, hasta el tope de horas.
import { ENEMIES, INACTIVO, levelConfig } from './datos';
import { stats, type Meta } from './meta';

export function idleUnlocked(meta: Meta): boolean {
  return meta.nivel >= INACTIVO.desde;
}

/** Oro por minuto jugando el nivel más alto ya superado (la referencia). */
/**
 * Oro por minuto jugando: lo que de verdad ganas (promedio de tus últimas partidas). Si todavía no hay
 * partidas, una estimación con el nivel más alto superado (una partida cada 30 s).
 */
export function activeGoldPerMinute(meta: Meta): number {
  if (meta.oroMinuto > 0) return meta.oroMinuto;
  const s = stats(meta);
  const c = levelConfig(Math.max(1, meta.nivel - 1));
  const porSlime = (ENEMIES.verde.oro * (1 - c.azules) + ENEMIES.azul.oro * c.azules) * c.oro;
  const porPartida = (c.total * porSlime + c.premio * s.premioMult) * s.oroMult;
  return (porPartida * 60) / INACTIVO.segundosPorNivelJugado;
}

/** Oro por minuto mientras no juegas (0 si todavía no se abre). */
export function idleGoldPerMinute(meta: Meta): number {
  return idleUnlocked(meta) ? activeGoldPerMinute(meta) * stats(meta).inactivo.eficiencia : 0;
}

/**
 * Lo que se juntó desde la última vez que se guardó hasta `ahora`, o null si no se ha abierto, si
 * pasó menos de un minuto o si el reloj se fue para atrás. Los segundos se cortan en el tope de horas.
 */
export function idleReward(meta: Meta, ahora: number): { segundos: number; oro: number; tope: boolean } | null {
  if (!idleUnlocked(meta) || !meta.ultimaVez) return null;
  const fuera = (ahora - meta.ultimaVez) / 1000;
  if (!(fuera >= INACTIVO.minSegundos)) return null;
  const tope = stats(meta).inactivo.horas * 3600;
  const segundos = Math.min(fuera, tope);
  const oro = Math.floor((idleGoldPerMinute(meta) * segundos) / 60);
  return oro > 0 ? { segundos, oro, tope: fuera >= tope } : null;
}
