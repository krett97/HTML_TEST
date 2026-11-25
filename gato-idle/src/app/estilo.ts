// Estilo visual del juego. "vector" (el de ahora): caricatura plana dibujada en SVG desde código
// (src/assets/vector, 8 px por unidad) y la interfaz redonda (ui/vector.css). "pixel": el arte anterior
// de PixelLab (src/assets/arte, 4 px por unidad), que se conserva para comparar. Se elige con
// ?estilo=pixel|vector en la URL o con el botón del panel de pruebas (queda en localStorage); se lee una
// vez al arrancar.
export type Estilo = 'pixel' | 'vector';

function leer(): Estilo {
  // Fuera del navegador (pruebas unitarias) manda el pixel art: sus números están a 4 px por unidad.
  if (typeof window === 'undefined') return 'pixel';
  try {
    const url = new URLSearchParams(window.location.search).get('estilo');
    if (url === 'vector' || url === 'pixel') {
      window.localStorage.setItem('estilo', url);
      return url;
    }
    return window.localStorage.getItem('estilo') === 'pixel' ? 'pixel' : 'vector';
  } catch {
    return 'vector';
  }
}

export const ESTILO: Estilo = leer();
export const ES_VECTOR = ESTILO === 'vector';

/** Cambia el estilo y recarga (el arte y la escala se deciden al arrancar). */
export function cambiarEstilo(estilo: Estilo): void {
  try {
    window.localStorage.setItem('estilo', estilo);
  } catch {
    /* sin almacenamiento: solo por URL */
  }
  // La URL manda sobre lo guardado: se le quita ?estilo= antes de recargar (dentro de un marco, como el
  // artefacto de Claude, no se puede navegar a otra dirección, pero sí recargar).
  const url = new URL(window.location.href);
  if (url.searchParams.has('estilo')) {
    url.searchParams.delete('estilo');
    window.history.replaceState(null, '', url);
  }
  window.location.reload();
}
