// Íconos de PixelLab (src/assets/iconos/<nombre>.png) en lugar de emojis. En los textos se escriben
// como [[nombre]] ("Súbelo en [[canal]] Canal") y se cambian por el dibujo al mostrarlos.
const URLS = import.meta.glob<string>('../assets/iconos/*.png', { eager: true, query: '?url', import: 'default' });

const ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(URLS).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.png'.length), url]),
);

export function iconUrl(name: string): string | undefined {
  return ICONS[name];
}

/** Partes de un texto: cadenas sueltas y los íconos [[nombre]] que lleva. */
export type RichPart = { text: string } | { icon: string };

export function richParts(text: string): RichPart[] {
  const parts: RichPart[] = [];
  let last = 0;
  for (const match of text.matchAll(/\[\[([a-zA-Z]+)\]\]/g)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    if (iconUrl(match[1]!)) parts.push({ icon: match[1]! });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** Un ícono como <img> (para los números y avisos que se arman a mano en la escena). */
export function iconImage(name: string, className = 'icono'): HTMLImageElement | null {
  const url = iconUrl(name);
  if (!url) return null;
  const img = document.createElement('img');
  img.className = className;
  img.src = url;
  img.alt = '';
  return img;
}

/** Pone en `el` el texto con sus íconos. */
export function setRichText(el: HTMLElement, text: string): void {
  el.replaceChildren(...richParts(text).map((part) => ('icon' in part ? iconImage(part.icon)! : part.text)));
}
