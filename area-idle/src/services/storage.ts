// Guardado en el navegador (localStorage; en el APK de prueba también funciona). Si el navegador
// no deja guardar (modo privado, almacenamiento lleno), el juego sigue en memoria.
const KEY = 'area-idle:partida';

export function loadRaw(): unknown {
  try {
    const text = localStorage.getItem(KEY);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export function saveRaw(data: unknown): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearRaw(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nada que borrar.
  }
}
