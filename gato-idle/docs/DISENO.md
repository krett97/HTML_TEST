# Swat to the Moon — Documento de diseño

> **Versión 0.15** · Actualiza el prompt original ([`prompt-original.md`](prompt-original.md)) con las mejoras del análisis.
> **Nombre provisional.** *Knock It Off!* ya está en uso (Spin Master vende un juego físico con ese nombre para jugar con tu gato, y hay varios juegos en itch.io). *Swat to the Moon* aún no está verificado en Play Store ni en registros de marca (USPTO / IMPI). El nombre visible se cambia en un solo lugar: `src/i18n/*.json` → `app.title` y `capacitor.config.ts` → `appName`.

---

## 1. Concepto

**Un gato que destruye las cosas de su dueño, cada vez más grandes, hasta tirar la Luna de la mesa.**

- **La destrucción financia la destrucción.** El dueño es influencer: graba los destrozos, se hacen virales, gana dinero, compra cosas más caras y el gato las rompe.
- **El secreto del gato.** El gato sabe lo que hace: es el director creativo del canal y el dueño solo es el camarógrafo. **El dueño no lo sabe.** Cree que son accidentes, y el gato tiene que mantener la ilusión (ver §8, "¡Llegó el dueño!").
- **Escalada del dueño:** streamer en cuarto rentado → influencer famoso → celebridad → magnate → compra islas → compra la Luna.
- **Tono:** caricaturesco y absurdo, sin violencia. Nadie sale lastimado; solo se rompen cosas.
- **Principio clave: que sea cómico.** Todo lo que se agregue (objetos, aliados, mejoras, textos, sonidos, animaciones) tiene que hacer reír o sonreír. Ver §22.
- **Lo que nos distingue:** "gato que tira cosas" ya existe (*Cat Tap*, *Catlateral Damage*, *Knock It Over, Again?*). Lo nuestro es **la escalada (de un vaso a la Luna) y la sátira del influencer**. Eso debe verse en el nombre, el ícono y las capturas de la tienda.

## 2. Plataformas

- **Android primero** (Google Play), vertical y para jugar con una mano.
- **Web / PC después**, con el mismo código. Primero como columna centrada en el navegador; más adelante, un layout horizontal (escena a la izquierda, paneles a la derecha).
- Canal de PC por decidir: navegador (itch.io, CrazyGames, Poki) o Steam. Afecta la monetización (§9).

## 3. Ciclo principal

1. El jugador **toca cualquier parte de la escena** (no hace falta atinarle al objeto) y el gato da un **manotazo**.
2. Cada objeto tiene **vida (HP)**. Cada manotazo le quita `daño` y el objeto **avanza hacia la orilla**: su posición es la barra de vida.
3. Al llegar a la orilla, **cae y se rompe** (animación, partículas, sonido, vibración).
4. La rotura genera **vistas** (número flotante) y **dinero** = vistas × tarifa.
5. Con dinero se compran mejoras, aliados, investigaciones y personal.

**Regla de oro:** el gesto nunca cambia, siempre es un manotazo. Lo que cambia es lo que golpea.

**La orilla también escala:** mesa → repisa → balcón → azotea → acantilado → órbita. Al final, el gato tira la Luna "de la mesa".

### Estilos de rotura (`estiloRotura` en los datos)

| Estilo | Cómo se ve el progreso | Ejemplos |
|---|---|---|
| `empujar` | Se desliza hacia la orilla y cae | vaso, florero, TV, computadora |
| `rasgar` | 3–4 estados de daño visibles (rasguños, jirones) | tenis, sofá, cortinas, colchón |
| `volcar` | Se inclina más con cada golpe hasta caer | refri, lavadora, librero |

## 4. Economía

### Monedas

| Moneda | Qué es | ¿Se pierde en la mudanza? |
|---|---|---|
| **Vistas** | Lo que genera cada rotura. Es el número que flota en pantalla. | — (es un flujo, no se acumula para gastar) |
| **Dinero** | Vistas × tarifa. Se gasta en mejoras, aliados, investigaciones y personal. | Sí |
| **Seguidores** | Moneda de prestigio. El dueño se muda, pero los seguidores se quedan. Cada uno da +X % de ingresos. | No |

### Mejoras principales (implementadas)

- **Fuerza:** daño por manotazo = `(1 + nivel) × 2^⌊nivel / 11⌋` (se duplica cada 11 niveles). Costo: `5 × 1.28^nivel`.
- **Valor:** **cada 10 niveles el dueño compra el siguiente objeto** (más vida, más vistas). Dentro de un objeto, cada nivel da +10 % de vistas. Costo: lo que pagan 10 roturas del objeto actual × `1.25^(nivel dentro del objeto)`.
- **Tensión del jugador:** Fuerza contra Valor. Si subes Valor sin Fuerza, cada objeto tarda demasiado.
- **Meta de balance:** si el jugador va al día, cada objeto pide **5–15 toques**.

- **Garras afiladas** y **Sombrero ridículo:** los críticos (ver §24).
- **Saco de jefe:** más daño para todos los aliados (ver §25).

### Herramientas (ya no se compran, desde 0.7.0)

Hasta la 0.6 se compraban, daban ×3 de daño y eran el candado para pasar a la siguiente familia de objetos. Se sentían como "un número que sube", así que:
- **El gato las usa solo** al llegar a esos objetos: se sube al carrito con los muebles y a la aspiradora con los electrodomésticos. Solo cambian su aspecto (y salta un aviso: "¡El gato consiguió: Carrito a control remoto!").
- **Las garras pasaron a ser la mejora de crítico** (§24).
- **Las compras con efecto vuelven como "Habilidades" en los reinicios** (fase 4), con mecánicas propias: la embestida del carrito (cada 10 toques, un golpe enorme), la aspiradora que recoge los pedazos (+% de dinero y golpes solos), etc.
- Las partidas viejas recuperan lo que pagaron por ellas (migración del guardado v2 → v3).

### Valores actuales (`src/data/*.json`, calibrados con `npm run simular`)

| Objeto | Vida | Vistas | | Objeto | Vida | Vistas |
|---|---|---|---|---|---|---|
| Vaso | 5 | 10 | | TV | 950 | 7.3K |
| Florero | 12 | 30 | | Librero | 2.3K | 22K |
| Tenis | 29 | 90 | | Computadora | 5.5K | 66K |
| Sofá | 70 | 270 | | Lavadora | 13.2K | 197K |
| Cortinas | 165 | 810 | | Refri | 31.7K | 590K |
| Colchón | 400 | 2.4K | | | | |

Tarifa: $0.10 por vista.

### Fórmulas pendientes

- Seguidores al mudarse: `floor(√(dinero ganado en la partida / escala))` (fase 4).

## 5. Progresión de herramientas y objetos

Las herramientas marcan la etapa y el aspecto del gato; no se compran (ver §4).

| # | Herramienta | Objetos | En el MVP |
|---|---|---|---|
| 1 | Pata (con garras de acero si ya tiene Garras afiladas) | vaso … celular, papel de baño … colchón | ✅ |
| 2 | Carrito a control remoto | lámpara … librero | ✅ |
| 3 | Montado en aspiradora robot | tostadora … refri | ✅ |
| 5 | Grúa con bola de demolición (el manotazo va a la palanca) | piano (el clásico piano que cae), coche, casa | |
| 6 | Excavadora | mansión, edificios | |
| 7 | Mecha-gato gigante | ciudad, planeta | |
| 8 | Cohete | la Luna | |

Escenarios: departamento → casa → mansión → rascacielos → ciudad → planeta → espacio. Dentro de cada casa, cada objeto está en su cuarto (ver §26).

## 6. Personal (generadores idle)

Modelo tipo *Tap Titans*: los objetos tienen vida y el personal aporta **daño automático** o **bonos**. Así el idle se ve en pantalla: el gato sigue destruyendo solo.

| Personal | Mecánica | MVP |
|---|---|---|
| **Camarógrafo** | "El gato solo actúa si la cámara graba." Da **manotazos automáticos por segundo**; cada nivel sube el ritmo. Es el corazón del idle. | ✅ |
| **Editor** | Cada N roturas publica una **compilación** que paga un bono sobre esas N roturas ("¡Compilación publicada! +12K"). Los niveles bajan N o suben el bono. | ✅ |
| **Agente de seguros** | Reembolsa un **% del valor** de cada rotura, con su propio número flotante y frases cada vez más desesperadas. En el endgame, la aseguradora quiebra. | ✅ |
| **Community manager** | Activa las **ganancias offline**. Los niveles suben el tope de horas y la eficiencia. **Debe llegar en la primera sesión (5–10 min).** | ✅ |
| Paseador de perros | Trae perros que destruyen por su cuenta (daño automático extra). | |
| Abogado | Reduce el castigo del evento del dueño y de las demandas de vecinos. | |

