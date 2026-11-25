# Qué se lleva al juego nuevo

El juego del gato (`gato-idle/`) queda guardado completo y sin cambios; sus decisiones están en [`gato-idle/docs/DECISIONES.md`](gato-idle/docs/DECISIONES.md). Este archivo dice **qué partes se pueden reusar** para el próximo idle y cómo.

El juego nuevo irá en **su propia carpeta**, junto a `gato-idle/`. Así nada del gato se toca. Se copian archivos, no se comparten: si el juego nuevo cambia algo, el gato no se rompe.

> Antes de publicar algo comercial conviene pasar el juego nuevo a un repositorio **privado**: `HTML_TEST` es público.

---

## 1. Se copian tal cual

Código genérico: no sabe nada de gatos ni de objetos. Rutas dentro de `gato-idle/`.

| Qué | Archivos | Para qué sirve |
|---|---|---|
| Números grandes | `src/core/num.ts`, `src/core/format.ts` | Decimal con break_infinity y formato K, M, B, T, aa… o científico |
| Guardado | `src/core/save.ts`, `src/app/persistence.ts`, `src/services/storage.ts` | JSON versionado con migraciones, dos ranuras alternas, Preferences en Android y localStorage en web |
| Ciclo de vida | `src/services/lifecycle.ts`, `src/services/platform.ts` | Guardar al pasar a segundo plano; saber si es Android o web |
| Anuncios | `src/services/ads.ts` | AdMob recompensado con una interfaz común y un anuncio falso para web y pruebas |
| Vibración | `src/services/haptics.ts` | Vibración nativa o del navegador |
| Sonido sintetizado | `src/services/audio.ts` | Recetas de Web Audio (golpes, roturas, monedas) sin archivos de audio |
| Eventos | `src/app/emitter.ts` | La lógica avisa a la escena y a la interfaz |
| Tope de toques | `src/core/limiter.ts` | Máximo de toques por segundo contra autoclickers |
| Compras ×1 / ×10 | `src/core/bulk.ts`, `src/ui/BuyAmount.svelte` | Comprar varios niveles a la vez con el precio exacto |
| Pagar | `src/core/wallet.ts` | Todas las compras pasan por aquí (permite el "dinero infinito" de pruebas) |
| Modificadores | `src/core/modifiers.ts` | Cada efecto se declara como `{stat, op, valor}` y un agregador calcula el total |
| Ganancias sin jugar | `src/core/offline.ts`, `src/ui/OfflineModal.svelte` | Cálculo con tope de horas y ventana de bienvenida con ×2 por anuncio |
| Medidor de daño | `src/app/dpsMeter.ts` | Daño por segundo real de los últimos segundos |
| Idiomas | `src/i18n/index.ts` | `$t('clave', {n})`, cambio de idioma en vivo |
| Íconos en textos | `src/ui/Icon.svelte`, `src/ui/Rich.svelte`, `src/ui/icons.ts` | Escribir `[[fuerza]] Fuerza` y que salga el dibujo |
| Tamaño de escena | `src/game/sceneSize.ts`, `src/game/boot.ts` | Escena nítida en cualquier pantalla, cámara que sigue al personaje |

## 2. Se copian y se adaptan

Sirven como base, pero traen cosas del gato que hay que cambiar.

| Qué | Archivos | Qué hay que cambiar |
|---|---|---|
| Controlador del juego | `src/app/game.ts` | Es el pegamento entre lógica, escena e interfaz. Sirve como molde: bucle, autoguardado, vista para la interfaz, modo pruebas. Las reglas son del gato |
| Estado inicial y normalización | `src/core/state.ts`, `src/core/normalize.ts` | Los campos del juego nuevo |
| Interfaz principal | `src/ui/App.svelte`, `src/ui/Panel.svelte`, `src/ui/TopBar.svelte`, `src/ui/SceneHost.svelte`, `src/ui/tabs/Mejoras.svelte` | Pestañas, barra de arriba, pantalla sin scroll con botones gordos |
| Tema visual | `src/ui/global.css`, `src/ui/vector.css` | Colores y letra; el estilo de tarjetas y botones con relieve se queda |
| Tutorial | `src/core/tutorial.ts`, `src/ui/Tutorial.svelte` | Pasos en globitos que esperan a que se pueda hacer lo que piden. Cambiar pasos y textos |
| Descubrimientos | `src/core/unlocks.ts` | Revelar funciones poco a poco desde un JSON |
| Modo pruebas | `src/ui/Pruebas.svelte`, `src/core/pruebas.ts` | Dinero infinito, daño infinito, reiniciar, puntos de guardado. Quitar lo de mudanza y jefes |
| Jefes con tiempo | `src/core/jefes.ts` | Pelea de 30 s con revancha; cambiar quiénes son |
| Ranking compartido | `src/services/ranking.ts`, `src/ui/Ranking.svelte` | Tabla compartida en la versión publicada por Claude |
| Maquinita | `src/core/suerte.ts`, `src/ui/Maquinita.svelte` | Tragamonedas con fichas y "¿Doble o nada?", si el juego nuevo la quiere |
| Simulador de balance | `tools/simulate.ts`, `src/core/bot.ts` | Un bot que juega y compra lo que más rinde; responde "¿en cuántos minutos llego a X?" sin jugar a mano |
| Pruebas de punta a punta | `tests/e2e/flujos.cjs` | El arnés (página nueva por flujo, errores de consola, tamaños de pantalla) se queda; los flujos son del gato |

