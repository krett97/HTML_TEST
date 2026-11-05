// Avisa cuando el juego pasa a segundo plano o regresa: es el momento de guardar
// (y, en la fase 3, de calcular las ganancias offline).
import { App } from '@capacitor/app';
import { isNative } from './platform';

export interface LifecycleHandlers {
  onBackground(): void;
  onForeground(): void;
}

/**
 * Botón "atrás" de Android: primero cierra lo que esté abierto (el árbol en pantalla completa, una
 * ventana); si no hay nada, manda la app al fondo en vez de cerrarla (así no se pierde nada).
 */
export function watchBackButton(closeSomething: () => boolean): void {
  if (!isNative) return;
  void App.addListener('backButton', () => {
    if (!closeSomething()) void App.minimizeApp();
  });
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
