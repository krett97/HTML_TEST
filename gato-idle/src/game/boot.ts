// Crea el juego de Phaser dentro de un elemento y lo mantiene a escala entera (ver sceneSize.ts).
import Phaser from 'phaser';
import type { Game } from '../app/game';
import { MainScene } from './MainScene';
import { ART, computeSceneSize, FLOOR_H } from './sceneSize';

export function mountScene(parent: HTMLElement, controller: Game): () => void {
  const measure = () => computeSceneSize(parent.clientWidth, parent.clientHeight, window.devicePixelRatio || 1);
  const initial = measure();

  const phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: initial.width * ART,
    height: initial.height * ART,
    pixelArt: true,
    backgroundColor: '#3b2a4d',
    banner: false,
    input: { activePointers: 3 },
    // El sonido lo maneja services/audio.ts.
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE, zoom: initial.zoom, autoRound: false },
    scene: [new MainScene(controller)],
  });

  // El contenedor pinta el piso a los lados del canvas, a la misma altura.
  const paintFloor = (zoom: number) => parent.style.setProperty('--piso', `${FLOOR_H * ART * zoom}px`);
  paintFloor(initial.zoom);

  const fit = () => {
    const size = measure();
    paintFloor(size.zoom);
    if (!phaser.isBooted) return;
    if (phaser.scale.width !== size.width * ART || phaser.scale.height !== size.height * ART) {
      phaser.scale.resize(size.width * ART, size.height * ART);
    }
    if (phaser.scale.zoom !== size.zoom) phaser.scale.setZoom(size.zoom);
  };
  phaser.events.once(Phaser.Core.Events.READY, fit);
  const observer = new ResizeObserver(fit);
  observer.observe(parent);

  return () => {
    observer.disconnect();
    phaser.destroy(true);
  };
}
