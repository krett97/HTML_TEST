import { Capacitor } from '@capacitor/core';

export type PlatformName = 'android' | 'ios' | 'web';

export const platform: PlatformName = Capacitor.getPlatform() as PlatformName;
export const isNative = Capacitor.isNativePlatform();