**Otras mascotas (después del MVP):** perro (zapatos, sofá, entierra cosas), perico (cortinas, imita la alarma), mapache (cocina y refri), cabra (se come todo). Endgame: gato del tamaño de un edificio, perro kaiju.

## 7. Reinicios y gatos legendarios

### Subir el video (el reinicio, implementado en 0.10.0) y la mudanza

> Desde la 0.10.0 el reinicio es **subir el video que grabó el dueño** (ver §27). La mudanza a una casa más grande queda como la siguiente capa, cuando se junten suficientes seguidores. Lo de abajo es el plan original de la mudanza.

- **Qué es una partida:** va del vaso hacia la Luna. La mudanza te regresa al vaso.
- **Se pierde:** dinero, Fuerza, Valor, críticos, aliados y personal.
- **Se gana:** puntos para **Habilidades** permanentes (lo que antes eran las herramientas compradas).
- **Se conserva:** seguidores, gatos legendarios, compras, skins, logros y ajustes.
- **"Casa más cara":** multiplicador + cambio cosmético del departamento.
- **Vista previa obligatoria:** "Si te mudas ahora: +37 seguidores".
- En el MVP, la partida termina en el departamento. Al llegar al último objeto, el juego empuja claramente a "¡Hora de mudarse!".

### Gatos legendarios

| Gato | Efecto | Desbloqueo |
|---|---|---|
| **Schrödinger** | Cada video se publica en dos universos: ×2 vistas (se ven dos números flotantes) | **MVP:** 1.ª mudanza |
| **Cheshire** | Se vuelve invisible: **reduce** la probabilidad de que el dueño te vea (no la anula; si la anulara, mataría el evento y su anuncio) | **MVP:** 3.ª mudanza |
| Gato negro | Probabilidad de que los objetos se rompan solos | 7 vidas |
| Gato con botas | Probabilidad de "patada crítica" que tumba el objeto de un golpe | 7 vidas |
| Bastet | Multiplica los seguidores ganados al mudarse | 7 vidas |
| Félicette (gata real, voló al espacio en 1963) | Desbloquea la fase espacial | 7 vidas |

Solo versiones originales o de dominio público: nada de diseños de películas (ni el Cheshire de Disney ni el Gato con botas de DreamWorks).

### Después del MVP

- **Las 7 vidas** (prestigio 2): se ganan vidas, que desbloquean y suben gatos legendarios. Schrödinger y Cheshire se conservan al llegar esta capa. En inglés los gatos tienen **nueve** vidas, así que el número no debe estar amarrado a la regla.
- **El Big Bang** (prestigio 3): al destruir el mundo, empieza un universo con reglas distintas.

## 8. Evento "¡Llegó el dueño!" (luz roja, luz verde)

El dueño no sabe que el gato lo hace a propósito. Si lo cacha en el acto, sospecha.

1. Suenan las llaves: **2–3 s de aviso**. Luego el dueño se asoma unos segundos.
2. **Si tocas mientras mira, te cacha.** Si te quedas quieto, el gato pone cara de inocente, el dueño se va y deja un premio chico.
3. Los manotazos automáticos se pausan solos: **nunca te cacha por estar en idle**.
4. **Castigo temático:** el objeto regresa al centro de la mesa (pierdes el progreso de ese objeto). No se pierde dinero.
5. **Anuncio "Échale la culpa al perro":** recuperas el progreso y el regaño se lo lleva el perro.

Cada sistema hace algo distinto: Cheshire baja la probabilidad de que te vea, el abogado reduce el castigo y el anuncio te rescata.

## 9. Monetización

**Solo anuncios recompensados, opcionales. Sin intersticiales.**

| Anuncio | Recompensa |
|---|---|
| **Zoomies** | ×3 a todo el daño (toques y automáticos) por 3 min |
| **Video patrocinado** | ×2 ingresos por 30 min, acumulable hasta 4 h (para jugadores idle) |
| **Patrocinio** (implementado, 0.5.0) | Dinero al instante; la oferta aparece en la pantalla principal cada 90 s (ver sección 21) |
| **Los dueños se fueron de vacaciones** | Ganancias offline ×2 (en la pantalla de "mientras no estabas") |
| **Caja de cartón** | Caja con premio al azar, cada ~10 min. El gato se mete en la caja. |
| **Échale la culpa al perro** | Recupera el progreso perdido en el evento del dueño |

**Compras (después del MVP):**
- **Pase VIP:** todas las recompensas sin ver video. (No se llama "Quitar anuncios" porque no hay anuncios forzados.)
- **Pack de inicio barato:** ×2 ingresos permanente + skin exclusiva.
- **Skins del gato.** Al empezar, el jugador elige el pelaje gratis (naranja, negro, calicó, siamés…). "Es igualito a mi gato" crea apego.

**Reglas:**
- La caja de cartón **nunca se vende con dinero real** (las cajas de botín pagadas están reguladas).
- En PC por navegador, AdMob no funciona: se usa H5 Games Ads (AdSense) o el SDK del portal. En Steam no hay anuncios.

## 10. Humor y contenido

> Las reglas generales del humor están en §22. Aquí, el contenido concreto.

- Cada rotura genera un **título de video** de plantilla ("MI GATO TIRÓ LA TV 😱 (NO CLICKBAIT)") y **comentarios falsos** en un feed. Es solo texto en JSON y refuerza la premisa.
- Frases del agente de seguros, cada vez más desesperado.
- El título del dueño cambia con la fama (streamer en cuarto rentado → … → dueño de la Luna).

## 11. Juice

Vibración ligera, partículas, sonido de rotura, números flotantes, temblor de pantalla en roturas grandes y en los zarpazos críticos, animación distinta por herramienta. Todo se puede apagar en ajustes.

## 12. UX

- Vertical, una mano. **Barra superior:** dinero y vistas/s. **Centro:** escena. **Abajo:** paneles con pestañas (Mejoras, Personal, Mudanza, Ajustes).
- **Tope de toques por segundo** (~15), para que el multitouch y los autoclickers no rompan el balance.
- **Ajustes:** sonido, música, vibración, idioma, notación (letras o científica).
- **Tutorial** de los primeros 60 s: una mano que indica "toca".
- **Notación:** K, M, B, T y luego aa, ab… sin traducir (en español "billón" es 10¹², no 10⁹). Opción de notación científica.
- Después del MVP: notificaciones locales ("tu gato está aburrido", "ganancias offline llenas").

## 13. Ritmo

Metas:

| Hito | Cuándo |
|---|---|
| Primer vaso roto | ≤ 5 s |
| Primera mejora | ~30 s |
| Camarógrafo | 2–3 min |
| Garras | 5–8 min |
| Community manager | antes de 10 min |
| Primera mudanza | 30–60 min |
| Partidas siguientes al mismo punto | 2–3× más rápido |

Lo que da hoy el simulador (`npm run simular`): un jugador que toca 5 veces por segundo, sin ganancias automáticas todavía, y compra siempre lo que antes se paga solo.

| Hito | Minuto |
|---|---|
| Florero | 1.7 |
| Garras | 3.9 |
| Carrito | 11.5 |
| Aspiradora | 21.7 |
| Refri | 36.4 |

Una persona real compra peor que el simulador, así que tardará más; el camarógrafo (fase 3) lo acelerará. Se recalibra al terminar la fase 3.

## 14. Técnica

### Stack

| Pieza | Elección |
|---|---|
| Lenguaje y build | TypeScript + Vite |
| Escena | Phaser 4 (pixel art, animaciones, partículas, sonido) |
| Paneles de UI | Svelte 5 (HTML/CSS, fácil de adaptar a PC) |
| Android | Capacitor 8 (no TWA: hacen falta AdMob y pagos nativos) |
| Anuncios | `@capacitor-community/admob` + UMP (fase 5) |
| Compras | RevenueCat (después del MVP) |
| Guardado | Capacitor Preferences en Android, localStorage en web |
| Números grandes | break_infinity.js, envuelto en `core/num.ts` |
| Pruebas | Vitest (lógica) + Chromium headless (capturas) |

### Arquitectura

- **`core/` es lógica pura:** sin Phaser ni DOM. Se puede probar y simular en Node.
- **Modificadores:** cada efecto (mejora, empleado, gato, mudanza, anuncio) se declara como `{stat, op, valor}` y un solo agregador calcula las estadísticas finales. Un gato nuevo es una entrada en JSON.
- **Datos en `src/data/*.json`.** Los `id` nunca se renombran, porque el guardado depende de ellos.
- **Simulador de balance** (fase 2): responde "¿en cuántos minutos llego a las garras?" sin jugar a mano.
- **Guardado:** JSON con número de versión y migraciones. Autoguardado cada 20 s y al pasar a segundo plano, en dos ranuras alternas: si una se corrompe, se carga la otra.
- **Offline:** por marca de tiempo, con tope de horas. Se ignoran diferencias negativas (reloj atrasado).
- **Servicios por plataforma** (`services/`): anuncios, guardado, vibración y compras tienen una interfaz común, con una versión por plataforma y una falsa para desarrollo.
- **Pixel art:** escena con resolución virtual fija (180×240) y escalado **entero** en píxeles del dispositivo, filtro *nearest*, paleta limitada. El arte generado por IA suele traer la cuadrícula chueca y hay que normalizarlo. Los sprites se piden por clave desde el JSON; mientras no haya arte, se generan placeholders.

