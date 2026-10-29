// Anuncios recompensados detrás de una interfaz común. Cada plataforma tendrá su versión:
// AdMob en Android (fase 5), H5 Games Ads o el SDK del portal en web. Por ahora solo existe la
// versión falsa, que muestra una pantalla de prueba y siempre da la recompensa si la ves completa.

export type RewardedPlacement = 'zoomies' | 'patrocinio' | 'vacaciones' | 'caja' | 'culpa_perro' | 'dinero' | 'arbol' | 'video';

export interface AdResult {
  /** true solo si el jugador vio el anuncio completo y debe recibir la recompensa. */
  rewarded: boolean;
}

export interface AdsService {
  readonly name: string;
  init(): Promise<void>;
  isReady(placement: RewardedPlacement): boolean;
  showRewarded(placement: RewardedPlacement): Promise<AdResult>;
}

class MockAds implements AdsService {
  readonly name = 'prueba';
  private showing = false;

  constructor(private readonly seconds = 3) {}

  async init() {}

  isReady() {
    return !this.showing;
  }

  showRewarded(placement: RewardedPlacement): Promise<AdResult> {
    if (this.showing) return Promise.resolve({ rewarded: false });
    this.showing = true;

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ad-mock';
      overlay.innerHTML = `
        <div class="ad-mock__box">
          <p class="ad-mock__tag">ANUNCIO DE PRUEBA</p>
          <p class="ad-mock__placement"></p>
          <p class="ad-mock__count"></p>
          <button type="button" class="ad-mock__close">Cerrar</button>
        </div>`;
      overlay.querySelector('.ad-mock__placement')!.textContent = placement;
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
        count.textContent = left > 0 ? `${left} s` : '✓ Recompensa ganada';
        close.textContent = left > 0 ? 'Cerrar sin recompensa' : 'Cerrar';
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
