# Campo de Slimes: diseño del prototipo

> Versión 0.12.0. Nombre provisional. Nació de pausar el juego del gato
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
| **Jugador** | Tu círculo: lluvia de flechas en el área | Físico | Daño (raíz), Área, Atraer slimes (llegan más rápido), Cadencia, Tiempo, Botín (premio por nivel), Ganancia de oro (todo el oro), Oro inactivo, Bolsa grande, Autoapuntado (5i) |
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

- Da **10 %** (desde 0.9.0; antes 15 %) de lo que se gana por minuto jugando el nivel más alto ya superado
  (sus slimes y su premio, una partida cada 30 s), hasta **2 horas**. Menos de un minuto fuera no cuenta.
- **Oro inactivo** (+10 % por nivel, hasta 80 %; también sube el modo guardia; pide haber llegado al nivel 3) y **Bolsa grande** (+1 h por
  nivel, hasta 12 h), en el árbol del jugador, bajo **Ganancia de oro**, que ahora multiplica todo el oro:
  el de los slimes, el premio por nivel y lo que se junta sin jugar.
- En el árbol, debajo del oro, dice cuánto se gana por minuto sin jugar (o, si la guardia está andando,
  cuánto junta la guardia, en verde).
- El juego guarda la hora en cada guardado (también cada 20 s y al pasar a segundo plano). El modo
  pruebas tiene "Simular 1 h fuera", "+1 nivel" y **"+1 min de juego" / "+10 min de juego"**: el jugador
  simulado del simulador juega ese tiempo sobre tu partida (partidas, oro, compras en el árbol, niveles) y
  sale un resumen ("En 10 min de juego: 23 partidas (17 ganadas), nivel 3 → 14, 75 mejoras, +8.95K de oro").

## 5c. Jefes (desde 0.4.0)

**Cada 10 niveles hay un jefe.** El primero, en el nivel 10, es el **Rey Slime**: naranja, gigante, con
corona de oro, capa roja y cejas de enojo. En un nivel de jefe se gana **al vencerlo** (su escolta
revienta con él); hay **10 s más** de tiempo y el **premio es ×5**. Su vida es la de todos los slimes de un
nivel normal ×6 (en el nivel 10: unas 16 600). Orden (desde 0.12.0): **Rey Slime** (10), **Lobo Blanco**
(20), **Esqueleto Mago** (30) y **Líder de los bandidos** (40); en el 50, 60… se repiten en ese orden.

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
hielo. Cada jefe tiene sus números en `JEFES` (`datos.ts`).

El simulador llega al nivel 20 hacia el minuto 27 (la primera zona se pasa hacia el 9): la segunda
zona es un salto claro de dificultad, sobre todo por la muralla.

## 5d2. Tercera zona: Pradera amarilla (desde 0.11.0)

Niveles 21–30 (y los siguientes hasta que haya una cuarta zona): **hierba amarilla y seca**, y en lugar de
arbustos hay **cráneos, cascos y petos abollados**. Enemigos:

| Enemigo | Desde | Vida | Velocidad | Qué hace | Débil a | Fuerte contra | Oro |
|---|---|---|---|---|---|---|---|
| Araña gigante | 21 | 6 | Normal | Escupe **telaraña** a un arquero y lo deja enredado 2.5 s (no tira) | Fuego | Hielo | 2.5 |
| Lobo negro | 21 | 5 | Rapidísima | Sale en **manada de 3** | Físico | Muerte | 1.5 |
| Esqueleto (espada y escudo) | 23 | 14 | Lenta | Marcha a la muralla y la golpea (5); al caer **se rearma una vez** con media vida | Luz | Físico | 7 |
| Bandido con dagas (el más fuerte) | 25 | 10 | Normal | Lanza **dagas** a la muralla muy seguido (3 cada 1.8 s) y **se aparta de tu círculo** | Físico | — | 9 |

- Las arañas son el resto de cada nivel; los lobos negros salen en 10 % de los turnos (como son de a 3,
  son ~25 % de los enemigos); los esqueletos, del 8 % al 20 %; los bandidos, del 5 % al 12 %.