### Estructura

```
gato-idle/
  docs/            este documento y el prompt original
  src/
    core/          lógica pura: estado, números, guardado, acciones
    data/          objects.json, tools.json (balance)
    app/           el pegamento: bucle, autoguardado, ciclo de vida, puente con la UI
    game/          escena Phaser y placeholders
    ui/            paneles Svelte
    services/      plataforma, storage, haptics, ads (una versión por plataforma)
    i18n/          es.json, en.json
  tests/           Vitest
  android/         proyecto nativo generado por Capacitor
```

## 15. Alcance del MVP

- Ciclo base con los 3 estilos de rotura.
- Fuerza y Valor.
- Herramientas 1–4 con sus objetos (~11 objetos).
- Personal: camarógrafo, editor, agente de seguros, community manager.
- Ganancias offline con tope y pantalla de "mientras no estabas".
- La mudanza con seguidores y vista previa.
- Schrödinger y Cheshire.
- Evento "¡Llegó el dueño!" (luz roja, luz verde).
- Los 5 anuncios recompensados, con IDs de prueba.
- Guardado local versionado.
- Ajustes, tutorial corto, español (inglés en la fase 6).

Fuera del MVP: herramientas 5–8, otras mascotas, paseador y abogado, 7 vidas, Big Bang, compras, notificaciones, layout horizontal de PC.

## 16. Plan por fases

Cada fase responde una pregunta. Se pasa a la siguiente cuando se cumple su criterio de salida: lo revisan las pruebas automáticas y el simulador, y al final **lo decide el dueño del proyecto jugando en el celular**. Las fases no son estrictamente en orden: si algo de una fase posterior hace falta antes (como los aliados o el modo pruebas), se adelanta.

| Fase | Pregunta | Entrega | Se pasa cuando | Estado |
|---|---|---|---|---|
| 0. Esqueleto | ¿Funciona la base? | Proyecto, escena con toque, pestañas, servicios falsos, guardado versionado, números grandes, Android | Se instala en el celular, se toca y el progreso sobrevive al cerrar la app | ✅ |
| 1. ¿Es divertido tocar? | ¿Dan ganas de seguir tocando sin mejoras? | Manotazo → desliza → cae → rompe; números flotantes, avisos y sonido por objeto ✅. Falta: animación del gato con expresión y un mini tutorial | Tocar se siente bien por sí solo (sonido, vibración, animación) y alguien que no conoce el juego entiende qué hacer sin explicación | Casi |
| 2. Economía | ¿Hay siempre una compra que valga la pena? | Fuerza, Valor, críticos, 27 objetos, modificadores, investigación gatuna, simulador | El simulador llega al último objeto sin atorarse y sin tramos de más de ~3 min sin novedad | ✅ |
| 3. Idle | ¿El juego avanza sin mí? | Aliados ✅, autoguardado ✅ y **ganancias mientras no estabas** ✅ (§32). Falta: el personal del canal | Al cerrar el juego un rato y volver, hay una recompensa que dé gusto, y los aliados cargan buena parte del daño | Parcial |
| 4. Meta (reinicios) | ¿Hay razón para jugar días? | **Subir el video** (reinicio con seguidores y visualizaciones) ✅, **Habilidades** ✅. Falta: mudanza a casas más grandes, gatos legendarios, evento "¡Llegó el dueño!" | Subir el video deja al jugador más fuerte y la segunda vuelta es claramente más rápida (simulador: 2.4×) | Parcial |
| 5. Anuncios y Android | ¿Puede ganar dinero sin molestar? | Patrocinio con anuncio falso ✅, APK de prueba ✅. Falta: AdMob con IDs de prueba, las otras 4 recompensas, consentimiento de privacidad (requisito de Google) | Los anuncios de prueba de Google se ven y pagan en el celular, y la app cumple las políticas de Play | Parcial |
| 6. Pulido | ¿Está listo para publicar? | Arte de PixelApp, tutorial, layout de PC, balance con testers. Inglés ✅, modo pruebas ✅ | Un grupo de testers juega una semana y el ritmo, el humor y los anuncios se sienten bien | Pendiente |

## 17. Google Play (planear desde ya)

- Las cuentas de desarrollador **personales** creadas después de noviembre de 2023 necesitan una **prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de publicar en producción (confirmar en Play Console). Juntar testers desde la fase 5.
- AAB (no APK) con el *target API* vigente; Play App Signing.
- AdMob exige política de privacidad, formulario de seguridad de datos, consentimiento UMP y `app-ads.txt` en el sitio del desarrollador.
- **Público objetivo:** un gatito caricaturesco atrae a niños. Si se declara público menor de 13, aplican las políticas de familias (anuncios limitados). Decidirlo antes de la fase 5.
- Nunca ver ni tocar anuncios reales propios: usar IDs de prueba y registrar el teléfono como dispositivo de prueba.

## 18. Decisiones abiertas

1. Nombre definitivo (verificar Play Store y registros de marca).
2. Canal de PC: navegador o Steam.
3. Idiomas del MVP: solo español o también inglés.
4. Repositorio: `HTML_TEST` es público; para un juego comercial conviene un repo privado.
5. `appId` de Android (`com.krett97.gatoidle` es provisional; no se puede cambiar después de publicar).

## 19. Cambios de la versión 0.3.0 (juego)

- **Sonido:** efectos sintetizados con Web Audio (`src/services/audio.ts`), sin archivos. Cada objeto tiene en `objects.json` un sonido al golpearlo, otro al romperse y un tono propio: no hay dos objetos que suenen igual. Materiales: vidrio, cerámica, plástico, tela, goma, madera, metal y aparatos eléctricos. También suenan las compras, las herramientas y las voces de los aliados. Cuando haya grabaciones reales se cambian las recetas por archivos y los datos siguen igual.
- **27 objetos** en 4 familias, con 5 niveles de Valor cada uno:
  - Pata: vaso, taza, plato, control remoto, florero, celular del dueño.
  - Garras: papel de baño, cojín, tenis, cortinas, sofá, colchón.
  - Carrito: lámpara, bocina, consola de videojuegos, TV, mesa de centro, librero.
  - Aspiradora: tostadora, cafetera, licuadora, microondas, computadora, lavadora, secadora, estufa, refri.
- **Aliados** (`allies.json`, pestaña Aliados): golpean solos cada cierto tiempo, sin tocar. Daño por golpe = base × nivel, ×2 cada 25 niveles.

| Aliado | Llega con | Golpe | Ritmo |
|---|---|---|---|
| Gatito bebé | desde el inicio | rasguña | cada 1 s |
| Perro | papel de baño | muerde | cada 2 s |
| Perico | lámpara | picotea | cada 0.8 s |
| Mapache | tostadora | saquea | cada 1.5 s |

- **Ritmo** (simulador, 5 toques/s): garras min 4.9, carrito 10.5, aspiradora 18.9, refri 41.4. Los aliados hacen ~5 % del daño al inicio y ~60 % al final.
- El "Personal del canal" (camarógrafo, editor, seguros, community manager) queda para la siguiente fase, ahora como ganancias y ganancias offline.

## 20. Principio de diseño: siempre hay algo nuevo por descubrir (versión 0.4.0)

El jugador siempre debe sentir que avanza y que está a punto de desbloquear algo. Al principio solo puede dar manotazos; todo lo demás se va **descubriendo**: rápido al inicio y cada vez más espaciado, hasta investigaciones que tardan días.

- **`unlocks.json`** define el orden y la condición de cada descubrimiento (romper N objetos o llegar a un objeto). Agregar uno nuevo es agregar una línea.
- Siempre se ve la tarjeta **"Próximo descubrimiento"**, con su barra de progreso y qué falta ("Tira 3 objetos más" o **"Mejora el Valor"**), sin revelar qué es. **Nunca se dice a qué objeto hay que llegar** (ni en esa tarjeta, ni en el aliado oculto ni en la investigación gatuna): solo que hay que mejorar el Valor, y la barra avanza con cada nivel de Valor.
- Al descubrir algo: aviso, sonido y la etiqueta **"¡Nuevo!"** en la tarjeta o la pestaña. Las pestañas aparecen solo cuando se descubren.
- Los aliados futuros se ven como **"???"** hasta descubrirlos.

