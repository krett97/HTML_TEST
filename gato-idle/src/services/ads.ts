// Anuncios recompensados detrás de una interfaz común. En la app de Android (Capacitor) son de
// AdMob (AdMobAds); en el navegador y en el APK de prueba, una pantalla falsa que da la recompensa
// si la ves completa (MockAds). Los IDs de AdMob vienen de VITE_ADMOB_REWARDED_ID al compilar; sin
// él se usan los IDs de prueba de Google (anuncios de prueba, nunca cobran).

import { isNative } from './platform';

export type RewardedPlacement = 'zoomies' | 'patrocinio' | 'vacaciones' | 'caja' | 'culpa_perro' | 'dinero' | 'arbol' | 'video' | 'suerte' | 'turbo' | 'jefe';

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

/** ID del bloque de anuncios recompensados de prueba de Google (siempre muestra un anuncio de prueba). */
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

/**
 * AdMob (plugin @capacitor-community/admob). Pide el consentimiento (UMP: Europa y otros lugares que
 * lo exigen), precarga un anuncio y al terminar uno precarga el siguiente. La recompensa se da solo si
 * AdMob avisa "Rewarded" antes de que se cierre el anuncio.
 */
class AdMobAds implements AdsService {
  readonly name = 'admob';
  private plugin: typeof import('@capacitor-community/admob') | null = null;
  private loaded = false;
  private showing = false;
  private readonly adId = (import.meta.env.VITE_ADMOB_REWARDED_ID as string | undefined) || TEST_REWARDED_ID;

  async init(): Promise<void> {
    try {
      this.plugin = await import('@capacitor-community/admob');
      const { AdMob, AdmobConsentStatus } = this.plugin;
      await AdMob.initialize({ initializeForTesting: this.adId === TEST_REWARDED_ID });
      const consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
      void this.preload();
    } catch {
      this.plugin = null; // Sin AdMob (p. ej. sin Google Play Services): los anuncios no se ofrecen.
    }
  }

  private async preload(): Promise<void> {
    if (!this.plugin || this.loaded) return;
    try {
      await this.plugin.AdMob.prepareRewardVideoAd({ adId: this.adId, isTesting: this.adId === TEST_REWARDED_ID });
      this.loaded = true;
    } catch {
      this.loaded = false;
    }
  }

  isReady(): boolean {
    return this.plugin !== null && !this.showing;
  }

  async showRewarded(): Promise<AdResult> {
    if (!this.plugin || this.showing) return { rewarded: false };
    const { AdMob, RewardAdPluginEvents } = this.plugin;
    if (!this.loaded) await this.preload();
    if (!this.loaded) return { rewarded: false };
    this.showing = true;
    let rewarded = false;
    const onReward = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => (rewarded = true));
    try {
      await AdMob.showRewardVideoAd();
    } catch {
      // No se pudo mostrar: sin recompensa.
    } finally {
      await onReward.remove();
      this.showing = false;
      this.loaded = false;
      void this.preload();
    }
    return { rewarded };
  }
}

export function createAds(): AdsService {
  return isNative ? new AdMobAds() : new MockAds();
}
