#!/usr/bin/env bash
# Genera un APK de prueba sin Gradle ni Android Studio: un visor (WebView) que carga el juego en
# un solo HTML. Sirve para probar en el teléfono cuando no hay acceso a los servidores de Google.
# La app final es la de android/ (Capacitor), que se compila con Android Studio.
#
# Requisitos (Ubuntu/Debian):
#   sudo apt-get install android-sdk-platform-23 android-sdk-build-tools dalvik-exchange apksigner zipalign
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
OUT=build
VERSION=$(node -p "require('../package.json').version")
# versionCode: 1.2.3 → 10203
VERSION_CODE=$(node -p "const [a,b,c]='$VERSION'.split('.').map(Number); a*10000+b*100+c || 1")
APK="$OUT/swat-to-the-moon-prueba-$VERSION.apk"

rm -rf "$OUT"
mkdir -p "$OUT/assets" "$OUT/classes"

echo "1/5 Juego en un solo HTML"
(cd .. && npm run --silent build:archivo)
cp ../dist-archivo/swat-to-the-moon.html "$OUT/assets/index.html"

echo "2/5 Recursos y manifiesto"
aapt package -f -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$ANDROID_JAR" \
  --version-name "$VERSION" --version-code "$VERSION_CODE" -F "$OUT/sin-firmar.apk"

echo "3/5 Código Java a dex"
javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -d "$OUT/classes" \
  $(find src -name '*.java')
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && aapt add sin-firmar.apk classes.dex >/dev/null)

echo "4/5 Alinear"
zipalign -f 4 "$OUT/sin-firmar.apk" "$OUT/alineado.apk"

echo "5/5 Firmar"
# Llave de depuración local (no se sube al repo). Si cambia, hay que desinstalar la versión anterior.
if [ ! -f debug.keystore ]; then
  keytool -genkeypair -keystore debug.keystore -storepass android -keypass android -alias prueba \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Prueba, O=Swat to the Moon" >/dev/null 2>&1
fi
apksigner sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android --ks-key-alias prueba \
  --out "$APK" "$OUT/alineado.apk"
apksigner verify "$APK"

echo "Listo: apk-prueba/$APK ($(du -h "$APK" | cut -f1))"