| Descubrimiento | Condición | Minuto (simulador) |
|---|---|---|
| Fuerza | 3 roturas | 0.1 |
| Valor | 12 roturas | 0.2 |
| Patrocinios (anuncio por dinero) | 20 roturas | 0.2 |
| Gatito bebé (pestaña Aliados) | 30 roturas | 0.3 |
| Ratón | llegar al control remoto | 2.2 |
| Garras afiladas (prob. de crítico) | llegar al florero | 2.9 |
| Perro | llegar al papel de baño | 4.0 |
| Sombrero ridículo (daño crítico) | llegar a las cortinas | 5.9 |
| Investigación gatuna | llegar a la lámpara | 8.5 |
| Perico | llegar a la consola | 10.5 |
| Saco de jefe (daño de aliados) | llegar a la TV | 11.6 |
| Cuervo | llegar a la mesa de centro | 13.0 |
| Mapache | llegar a la tostadora | 17.1 |
| **Canal del dueño** (el dueño cacha al gato y empieza a grabar) | llegar a la cafetera | 19.0 |
| Cabra | llegar a la lavadora | 27.9 |

(En el juego nunca se dice el objeto: solo "Mejora el Valor".)

### Investigación gatuna (antes "Laboratorio de gatitos")

Gatitos con bata analizan al dueño. Cada investigación cuesta dinero, **tarda tiempo real** y sigue avanzando con el juego cerrado; da una mejora permanente (se suma al sistema de modificadores). Se investiga una a la vez y en orden (`research.json`).

| Investigación | Efecto | Duración |
|---|---|---|
| Estudio de la mirada inocente | ×1.25 vistas | 1 min |
| Fisioterapia de pata | ×1.25 daño | 5 min |
| Vida en manada (desde la consola) | +10 % daño de aliados **por cada aliado adoptado** | 10 min |
| Psicología del dueño | ×1.5 vistas | 20 min |
| Entrenamiento de aliados | ×1.5 daño de aliados | 1 h |
| Análisis de las compras del dueño | ×2 vistas | 4 h |
| Kung fu felino | ×2 daño | 12 h |
| Sindicato de mascotas | ×2 daño de aliados | 1 día |
| Gravedad aplicada | ×3 daño | 3 días |

Ideas para más adelante: acelerar una investigación con un anuncio recompensado, y más descubrimientos de largo plazo (la mudanza, el personal del canal, gatos legendarios).

## 21. Aliados cada vez mejores y patrocinio por anuncio (versión 0.5.0)

### Escalera de aliados

Cada aliado nuevo es mucho mejor que el anterior, aunque cueste más: subir de nivel al recién llegado suele ser la mejor compra. Todos crecen igual (costo ×1.18 por nivel), así que lo que los distingue es el daño por segundo que da cada nivel:

| Aliado | Costo inicial | Daño por golpe (nivel 1) | Ritmo | Daño/s por nivel |
|---|---|---|---|---|
| Gatito bebé | $8 | 1 | 1 s | 1 |
| Ratón | $150 | 4 | 1.5 s | 2.7 |
| Perro | $900 | 20 | 2 s | 10 |
| Perico | $40K | 24 | 0.8 s | 30 |
| Cuervo | $450K | 180 | 1.2 s | 150 |
| Mapache | $6M | 960 | 1.5 s | 640 |
| Cabra | $50M | 4,800 | 2.5 s | 1,920 |

(Desde la 0.8.0 los aliados tardíos tienen el 40 % del daño base que tenían: el Saco de jefe se los repone, ver §25.)

En la pestaña Aliados, cada tarjeta dice cuánto daño por segundo suma la siguiente compra (**"+10 daño/s"**), y la que da más daño por cada peso lleva la etiqueta **"★ Mejor compra"** (`bestAllyPurchase` en `src/core/allies.ts`).

### Vida en manada (investigación gatuna)

Multiplica el daño de los aliados por **1 + 0.1 × aliados adoptados**: con gatito y perro, ×1.2; con los 7, ×1.7. Se declara como un modificador con `"escala": "aliados"`, así que cualquier investigación futura puede escalar igual.

### Patrocinio: dinero por ver un anuncio

Cada **90 s** aparece en la pantalla principal un botón dorado **"📺 Patrocinio +$X"** que dura 25 s (la primera oferta llega 20 s después de descubrirlo). Si el jugador ve el anuncio completo, recibe:

```
recompensa = máx( ingreso por segundo × 60 ,  dinero por rotura × 100 )

ingreso por segundo = roturas por segundo × dinero por rotura
roturas por segundo = mín( daño por segundo / vida del objeto ,  5 toques/s + golpes de aliados por segundo )
daño por segundo    = daño del toque × 5 toques/s + daño automático de los aliados
```

- Es **un minuto de juego activo** a 5 toques por segundo: toma en cuenta lo que vale el objeto y lo que se tarda en romperlo, incluidos los aliados.
- La segunda parte es un **piso de 100 roturas**: aunque el objeto se rompa de un toque y no haya aliados, el anuncio vale al menos 100 veces lo que da romperlo.
- Ejemplo: un objeto que se rompe de un toque y da $10 → 5 roturas por segundo × $10 × 60 s = **$3,000**, por encima de los $1,000 mínimos y cerca de los $2,500 deseados. Si el objeto tarda varios toques, la parte de tiempo baja y el piso de $1,000 lo protege.
- Los parámetros están en `balance.json` (`patrocinio`: cada cuántos segundos, cuánto dura visible, segundos de juego, toques por segundo y roturas mínimas). La fórmula está en `src/core/income.ts` y la usa también el simulador.

## 22. Principio de diseño: que sea cómico (versión 0.6.0)

Es la otra idea clave, junto con "siempre hay algo nuevo por descubrir" (§20). El jugador vuelve porque el juego le hace gracia, no solo por los números. Antes de agregar cualquier cosa, preguntarse **"¿qué tiene de gracioso esto?"**; si no tiene nada, buscarle el chiste o replantearlo.

### Reglas

- **El gato es inocente… en apariencia.** Después de cada destrozo pone cara de "yo no fui", mira a la cámara, se lame la pata. El chiste es que todos sabemos que sí fue.
- **Escalada absurda.** Cada objeto es más ridículo de tirar que el anterior: de un vaso a un refri, y al final la Luna. Que el jugador piense "¿cómo va a tirar ESO?".
- **Comedia física (slapstick).** Anticipación antes del golpe, objetos que tiemblan en la orilla, rebotes exagerados, piezas que salen volando, el dueño que llega tarde. Mejor exagerado que realista.
- **Sonidos caricaturescos.** Golpes con "boing", vidrio que se rompe de más, voces de los aliados fuera de lugar (el balido de la cabra en medio del silencio).
- **Aliados con personalidad.** Cada uno tiene su manía: el perro siempre se lleva la culpa, el ratón mordisquea cables, el perico repite lo que dice el dueño, el cuervo se roba lo brillante, el mapache saquea la cocina, la cabra embiste sin razón.
- **Textos con chiste.** Avisos, investigaciones ("Estudio de la mirada inocente", "Sindicato de mascotas"), nombres de mejoras, títulos de video y comentarios falsos. Cortos, y que se entiendan aunque no se lean completos.
- **La sátira del influencer.** El dueño convierte cada desastre en contenido: miniaturas con caras exageradas, "NO CLICKBAIT", patrocinios absurdos.
- **Nunca cruel.** Nadie sale lastimado, ni el dueño ni los animales; solo se rompen cosas.

### Para la fase de diseño con PixelApp

Lo que necesita arte con expresión (no solo un sprite quieto):

| Quién | Estados mínimos |
|---|---|
| Gato | quieto, manotazo (anticipación + golpe), cara inocente, celebración, regañado; con y sin garras de acero, sombrero y saco (se combinan) |
| Dueño | grabando, sorprendido, enojado, emocionado por las vistas |
| Cada aliado | quieto, ataque, su manía (gesto propio) |
| Cada objeto | normal, tambaleándose en la orilla, cayendo, roto en pedazos |

Ya cumple con esto (en código, con arte provisional): los textos del modo pruebas ("El dueño ni se dio cuenta"), los nombres de la investigación gatuna, el "¡ZARPAZO!" con garras de acero, el sombrero ridículo, el saco de jefe con corbata, las voces de los aliados y los sonidos por objeto. Pendiente: animaciones con expresión, el dueño en escena, títulos de video y comentarios falsos (§10).

## 23. Modo pruebas (versión 0.6.0)

Como el juego es largo, hace falta probar etapas avanzadas sin empezar de cero. El botón **🛠** de la barra superior (a la derecha del dinero) abre el panel:

