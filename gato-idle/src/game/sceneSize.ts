// Tamaño de la escena. La escala es un múltiplo ENTERO de píxeles del dispositivo, para que el
// pixel art se vea nítido (sin píxeles de distinto tamaño). El área de juego mide 180 px de ancho;
// el canvas crece a lo ancho y a lo alto para llenar el espacio sin dejar franjas, y la cámara
// centra el área de juego (ver MainScene).
export const SCENE_WIDTH = 180;
export const MAX_WIDTH = 300;
export const MIN_HEIGHT = 160;
export const MAX_HEIGHT = 300;
/** Alto del piso, en píxeles virtuales. */
export const FLOOR_H = 30;

export interface SceneSize {
  /** Cuántos píxeles del dispositivo mide cada píxel virtual. */
  pixelScale: number;
  /** Tamaño virtual del canvas. */
  width: number;
  height: number;
  /** Zoom en píxeles CSS que se le pasa a Phaser. */
  zoom: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function computeSceneSize(cssWidth: number, cssHeight: number, dpr: number): SceneSize {
  const deviceW = cssWidth * dpr;
  const deviceH = cssHeight * dpr;
  const pixelScale = Math.max(1, Math.floor(Math.min(deviceW / SCENE_WIDTH, deviceH / MIN_HEIGHT)));
  return {
    pixelScale,
    width: clamp(Math.floor(deviceW / pixelScale), SCENE_WIDTH, MAX_WIDTH),
    height: clamp(Math.floor(deviceH / pixelScale), MIN_HEIGHT, MAX_HEIGHT),
    zoom: pixelScale / dpr,
  };
}
