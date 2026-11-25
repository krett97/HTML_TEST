# Campo de Slimes: diseño del prototipo

> Versión 0.6.0. Nombre provisional. Nació de pausar el juego del gato
> ([`../../gato-idle/docs/DECISIONES.md`](../../gato-idle/docs/DECISIONES.md)), tomando su base técnica y su
> arte en código ([`../../REUSO.md`](../../REUSO.md)). Referencia de sensación: *Don't Stop The Pop!*
> (cientos de cosas reventando en un área) y el idle del castor (rocas que caen, mundo que cambia por fase).

## 1. El momento divertido

Una explanada de pasto se llena de slimes. **Tocas donde quieres que caigan las flechas**: el círculo se
queda ahí y **dispara solo** cada tanto; las flechas caen, se clavan y todo lo que está dentro recibe
daño. Arrastrar el dedo también mueve el círculo. Al final de la partida el campo está lleno: cientos de
slimes, números de daño y manchas de colores.

**Lección del gato aplicada:** primero el momento de 10 segundos; ningún sistema nuevo hasta que ese se
sienta bien. Poco texto: lo que sigue se descubre jugando.

## 2. El ciclo: niveles con tiempo límite (desde 0.2.0)

1. **Cada nivel trae una cantidad fija de slimes** (15 en el nivel 1, 8 más por nivel): el 30 % sale al
   empezar y el resto llega en los siguientes 8 segundos (más rápido con "Atraer slimes"). Cada slime
   aparece con una **chispa** de estrellitas y un anillo blanco.
2. **Hay que reventarlos todos antes de que se acabe el tiempo** (20 s; el talento Tiempo suma hasta 20 más).
   - **Lo logras:** "¡Nivel N superado!", con el oro juntado y un **premio** por el nivel. Se abre el
     siguiente. Botones: Siguiente y Mejorar.
   - **No lo logras:** "¡Se acabó el tiempo!". **El oro juntado se queda.** Botones: Reintentar el nivel,
     jugar el **nivel anterior para juntar oro** y Mejorar.
3. **Árbol** en tres secciones (pestañas): se gasta el oro. Abajo se elige el nivel (◀ Nivel 5 ▶; uno
   anterior dice "para juntar oro") y ¡Jugar!.

Cada nivel tiene más slimes, con más vida (×1.3 por nivel) y algo más de oro (×1.05); los azules salen
desde el nivel 4 y cada vez son más (hasta la mitad). Quien ya jugó, al abrir llega al árbol; quien es
nuevo, directo al nivel 1 con una pista.

