// Vibración. El plugin de Capacitor usa el motor nativo en Android y navigator.vibrate en web;
// en PC y iPhone por navegador no hay vibración y simplemente no pasa nada.
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type HapticStrength = 'ligera' | 'media' | 'fuerte';

const STYLE: Record<HapticStrength, ImpactStyle> = {
  ligera: ImpactStyle.Light,
  media: ImpactStyle.Medium,
  fuerte: ImpactStyle.Heavy,
};

export function vibrate(strength: HapticStrength): void {
  Haptics.impact({ style: STYLE[strength] }).catch(() => {
    // Dispositivo sin vibración.
  });
}
