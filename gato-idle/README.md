# Swat to the Moon (nombre provisional)

Idle de un gato que tira las cosas de su dueño, de un vaso a la Luna. Celular primero (Android), y también en navegador de PC.

- Diseño completo: [`docs/DISENO.md`](docs/DISENO.md)
- Prompt original: [`docs/prompt-original.md`](docs/prompt-original.md)

**Estado:** versión 0.22.0. Al empezar solo se puede dar manotazos; Fuerza, Valor, patrocinios (dinero por ver un anuncio cada 90 s), **críticos** (Garras afiladas y Sombrero ridículo; con las **Garras marcadoras**, cada crítico marca el objeto 10 s y la pandilla pega más), **Saco de jefe** (más daño para los aliados) —las tres cambian el aspecto del gato—, 7 aliados (gatito bebé, ratón, perro, perico, cuervo, mapache, cabra; cada uno mejor que el anterior) la Investigación gatuna y el **Canal del dueño** se van descubriendo conforme se avanza. A media partida el dueño cacha al gato y empieza a grabar: **subir el video** es el reinicio (con opción de **×2 viendo un anuncio**), y deja seguidores (el récord del canal: bono permanente y abren pisos) y visualizaciones, que se gastan en el **árbol del canal**: 4 ramas (Manotazo, Pandilla, Producción, Viral) de 3 pisos, y se puede reiniciar viendo 3 anuncios. 39 objetos, cada uno con su sonido y en su cuarto: 27 en el departamento (cocina, sala, baño, recámara, cuarto de lavado) y 12 en la **casa con jardín** (jardín, estudio, cochera), a la que el dueño **se muda** al juntar 80 seguidores y 500K visualizaciones en total; desde entonces cada video reinicia en la casa. Al terminar la casa espera el primer **jefe, el Pepino Gigante**: 30 segundos para quitarle la vida, con trofeo de +25 % de daño para siempre. Números de daño con estilo propio y fáciles de leer (fuente Jersey 10 para cifras), medidor de daño por segundo en la escena, compra ×1/×10, moneda con gatito y viñetas de cómic la primera vez que llega una mejora, un aliado o un objeto. La pandilla sigue trabajando mientras no juegas (hasta 2 h, con opción de duplicar viendo un anuncio). **Tutorial** corto en contexto: el gato explica un paso a la vez y una manita señala qué tocar (se puede saltar). **Arte de PixelLab estilo meme** (el gato y el gatito sueltan el manotazo de verdad): el gato con cara de susto y una uva en la cabeza, el shiba de reojo, la cabra que grita, el gato en el robot aspiradora y 27 objetos con su chiste. El progreso se guarda. Botón 🛠 (arriba a la derecha) con el **modo pruebas**: dinero infinito, daño ∞, avanzar como jugador hasta cualquier objeto y puntos de guardado.

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
| `npm run simular` | Simula a un jugador: en qué minuto llega a cada objeto y cuánto más rápidas son las vueltas después de subir el video (`npm run simular -- 3` para 3 toques por segundo) |
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
  data/        balance en JSON: objects.json (con sonidos), tools.json (aspecto del gato por etapa), allies.json, unlocks.json (orden de descubrimientos), research.json (investigación gatuna), habilidades.json (Canal), balance.json
  app/         une todo: bucle, autoguardado, eventos para la escena, datos para la UI
  game/        escena de Phaser, cuartos y superficies (places.ts), escalado de píxeles y arte provisional
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
- **Arte**: los PNG de PixelLab están en `src/assets/arte/` y se cargan con la clave de su nombre (las mismas que `sprite` en `objects.json` y que `SPRITES`); lo que no tenga PNG se dibuja en código (`src/game/placeholders.ts`). El arte va a 2 píxeles por unidad del mundo. Para generar más: `tools/arte/generar.py` (lee la llave de `PIXELLAB_TOKEN`, nunca la guardes en el repo). Ver `docs/DISENO.md` §33.

## Notas técnicas

- **Pixel art nítido:** la escena se escala por múltiplos enteros de píxeles del dispositivo (`src/game/sceneSize.ts`), y el canvas crece para llenar el espacio sin dejar franjas.
- **Guardado:** dos ranuras alternas con número de versión (`src/core/save.ts`). Para cambiar el formato, sube `SAVE_VERSION` y agrega una migración.
- **Anuncios:** `src/services/ads.ts` define la interfaz. Hoy solo existe la versión de prueba; AdMob llega en la fase 5.
- **`appId`** (`com.krett97.gatoidle`) es provisional y no se puede cambiar después de publicar en Google Play.

**Versión para compartir** (sin el modo pruebas 🛠): `npm run build:compartir` deja un solo HTML en `dist-archivo/swat-to-the-moon.html`, listo para publicarlo y compartirlo (se juega en el navegador del celular, también en iPhone).