- **Telarañas con medida:** cada arquero recibe una a la vez y, al soltarse, no lo pueden volver a
  enredar en 4 s. Con 110 arañas en el campo los arqueros pasan ~27 % del tiempo enredados (sin ese
  límite pasaban casi todo el tiempo). Sin arqueros, la telaraña le pega a la muralla (2).
- El esqueleto aguanta las flechas (escudo) y se levanta otra vez: aquí el mago importa. El bandido
  premia apuntar a mano (el autoapuntado es muy lento para él).
- El jefe del nivel 30 sigue siendo el Rey Slime (se alternan); falta uno propio de la zona.
- Misiones diarias nuevas: revienta 120 arañas (3), 40 esqueletos (4, desde el 23) y 25 bandidos (4, desde el 25).

Con el simulador se llega al nivel 21 hacia el minuto 22 y al 28 hacia el 45; del 21 al 30 pierde ~17
veces (junta oro en el anterior y sigue).

## 5d3. Esqueleto Mago (30), Desierto (31–40) y Líder de los bandidos (40) (desde 0.12.0)

**Esqueleto Mago de fuego** (jefe del 30): esqueleto con sombrero morado de mago y bastón en llamas.
Invoca esqueletos (2 cada 5 s), se **teletransporta** entre llamas cada 4 s (mientras, no se le puede
pegar) y queda recuperándose (×2 de daño), lanza **bolas de fuego** a la muralla (16) y, al caer, **se
rearma una vez con 30 % de vida**. Aguanta el fuego (tu mago le hace la mitad). Por todas esas defensas
tiene 70 % de la vida normal de un jefe (con el 100 % el simulador necesitaba ~18 intentos; así, ~3, como
el Rey).

**Desierto** (31–40 y siguientes): arena con ondas, cactus, vasijas rotas y cráneos.

| Enemigo | Desde | Vida | Velocidad | Qué hace | Débil a | Fuerte contra | Oro |
|---|---|---|---|---|---|---|---|
| Escorpión gigante | 31 | 9 | Normal | Se **entierra** en la arena 1.6 s cada ~4 s: ahí no se le puede pegar | Hielo | Físico | 3 |
| Bandido del desierto | 31 | 8 | Normal | Lanza **cimitarras** a la muralla (3 cada 2.2 s) y esquiva tu círculo | Hielo | Fuego | 3 |
| Minotauro guerrero | 33 | 26 | Lenta | Marcha y, pasando la mitad del campo, **embiste** (×3) y golpea la muralla (6) | Fuego | — | 12 |
| Cíclope guerrero (el más fuerte) | 35 | 30 | Muy lenta | Avienta **rocas** enormes a la muralla (7 cada 6 s) | Luz | Fuego | 15 |

**Líder de los bandidos** (jefe del 40): turbante rojo, parche y dos cimitarras. Llama bandidos del
desierto, **embiste** cada 3 s, lanza **tres dagas en abanico** y es el que más esquiva tu círculo. Tiene
150 % de la vida normal de un jefe.

Misiones nuevas: diarias de escorpiones (100), minotauros (30) y cíclopes (20); permanentes "Llega al 35"
(25), "Llega al 40" (30), "Vence al Esqueleto Mago" (16) y "Vence al Líder" (20).

**Curvas de la segunda mitad (0.12.0).** Al agregar el desierto, el simulador mostró que el juego se
atoraba en el nivel 29 (con cualquier jefe): la vida crecía ×1.3 por nivel y el oro ×1.05, y casi todas
las mejoras ya estaban al máximo. Desde el nivel 20: vida ×1.14 y oro ×1.15 por nivel; **Daño** llega a
100 (pasado su nivel 40 cada nivel cuesta ×1.2 en vez de ×1.4) y **Muralla reforzada** a 20. Los niveles
1–20 no cambian.

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

## 5f. Ranking (desde 0.7.0)

Al llegar al **nivel 17** sale un aviso en el fin de partida y un **trofeo** en el árbol. La ventana
muestra a cada jugador con su **nombre**, el **nivel más alto** al que ha llegado y cuántos enemigos ha
reventado (desempata), con el dibujo del último jefe que venció. Tu fila va resaltada y, si no estás
entre los primeros 100, sale al final.

