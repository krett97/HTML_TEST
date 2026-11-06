// Tamaño de la escena. La escala es un múltiplo ENTERO de píxeles del dispositivo, para que el
// pixel art se vea nítido (sin píxeles de distinto tamaño). El mundo mide 180 unidades de ancho,
// pero la cámara está más cerca: en un celular se ven unas 120–145 unidades y la cámara sigue al
// gato y al objeto (ver MainScene.updateCamera). En pantallas anchas se ve el mundo completo y más
// cuarto a los lados.
//
// El arte (PixelLab) tiene más detalle que el mundo: cada unidad del mundo mide ART píxeles de arte
// (4: alta definición). Las posiciones y reglas siguen en unidades del mundo; la cámara amplía ×ART.
export const ART = 4;
/** Ancho del mundo (el área de juego: la barra, la mesa…). */
export const SCENE_WIDTH = 180;
/** Lo menos que se ve a lo ancho: decide qué tan cerca está la cámara. */
export const VIEW_MIN_WIDTH = 120;
/** En pantallas anchas (tableta, escritorio) se ve más pared a los lados en vez de franjas lisas. */
export const MAX_WIDTH = 480;
export const MIN_HEIGHT = 120;
export const MAX_HEIGHT = 300;
/** Alto del piso, en unidades del mundo. */
export const FLOOR_H = 30;

export interface SceneSize {
  /** Cuántos píxeles del dispositivo mide cada píxel de arte (entero a partir de 2; entre 1 y 2 puede ser fracción). */
  pixelScale: number;
  /** Tamaño visible del mundo (el canvas mide ART veces esto). */
  width: number;
  height: number;
  /** Píxeles CSS por píxel de arte: el zoom que se le pasa a Phaser. */
  zoom: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function computeSceneSize(cssWidth: number, cssHeight: number, dpr: number): SceneSize {
  const deviceW = cssWidth * dpr;
  const deviceH = cssHeight * dpr;
  const raw = Math.min(deviceW / (VIEW_MIN_WIDTH * ART), deviceH / (MIN_HEIGHT * ART));
  // Con el arte a 4 píxeles por unidad, un píxel de arte es diminuto: abajo de 2 se acepta una fracción
  // (píxeles de 1 y 2 del dispositivo, que no se notan) antes que quedarse lejos; en ventanas chicas de
  // densidad 1 incluso se encoge (hasta la mitad) para que quepa el cuarto.
  const pixelScale = raw >= 2 ? Math.floor(raw) : Math.max(0.5, raw);
  const unit = pixelScale * ART;
  return {
    pixelScale,
    width: clamp(Math.floor(deviceW / unit), VIEW_MIN_WIDTH, MAX_WIDTH),
    height: clamp(Math.floor(deviceH / unit), MIN_HEIGHT, MAX_HEIGHT),
    zoom: pixelScale / dpr,
  };
}

/**
 * Dónde empieza lo que se ve (scroll de la cámara) para que `focusX` quede al centro sin salirse
 * del mundo. Si se ve más que el mundo, el mundo queda centrado (scroll negativo: más cuarto a los lados).
 */
export function cameraScroll(focusX: number, viewWidth: number): number {
  if (viewWidth >= SCENE_WIDTH) return -Math.floor((viewWidth - SCENE_WIDTH) / 2);
  return clamp(Math.round(focusX - viewWidth / 2), 0, SCENE_WIDTH - viewWidth);
}
