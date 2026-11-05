import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './ui/global.css';
import { mount } from 'svelte';
import { Game } from './app/game';
import { gameData } from './data';
import { createAds } from './services/ads';
import { AudioEngine, renderSound } from './services/audio';
import { RankingService } from './services/ranking';
import { createStore } from './services/storage';
import App from './ui/App.svelte';
import { gameContext } from './ui/context';
import { arbolAbierto } from './ui/pantalla';
import { watchBackButton } from './services/lifecycle';
import { get } from 'svelte/store';

const audio = new AudioEngine();
const ranking = new RankingService(gameData.homes.map((h) => h.id), gameData.objects.map((o) => o.id));
const game = new Game(gameData, { store: createStore(), ads: createAds(), audio, ranking });
await game.init();
game.start();

mount(App, { target: document.getElementById('app')!, context: gameContext(game) });
document.getElementById('carga')?.remove();

watchBackButton(() => {
  // Una ventana abierta (ranking, maquinita, pruebas): se cierra con su fondo o su botón.
  const backdrop = document.querySelector<HTMLElement>('.backdrop');
  if (backdrop) {
    backdrop.click();
    return true;
  }
  if (get(arbolAbierto)) {
    arbolAbierto.set(false);
    return true;
  }
  return false;
});

if (import.meta.env.DEV) {
  // Para revisar el estado desde la consola del navegador.
  Object.assign(window, { juego: game, audio, renderSound });
}