| Sección | Qué hace |
|---|---|
| Dinero | **Dinero infinito** (todo gratis; el contador muestra ∞) y botones para recibir 1 min, 10 min o 1 h de ganancias |
| Daño del manotazo | ×1, ×10, ×100, ×1000 o **∞** (tira cualquier objeto de un toque). Los aliados pegan normal |
| Avanzar como jugador | +5 min, +30 min o **"Jugar hasta…"** un objeto. Lo hace un jugador automático (el mismo del simulador, `src/core/bot.ts`), así que la partida queda como la de alguien que jugó de verdad: con su Fuerza, Valor, críticos, aliados y descubrimientos. La investigación gatuna avanza el mismo tiempo |
| Atajos | Descubrir el siguiente o todo, +10 niveles a los aliados, terminar la investigación en curso o todas, mostrar el patrocinio ya |
| Puntos de guardado | 3 copias aparte de la partida: guardar una etapa y volver a ella cuando se quiera |

- Con algún truco prendido, el botón 🛠 se pone **rojo** para no olvidarlo; "Apagar todos los trucos" los quita.
- Los trucos se guardan con la partida (`pruebas` en el estado) y las compras pasan todas por `src/core/wallet.ts`.
- **Versión de tienda:** compilar con `PRUEBAS=no` (por ejemplo `PRUEBAS=no npm run build`). El botón desaparece y los trucos se apagan al cargar.

## 24. Críticos: Garras afiladas y Sombrero ridículo (versión 0.7.0)

Dos mejoras nuevas en la pestaña Mejoras, que se descubren después de Fuerza y Valor. Cada manotazo tira un dado: si sale crítico, aparece **"¡ZARPAZO!"** en rojo, suena un tajo de acero y la pantalla tiembla.

| Mejora | Aparece (simulador) | Efecto | Costo | Aspecto del gato |
|---|---|---|---|---|
| **Garras afiladas** | min 2.9 | +1 % de probabilidad de crítico por nivel, **tope 50 %** | `200 × 1.4^nivel` | garras de acero en la pata |
| **Sombrero ridículo** | min 5.9 | el crítico multiplica el daño ×2, +0.1 por nivel, sin tope | `2000 × 1.4^nivel` | sombrero de copa negro de mago |

**Por qué es medible:** en promedio, cada manotazo rinde

```
daño promedio = daño × (1 + probabilidad × (multiplicador − 1))
```

El simulador, el patrocinio y el ingreso usan ese promedio (`critFactor` en `src/core/economy.ts`), así que los críticos se balancean como cualquier otro multiplicador. En cada partida hay suerte, pero el ritmo promedio es predecible.

**Balance (simulador, 5 toques/s):** al quitar el ×27 de las herramientas, el daño se repuso con los críticos y con hitos de Fuerza (×2 cada 11 niveles). El ritmo quedó casi igual que antes:

| | Antes (0.6) | Ahora (0.7) |
|---|---|---|
| Lámpara | min 10.4 | min 8.5 |
| Tostadora | min 18.7 | min 16.7 |
| Refri | min 35.3 | min 34.2 |
| Golpes para el refri | 22 | 17 |
| Daño de los aliados al final | 84 % | 80 % |
| Críticos al final | — | 32 % de probabilidad, ×4.5 (rinde ×2.1 en promedio) |

Los aliados no hacen críticos (por ahora): el crítico es el premio de tocar.

## 25. Saco de jefe: los aliados pegan más (versión 0.8)

El gato es el director creativo del canal y, de saco y corbata, **el jefe de la pandilla**. Es una mejora en la pestaña Mejoras, después del Sombrero ridículo:

| | |
|---|---|
| Aparece | al llegar a la TV (min 11.6 en el simulador; primera compra hacia el min 13.7) |
| Efecto | el daño de **todos** los aliados se multiplica por `1 + 0.1 × nivel` (nivel 5 = ×1.5) |
| Costo | `50,000 × 1.5^nivel` |
| Aspecto | saquito negro de la cintura para arriba, con solapa, camisa blanca (su pecho), corbata roja y manga negra en el brazo del manotazo. La primera vez se lo acomoda |

Se suma a los demás multiplicadores de aliados (Vida en manada, Entrenamiento de aliados, Sindicato de mascotas) por el sistema de modificadores (`danioAliados`).

En la 0.8.0 eran unos lentes oscuros, pero en pixel art no se distinguían; en la 0.8.1 pasaron a ser el saco (los guardados conservan los niveles).

**Balance.** El saco solo aceleraban demasiado el juego (refri en el min 22–30) y dejaban el manotazo sin importancia (los aliados hacían el 97 % del daño). Para compensar, el perico, el cuervo, el mapache y la cabra quedaron con el 40 % de su daño base: con el saco que compra un jugador normal (~18 niveles, ×2.8) vuelven a pegar como antes. La escalera de aliados se conserva (cada uno sigue siendo más del doble de bueno que el anterior por nivel).

| | 0.7 | 0.8 |
|---|---|---|
| Tostadora | min 16.7 | min 17.1 |
| Refri | min 34.2 | min 36.2 |
| Golpes para el refri | 17 | 17 |
| Daño de los aliados al final | 80 % | 82 % |

## 26. Cada objeto en su cuarto (versión 0.9.0)

Todo encima de la misma mesa se sentía repetitivo (y un sofá o un librero sobre la mesa no tenía sentido). Ahora cada objeto dice **dónde está** (`lugar` en `objects.json`: cuarto y superficie) y la escena cambia de cuarto con un fundido corto cuando el dueño compra algo que va en otro lado.

| Cuarto | Superficie | Objetos |
|---|---|---|
| Cocina | barra | vaso, taza, plato, tostadora, cafetera, licuadora, microondas |
| Cocina | piso | estufa, refri |
| Sala | mesa de centro | control, florero, celular |
| Sala | mueble de TV | lámpara, bocina, consola, TV |
| Sala | piso | sofá, mesa, librero |
| Baño | repisa (con el inodoro abajo) | papel de baño |
| Recámara | cama | cojín |
| Recámara | piso | tenis, cortinas, colchón |
| Recámara | escritorio | computadora |
| Cuarto de lavado | piso | lavadora, secadora |

- Cada cuarto tiene su pared, piso y detalle: azulejos y reloj en la cocina, lambrín de azulejo y espejo en el baño, alfombra y cortinas en la recámara, repisa con detergentes en el cuarto de lavado.
- Cada superficie tiene su alto y su orilla (`src/game/places.ts`). Lo que está en una superficie se empuja hasta la orilla y cae; **lo que está en el piso no tiene orilla: se vuelca ahí mismo** (o se rasga).
- El cuadro y la ventana quedan en el mismo lugar en todos los cuartos, para que el perico y el cuervo tengan dónde pararse.
- Cuando lleguen los reinicios (subir el video y mudarse), cada casa nueva tendrá sus propios cuartos.
- Arte provisional con rectángulos; para PixelApp, la lista de cuartos y superficies de arriba es la lista de fondos que hay que dibujar.

## 27. El canal del dueño y "Subir video": el reinicio (versión 0.10.0)

### La historia

Hacia el **minuto 19** (al llegar a la cafetera), **el dueño cacha al gato**: entra a la escena, se sorprende… y en vez de regañarlo saca el celular y empieza a grabar ("¡esto se va a hacer viral!"). Desde ahí la escena tiene marco de cámara y **● REC** parpadeando, y aparece la pestaña **Canal**. El dueño cree que son accidentes graciosos; el gato sigue poniendo cara de inocente (así se conserva el secreto de §1 y el evento de §8).

### La mecánica: el reinicio es subir el video

- La pestaña Canal muestra **el video en grabación** (la partida actual): cuántas cosas lleva rotas, a qué objeto llegó y la vista previa: "Si lo subes ahora: +24 seguidores · +2.4K visualizaciones".
- Se puede subir desde la **lavadora** (`canal.objetoMinimo`); lo ideal es al llegar al refri. Subir pide dos toques.
- Al subirlo sale el video con un **título chistoso** ("MI GATO VS. Refri 😱 (NO CLICKBAIT)", "Mi gato destruyó 412 cosas y no se arrepiente 💀"…), con 15 % de probabilidad de **hacerse viral** (×2 seguidores y visualizaciones, confeti y sacudida), y **la partida vuelve al vaso** (o, ya mudado, al primer objeto de la casa nueva: §36).

| Se pierde | Se conserva |
|---|---|
| dinero, Fuerza, Valor, Garras, Sombrero, Saco, aliados | seguidores, visualizaciones, habilidades, investigaciones (hechas y en curso), descubrimientos, ajustes, historial de videos |

### Fórmulas (`balance.json` → `canal`, `src/core/canal.ts`)

```
seguidores del video      = ⌊ √(dinero ganado en la partida / 2,000,000) ⌋     (×2 si es viral)
visualizaciones del video = seguidores × 100
bono permanente           = dinero × (1 + 0.02 × seguidores totales)
```

