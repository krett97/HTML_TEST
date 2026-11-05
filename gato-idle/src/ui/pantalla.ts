// Pantallas que se abren encima de la escena y el panel (las pestañas de abajo se quedan).
import { writable } from 'svelte/store';

/** El árbol del Canal en pantalla completa. Tocar una pestaña o "Volver" lo cierra. */
export const arbolAbierto = writable(false);
