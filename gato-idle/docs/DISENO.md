# Swat to the Moon — Documento de diseño

> **Versión 0.7** · Actualiza el prompt original ([`prompt-original.md`](prompt-original.md)) con las mejoras del análisis.
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

Escenarios: departamento → casa → mansión → rascacielos → ciudad → planeta → espacio.

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

### La mudanza (prestigio 1, en el MVP)

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
| 3. Idle | ¿El juego avanza sin mí? | Aliados ✅ y autoguardado ✅. Falta: **ganancias offline** (al volver: "mientras no estabas ganaste $X") y el personal del canal | Al cerrar el juego un rato y volver, hay una recompensa que dé gusto, y los aliados cargan buena parte del daño | Parcial |
| 4. Meta (reinicios) | ¿Hay razón para jugar días? | **La mudanza** (empezar de cero con un bono permanente), **Habilidades** (carrito, aspiradora…), gatos legendarios, evento "¡Llegó el dueño!" | Una mudanza deja al jugador más fuerte y la segunda vuelta es claramente más rápida | Pendiente |
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
| Cuervo | llegar a la mesa de centro | 13.0 |
| Mapache | llegar a la tostadora | 16.7 |
| Cabra | llegar a la lavadora | 26.3 |

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
| Perico | $40K | 60 | 0.8 s | 75 |
| Cuervo | $450K | 450 | 1.2 s | 375 |
| Mapache | $6M | 2,400 | 1.5 s | 1,600 |
| Cabra | $50M | 12,000 | 2.5 s | 4,800 |

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
| Gato | quieto, manotazo (anticipación + golpe), cara inocente, celebración, regañado |
| Dueño | grabando, sorprendido, enojado, emocionado por las vistas |
| Cada aliado | quieto, ataque, su manía (gesto propio) |
| Cada objeto | normal, tambaleándose en la orilla, cayendo, roto en pedazos |

Ya cumple con esto (en código, con arte provisional): los textos del modo pruebas ("El dueño ni se dio cuenta"), los nombres de la investigación gatuna, el "¡ZARPAZO!" con garras de acero y el sombrero ridículo, las voces de los aliados y los sonidos por objeto. Pendiente: animaciones con expresión, el dueño en escena, títulos de video y comentarios falsos (§10).

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
| **Sombrero ridículo** | min 5.9 | el crítico multiplica el daño ×2, +0.1 por nivel, sin tope | `2000 × 1.4^nivel` | chistera morada con flor |

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