La raíz cuadrada hace que esperar más dé más, pero cada vez menos: conviene subir el video en cuanto se llega al final, no quedarse horas en el refri. Una partida normal deja ~10 seguidores en la lavadora y ~24 en el refri (+48 % de dinero).

### Habilidades (desde 0.14.0 se desbloquean con metas: ver §31)

| Habilidad | Efecto por nivel | Tope |
|---|---|---|
| 🏎️ Embestida del carrito | cada 10 manotazos, uno pega ×(1 + 2 × nivel) | 10 |
| 🤖 Aspiradora recolectora | +10 % de dinero | 20 |
| 🐾 Pandilla veterana | gatito, ratón y perro empiezan cada partida en nivel 5 × nivel | 10 |
| 🧪 Investigación express | las investigaciones tardan 10 % menos (máximo la mitad) | 5 |

Son las ideas de las herramientas viejas (§4) convertidas en mejoras permanentes. La embestida entra al daño promedio como `1 + (mult − 1) / 10`, así que el simulador la mide igual que los críticos.

### Balance de la 0.10.0 (antes de las metas; el actual está en §31)

| Vuelta | Llega al refri | Seguidores del video |
|---|---|---|
| 1 | min 36.2 | +24 |
| 2 | min 14.8 (**2.4× más rápida**) | +23 |
| 3 | min 10.1 | +23 |
| 4 | min 7.4 | +22 |

Las vueltas se acortan porque hoy el contenido termina en el refri. Con la mudanza (casas nuevas y objetos más grandes, hacia la Luna) cada vuelta llegará más lejos en lugar de solo más rápido.

### Pendiente

- **Mudanza:** al juntar cierta cantidad de seguidores, el dueño se muda a una casa más grande, con cuartos nuevos (§26) y objetos nuevos.
- Arte del dueño (hoy es un dibujo provisional al doble de tamaño), animación de "subiendo video" y miniaturas de los videos.

## 28. Números más visuales, comprar ×10 y viñetas de cómic (versión 0.11.0)

### Números de daño (`MainScene.popNumber`, estilos `.num` en `global.css`)

| Golpe | Cómo se ve |
|---|---|
| Manotazo del gato | número crema que sale con "pop", se va en arco hacia un lado y se desvanece; más grande cuanto más daño hizo respecto a la vida del objeto |
| Aliado | número del color del aliado con su ícono (🐶 20, 🐱 4…), más chico; a lo mucho uno cada 0.14 s por aliado |
| **Crítico** | letrero "¡ZARPAZO!" y el número enorme en rojo, con una estrella dorada girando detrás, rebote exagerado, chispas doradas y sacudida |
| Embestida (habilidad) | "¡EMBESTIDA!" en azul con estrella azul, motor y sacudida; crítico + embestida = "¡SÚPER ZARPAZO!" |
| Dinero de una rotura | "+$X" dorado en la orilla por donde cayó, rebota y sube despacio |

Contorno grueso de pixel art para leerse sobre cualquier cuarto, y máximo 28 números a la vez (con 15 toques por segundo y 7 aliados se juntan muchos). Con "reducir movimiento" del sistema, las animaciones van por pasos.

### Comprar ×1 / ×10

Arriba de Mejoras y de Aliados hay un selector **Comprar ×1 | ×10** (se guarda en los ajustes). Con ×10 cada botón muestra "×10" y el costo de los 10 niveles juntos, y el efecto ya con los 10 ("Daño 11 → 42"). Se compran todos o ninguno; si hay tope (la probabilidad de crítico al 50 %), compra los que queden. Valor ×10 puede cruzar de objeto. Lógica en `src/core/bulk.ts` (simula la compra nivel por nivel sobre una copia, porque cada nivel cuesta distinto).

### Viñeta de cómic al estrenar Garras, Sombrero o Saco

El **primer nivel** de cada una lanza una viñeta de ~2.5 s que cruza la mitad de la escena: recuadro inclinado con puntitos de historieta y líneas de velocidad del color de la mejora (azul acero, morado, rojo), el gato ampliado **con su nuevo aspecto** y un globo de texto ("¡GARRAS DE ACERO!", "¡QUÉ ELEGANCIA!", "¡LLEGÓ EL JEFE!"). No bloquea los toques. Hoy el gato de la viñeta es el mismo pixel art ampliado; **con PixelLab se dibuja una ilustración propia para cada viñeta** (pose y expresión de cómic).

Recordatorio: estas mejoras no están desde el inicio; se descubren al subir el Valor (Garras ~min 3, Sombrero ~min 6, Saco ~min 12; ver §20).

## 29. Medidor de daño por segundo y números legibles (versión 0.12.0)

### Medidor en la escena

Arriba a la izquierda (debajo del ● REC) está el **daño por segundo real** de los últimos 3 segundos: suma lo que de verdad pegaron los manotazos (con críticos y embestidas) y los aliados (`src/app/dpsMeter.ts`). Por eso sube si tocas rápido y baja solo al detenerte, hasta quedar en lo que hace la pandilla.

- Número grande dorado que "late" cada vez que cambia.
- Barra repartida: **naranja = gato 🐱**, **morado = pandilla 🐾**, con las dos cifras abajo.
- **En racha** (4 o más manotazos por segundo): ícono 🔥, borde de fuego que tiembla, número rojo encendido y letrero "¡EN RACHA!".

### Números fáciles de leer

En Pixelify Sans el **8 parecía S y el 2 parecía Z**. Ahora:
- **Todos los dígitos del juego** usan **Jersey 10** (pixel art grueso, con dígitos inconfundibles), un poco más grande para empatar con el texto: "Daño **304** → **312**". Se hace con `unicode-range` (fuente "Digitos"), así que ningún texto tuvo que cambiar.
- **Lo que solo son cifras** (dinero de arriba, botones de compra, números de daño, medidor, seguidores) va completo en Jersey 10, incluidos "$", "K" y "M" (clase `.cifra`).

Se eligió entre Press Start 2P, VT323, Silkscreen, Jersey 10, Tiny5, Micro 5, Handjet y Sixtyfour; Jersey 10 fue la más legible sin ocupar demasiado ancho.

## 30. La moneda con gatito y más viñetas de cómic (versión 0.13.0)

### La moneda

El dinero ya no usa "$": es una **moneda dorada con la silueta de un gatito** (orejas, ojos y naricita rosa), pixel art de 13×13 dibujado como SVG para verse nítido a cualquier tamaño (`src/ui/coin.ts`, componente `Coin.svelte`). Está en los botones de compra, en el contador de arriba, en el botón de patrocinio y en el dinero que sale al romper cosas ("+🪙4.4K"). Los textos dentro de oraciones ("+$4.4K por rotura") todavía usan "$". Para PixelLab: la moneda es parte de la guía de arte (ícono de 13×13 o múltiplos).

### Viñetas para aliados y objetos nuevos

Además de Garras, Sombrero y Saco (§28), ahora también tienen viñeta de cómic:

| Cuándo | Viñeta | Ejemplo |
|---|---|---|
| Se adopta un aliado | verde, con el aliado ampliado | "¡El perro se unió a la pandilla!" · "Siempre se lleva la culpa. Siempre" |
| El dueño compra un objeto nuevo | amarilla, con el objeto ampliado | "¡El dueño compró: Taza!" · una frase al azar ("Garantía: 0 días", "Se ve carísimo… sería una pena que se cayera 😼"…) |

**Todas las viñetas salen solo la primera vez en la partida guardada** (`vistos` en el estado). Después de subir el video se vuelven a adoptar los aliados y a comprar los objetos; ahí sale el aviso corto de siempre, para no interrumpir cada vuelta. Con PixelLab cada viñeta tendrá su ilustración propia (hoy es el sprite ampliado).

## 31. Habilidades por metas: seguidores y visualizaciones que nunca se gastan (versión 0.14.0)

Antes las visualizaciones se gastaban en habilidades y el jugador tenía que escoger. Ahora:

- **Seguidores y visualizaciones son totales que solo crecen.** No se gastan nunca.
- Cada habilidad sube de nivel al llegar a una **meta** de seguidores o de visualizaciones. Cuando se alcanza, la tarjeta brilla y el botón **"¡Reclamar!"** late; un toque sube el nivel. No hay que escoger entre una y otra: todas avanzan solas con el canal.
- Cada tarjeta muestra la meta del siguiente nivel con su barra ("👥 24/27", "👁️ 95.9K/100K").