- **Dónde vive la tabla:** igual que en el juego del gato (`src/services/ranking.ts`). En la versión
  publicada en Claude usa la base de datos de la página: cada jugador escribe solo su fila
  (`ranking/<su id>`) y todos leen. La versión de pruebas y la versión para compartir son páginas
  distintas, así que cada una tiene su propio ranking (los botones de pruebas no ensucian el de verdad).
- **Fuera de Claude** (APK, archivo HTML) no hay servidor: se ve solo tu fila y un aviso. Un ranking en
  línea para la app pediría un servicio (por ejemplo, las tablas de Google Play Juegos o una base de
  datos propia).
- Lo que llega de otros jugadores se revisa antes de mostrarse (`readRow`): nombres limpios (sin
  caracteres de control, 16 letras), niveles enteros entre 17 y 100 000.

## 5g. Arena PvP sin conexión (desde 0.8.0)

Al llegar al **nivel 19** sale un aviso y, junto a "¡Jugar!", el botón **PvP** con tus intentos (5/5).
Todo está en `src/core/pvp.ts`; la propuesta original del jugador y lo que se decidió para lo que no
estaba dicho:

- **Tu liga:** cada semana (lunes a lunes, hora local) estás en una liga de **100 jugadores**: tú y 99
  rivales **simulados** (sin servidor no hay jugadores reales; cada uno tiene nombre, dibujo, poder y
  puntos que va juntando durante la semana). Ligas: Bronce, Plata, Oro, Platino, Diamante y Campeón.
- **Poder:** una cifra que junta tus árboles: tu círculo (daño × área ÷ cadencia, con críticos), el mago
  (explosión y fuego × área ÷ cadencia), los arqueros (cuántos × objetivos × daño ÷ cadencia), todo por un
  multiplicador de tiempo, muralla, Albañil y Estandarte. Se ve con su desglose.
- **Batalla:** gana el de más poder con más probabilidad, no siempre: p⁴ / (p⁴ + q⁴) (con 1.5× de poder,
  84 %). Se cuenta en ~5 s con dos barras de vida (se puede saltar). Cada rival dice si es Fácil, Parejo
  o Difícil y cuántos puntos da.
- **Puntos:** ganar da 6–40 (16 contra alguien con tus mismos puntos; más si tiene más); perder quita
  2–10 (menos si tenía más que tú), sin bajar de 0.
- **Intentos:** 5 como máximo; uno vuelve cada 2 h (mientras estás lleno, no corre el reloj).
- **Rivales a tu altura:** su poder sale de **tu poder al empezar cada día** (sin el Estandarte), de la
  liga (de ×0.7 en Bronce a ×1.5 en Campeón) y de qué tan buenos son (×0.5 a ×1.5), y sube 2 % por día de
  la semana. Así lo que mejoras hoy te da ventaja hoy, y el Estandarte, siempre. (Sin esto, en un idle el
  poder crece tanto en una semana que a media semana le ganabas a todos.)
- **Fin de semana:** los **20 mejores suben**, los **20 peores bajan** (de Bronce no se baja; de Campeón
  no se sube). Se cierra sola al volver y se muestra una vez cómo te fue.
- **Medallas y tienda:** 3 por pelea ganada, 1 por perdida, y al cerrar la semana 30 (top 20), 12 (en
  medio) o 4 (últimos 20), ×1.5 por cada liga de más. En la tienda: **cofre de oro** (15 min de juego, 5),
  **pelea extra** (6), **5 gemas** (25) y **Estandarte de guerra** (+5 % de poder en el PvP por nivel,
  hasta 20; desde 15, ×1.3 cada nivel).

Simulación de una semana en Bronce (`fight` con un jugador que pelea contra el de más puntos que le gane
con ≥75 %): quien entra una vez al día queda ~27.º (se queda), dos veces ~17.º (sube), tres veces ~12.º;
quien entra cada 3 días, ~59.º. Para bajar hay que casi no pelear (los últimos 20 terminan con <40 puntos).

Modo pruebas: **PvP: intentos 5/5**, **PvP: terminar semana** y **+50 medallas**.

**Pantalla que se mueve:** desde 0.8.0 los golpes normales a la muralla ya no sacuden la pantalla (solo
los de jefes, poquito), las explosiones del mago tampoco, y las demás sacudidas son más suaves y nunca
seguidas (máximo una cada medio segundo).

