// El canal del dueño. A media partida el dueño cacha al gato y empieza a grabar; "subir el video"
// es el reinicio: la partida vuelve al primer objeto de la casa actual (el vaso, o el de la casa
// a la que ya se mudó), y el video deja seguidores (bono permanente de dinero) y visualizaciones.
// Los dos son totales que solo crecen y desbloquean las Habilidades y la mudanza.
import { allyUnlocked } from './allies';
import type { GameData } from './data';
import { currentObject, objectIndex } from './economy';
import { runStart } from './mudanza';
import { num, ZERO, type Decimal } from './num';
import { skillAmount, STARTING_GANG } from './skills';
import type { GameState, VideoRecord } from './state';
import { hasUnlock } from './unlocks';

/** Cuántas plantillas de título hay en los textos (canal.titulos.0 … N-1). */
export const TITLE_TEMPLATES = 6;
/** Cuántos videos se guardan en el historial. */
export const MAX_VIDEOS = 20;

/**
 * Seguidores que daría un video con lo ganado en la partida: ⌊(dinero / escala)^exponente⌋. Con
 * raíz cúbica, una partida que gana mil veces más da diez veces más seguidores (no treinta):
 * así la casa, que paga muchísimo más, no dispara el bono.
 */
export function followersFor(dineroPartida: Decimal, data: GameData): number {
  const { escalaSeguidores, exponenteSeguidores } = data.balance.canal;
  return Math.floor(dineroPartida.div(escalaSeguidores).pow(exponenteSeguidores).toNumber() + 1e-6);
}

/** El bono permanente de los seguidores: ×(1 + bono × seguidores) al dinero. */
export function followerMultiplier(state: GameState, data: GameData): number {
  return 1 + state.canal.seguidores * data.balance.canal.bonoPorSeguidor;
}

/** Un canal con más seguidores consigue más visualizaciones: ×(1 + vistasPorSeguidor × seguidores). */
export function viewsBoost(state: GameState, data: GameData): number {
  return 1 + state.canal.seguidores * data.balance.canal.vistasPorSeguidor;
}

export interface VideoPreview {
  seguidores: number;
  visualizaciones: Decimal;
  /** Ya se puede subir (se llegó lo bastante lejos). */
  listo: boolean;
}

export function videoPreview(state: GameState, data: GameData): VideoPreview {
  const seguidores = followersFor(state.dineroPartida, data);
  const minimo = data.objects.findIndex((o) => o.id === data.balance.canal.objetoMinimo);
  return {
    seguidores,
    visualizaciones: num(state.stats.vistasVideo * data.balance.canal.visualizacionesPorVista * viewsBoost(state, data)).floor(),
    listo: hasUnlock(state, 'canal') && objectIndex(state, data) >= minimo && seguidores > 0,
  };
}

/**
 * Sube el video: cobra seguidores y visualizaciones (×multViral si se hace viral) y reinicia la
 * partida. Se conservan descubrimientos, investigaciones, el canal, las habilidades y los ajustes.
 */
export function uploadVideo(state: GameState, data: GameData, now: number, rng: () => number = Math.random): VideoRecord | null {
  const preview = videoPreview(state, data);
  if (!preview.listo) return null;
  const { multViral, probabilidadViral } = data.balance.canal;
  const viral = rng() < probabilidadViral;
  const mult = viral ? multViral : 1;
  const video: VideoRecord = {
    plantilla: Math.floor(rng() * TITLE_TEMPLATES),
    objeto: currentObject(state, data).id,
    roturas: state.stats.roturasPartida,
    seguidores: preview.seguidores * mult,
    visualizaciones: preview.visualizaciones.mul(mult),
    viral,
    fecha: now,
  };
  state.canal.seguidores += video.seguidores;
  state.canal.visualizaciones = state.canal.visualizaciones.add(video.visualizaciones);
  state.canal.videos = [video, ...state.canal.videos].slice(0, MAX_VIDEOS);
  restartRun(state, data);
  return video;
}

/** La partida vuelve al primer objeto de la casa actual (en la casa, con el gato ya entrenado). */
function restartRun(state: GameState, data: GameData): void {
  const start = runStart(state, data);
  state.dinero = ZERO;
  state.dineroPartida = ZERO;
  state.nivelFuerza = start.nivelFuerza;
  state.nivelValor = start.nivelValor;
  state.nivelCritico = 0;
  state.nivelDanioCritico = 0;
  state.nivelSaco = 0;
  state.danioObjeto = ZERO;
  state.stats.roturasPartida = 0;
  state.stats.vistasVideo = 0;
  // Habilidad "pandilla": los primeros aliados ya vienen entrenados.
  const levels = skillAmount(state, data, 'pandilla');
  state.aliados = levels > 0
    ? STARTING_GANG.filter((id) => allyUnlocked(state, data, data.allies.find((a) => a.id === id)!)).map((id) => ({ id, nivel: levels }))
    : [];
}

/** Quita videos rotos de un guardado (el resto lo corrige mergeDefaults). */
export function normalizeCanal(state: GameState): void {
  const canal = state.canal;
  canal.seguidores = Math.max(0, Math.floor(canal.seguidores));
  canal.videos = canal.videos.filter((v) => v && typeof v.objeto === 'string' && typeof v.seguidores === 'number').slice(0, MAX_VIDEOS);
}
