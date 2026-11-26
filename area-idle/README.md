# Campo de Slimes (nombre provisional)

Idle de áreas para celular (vertical, una mano) y navegador. Tocas donde quieres que caigan tus
flechas y el círculo dispara solo ahí. Cada **nivel** trae una cantidad de slimes y hay que reventarlos
todos antes de que se acabe el tiempo; si no, se reintenta o se juega el anterior para juntar oro. Con
el oro mejoras tres árboles: el tuyo, el del mago (explosiones de fuego cuadradas) y el de los arqueros
(un objetivo a la vez, luego varios).

**Estado: prototipo 0.14.0.** Cinco zonas: **Campo verde** (niveles 1–10, slimes), **Campo de batalla**
(11–20: goblins con lanzas, lobos, orcos y orcos arqueros, con espadas y tablas tiradas) y **Pradera
amarilla** (21–30 y siguientes: arañas gigantes, esqueletos con espada y escudo, lobos negros y bandidos
con dagas, entre cráneos y pedazos de armadura) y **Desierto** (31–40: escorpiones gigantes que se
entierran, bandidos del desierto, minotauros y cíclopes) y **Montaña de piedra** (41–50: guerreros y
arqueros de hierro, gólems que se parten y dragones pequeños que vuelan).
Un **jefe cada 10 niveles**: el **Rey Slime** (naranja, con corona) en el 10, el **Lobo Blanco** (con
una hoz en el hocico) en el 20, el **Esqueleto Mago** de fuego en el 30 y el **Líder de los bandidos** en
el 40 y el **Dragón de acero** en el 50; después se repiten. En la primera zona, tres enemigos (slime verde;
azul desde el nivel 4; **rojo con resortera** desde el 7, que le tira piedras a la muralla y, si la tumba,
deja sin atacar al mago y a los arqueros), **oro mientras no juegas** desde el nivel 3 (10 %; y en el árbol, el **modo guardia**: tus tropas
pelean solas contra pocos enemigos, 20 %), y desde el 11
**misiones diarias y permanentes** que dan **gemas moradas** para la cuarta sección del árbol,
**Reliquias**, desde el 17 un **ranking** (compartido en la versión publicada en Claude) y desde el 19 una **arena PvP**
sin conexión (ligas semanales de 100 con rivales simulados, intentos que se recargan y tienda de medallas). 26 talentos en cuatro secciones, seis tipos de daño (dos en juego: físico y fuego) y un
glosario de enemigos. Con **Autoapuntado** (talento) tu círculo se mueve solo hacia los enemigos, pero
muy despacio: apuntar siempre es mejor. Desde el 26, **Supervivencia** (oleadas hasta que cae la muralla)
da **Runas** para la **Herrería**: 9 piezas de equipo para el mago, los arqueros y la base que a veces
fallan al mejorar (cada fallo sube la probabilidad del siguiente) y cambian cómo se ven.

- Diseño y decisiones: [`docs/DISENO.md`](docs/DISENO.md)
- Lo que se tomó del juego del gato: [`../REUSO.md`](../REUSO.md)

## Comandos

```
npm install
npm run dev          # jugar en el navegador
npm test             # pruebas de la lógica (Vitest)
npm run check        # tipos de los componentes Svelte
npm run simular      # simulador de balance: un bot juega 80 partidas y compra
npm run e2e          # pruebas de punta a punta (Playwright, puerto 4174)
npm run arte         # redibuja todo el arte (SVG en código → PNG)
npm run build:archivo     # el juego en un solo HTML (con modo pruebas)
npm run build:compartir   # el mismo HTML sin modo pruebas
npm run apk:prueba        # APK de prueba (visor WebView)
```
