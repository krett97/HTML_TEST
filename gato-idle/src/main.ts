import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './ui/global.css';
import { mount } from 'svelte';
import { Game } from './app/game';
import { gameData } from './data';
import { createAds } from './services/ads';
import { createStore } from './services/storage';
import App from './ui/App.svelte';
import { gameContext } from './ui/context';

const game = new Game(gameData, { store: createStore(), ads: createAds() });
await game.init();
game.start();

mount(App, { target: document.getElementById('app')!, context: gameContext(game) });

if (import.meta.env.DEV) {
  // Para revisar el estado desde la consola del navegador.
  (window as unknown as { juego: Game }).juego = game;
}