| Habilidad | Se desbloquea con | Meta del nivel n | Tope |
|---|---|---|---|
| 🏎️ Embestida del carrito | 👥 seguidores | `⌈6 × 1.7^(n−1)⌉`: 6, 11, 18, 30, 50… | 10 |
| 🤖 Aspiradora recolectora | 👁️ visualizaciones | `⌈30K × 1.7^(n−1)⌉`: 30K, 51K, 87K, 147K… | 20 |
| 🐾 Pandilla veterana | 👥 seguidores | `⌈15 × 1.8^(n−1)⌉`: 15, 27, 49, 88… | 10 |
| 🧪 Investigación express | 👁️ visualizaciones | `⌈50K × 2^(n−1)⌉`: 50K, 100K, 200K… | 5 |

### De dónde salen las visualizaciones (ahora miden la destrucción)

```
vistas del video          = Σ por cada rotura de la vuelta: posición del objeto (vaso 1 … refri 27)
visualizaciones del video = vistas del video × (1 + 0.1 × seguidores que ya tiene el canal)   (×2 si es viral)
seguidores del video      = ⌊ √(dinero ganado en la vuelta / 2,000,000) ⌋                   (×2 si es viral)
```

Romper cosas grandes da más vistas, y **un canal con más seguidores consigue más visualizaciones** (+10 % por seguidor). Sin ese bono, las vueltas más rápidas romperían menos cosas y cada video traería menos visualizaciones.

### Balance (simulador)

| Vuelta | Refri | Video | Totales | Habilidades reclamadas |
|---|---|---|---|---|
| 1 | min 36.2 | +24 👥 · +96K 👁️ | 24 / 96K | embestida 3, recolectora 3, pandilla 1, express 1 |
| 2 | min 13.7 (2.6× más rápida) | +23 · +154K | 47 / 250K | 4, 4, 2, 3 |
| 3 | min 8.5 | +22 · +175K | 69 / 426K | 5, 6, 3, 4 |

## 32. Ganancias mientras no estabas (versión 0.15.0)

La pandilla sigue rompiendo cosas con el juego cerrado o en segundo plano (`src/core/offline.ts`).

```
roturas = ⌊ roturas por segundo de los aliados × segundos fuera (tope 2 h) × 0.5 ⌋
dinero  = roturas × dinero por rotura del objeto actual
```

- Solo cuentan los **aliados** (nadie toca) a la **mitad** de su ritmo, hasta **2 horas** (`balance.json` → `offline`). El objeto no cambia: el dueño no compra nada mientras no estás. Sin aliados no se gana nada.
- Al volver aparece la ventana **"¡Mientras no estabas…!"** con los íconos de la pandilla, el dinero y las cosas rotas, y dos botones: **"Cobrar"** o **"📺 ¡Duplicar! Ver anuncio"** (el anuncio "Los dueños se fueron de vacaciones", ×2). Si se cierra el anuncio antes, la ventana sigue para cobrar normal.
- Si se pasó del tope, lo dice: "Solo cuentan 2 h (estuviste fuera 5 h). ¡Vuelve antes para no perder nada!".
- Ausencias de menos de 1 minuto se cobran solas, sin ventana.
- Lo pendiente se guarda: si se cierra el juego sin cobrar, sigue ahí la próxima vez (y si se vuelve a salir, se suma).
- Las roturas de mientras no estabas también cuentan para el video del Canal.
- Funciona al abrir el juego (desde el último guardado) y al volver de segundo plano.
- Modo pruebas: "Simular 1 h fuera".

Pendiente: subir el tope de horas y la eficiencia con investigaciones o habilidades del Canal.

## 33. Arte de PixelLab estilo meme (versión 0.16.0)

Llega el primer arte de verdad, generado con PixelLab. **Principio: los personajes son chistosos, inspirados en memes famosos, pero dibujos originales** (nunca copias de una foto ni de un personaje con dueño; solo "parecidos" en la idea).

| Personaje | Inspiración |
|---|---|
| Gato (protagonista) | Gato crema con ojos enormes de susto y **una uva en la cabeza** |
| Gato con saco | El mismo, con saco negro, camisa y corbata roja (editado con Pixen para que sea idéntico) |
| Sombrero ridículo | **Sombrero de copa negro de mago**, brillante y con banda gris, para combinar con el saco (0.18.3; antes gorra de hélice) |
| Garras afiladas | Tres uñas de metal en la pata (se ven en el cuadro del manotazo, §35) |
| Gatito bebé | Llorando a mares… con el pulgar arriba |
| Ratón | Lentes oscuros y un queso, muy seguro de sí |
| Perro | Shiba con **mirada de reojo** desconfiada |
| Perico | Gritando con el pico abierto |
| Cuervo | Cadena de oro, muy rapero |
| Mapache | Abrazando una bolsa de papitas robada, cara de culpable |
| Cabra | Gritando |
| Dueño | Cara de miniatura de YouTube: boca abierta, celular arriba |
| Carrito | Convertible de juguete; el gato va sentado adentro |
| Aspiradora | **Robot aspiradora** con el gato encima (meme clásico) |

Los 27 objetos también tienen su chiste: el vaso **medio lleno**, la taza con corazón "#1", el plato con **una rebanada de pizza triste**, el florero con la flor marchita, el celular con funda de brillitos, el cojín con cara de gato, los tenis "hype", la **lámpara de lava**, la TV pasando un video de gatos, la licuadora con licuado de fresa, la computadora gamer con luces arcoíris, la lavadora llena de espuma, la secadora con un calcetín atorado en la puerta y el refri con imanes y un dibujo.

**Resolución.** El arte tiene el doble de detalle que el mundo: `ART = 2` píxeles de arte por unidad del mundo (`src/game/sceneSize.ts`). Las reglas, posiciones y cuartos siguen en unidades del mundo (área de juego de 180 de ancho); la cámara amplía ×2 y cada imagen se dibuja a escala ½. La escala del celular sigue siendo un entero de píxeles del dispositivo, así que todo se ve nítido. Los cuartos y superficies siguen dibujados en código (a la resolución del mundo), por ahora.

**Cómo se carga.** Cada PNG de `src/assets/arte/` se carga con la clave de su nombre (`gato`, `gato_saco`, `pata`, `garra`, `sombrero`, `duenio`, `carrito`, `aspiradora`, `aliado_*`, `obj_*`), la misma de `SPRITES` y de `sprite` en `objects.json` (`src/game/art.ts`). Lo que no tenga PNG usa el dibujo provisional (`placeholders.ts`). La viñeta de cómic del gato se arma con las mismas texturas (`catPortrait.ts`).

**Cómo se genera.** `tools/arte/generar.py` pide candidatos a PixelLab (modelo *pixflux*, 1 generación cada uno, varias semillas) y arma un montaje para elegir; los lotes con sus textos están en `tools/arte/*.json` y los elegidos en `tools/arte/elegidos.json`. Las variantes de un mismo personaje (el saco) se hacen con *edit-image-pixen*, que respeta pose y cara. La llave de PixelLab **nunca** va en el repositorio: el script la lee de `PIXELLAB_TOKEN`. Esta primera tanda gastó ~160 generaciones.

Pendiente de arte: fondos de los cuartos y superficies, ilustraciones propias para las viñetas, animaciones (parpadeo del gato, aliados atacando) y la moneda.

## 34. Tutorial: el gato te explica (versión 0.17.0)

Un tutorial **corto y en contexto**: el gato (con su cara de susto y su uva) habla en un globito al pie de la escena, **un paso a la vez y solo cuando ya se puede hacer lo que pide**. Lo que hay que tocar brilla en dorado y una manita 👆 lo señala (si está abajo en la lista, se desplaza solo hasta verlo). Nunca bloquea: se puede seguir tocando la escena, y siempre está "Saltar tutorial".

| Paso | Cuándo sale | El gato dice | Se cierra |
|---|---|---|---|
| tocar | Al empezar | "Psst, humano. Toca la pantalla y le doy un manotazo a lo que esté en la mesa." (manita sobre la mesa) | Al romper la primera cosa |
| monedas | Después | "¡Al suelo! 😼 Cada cosa rota da monedas (arriba). Y el dueño pone otra. Nunca aprende." (brilla el contador) | "¡Va!" o al comprar Fuerza |
| fuerza | Cuando Fuerza se descubre y alcanza | "Compra Fuerza: mis manotazos pegan más fuerte…" | Al comprarla |
| valor | Cuando Valor se descubre y alcanza | "Compra Valor: el dueño pone cosas más caras. Más caras = más monedas. Es ciencia." | Al comprarlo |
| meta | Después | "Aquí abajo ves qué sigue. Spoiler: más destrucción." (brilla Próximo descubrimiento) | "¡Va!" |
| aliado | Cuando el gatito bebé se puede adoptar | "Un gatito quiere unirse a la pandilla. Adóptalo en 🐱 Aliados…" (brillan la pestaña y el botón Adoptar) | Al adoptarlo |
| video | Cuando el primer video ya se puede subir | "¡El dueño ya tiene video! Súbelo en 📱 Canal: empiezas de cero, pero con seguidores que te hacen más fuerte." | Al subirlo |

