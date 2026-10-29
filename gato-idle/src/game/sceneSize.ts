// Tamaño de la escena. La escala es un múltiplo ENTERO de píxeles del dispositivo, para que el
// pixel art se vea nítido (sin píxeles de distinto tamaño). El área de juego mide 180 unidades de
// ancho; el canvas crece a lo ancho y a lo alto para llenar el espacio sin dejar franjas, y la
// cámara centra el área de juego (ver MainScene).
//
// El arte (PixelLab) tiene el doble de detalle que el mundo: cada unidad del mundo mide ART píxeles
// de arte. Las posiciones y reglas siguen en unidades del mundo; la cámara amplía ×ART.
export const ART = 2;
export const SCENE_WIDTH = 180;
export const MAX_WIDTH = 300;
export const MIN_HEIGHT = 160;
export const MAX_HEIGHT = 300;
/** Alto del piso, en unidades del mundo. */
export const FLOOR_H = 30;

export interface SceneSize {
  /** Cuántos píxeles del dispositivo mide cada píxel de arte. */
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
  const pixelScale = Math.max(1, Math.floor(Math.min(deviceW / (SCENE_WIDTH * ART), deviceH / (MIN_HEIGHT * ART))));
  const unit = pixelScale * ART;
  return {
    pixelScale,
    width: clamp(Math.floor(deviceW / unit), SCENE_WIDTH, MAX_WIDTH),
    height: clamp(Math.floor(deviceH / unit), MIN_HEIGHT, MAX_HEIGHT),
    zoom: pixelScale / dpr,
  };
}
