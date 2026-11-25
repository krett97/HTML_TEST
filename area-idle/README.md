# Campo de Slimes (nombre provisional)

Idle de áreas para celular (vertical, una mano) y navegador. Tocas donde quieres que caigan tus
flechas y el círculo dispara solo ahí. Cada **nivel** trae una cantidad de slimes y hay que reventarlos
todos antes de que se acabe el tiempo; si no, se reintenta o se juega el anterior para juntar oro. Con
el oro mejoras tres árboles: el tuyo, el del mago (explosiones de fuego cuadradas) y el de los arqueros
(un objetivo a la vez, luego varios).

**Estado: prototipo 0.10.0.** Dos zonas: **Campo verde** (niveles 1–10, slimes) y **Campo de batalla**
(11–20 y siguientes: goblins con lanzas, lobos, orcos y orcos arqueros, con espadas y tablas tiradas).
Un **jefe cada 10 niveles**: el **Rey Slime** (naranja, con corona) en el 10 y el **Lobo Blanco** (con
una hoz en el hocico) en el 20; después se alternan. En la primera zona, tres enemigos (slime verde;
azul desde el nivel 4; **rojo con resortera** desde el 7, que le tira piedras a la muralla y, si la tumba,
deja sin atacar al mago y a los arqueros), **oro mientras no juegas** desde el nivel 3 (10 %; y en el árbol, el **modo guardia**: tus tropas
pelean solas contra pocos enemigos, 20 %), y desde el 11
**misiones diarias y permanentes** que dan **gemas moradas** para la cuarta sección del árbol,
**Reliquias**, desde el 17 un **ranking** (compartido en la versión publicada en Claude) y desde el 19 una **arena PvP**
sin conexión (ligas semanales de 100 con rivales simulados, intentos que se recargan y tienda de medallas). 26 talentos en cuatro secciones, seis tipos de daño (dos en juego: físico y fuego) y un
glosario de enemigos. Con **Autoapuntado** (talento) tu círculo se mueve solo hacia los enemigos, pero
muy despacio: apuntar siempre es mejor.

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
