// El controlador llega a todos los componentes por contexto (sin pasarlo de mano en mano).
import { getContext } from 'svelte';
import type { Juego } from '../app/juego';

const KEY = Symbol('juego');

export const juegoContext = (juego: Juego) => new Map([[KEY, juego]]);
export const useJuego = (): Juego => getContext<Juego>(KEY);
