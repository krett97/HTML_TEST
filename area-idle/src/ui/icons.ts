const URLS = import.meta.glob<string>('../assets/arte/iconos/*.png', { eager: true, query: '?url', import: 'default' });
const BY_NAME = Object.fromEntries(Object.entries(URLS).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url]));

export function iconUrl(name: string): string {
  return BY_NAME[name] ?? '';
}

const ARTE = import.meta.glob<string>('../assets/arte/*.png', { eager: true, query: '?url', import: 'default' });
const ARTE_BY_NAME = Object.fromEntries(Object.entries(ARTE).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url]));

/** Arte de escena (slimes, mago, arquero…) para usarlo en la interfaz. */
export function artUrl(name: string): string {
  return ARTE_BY_NAME[name] ?? '';
}
