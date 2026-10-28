// Avisa cuando el juego pasa a segundo plano o regresa: es el momento de guardar
// (y, en la fase 3, de calcular las ganancias offline).
import { App } from '@capacitor/app';
import { isNative } from './platform';

export interface LifecycleHandlers {
  onBackground(): void;
  onForeground(): void;
}

export function watchLifecycle(handlers: LifecycleHandlers): void {
  if (isNative) {
    void App.addListener('pause', handlers.onBackground);
    void App.addListener('resume', handlers.onForeground);
    return;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handlers.onBackground();
    else handlers.onForeground();
  });
  // En móviles, cerrar la pestaña no siempre dispara visibilitychange.
  window.addEventListener('pagehide', handlers.onBackground);
}
