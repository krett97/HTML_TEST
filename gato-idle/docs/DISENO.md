# Swat to the Moon — Documento de diseño

> **Versión 0.4** · Actualiza el prompt original ([`prompt-original.md`](prompt-original.md)) con las mejoras del análisis.
> **Nombre provisional.** *Knock It Off!* ya está en uso (Spin Master vende un juego físico con ese nombre para jugar con tu gato, y hay varios juegos en itch.io). *Swat to the Moon* aún no está verificado en Play Store ni en registros de marca (USPTO / IMPI). El nombre visible se cambia en un solo lugar: `src/i18n/*.json` → `app.title` y `capacitor.config.ts` → `appName`.

---

## 1. Concepto

**Un gato que destruye las cosas de su dueño, cada vez más grandes, hasta tirar la Luna de la mesa.**

- **La destrucción financia la destrucción.** El dueño es influencer: graba los destrozos, se hacen virales, gana dinero, compra cosas más caras y el gato las rompe.
- **El secreto del gato.** El gato sabe lo que hace: es el director creativo del canal y el dueño solo es el camarógrafo. **El dueño no lo sabe.** Cree que son accidentes, y el gato tiene que mantener la ilusión (ver §8, "¡Llegó el dueño!").
- **Escalada del dueño:** streamer en cuarto rentado → influencer famoso → celebridad → magnate → compra islas → compra la Luna.
- **Tono:** caricaturesco y absurdo, sin violencia. Nadie sale lastimado; solo se rompen cosas.
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
5. Con dinero se compran mejoras, herramientas y personal.

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
| **Dinero** | Vistas × tarifa. Se gasta en mejoras, herramientas y personal. | Sí |
| **Seguidores** | Moneda de prestigio. El dueño se muda, pero los seguidores se quedan. Cada uno da +X % de ingresos. | No |

### Mejoras principales (implementadas)

- **Fuerza:** daño por manotazo = `1 + nivel`. Costo: `5 × 1.28^nivel`. Hay un ajuste opcional de "hitos" (×N cada tantos niveles), apagado por ahora.
- **Valor:** **cada 10 niveles el dueño compra el siguiente objeto** (más vida, más vistas). Dentro de un objeto, cada nivel da +10 % de vistas. Costo: lo que pagan 10 roturas del objeto actual × `1.25^(nivel dentro del objeto)`.
- **Tensión del jugador:** Fuerza contra Valor. Si subes Valor sin Fuerza, cada objeto tarda demasiado.
- **Meta de balance:** si el jugador va al día, cada objeto pide **5–15 toques**.

### Herramientas (implementadas)

Cada una:
- es **requisito** para pasar a la siguiente familia de objetos (sin garras no hay sofá);
- **se compra justo cuando hace falta**: cuando el dueño quiere comprar el primer objeto de su familia. El botón aparece en la misma tarjeta de Valor. Comprarla antes rompía el ritmo (todo caía de un golpe);
- multiplica el daño ×3;
- cambia el aspecto del gato: garras en la pata, sentado en el carrito, montado en la aspiradora.

### Valores actuales (`src/data/*.json`, calibrados con `npm run simular`)

| Objeto | Vida | Vistas | | Objeto | Vida | Vistas |
|---|---|---|---|---|---|---|
| Vaso | 5 | 10 | | TV | 950 | 7.3K |
| Florero | 12 | 30 | | Librero | 2.3K | 22K |
| Tenis | 29 | 90 | | Computadora | 5.5K | 66K |
| Sofá | 70 | 270 | | Lavadora | 13.2K | 197K |
| Cortinas | 165 | 810 | | Refri | 31.7K | 590K |
| Colchón | 400 | 2.4K | | | | |

Herramientas: garras $600, carrito $20K, aspiradora $600K. Tarifa: $0.10 por vista.

### Fórmulas pendientes

- Seguidores al mudarse: `floor(√(dinero ganado en la partida / escala))` (fase 4).

## 5. Progresión de herramientas y objetos

| # | Herramienta | Objetos | En el MVP |
|---|---|---|---|
| 1 | Pata | vaso, florero, tenis | ✅ |
| 2 | Garras afiladas | sofá, cortinas, colchón | ✅ |
| 3 | Carrito a control remoto | TV, muebles (mesa, librero) | ✅ |
| 4 | Montado en aspiradora robot | computadora, lavadora, refri | ✅ |
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
- **Se pierde:** dinero, Fuerza, Valor, herramientas y personal.
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

- Cada rotura genera un **título de video** de plantilla ("MI GATO TIRÓ LA TV 😱 (NO CLICKBAIT)") y **comentarios falsos** en un feed. Es solo texto en JSON y refuerza la premisa.
- Frases del agente de seguros, cada vez más desesperado.
- El título del dueño cambia con la fama (streamer en cuarto rentado → … → dueño de la Luna).

## 11. Juice

Vibración ligera, partículas, sonido de rotura, números flotantes, temblor de pantalla en roturas grandes, animación distinta por herramienta. Todo se puede apagar en ajustes.

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

| Fase | Entrega | Estado |
|---|---|---|
| 0. Esqueleto | Proyecto, escena placeholder con toque, UI con pestañas, servicios falsos, guardado versionado, números grandes, Android | ✅ |
| 1. "¿Es divertido tocar?" | Manotazo → desliza → cae → rompe; números flotantes y avisos ✅. Falta: sonido, tutorial, mejor animación del gato | Parcial |
| 2. Economía | Fuerza/Valor, 11 objetos y 4 herramientas, estilos de rotura (empujar, rasgar, volcar), modificadores, simulador | ✅ |
| 3. Idle | 4 empleados, offline, autoguardado completo | |
| 4. Meta | Mudanza, Schrödinger, Cheshire, evento del dueño | |
| 5. Anuncios y Android | AdMob de prueba, 5 recompensas, consentimiento, ajustes, APK | |
| 6. Pulido | Tutorial, inglés, layout de PC, balance con testers | |

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
