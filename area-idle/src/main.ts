import '@fontsource-variable/fredoka';
import './ui/global.css';
import { mount } from 'svelte';
import { Juego } from './app/juego';
import { AudioEngine } from './services/audio';
import App from './ui/App.svelte';
import { juegoContext } from './ui/context';

const audio = new AudioEngine();
const juego = new Juego(audio);
// Los números de daño se dibujan en el canvas con Fredoka: hay que tenerla cargada antes.
await document.fonts.load('700 20px "Fredoka Variable"').catch(() => undefined);
mount(App, { target: document.getElementById('app')!, context: juegoContext(juego) });
document.getElementById('carga')?.remove();
// Guarda al salir o pasar a segundo plano (de ahí se cuenta el oro mientras no juegas) y, al volver,
// cobra lo juntado. También guarda cada 20 s, por si el sistema cierra la app sin avisar.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') juego.save();
  else juego.resume();
});
setInterval(() => juego.save(), 20_000);

if (import.meta.env.DEV || __PRUEBAS__) Object.assign(window, { juego });