Lo demás (críticos, saco, investigación, habilidades) ya lo presentan las viñetas de cómic y los avisos, así que el tutorial no crece.

Reglas (`src/core/tutorial.ts`): cada paso terminado se anota en `vistos` (`tuto:<paso>`), que sobrevive a subir el video y a recargar, así que **nunca se repite**. Una partida que ya pasó por ahí (o que ya subió un video) lo da por visto sin mostrarlo. "Saltar tutorial" anota `tuto:saltar`.

## 35. Manotazo de verdad (versión 0.18.0)

Antes, al golpear, el gato se quedaba quieto y una pata se deslizaba desde atrás; el gatito bebé solo se recorría de lado. Ahora:

- **El gato suelta el manotazo:** cada toque cambia por 75 ms al cuadro del golpe (se para, guiña y estira la pata hasta el objeto, inclinándose un poco) y se vuelve a sentar. Con garras, la pata del golpe trae las uñas de metal; con saco, el golpe es con saco. En ese cuadro pasa delante del objeto para que la pata le llegue (en el carrito o la aspiradora no: va sentado adentro). El sombrero sigue a la cabeza.
- **El gatito bebé brinca en arco** hasta el objeto, suelta su manotazo (llorando) y regresa a su lugar. Cualquier aliado que tenga un cuadro `aliado_<id>_golpe` hace lo mismo; los demás siguen con sus saltitos.
- La viñeta de cómic de las mejoras del gato usa el cuadro del manotazo (luce las garras).
- Los cuadros se hicieron editando el dibujo con *edit-image-pixen* (misma cara y colores); las cuatro variantes (normal, garras, saco, saco + garras) parten del mismo cuadro y se recortan con el mismo marco para que no salten. Recetas en `tools/arte/elegidos.json`; herramienta `tools/arte/editar.py`.
- El gato sentado mira hacia el objeto (a la derecha), igual que en el manotazo (0.18.1: se volteó el dibujo de PixelLab y se recolocó el sombrero).
- El Sombrero ridículo ahora es un **sombrero de copa negro de mago** (brillante, con banda gris), que combina con el saco; asentado sobre la cabeza sin tapar los ojos (0.18.2–0.18.4).

## 36. La mudanza: la casa con jardín (versión 0.19.0)

Cuando el Canal junta **80 seguidores y 500K visualizaciones** (totales, nunca se gastan), el dueño se puede mudar. La partida **continúa después del refri**: en el refri el Valor ya no se detiene, y el siguiente objeto es el primero de la casa nueva. Ahí sale la viñeta **"¡NOS MUDAMOS!"** con el dueño ("se hizo famoso: casa nueva, cosas nuevas que tirar"), y desde entonces **cada video reinicia directo en la casa**, con el gato ya entrenado (Fuerza 50). El departamento no se repite.

- **Dónde se ve:** en el Canal, la tarjeta "🚚 Mudanza: Casa con jardín" con dos barras (seguidores y visualizaciones). En el refri, mientras falte, el Valor avisa "🔒 El dueño ya no tiene dónde poner más cosas… (📱 Canal)"; cuando ya se puede, el nivel que muda dice "🚚 ¡Mudanza! El dueño estrena casa: Maceta".
- **Tres cuartos nuevos** (dibujados en código): **jardín** (cielo, barda de madera, árbol con rama para el cuervo y casita de pájaros para el perico), **estudio del influencer** (espuma acústica, luz neón rosa y póster de "play") y **cochera** (block, franja amarilla, tablero de herramientas y mancha de aceite).
- **12 objetos nuevos** (arte de PixelLab, con su chiste): cactus con gorrito de fiesta, gnomo gruñón con el pulgar arriba, flamenco de plástico, aro de luz, micrófono, cámara grabando, placa "100k", silla gamer, asador con salchichas, bici, scooter y **el coche del dueño** con dados de peluche (el último y el más grande).
- **Curva:** cada objeto de la casa aguanta ×1.6 y paga ×1.5 el anterior (en el departamento ×1.4 y ×1.75): con el gato ya fuerte, la casa sigue costando.
- **Seguidores con raíz cúbica:** seguidores por video = ⌊(dinero de la partida / 80 000)^⅓⌋. En el departamento da lo mismo que antes (~24 por video), pero la casa, que paga muchísimo más, da ~127 en lugar de ~600, y el bono no se dispara.
- Datos: `src/data/casas.json` (casas en orden, requisito y Fuerza inicial) y el campo `casa` de cada objeto. Lógica: `src/core/mudanza.ts`. El estado guarda `casa` (a qué casa ya se mudó; sobrevive al subir el video). Hecho para más casas: agregar una a `casas.json` y sus objetos al final.
- Modo pruebas: "🚚 Desbloquear mudanza" junta justo lo que pide.

Simulador (5 toques/s, reclamando habilidades):

| Vuelta | Casa | Minutos | Seguidores del video |
|---|---|---|---|
| 1–4 | departamento | 36 → 14 → 8.5 → 5.6 (refri) | ~23 cada uno (total 93 / 594K) |
| 5 | se muda | refri 4.4 · maceta 4.8 · coche 36.9 | 127 |
| 6 | casa | coche 15.7 | 127 |
| 7–10 | casa | 10.1 → 6.9 → 5.6 → 4.5 | 127 cada uno |

Pendiente: una casa siguiente (edificio, ciudad… hasta la Luna), fondos de PixelLab para los cuartos y un aliado nuevo de la casa.

## 37. Sacudida de pantalla más suave y objetos de la casa más grandes (versión 0.19.1)

- **Sacudida:** al romper un objeto la pantalla temblaba fuerte (110 ms, 1.2 % del tamaño de la cámara) en *cada* rotura, y con la pandilla rompiendo sin parar casi nunca se detenía. Ahora es una cuarta parte (70 ms, 0.3 %) y a lo mucho una cada medio segundo. El crítico, la embestida y el video viral también bajaron (tabla `SHAKES` en `MainScene.ts`). La vibración del celular (háptica) no cambió y se apaga en Ajustes.
- **Objetos de la casa ×1.5:** se redibujaron con el redimensionado de PixelLab (`/resize`), que conserva el diseño con más detalle en lugar de estirar los píxeles.

## 38. Jefes: el Pepino Gigante (versión 0.20.0)

Al terminar la casa (llegar al **coche**, su último objeto) aparece en la escena el botón **"🥒 ¡Retar al Pepino Gigante!"** (inspirado en el meme de los gatos que saltan del susto al ver un pepino). La pelea:

- El pepino (arte de PixelLab, enorme, con sonrisa malvada) toma el lugar del objeto; el gato se le pone enfrente. Arriba a la derecha: su nombre, la vida que le queda y un reloj de **30 s** (rojo en los últimos 5).
- Los manotazos (con críticos y embestidas) **y la pandilla** le pegan a él: cada golpe lo apachurra y lo hace parpadear. La primera vez sale la viñeta "¡APARECIÓ EL PEPINO GIGANTE! El gato está aterrado… ¡tienes 30 segundos!".
- **Vida:** 2.5 veces la del coche. Según el simulador, al llegar se le quita ~74 % (se pierde) y tras ~5 minutos de mejorar en el coche ~103 % (se gana); en la vuelta siguiente se gana de entrada.
- **Ganar:** el pepino se marea (cuadro "derrotado") y cae, confeti, viñeta "¡Pepino Gigante DERROTADO! Trofeo: +25 % de daño para siempre", y un premio de lo que pagan 60 roturas del coche. El **trofeo** (+25 % al daño del gato y de la pandilla) dura para siempre, también después de subir videos, y se ve en Mejoras ("🏆 Pepino Gigante · +25 % daño"). Ya derrotado, no vuelve a aparecer.
- **Perder:** el pepino se burla (tres brinquitos), paga la mitad del premio por la parte de vida que se le quitó, y la **revancha** llega en 60 s ("🥒 Revancha en 55 s").
- La pelea en curso no se guarda: si se cierra el juego o se sube un video, se cancela sin premio ni espera.

Datos: `src/data/jefes.json` (casa, segundos, vida y premio en "roturas del último objeto", espera de la revancha y los efectos del trofeo). Lógica: `src/core/jefes.ts`; el trofeo entra al sistema de modificadores. Modo pruebas: "🥒 Pelear con el jefe" (en cualquier objeto) y el daño infinito también tumba al jefe.

Siguientes jefes (uno por casa): **la Aspiradora Industrial**, **el Veterinario** (con el cono de la vergüenza) y **la Bañera**.
- El perro, el ratón, el mapache y el gatito bebé ahora miran hacia el otro lado (0.20.1: se voltearon sus dibujos; el cuadro del manotazo del gatito ya miraba hacia el objeto).
