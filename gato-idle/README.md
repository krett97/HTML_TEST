# Swat to the Moon (nombre provisional)

Idle de un gato que tira las cosas de su dueño, de un vaso a la Luna. Celular primero (Android), y también en navegador de PC.

- Diseño completo: [`docs/DISENO.md`](docs/DISENO.md)
- Prompt original: [`docs/prompt-original.md`](docs/prompt-original.md)

**Estado:** versión 0.7.0. Al empezar solo se puede dar manotazos; Fuerza, Valor, patrocinios (dinero por ver un anuncio cada 90 s), **críticos** (Garras afiladas y Sombrero ridículo, que también cambian el aspecto del gato), 7 aliados (gatito bebé, ratón, perro, perico, cuervo, mapache, cabra; cada uno mejor que el anterior) y la Investigación gatuna se van descubriendo conforme se avanza. 27 objetos, cada uno con su sonido. El progreso se guarda. Botón 🛠 (arriba a la derecha) con el **modo pruebas**: dinero infinito, daño ∞, avanzar como jugador hasta cualquier objeto y puntos de guardado.

## Requisitos

- Node 22 o más reciente.
- Para Android: Android Studio (trae el SDK y Java).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (la primera vez) |
| `npm run dev` | Abre el juego en `http://localhost:5173` y recarga al guardar cambios |
| `npm run dev:host` | Igual, pero accesible desde tu celular en la misma red Wi-Fi (usa la dirección "Network" que imprime) |
| `npm test` | Pruebas de la lógica (números, economía, guardado, datos) |
| `npm run simular` | Simula a un jugador y muestra en qué minuto llega a cada objeto (`npm run simular -- 3` para 3 toques por segundo) |
| `npm run check` | Revisión de tipos de TypeScript y Svelte |
| `npm run build` | Build de producción en `dist/` |
| `npm run build:archivo` | Todo el juego en un solo HTML (`dist-archivo/swat-to-the-moon.html`) que se abre sin servidor |
| `npm run android:sync` | Build + copia al proyecto Android |
| `npm run android:open` | Abre el proyecto en Android Studio |
| `npm run apk:prueba` | APK de prueba sin Android Studio (ver abajo) |

Para la versión de tienda, compila con `PRUEBAS=no` (p. ej. `PRUEBAS=no npm run android:sync`): quita el panel de pruebas.

## Probar en Android

1. `npm run android:sync`
2. `npm run android:open`
3. En Android Studio, conecta tu teléfono con la depuración USB activada y presiona ▶ (Run).

Cada vez que cambies el código web, repite `npm run android:sync`.

### APK de prueba (sin Android Studio)

`npm run apk:prueba` genera `apk-prueba/build/swat-to-the-moon-prueba-<versión>.apk`: un visor mínimo (WebView) que carga el juego en un solo HTML. Usa herramientas de Ubuntu en lugar de Gradle, así que funciona aunque no haya acceso a los servidores de Google:

```
sudo apt-get install android-sdk-platform-23 android-sdk-build-tools dalvik-exchange apksigner zipalign
```

Diferencias con la app real (`android/`): se instala como **"Swat (prueba)"** con otro identificador (`com.krett97.gatoidle.prueba`), no vibra y no tiene plugins nativos. Está firmado con una llave de depuración local: si se genera en otra máquina, hay que desinstalar la versión anterior antes de instalar la nueva.

## Estructura

```
src/
  core/        lógica pura (sin Phaser ni DOM): números grandes, estado, economía, modificadores, guardado
  data/        balance en JSON: objects.json (con sonidos), tools.json (aspecto del gato por etapa), allies.json, unlocks.json (orden de descubrimientos), research.json (investigación gatuna), balance.json
  app/         une todo: bucle, autoguardado, eventos para la escena, datos para la UI
  game/        escena de Phaser, escalado de píxeles y arte provisional
  ui/          interfaz en Svelte: barra superior, escena, pestañas
  services/    plataforma: sonido, guardado, vibración, anuncios (falsos por ahora), ciclo de vida
  i18n/        textos en español e inglés
tests/         pruebas de Vitest
tools/         simulador de balance (usa el mismo jugador automático que el modo pruebas, src/core/bot.ts)
android/       proyecto nativo de Capacitor (la app final)
apk-prueba/    APK de prueba sin Gradle (visor WebView)
```

## Cómo cambiar cosas sin tocar la lógica

- **Balance** (vida y vistas de cada objeto, costos de Fuerza, Valor y críticos, tarifa por vista, tope de toques, frecuencia y tamaño del patrocinio): `src/data/*.json`. Después de cambiarlo, corre `npm run simular` para ver cómo cambia el ritmo. Si escribes algo inválido (un id repetido, una herramienta que no existe), el juego se detiene al arrancar con un mensaje que dice qué archivo y qué objeto corregir.
- **Textos**: `src/i18n/es.json` y `en.json`. Las pruebas verifican que ambos tengan las mismas claves.
- **Nombre del juego**: `app.title` en los dos JSON de textos, `appName` en `capacitor.config.ts` y `<title>` en `index.html`.
- **Humor**: es un principio de diseño (ver `docs/DISENO.md` §22). Todo lo nuevo debería tener su chiste.
- **Arte**: hoy se dibuja en código (`src/game/placeholders.ts`). Para usar los sprites de PixelApp, se cargan los PNG con las mismas claves que `sprite` en `objects.json`.

## Notas técnicas

- **Pixel art nítido:** la escena se escala por múltiplos enteros de píxeles del dispositivo (`src/game/sceneSize.ts`), y el canvas crece para llenar el espacio sin dejar franjas.
- **Guardado:** dos ranuras alternas con número de versión (`src/core/save.ts`). Para cambiar el formato, sube `SAVE_VERSION` y agrega una migración.
- **Anuncios:** `src/services/ads.ts` define la interfaz. Hoy solo existe la versión de prueba; AdMob llega en la fase 5.
- **`appId`** (`com.krett97.gatoidle`) es provisional y no se puede cambiar después de publicar en Google Play.
