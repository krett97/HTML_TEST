# Cómo publicar en Google Play

Lo que ya está listo en el repo: el juego, el ícono (normal, redondo y adaptable), AdMob conectado (con IDs de prueba), la versión que sale de `package.json`, la pantalla de carga, el botón "atrás" de Android, la ficha de la tienda (`docs/tienda/FICHA.md`), los gráficos (`docs/tienda/`), la política de privacidad (`docs/privacidad.md`) y las respuestas de los cuestionarios (`docs/tienda/CLASIFICACION.md`).

Lo que solo puedes hacer tú (necesita tus cuentas y llaves; **nunca las subas al repo**):

1. **Cuenta de Google Play Console** (pago único de 25 USD) y **cuenta de AdMob**.
2. **En AdMob:** crea la app (Android) y un bloque de anuncios **recompensado**. Te da dos IDs: el de la app (`ca-app-pub-…~…`) y el del bloque (`ca-app-pub-…/…`).
3. **Ponlos al compilar** (sin ellos se usan los de prueba de Google):
   - ID de la app: en tu `~/.gradle/gradle.properties` (el de tu usuario, fuera del repo) agrega `ADMOB_APP_ID=ca-app-pub-…~…`, o exporta la variable `ADMOB_APP_ID`.
   - ID del bloque: `VITE_ADMOB_REWARDED_ID=ca-app-pub-…/…` en un archivo `.env.production.local` dentro de `gato-idle/` (ya está en `.gitignore`).
   - Enlace a la política de privacidad (sale en Ajustes): `VITE_PRIVACIDAD_URL=https://…` en el mismo archivo.
4. **Llave de firma:** en Android Studio, *Build → Generate Signed App Bundle*, crea una llave nueva (`.jks`) y **guárdala en un lugar seguro**: sin ella no podrás publicar actualizaciones. Activa "Play App Signing" en la consola.
5. **Compila la versión de tienda** (sin el modo pruebas):
   ```
   PRUEBAS=no npm run build
   npx cap sync android
   ```
   y en Android Studio: *Build → Generate Signed App Bundle → release* → `app-release.aab`.
6. **Prueba en tu teléfono** con los IDs de prueba (o con tu teléfono registrado como dispositivo de prueba en AdMob): nunca hagas clic en tus propios anuncios reales.
7. **En Play Console:** crea la app, sube el `.aab` a *Pruebas internas*, llena la ficha con `docs/tienda/FICHA.md` y los gráficos, la política de privacidad (publícala en una página web y pon su enlace), la clasificación de contenido y la seguridad de los datos con `docs/tienda/CLASIFICACION.md`, el público objetivo (13+) y "contiene anuncios: sí".
8. **Pruebas cerradas:** las cuentas personales nuevas deben tener una prueba cerrada con al menos 12 testers durante 14 días antes de pedir la publicación en producción.
9. Cada versión nueva: sube `version` en `package.json` (el versionCode sale de ahí) y repite 5 y 7.

Antes de cada versión: `npm test`, `npm run check`, `npm run e2e` (con `npm run build` y `npx vite preview --port 4173` en otra terminal) y `npm run simular` para revisar el balance.
