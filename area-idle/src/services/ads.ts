// Anuncios recompensados detrás de una interfaz común (tomado del juego del gato). Por ahora solo existe
// el anuncio de prueba: una pantalla con cuenta regresiva que da la recompensa si la ves completa (en el
// navegador y en el APK de prueba). Cuando exista la app con Capacitor, aquí entra AdMob (con los IDs
// fuera del repo, en variables de entorno) sin tocar el resto del juego.

export type RewardedPlacement = 'oro' | 'doble' | 'elemento';

export interface AdResult {
  /** true solo si el jugador vio el anuncio completo y debe recibir la recompensa. */
  rewarded: boolean;
}

export interface AdsService {
  readonly name: string;
  isReady(placement: RewardedPlacement): boolean;
  showRewarded(placement: RewardedPlacement): Promise<AdResult>;
}

const TEXTO: Record<RewardedPlacement, string> = { oro: 'Oro', doble: 'Oro ×2', elemento: 'Cambiar elemento' };

class MockAds implements AdsService {
  readonly name = 'prueba';
  private showing = false;

  constructor(private readonly seconds = 3) {}

  isReady(): boolean {
    return !this.showing;
  }

  showRewarded(placement: RewardedPlacement): Promise<AdResult> {
    if (this.showing) return Promise.resolve({ rewarded: false });
    this.showing = true;
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ad-mock';
      overlay.dataset.testid = 'anuncio-prueba';
      overlay.innerHTML = `
        <div class="ad-mock__box">
          <p class="ad-mock__tag">ANUNCIO DE PRUEBA</p>
          <p class="ad-mock__placement"></p>
          <p class="ad-mock__count"></p>
          <button type="button" class="ad-mock__close" data-testid="cerrar-anuncio"></button>
        </div>`;
      overlay.querySelector('.ad-mock__placement')!.textContent = TEXTO[placement];
      const count = overlay.querySelector('.ad-mock__count')!;
      const close = overlay.querySelector<HTMLButtonElement>('.ad-mock__close')!;
      let left = this.seconds;
      const finish = (rewarded: boolean) => {
        clearInterval(timer);
        overlay.remove();
        this.showing = false;
        resolve({ rewarded });
      };
      const render = () => {
        count.textContent = left > 0 ? `${left} s` : '✓';
        close.textContent = left > 0 ? 'Cerrar sin recompensa' : 'Cobrar';
      };
      const timer = setInterval(() => {
        left -= 1;
        render();
      }, 1000);
      close.addEventListener('click', () => finish(left <= 0));
      render();
      document.body.appendChild(overlay);
    });
  }
}

export function createAds(): AdsService {
  return new MockAds();
}