**Arriba, durante la partida:** la barra del nivel a todo lo ancho ("12/15 · 80 %"), y debajo el tiempo
que queda (con su barrita, que se pone roja en los últimos 5 s), la zona y el nivel ("Campo verde ·
Nivel 5") y el oro. Ahí arriba no aparecen ni pasean slimes, para que nada quede tapado.

## 3. Los árboles (`src/core/datos.ts`)

| Sección | Ataque | Tipo de daño | Talentos |
|---|---|---|---|
| **Jugador** | Tu círculo: lluvia de flechas en el área | Físico | Daño (raíz), Área, Atraer slimes (llegan más rápido), Cadencia, Tiempo, Botín (premio por nivel), Ganancia de oro (todo el oro), Oro inactivo, Bolsa grande |
| **Mago** | Bola de fuego que revienta en un **cuadrado** (40 × 40) donde hay alguien | Fuego | Mago (raíz), Mago veloz, Fuego mágico, Explosión grande, Suelo en llamas (tierra quemada con borde de brasas), Fuego intenso |
| **Arqueros** | Flechas a **un objetivo a la vez**; con Flechas múltiples, a 2, 3… 5 | Físico | Arquero (raíz), Más arqueros (hasta 6), Flechas múltiples, Arco veloz, Puntas de acero, Muralla reforzada |
| **Reliquias** (desde el nivel 11, con **gemas**) | — | — | Poder ancestral (raíz), Golpes críticos, Carcaj encantado, Albañil (ver 5e) |

- Al principio solo se ve **Daño**; cada compra muestra lo que sale de ahí. Las raíces del Mago y los
  Arqueros se ven desde el principio con candado ("Sube Cadencia a 3", "Sube Daño a 3").
- El mago, el fuego y los arqueros pegan en proporción a tu daño (×1.5, ×0.6/s y ×2), así Daño nunca deja
  de valer.
- Cada nodo muestra su ícono, su nivel y su precio; al tocarlo, abajo sale el efecto ("Daño 3 → 4") y el
  botón de compra. Una pestaña con algo comprable lleva un punto rojo; su esquina, el tipo de daño.

## 4. Tipos de daño y enemigos

Seis tipos: **físico, fuego, hielo, energía, muerte y luz**. Hoy hay físico (tus flechas y los arqueros) y
fuego (el mago y su suelo en llamas); los demás se ven en el glosario como "Pronto".

Cada enemigo es **débil** a algunos tipos (recibe ×1.5) y **fuerte** contra otros (×0.5). En la partida,
el golpe a una debilidad sale con número grande y rojizo, y el que choca con una fortaleza, chico y gris.

| Enemigo | Vida | Velocidad | Ataca | Débil a | Fuerte contra | Oro |
|---|---|---|---|---|---|---|
| Slime verde | 3 | Normal | No | Fuego | — | 1 |
| Slime azul (desde el nivel 4) | 14 | Lenta | No | Hielo, Energía | Fuego | 6 |
| Slime rojo (desde el nivel 7) | 8 | Normal | 3 a la muralla cada 3 s | Físico, Luz | Muerte | 4 |

**Glosario** (botón del libro en el árbol): los tipos de daño, quién hace cuál y cada enemigo con su vida,
velocidad, si ataca y sus debilidades y fortalezas. Los que aún no salen se ven como silueta con "???"
("Aparece desde el nivel 4"). La vida y el oro de la tabla son los del nivel 1; crecen con el nivel.

## 5. La muralla y el slime rojo (desde 0.3.0)

Abajo del campo hay una muralla de piedra con almenas y una torre con estandarte a la izquierda. Los
**arqueros** están en los huecos entre almenas y el **mago** arriba de la torre. Los slimes no bajan hasta ella.

Desde el **nivel 7** salen **slimes rojos con resortera** (6 % de los del nivel, sube 1 % por nivel hasta
12 %). Cada 3 s le tiran una piedra a la muralla (3 de daño, +5 % por nivel); la piedra vuela en arco.
La muralla tiene **100 de vida** (Muralla reforzada: +50 % por nivel) y una barra en su cara que aparece
cuando hay rojos. **Si cae, el mago y los arqueros dejan de atacar el resto del nivel**: la muralla se pone
gris, sale polvo, ellos quedan tumbados y arriba sale el aviso "¡Cayó la muralla!". Los rojos son débiles
al daño físico, así que tus flechas y los arqueros son la respuesta: hay que buscarlos primero.

## 5b. Oro mientras no juegas (desde 0.3.0)

Se abre al **llegar al nivel 3** (aviso en el fin de la partida). Al volver, la ventana "Mientras no
estabas" dice cuánto tiempo pasó y cuánto oro se juntó, con un botón para cobrar.

- Da **15 %** de lo que se gana por minuto jugando el nivel más alto ya superado (sus slimes y su premio,
  una partida cada 30 s), hasta **2 horas**. Menos de un minuto fuera no cuenta.
- **Oro inactivo** (+10 % por nivel, hasta 85 %; pide haber llegado al nivel 3) y **Bolsa grande** (+1 h por
  nivel, hasta 12 h), en el árbol del jugador, bajo **Ganancia de oro**, que ahora multiplica todo el oro:
  el de los slimes, el premio por nivel y lo que se junta sin jugar.
- En el árbol, junto al oro, una píldora dice cuánto se gana por minuto sin jugar.
- El juego guarda la hora en cada guardado (también cada 20 s y al pasar a segundo plano). El modo
  pruebas tiene "Simular 1 h fuera", "+1 nivel" y **"+1 min de juego" / "+10 min de juego"**: el jugador
  simulado del simulador juega ese tiempo sobre tu partida (partidas, oro, compras en el árbol, niveles) y
  sale un resumen ("En 10 min de juego: 23 partidas (17 ganadas), nivel 3 → 14, 75 mejoras, +8.95K de oro").

## 5c. Jefes (desde 0.4.0)

**Cada 10 niveles hay un jefe.** El primero, en el nivel 10, es el **Rey Slime**: naranja, gigante, con
corona de oro, capa roja y cejas de enojo. En un nivel de jefe se gana **al vencerlo** (su escolta
revienta con él); hay **10 s más** de tiempo y el **premio es ×5**. Su vida es la de todos los slimes de un
nivel normal ×6 (en el nivel 10: unas 16 600). En los niveles 20, 30… vuelve, más fuerte, hasta que haya
jefes nuevos.

Lo que hace (`JEFE` en `datos.ts`):

| Mecánica | Detalle |
|---|---|
| Invoca escolta | Sale con 6 slimes y cada 3 s llama a 3 más a su alrededor (dan oro). |
| Brinca | Cada 5 s salta en arco a otro lado del campo (medio segundo en el aire). |
| Esquiva tu círculo | Mientras tu círculo esté a menos de 25 unidades de su orilla, camina alejándose (22 u/s). Hay que perseguirlo tocando o arrastrando el dedo. |
| Cae aturdido | Al caer de un brinco queda **aturdido 1.5 s**: no se mueve y **recibe ×2** (números dorados y grandes, estrellitas, aviso "¡Aturdido!"). Es el momento de pegarle. |
| Ataca la muralla | Cada 4 s lanza una bola de baba gigante a la muralla (10 de daño). Si la tumba, el mago y los arqueros dejan de atacar. |
| Furia | A media vida se enfurece (destello rojo, parpadea rojizo, aviso "¡Está furioso!"): invoca, brinca, esquiva y lanza más seguido, y llama un slime más. |

En la partida, arriba, su **barra de vida** reemplaza la de progreso ("👑 Rey Slime · 64 %"), y al
empezar sale el letrero "¡JEFE! Rey Slime". El selector de nivel del árbol lo marca con corona. Si se
pierde, el fin dice cuánta vida le quedó. El glosario tiene una sección de **Jefes** (oculta hasta el
nivel 10) con sus mecánicas. Es débil al fuego: el mago le hace ×1.5.

El bot pierde el primer intento contra el Rey (le deja ~40 %), junta oro en el nivel 9 y lo vence al
segundo con un segundo de margen.

## 5d. Segunda zona: Campo de batalla (desde 0.5.0)

Después del Rey Slime (niveles 11–20, y los siguientes hasta que haya una tercera zona) sigue siendo un
campo verde, pero en lugar de arbustos y flores hay **espadas, tablas y escudos tirados**, y en lugar de
slimes salen:

| Enemigo | Desde | Vida | Velocidad | Ataca | Débil a | Fuerte contra | Oro |
|---|---|---|---|---|---|---|---|
| Goblin (verde, con lanzas) | 11 | 4 | Normal | Lanzas a la muralla (2 cada 4 s) | Fuego | — | 1.5 |
| Lobo | 11 | 3 | Rapidísima, cambia de rumbo a cada rato | No | Físico | — | 1 |
| Orco (casco y garrote) | 13 | 12 | Lenta | Camina hasta la muralla y la golpea (4 cada 2.5 s) | Fuego | Físico | 6 |
| Orco arquero (el más fuerte) | 15 | 9 | Lenta | Flechas a la muralla (4 cada 3 s) | Fuego | Físico | 8 |

Los lobos son el 22 % de cada nivel; los orcos, del 8 % al 20 %; los arqueros orcos, del 5 % al 12 %; el
resto, goblins. Aquí el **mago** (fuego) y **Muralla reforzada** importan de verdad: los orcos resisten
las flechas y casi todos le pegan a la muralla.

**El Lobo Blanco** (jefe del nivel 20): enorme, blanco, con ojos rojos y una **hoz en el hocico**. En vez
de brincar **embiste** por el piso rapidísimo (deja una estela de polvo) y se queda **jadeando** 1.2 s
(recibe ×2); **aúlla** para llamar lobos; **avienta su hoz** girando contra la muralla (14 de daño); esquiva
tu círculo más rápido que el Rey (32 u/s) y a media vida se enfurece. Débil al fuego, fuerte contra el
hielo. Cada jefe tiene sus números en `JEFES` (`datos.ts`); en los niveles 30, 40… se alternan.

El simulador llega al nivel 20 hacia el minuto 27 (la primera zona se pasa hacia el 9): la segunda
zona es un salto claro de dificultad, sobre todo por la muralla.

## 5e. Misiones, gemas moradas y Reliquias (desde 0.6.0)

Al pasar el nivel 10 (al vencer al Rey Slime) se abren las **misiones**, que dan **gemas moradas**, la
segunda moneda. Sale un aviso en el fin de partida y, en el árbol, la cuenta de gemas, el botón de
misiones (con un punto rojo y cuántas hay por cobrar) y una cuarta pestaña: **Reliquias**.

- **Diarias** (`src/core/misiones.ts`): 3 al día, elegidas con la fecha (todos los que juegan ese día
  tienen las mismas; cambian a medianoche, hora local). Cuentan desde que empieza el día. Completar las 3
  da un **bono de 5**. Ejemplos: revienta 600 enemigos (3), gana 5 niveles (3), juega 10 partidas (3),
  vence a un jefe (5), compra 8 mejoras (3), gana 3 niveles sin que caiga la muralla (4), cobra el oro de
  mientras no estabas (2), revienta 150 goblins / 60 lobos (3), 40 orcos (4, desde el 13), 25 orcos
  arqueros (4, desde el 15). Nunca piden enemigos que todavía no salen.
- **Permanentes** (logros, una sola vez): llegar al nivel 15/20/25/30 (5/10/15/20), vencer al Rey Slime
  (8) y al Lobo Blanco (12), reventar 1 000/10 000/100 000 (3/8/15), comprar 50/150 mejoras (5/10),
  reventar 100 orcos (5), ganar 20 niveles sin perder la muralla (8).
- Las gemas **no caen de los enemigos** por ahora: salen solo de misiones (una fuente predecible). Un
  drop muy raro o de jefes queda como idea.

**Reliquias** (se pagan con gemas; propuesta, fácil de cambiar):

| Reliquia | Qué hace | Máx. | Precio |
|---|---|---|---|
| Poder ancestral (raíz) | +10 % a **todo** el daño (tuyo, del mago, del fuego y de los arqueros) por nivel | 10 | 5, ×1.35 |
| Golpes críticos | Tus flechas: 5 % por nivel de pegar **triple** (número rosa) | 6 | 6, ×1.5 |
| Carcaj encantado | +1 objetivo por arquero (se suma a Flechas múltiples) | 3 | 10, ×2 |
| Albañil | Una vez por nivel, cuando la muralla queda a 30 % o menos, recupera 40/55/70 % (aunque el golpe la fuera a tumbar) | 3 | 8, ×1.8 |

Con el simulador, en la primera sesión (todo un mismo día) salen unas 100 gemas, casi todas de logros:
alcanzan para Poder 4, Críticos 3, Carcaj 1 y Albañil 2. Después, ~14 al día con las diarias y el bono.

Modo pruebas: **+10 gemas** y **Nuevo día** (otras 3 diarias, desde cero). "+1/+10 min de juego" juega
pero deja las misiones sin cobrar, para que las cobres tú.

## 6. Ritmo (`npm run simular`)

Un bot que toca donde hay más slimes cada segundo (los rojos cuentan por cuatro: los busca primero),
compra lo más barato y, si pierde un nivel, juega una vez el anterior para juntar oro y reintenta:

| Minuto | Nivel superado |
|---|---|
| 5 | 4 |
| 10 | 12 |
| 15 | 17 |
| 20 | 19 |
| 30 | 25 |
| 45 | 27 |

(0.6.0: el bot también cobra misiones y compra la Reliquia más barata.)

Al principio pierde los niveles 3, 4 y 7 alguna vez, junta oro en el anterior y pasa. Del 11 al 20 casi
no pierde (llegan el mago y los arqueros). Del 21 en adelante los rojos son el reto: la muralla cae en
unas 30 partidas de 45 minutos y ahí sirve Muralla reforzada. (El bot no cobra oro inactivo.)

## 7. Técnica

- `src/core/` es lógica pura y probada (60 pruebas): `run.ts` (la partida paso a paso; devuelve eventos),
  `stats.ts` (estadísticas desde los talentos), `meta.ts` (oro, gemas, árbol, guardado), `misiones.ts`
  (contadores, diarias y permanentes), `datos.ts`, `bot.ts`.
- `src/game/Campo.ts` (Phaser 4) solo dibuja los eventos: sprites reciclados para cientos de slimes,
  números de daño con una **fuente de mapa de bits** hecha al arrancar (`numeros.ts`), partículas, flechas
  de los arqueros dibujadas en una sola capa. El canvas va hasta densidad 2.
- `src/ui/` (Svelte 5): reloj y oro, fin de partida, árbol, glosario y ajustes (sonido, idioma,
  reiniciar desde cero; en la versión de pruebas, oro de regalo y ⏭ para terminar la partida).
- Arte: `tools/arte/dibujar.mjs` con la librería del gato (`lib.mjs`): slimes, mago, arquero, flecha,
  muralla, torre, pasto, decoraciones, 40 íconos y el ícono de la app. Sonido sintetizado (`services/audio.ts`).
- Guardado en `localStorage` (`area-idle:partida`), versionado y tolerante a datos dañados.

## 8. Pendiente (ideas, sin construir)

- **Segunda zona** (bosque, desierto, nieve…): al vencer al jefe del nivel 10, 20… cambia el mundo y llega un jefe nuevo.
- Gemas que caen muy rara vez de los enemigos o de los jefes (además de las misiones).
- Más Reliquias (y más permanentes conforme haya zonas nuevas).
- Fuentes de hielo, energía, muerte y luz (nuevos aliados o ramas) y enemigos que las pidan.
- Reparar la muralla a mano durante el nivel (un botón con espera); el Albañil ya la repara una vez solo.
- Anuncios recompensados: "+10 s a esta partida" y "×2 oro de esta partida".
- ×2 al oro de "Mientras no estabas" viendo un anuncio.