## 3. Arte dibujado en código

El sistema más valioso para el juego nuevo: arte gratis, con un estilo parejo garantizado.

- **Se copia:** `tools/vector/lib.mjs` (paleta, contorno, formas, ojos, nariz, render a PNG con `@resvg/resvg-js`) y `tools/vector/dibujar.mjs`.
- **Se cambia:** la paleta `P` y el contorno `K` si el juego nuevo tiene otro ambiente.
- **De ejemplo:** `tools/vector/gato.mjs` (personaje con detalle), `objetos.mjs` (objetos), `cuartos.mjs` (fondos que se repiten), `iconos.mjs` (58 íconos de 64 × 64 para la interfaz).
- **Reglas que funcionaron:** contorno café oscuro de 5–6 px, dos tonos por color, brillos blancos con opacidad, sin degradados ni texto dentro del dibujo, 8 px por unidad del mundo, objetos apoyados en el borde de abajo del lienzo.
- **No se lleva:** el pixel art de PixelLab (`src/assets/arte/`, `tools/arte/`) ni la bandera de estilo `src/app/estilo.ts`. Eran para comparar.

## 4. Entrega y publicación

| Qué | Archivos | Para qué sirve |
|---|---|---|
| Un solo HTML | `scripts/build-archivo.mjs` y los scripts `build:archivo` y `build:compartir` de `package.json` | Publicar el juego como página en Claude (con y sin modo pruebas) |
| APK de prueba sin Android Studio | `apk-prueba/` (`build.sh`, manifiesto, actividad Java) | Instalar en el teléfono en minutos. Cambiar el paquete `com.krett97.gatoidle.prueba` y el ícono |
| App de tienda | `android/`, `capacitor.config.ts` | Se regenera con `npx cap add android`; elegir un `appId` nuevo y definitivo |
| Guía de Google Play | `docs/PUBLICAR.md`, `docs/privacidad.md`, `docs/tienda/CLASIFICACION.md` | Pasos, política de privacidad y respuestas de los cuestionarios; cambiar el nombre del juego |
| Capturas de tienda | `tools/tienda/capturas.cjs`, `tools/tienda/banner.html` | Capturas automáticas en español e inglés |

## 5. Forma de trabajar que conviene repetir

- `core/` sin Phaser ni DOM: todo se prueba en Node.
- Datos en JSON y los `id` nunca se renombran.
- Antes de cada versión: `npm test`, `npx tsc --noEmit -p .`, `npm run check`, `npm run e2e`.
- Subir `version` en `package.json` en cada entrega (el APK y el versionCode salen de ahí).
- Nunca guardar llaves, IDs reales de AdMob ni keystores en el repo (`.gitignore` ya los excluye).

## 6. Cómo arrancar el juego nuevo

1. Definir la idea y **el momento divertido de 10 segundos**: qué se ve y qué se siente al tocar.
2. Crear la carpeta nueva junto a `gato-idle/` con Vite + TypeScript + Phaser + Svelte, y copiar lo de la sección 1.
3. Hacer solo ese momento divertido, con arte provisional del sistema vectorial, y probarlo en el teléfono.
4. Agregar sistemas uno por uno, cada uno con su prueba y su paso por el simulador. Ningún sistema nuevo hasta que el anterior se sienta bien.