## 5h. Modo guardia (desde 0.9.0)

Mientras estás en el árbol (sin jugar un nivel) y tienes tropas (al menos un arquero o el mago), el campo
de atrás se ve más claro y **tus tropas pelean solas**. Tu círculo descansa.

- Salen **pocos enemigos**: los del nivel más alto ya superado (sin jefes), uno cada 2.5 s y como mucho
  12 a la vez. No hay tiempo, no se pierde, nadie marcha hacia la muralla ni le tira cosas.
- Cada baja da un oro fijo (sale "+N" dorado) para que, si tus tropas alcanzan a todos, se junte el
  **20 %** de lo que se gana jugando. Si tus tropas no alcanzan, se junta menos. El oro va directo a tu
  bolsa, así que puedes ir comprando.
- **Oro inactivo** sube igual la guardia y la app cerrada: la guardia siempre da 10 puntos más (10 % → 20 %,
  con un nivel 20 % → 30 %…). Así, abrir el juego y dejarlo en el árbol vale más que cerrarlo, pero jugar
  niveles sigue siendo lo mejor (100 %).
- No cuenta para misiones, ranking ni PvP (si no, "revienta 600" se cumpliría solo).
- Al comprar en el árbol, la guardia toma lo nuevo sin empezar de nuevo; el primer arquero (o el mago) la
  arranca. Solo suena el "pop" de cada baja.

## 5i. Autoapuntado (desde 0.10.0)

Talento del árbol del jugador (junto a Tiempo; pide **Área 3**; 5 niveles, desde 50 de oro ×2.4). Si no
tocas en **2.5 s**, tu círculo se va **solo** hacia donde hay más enemigos (el mismo cálculo que usa el
simulador; los que atacan la muralla y el jefe pesan más) y vuelve a elegir cada segundo. Mientras apunta
solo, el círculo se pone **azul**.

Es lento a propósito: **12 unidades por segundo** en el nivel 1 y +6 por nivel, hasta 36 (el campo mide
360 de ancho: en el nivel 1 cruza medio campo en ~15 s; al máximo, en ~5 s). Tocar lo lleva al instante
y lo deja quieto 2.5 s, así que **apuntar siempre es mejor**: sirve para jugar con una mano o distraído, no
para ganarle al jugador. Contra los jefes que esquivan tu círculo casi no sirve. En el modo guardia tu
círculo sigue descansando.

## 6. Ritmo (`npm run simular`)

Un bot que toca donde hay más slimes cada segundo (los rojos cuentan por cuatro: los busca primero),
compra lo más barato y, si pierde un nivel, juega una vez el anterior para juntar oro y reintenta:

| Minuto | Nivel superado |
|---|---|
| 5 | 4 |
| 10 | 9–12 |
| 15 | 17 |
| 20 | 19 |
| 30 | 29 |
| 45 | 35 |
| 60 | 37 |
| 75 | 41 |

(0.6.0: el bot también cobra misiones y compra la Reliquia más barata. 0.12.0: curvas nuevas desde el 20.)
Jefes: el Rey ~3 intentos, el Lobo ~5, el Esqueleto Mago ~3 y el Líder 1–3. En el desierto la muralla es
el reto (del 36 al 38 cae seguido: ahí sirve Muralla reforzada hasta 20).

Al principio pierde los niveles 3, 4 y 7 alguna vez, junta oro en el anterior y pasa. Del 11 al 20 casi
no pierde (llegan el mago y los arqueros). Del 21 en adelante los rojos son el reto: la muralla cae en
unas 30 partidas de 45 minutos y ahí sirve Muralla reforzada. (El bot no cobra oro inactivo.)

## 7. Técnica

- `src/core/` es lógica pura y probada (98 pruebas): `run.ts` (la partida paso a paso; devuelve eventos),
  `stats.ts` (estadísticas desde los talentos), `meta.ts` (oro, gemas, árbol, guardado), `misiones.ts`
  (contadores, diarias y permanentes), `ranking.ts`, `pvp.ts` (poder, ligas, peleas, tienda), `datos.ts`, `bot.ts`. `src/services/ranking.ts`
  conecta el ranking con la base de datos de la página publicada.
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
