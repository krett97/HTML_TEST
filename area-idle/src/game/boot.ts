// Crea el juego de Phaser dentro de un elemento. El canvas mide lo que el elemento en píxeles del
// dispositivo (nítido en cualquier pantalla) y la escena ajusta la cámara para ver el campo completo.
import Phaser from 'phaser';
import type { Juego } from '../app/juego';
import { Campo } from './Campo';

export function mountScene(parent: HTMLElement, juego: Juego): () => void {
  // Hasta densidad 2: con cientos de sprites, la densidad 3 de algunos celulares dibuja 2.25 veces más
  // píxeles sin que se note la diferencia.
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = (): [number, number] => [Math.max(2, Math.round(parent.clientWidth * dpr)), Math.max(2, Math.round(parent.clientHeight * dpr))];
  const [w, h] = size();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: w,
    height: h,
    backgroundColor: '#5ec47a',
    antialias: true,
    banner: false,
    // El sonido lo maneja services/audio.ts.
    audio: { noAudio: true },
    input: { activePointers: 2 },
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr, autoRound: false },
    scene: [new Campo(juego)],
  });
  const fit = () => {
    const [nw, nh] = size();
    if (game.isBooted && (game.scale.width !== nw || game.scale.height !== nh)) game.scale.resize(nw, nh);
  };
  const observer = new ResizeObserver(fit);
  observer.observe(parent);
  return () => {
    observer.disconnect();
    game.destroy(true);
  };
}
